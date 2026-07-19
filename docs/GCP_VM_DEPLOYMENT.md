# Deploying Daily Update on a GCP Compute Engine VM (Docker)

This runbook deploys the app to a single Google Compute Engine VM using Docker
Compose, with MongoDB running on a **separate, already-existing server** in the
same VPC.

**Architecture on the VM**

```
Internet ──443──▶ nginx proxy ──▶ frontend (nginx, static SPA)
                       └────────▶ backend  (Node :5000)  ──▶  MongoDB
                                   (Express + scheduler +          (separate
                                    digest + Telegram bot)          in-VPC server,
                                                                    private IP)
```

Only the `proxy` container publishes ports (80/443). `backend` and `frontend`
are reachable only on the internal Docker network. There is **no Redis and no
Mongo container** — see "Why no Redis / no Mongo container" at the end.

---

## 0. What you need first

- A GCP VM (Compute Engine). `e2-small` (2 vCPU, 2 GB) is enough to start;
  `e2-medium` (4 GB) gives comfortable headroom for the Node process + two
  nginx containers + image builds. See "Sizing" below.
- The MongoDB server's **private IP** (e.g. `10.128.0.5`) and a database user
  with read/write on the `daily-update` database.
- A domain name with an A record pointing at the VM's external IP.
- An Anthropic API key, and SMTP credentials for email/digests.

---

## 1. VM sizing

| Component            | Idle RAM | Notes                                        |
| ------------------- | -------- | -------------------------------------------- |
| backend (Node)      | ~120 MB  | +spikes during Claude calls / digest runs    |
| frontend (nginx)    | ~10 MB   | serves static build                          |
| proxy (nginx)       | ~10 MB   | TLS termination                              |
| **Docker build**    | ~1 GB    | transient, only during `up --build`          |

- **RAM:** 2 GB works; 4 GB (`e2-medium`) is the safe default so image builds
  don't OOM. If you stay on 2 GB, either build images elsewhere and pull, or
  add swap (`fallocate -l 2G /swapfile`).
- **Disk:** 20 GB standard persistent disk is plenty (Docker images ~500 MB
  total). Mongo lives on the other server, so no data disk needed here.
- **CPU:** 1–2 vCPU. The workload is I/O bound; CPU only matters during Vite
  builds.

## 2. Networking / firewall

VPC firewall rules needed:

- **Ingress to the VM:** allow TCP `80` and `443` from `0.0.0.0/0` (or your CDN
  range). Allow `22` from your admin range only.
- **VM → Mongo server:** allow TCP `27017` from the VM's subnet/tag to the
  Mongo server. Since both are in the same VPC this is an internal rule; do
  **not** expose 27017 to the internet.
- **Egress from the VM (outbound HTTPS/SMTP):** the backend needs to reach:
  - `api.anthropic.com` (443) — Claude API
  - your SMTP host (587/465) — email + digests
  - `api.telegram.org` (443) — Telegram bot, if enabled
  - `chat.googleapis.com` / Slack webhook hosts (443) — outbound notifications
  - `*.letsencrypt.org` (443) — certbot renewals

  Default GCP egress is open; only relevant if you've locked egress down.

## 3. Install Docker on the VM

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"   # log out/in so the group applies
```

Docker Compose v2 ships as the `docker compose` plugin with the above install.

## 4. Get the code and configure

```bash
git clone https://github.com/cakming/daily-update.git
cd daily-update

cp .env.gcp.example .env
nano .env      # fill in every value — see the file's comments
```

Critical values in `.env`:

- `MONGODB_URI` → the Mongo server's **private IP**, real user/password,
  `?authSource=admin` (or wherever the user was created).
- `JWT_SECRET` → `openssl rand -hex 64`.
- `CLIENT_URL` / `VITE_API_URL` → your real `https://` domain. Keep
  `VITE_API_URL` as `https://<domain>/api` so the frontend talks to the proxy
  same-origin.
- `ANTHROPIC_API_KEY`, `SMTP_*`, and (optionally) `TELEGRAM_BOT_TOKEN`.

Verify Mongo connectivity from the VM before deploying:

```bash
# quick TCP check (install mongosh or just nc)
nc -vz 10.128.0.5 27017
```

## 5. Obtain a TLS certificate

Edit `nginx/gcp/default.conf` and replace **both** occurrences of
`daily-update.example.com` with your domain.

Then issue a cert with certbot on the host (simplest one-time approach):

```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d daily-update.example.com
# certs land in /etc/letsencrypt/live/daily-update.example.com/
```

`.env` already sets `TLS_CERT_DIR=/etc/letsencrypt`, which the compose file
mounts read-only into the proxy at `/etc/nginx/certs`, so the cert paths in
`default.conf` resolve as-is.

> Renewal: `certbot renew` updates the files in place; reload the proxy with
> `docker compose -f docker-compose.gcp.yml exec proxy nginx -s reload`
> (add both to a cron/systemd timer). The `location /.well-known/acme-challenge/`
> block in the config supports webroot renewals if you later switch off
> `--standalone`.

## 6. Launch

```bash
docker compose -f docker-compose.gcp.yml --env-file .env up -d --build
docker compose -f docker-compose.gcp.yml ps
```

Check health:

```bash
# backend health via the proxy
curl -sk https://daily-update.example.com/api/health
# container logs
docker compose -f docker-compose.gcp.yml logs -f backend
```

You should see the scheduler, digest scheduler, and (if configured) the
Telegram bot start up in the backend logs, then `Server running on port 5000`.

## 7. Updating to a new version

```bash
cd daily-update
git pull
docker compose -f docker-compose.gcp.yml --env-file .env up -d --build
docker image prune -f      # reclaim old layers
```

Because `VITE_API_URL` is baked at build time, always rebuild the frontend
(the `--build` flag) after changing that value.

---

## Operations

**Logs:** JSON-file driver, capped at 3×10 MB per container.
`docker compose -f docker-compose.gcp.yml logs -f <service>`.

**Restart one service:**
`docker compose -f docker-compose.gcp.yml restart backend`.

**Backups:** Mongo lives on the separate server — back it up there
(`mongodump` on a timer). Nothing on this VM holds durable state, so the VM is
disposable/rebuildable from git + `.env`.

**Single-instance caveat:** the backend runs node-cron schedulers and the
Telegram long-poll bot in-process. Do **not** scale `backend` to multiple
replicas — you'd get duplicate scheduled sends and Telegram update conflicts.
If you later need HA, extract those jobs into a leader-elected worker first.

---

## Why no Redis / no Mongo container

- **No Mongo container:** MongoDB already runs on a dedicated in-VPC server.
  Running a second Mongo in Docker here would split your data. `MONGODB_URI`
  points at the existing server's private IP; that's the only wiring needed.
- **No Redis:** the app is stateless where it counts. Auth is JWT (no server
  sessions), and rate-limiting uses in-process `express-rate-limit`. There is
  no queue or cross-process cache. A single Node container needs nothing else.
  (If you ever run multiple backend instances behind a load balancer, *then*
  you'd want Redis for shared rate-limit state — but see the single-instance
  caveat above; the schedulers block that anyway.)
