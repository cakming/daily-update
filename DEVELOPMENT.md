# Development Guide

How to run the Daily Update App locally end-to-end. This complements the
deployment docs (`DEPLOYMENT.md`, `PRODUCTION_SETUP.md`), which cover shipping —
not local development.

## Prerequisites

- **Node.js** 18+ (the app is tested on Node 22)
- **MongoDB** — either a local `mongod`, a MongoDB Atlas URI, or the
  zero-install in-memory option described below
- **Anthropic API key** — only required for the AI features (creating daily
  updates, generating weekly summaries). Everything else runs without it.

## Architecture

```
frontend/  React 19 + Vite + Chakra UI v2   → http://localhost:3000
backend/   Node + Express + Mongoose         → http://localhost:5000
           Anthropic Claude API for AI rewriting
```

The frontend talks to the backend via `VITE_API_URL` (default
`http://localhost:5000/api`). CORS on the backend allows `CLIENT_URL`
(default `http://localhost:3000`), so **use `localhost`, not `127.0.0.1`**, in
the browser — the origins must match or requests are blocked.

## 1. Install

```bash
cd backend  && npm install
cd ../frontend && npm install
```

## 2. Configure

```bash
# backend
cp backend/.env.example backend/.env
# then edit backend/.env — at minimum set MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY
```

Backend `.env` keys:

| Key                 | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `PORT`              | Backend port (default 5000)               |
| `MONGODB_URI`       | MongoDB connection string                 |
| `JWT_SECRET`        | Secret for signing auth tokens            |
| `JWT_EXPIRE`        | Token lifetime (e.g. `7d`)                |
| `ANTHROPIC_API_KEY` | Claude API key (AI features only)         |
| `CLIENT_URL`        | Allowed CORS origin (default localhost:3000) |

The frontend needs no `.env` for defaults; override the API URL with
`VITE_API_URL` if the backend isn't on `localhost:5000`.

## 3. Run

```bash
# terminal 1 — backend (needs a reachable MONGODB_URI)
cd backend && npm run dev      # nodemon-style --watch on server.js

# terminal 2 — frontend
cd frontend && npm run dev     # Vite on http://localhost:3000
```

Open http://localhost:3000, register an account, and start creating updates.

## Running without installing MongoDB (in-memory)

`mongodb-memory-server` is already a dev dependency. You can boot the backend
against a throwaway in-memory database — handy for demos, screenshots, or a
quick smoke test. Create `backend/dev-inmemory.mjs`:

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
process.env.NODE_ENV = 'development';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-dummy';

await mongoose.connect(process.env.MONGODB_URI);
const { default: app } = await import('./app.js');
app.listen(5000, () => console.log('Backend (in-memory Mongo) on :5000'));
```

Run it with `node backend/dev-inmemory.mjs`. Data is wiped on every restart.

> Note: this bootstraps `app.js` directly, which skips the scheduler and
> Telegram bot started by `server.js` — fine for local UI work.

## Docker

A `docker-compose.yml` is provided for a containerized local stack:

```bash
docker compose up --build
```

## Tests

```bash
cd backend  && npm test        # Jest + supertest + mongodb-memory-server
cd frontend && npm test        # Vitest
cd frontend && npm run test:e2e # Playwright (needs the app running)
```

Coverage is currently partial — see [Known Issues](./README.md#-known-issues).

## Gotchas

- **Use `localhost`, not `127.0.0.1`.** CORS is pinned to `CLIENT_URL`; a
  mismatched origin makes `/api/auth/me` fail and the app logs you out.
- **Auth rate limit.** `/api/auth` is capped at 5 requests / 15 min. Repeated
  full page reloads during testing can trip it (HTTP 429) and force a logout.
  Restart the backend to reset the in-memory counter, or loosen the limiter in
  `backend/middleware/rateLimiter.js` for local work.
- **Chakra UI v2.** This project uses Chakra **v2**. Use flat components
  (`<Card>`, `<Tabs>/<Tab>`, `<Modal>/<ModalContent>`, `<Alert>/<AlertIcon>`),
  not the v3 dotted API (`<Card.Root>`, `<Tabs.Trigger>`), which is `undefined`
  on v2 and renders a blank page.
