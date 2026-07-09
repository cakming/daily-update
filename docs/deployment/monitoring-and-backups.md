# Monitoring & Backups

Operational guide for keeping the Daily Update App healthy in production. This
stack is a **Node/Express + MongoDB** backend with a **Vite/React** frontend.
Sentry is already wired into the backend (`backend/config/sentry.js`), and a
health endpoint is exposed at `/api/health` (`backend/app.js`).

---

## 1. Uptime Monitoring

Poll the existing health endpoint from an external monitor so you find out about
outages before your users do.

### Endpoint

```
GET https://your-backend-domain.com/api/health
```

Returns HTTP `200` with:

```json
{
  "success": true,
  "message": "Daily Update API is running",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

### UptimeRobot setup

1. Create a free account at https://uptimerobot.com.
2. **Add New Monitor** → Monitor Type: **HTTP(s)**.
3. Friendly Name: `Daily Update API`.
4. URL: `https://your-backend-domain.com/api/health`.
5. Monitoring Interval: **5 minutes** (1 minute on paid plans).
6. Under **Advanced**, optionally add a keyword check for the string
   `"success":true` so a `200` with a degraded body still alarms.
7. Add alert contacts (email, SMS, Slack, or webhook) and enable them for the
   monitor.

Also add a second monitor for the **frontend** root URL
(`https://your-production-domain.com`) so static-hosting outages are caught too.

Pingdom or Better Stack work identically if you prefer them over UptimeRobot.

---

## 2. Error Tracking (Sentry)

Sentry is already integrated — no code changes are needed, only configuration.

- Initialization lives in `backend/config/sentry.js` and is a no-op unless
  `SENTRY_DSN` is set and `NODE_ENV !== 'test'`.
- The Sentry Express error handler is mounted in `backend/app.js` after the
  routes.
- Authorization and cookie headers are stripped in `beforeSend`, so secrets are
  not shipped to Sentry.

### Enable it

1. Create a project in https://sentry.io (platform: **Node.js / Express**).
2. Copy the **DSN**.
3. Set the environment variable on your backend host (Railway/Render/etc.):

   ```env
   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
   NODE_ENV=production
   ```

4. Redeploy. In production the SDK samples 10% of traces/profiles
   (`tracesSampleRate` / `profilesSampleRate` = `0.1`); raise these temporarily
   when debugging.

### Recommended alerts

- New issue created → notify Slack/email.
- Issue frequency spikes above a threshold (e.g. > 10 events / minute).
- Regression: a previously resolved issue reappears.

---

## 3. MongoDB Backups

### Automated backups (MongoDB Atlas)

Atlas is the recommended datastore for production.

1. In the Atlas UI, open your cluster → **Backup** tab.
2. Enable **Cloud Backup** (continuous / snapshot backups). Note: the free M0
   tier does **not** support automated backups — use **M10 or higher** for
   production if you need point-in-time recovery.
3. Configure the snapshot **policy**:
   - Hourly snapshots retained 2 days.
   - Daily snapshots retained 7 days.
   - Weekly snapshots retained 4 weeks.
   - Monthly snapshots retained 12 months.
   (Adjust to your compliance/retention needs and budget.)
4. Enable **Point-in-Time Recovery (PITR)** for the ability to restore to any
   moment within the retention window.
5. **Test a restore quarterly** — a backup you have never restored is not a
   backup. Restore into a throwaway cluster and verify data integrity.

### Manual backup — `mongodump`

Use for ad-hoc snapshots (e.g. before a risky migration) or if you self-host
MongoDB. Requires the [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/).

```bash
# Dump the whole database to a timestamped, gzipped archive.
mongodump \
  --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/daily-update-app" \
  --archive="backup-$(date +%Y%m%d-%H%M%S).gz" \
  --gzip
```

Store the archive off-box — e.g. copy it to S3 / Cloudflare R2 / GCS. Do not
leave the only copy on the application server.

### Manual restore — `mongorestore`

```bash
# Restore from a gzipped archive.
# --drop replaces existing collections; OMIT it to merge instead.
mongorestore \
  --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/daily-update-app" \
  --archive="backup-20260709-120000.gz" \
  --gzip \
  --drop
```

Always restore into a **staging** database first to validate before touching
production.

### Scheduling a nightly dump (self-hosted / VM)

Add a cron entry that dumps, then uploads and prunes old archives:

```cron
# 02:15 every day
15 2 * * * /usr/bin/mongodump --uri="$MONGODB_URI" --archive="/backups/daily-$(date +\%Y\%m\%d).gz" --gzip \
  && find /backups -name 'daily-*.gz' -mtime +14 -delete
```

Keep the connection string in an environment file readable only by the backup
user (`chmod 600`), never inline in the crontab.

---

## 4. Log Retention

The backend logs to `stdout`/`stderr` (via `console.*` and the error-handling
middleware in `app.js`). How logs are retained depends on the host:

- **Railway / Render / DigitalOcean App Platform** retain recent logs in their
  dashboard (typically days, not months). For long-term retention, forward logs
  to a dedicated service.
- **PM2** (see `backend/ecosystem.config.js`): logs land in `~/.pm2/logs`.
  Install `pm2-logrotate` to cap size and rotation:

  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 14        # keep 14 rotated files
  pm2 set pm2-logrotate:compress true
  ```

- **Log aggregation** (recommended for production): ship logs to Papertrail,
  Logtail/Better Stack, or Datadog. Set a retention window (e.g. 30 days) in the
  provider and alert on error-rate spikes there in addition to Sentry.

### Retention guidance

| Data                     | Suggested retention |
| ------------------------ | ------------------- |
| Application logs         | 14–30 days          |
| Sentry error events      | Per Sentry plan (usually 30–90 days) |
| MongoDB daily snapshots  | 7 days              |
| MongoDB weekly snapshots | 4 weeks             |
| MongoDB monthly snapshots| 12 months           |

Avoid logging PII or secrets. Authorization/cookie headers are already scrubbed
before reaching Sentry; apply the same discipline to any custom logging.

---

## Quick Checklist

- [ ] UptimeRobot monitor on `/api/health` (5-min interval) with alerts.
- [ ] UptimeRobot monitor on the frontend root URL.
- [ ] `SENTRY_DSN` set on the backend host; alerts configured.
- [ ] Atlas Cloud Backup enabled with a snapshot policy (M10+).
- [ ] Point-in-Time Recovery enabled.
- [ ] Off-box copy of manual `mongodump` archives.
- [ ] Restore tested in staging within the last quarter.
- [ ] Log rotation/retention configured (pm2-logrotate or aggregator).
