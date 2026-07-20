# Feature Status Guide

> **Note (2026-07):** This document previously contained step-by-step build
> guides for features that were treated as "not started." Those features have
> since shipped, so the old guide was misleading and has been replaced with an
> accurate status snapshot. For live details, read the code and tests — they
> are the source of truth.

## Shipped

All of the features that the earlier version of this guide described as
"pending" or "not started" are now implemented and tested:

| Feature | Where it lives |
| --- | --- |
| User profile editing | `backend/controllers/authController.js` (`updateProfile`), `frontend/src/pages/Profile.jsx` |
| Two-factor authentication (2FA) | `backend/controllers/twoFactorController.js`, `frontend/src/pages/TwoFactorSetup.jsx` |
| Tags & categories | `backend/models/Tag.js`, `backend/controllers/tagController.js`, `frontend/src/pages/Tags.jsx`, `TagSelector`/`TagFilter` |
| Bulk operations | `backend/controllers/bulkController.js`, `frontend/src/components/BulkOperations.jsx` |
| Email delivery + digests | `backend/services/emailService.js`, `backend/services/digestScheduler.js`, `backend/config/email.js` |
| Update scheduling (per-schedule channels) | `backend/models/ScheduledUpdate.js`, `backend/services/scheduler.js`, `frontend/src/pages/Schedules.jsx` |
| Telegram bot | `backend/services/telegramBot.js` |
| Google Chat + Slack outbound | `backend/services/googleChat.js`, `backend/services/slack.js` |
| Notifications + quiet hours | `backend/services/notificationDispatcher.js`, `backend/models/NotificationPreference.js` |
| Public share links | `backend/routes/public.js`, `frontend/src/pages/PublicUpdate.jsx` |
| Analytics dashboard | `backend/controllers/analyticsController.js`, `frontend/src/pages/Analytics.jsx` |
| Streaks & achievements | `backend/services/gamificationService.js`, `frontend/src/pages/Achievements.jsx` |

All notification surfaces read fields through the shared
`backend/services/updateFormatter.js` layer to prevent schema drift.

## Ideas not yet built

There is no committed backlog beyond polish. Candidate future work:

- Team-level analytics / leaderboards (streaks are currently per-user).
- Multi-instance HA: the schedulers and Telegram bot run in-process and assume
  a single backend instance. Distributing them needs leader election (and then
  a shared store like Redis) — see `docs/GCP_VM_DEPLOYMENT.md`.
- Pushing frontend test coverage the last stretch toward the 80% backend bar.

## Deployment

Deployment docs are current and authoritative:

- `docs/GCP_VM_DEPLOYMENT.md` — production stack on a GCP VM with external
  MongoDB (Docker).
- `docker-compose.yml` — local development stack (bundled MongoDB).
- `docker-compose.gcp.yml` — production stack (external MongoDB, nginx TLS proxy).
