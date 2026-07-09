# Current Tasks

**Last Updated:** 2026-07-09
**Sprint:** Stabilization

## ✅ Recently Completed (2026-07-09 — stabilization pass)

The app did not actually run as shipped; this pass made it runnable and added a
regression guard. See `completed-tasks.md` for detail.

- [x] Fix backend boot crash (`models/DailyUpdate.js` / `WeeklyUpdate.js` → `Update.js`)
- [x] Complete the Chakra UI v3→v2 migration (16 pages were rendering blank)
- [x] Add an app-wide React error boundary (blank-screen crashes now surface)
- [x] Repair the frontend test harness (vitest `setupFiles` path + Chakra v2 test-utils)
- [x] Add render smoke tests for all 22 pages
- [x] Update the AI model (retired `claude-3-5-sonnet-20241022` → `claude-sonnet-5`,
      overridable via `ANTHROPIC_MODEL`)
- [x] Remove Google Chat placeholder images (webhook is a per-user UI setting)
- [x] Refresh docs (README status/known-issues, new DEVELOPMENT.md, todo trackers)
- [x] Add Swagger/OpenAPI API docs at `/api-docs` (19 paths annotated)
- [x] Add behavioral frontend tests (Login/CreateDaily/History/ExportButton) + tags
      backend integration tests + Playwright E2E smoke specs
- [x] Skeleton loaders on History/Companies/Templates
- [x] DOMPurify `sanitize()` helper (audit: no `dangerouslySetInnerHTML` sinks)
- [x] Monitoring & backups runbook (`docs/deployment/monitoring-and-backups.md`)

Note: **Rate limiting** and **Sentry error logging** listed below are already
implemented in the codebase — marked done.

## In Progress

### High Priority

- [ ] **Complete Backend Test Coverage**
  - [ ] Write unit tests for Update model
  - [ ] Write integration tests for daily update endpoints
  - [ ] Write integration tests for weekly update endpoints
  - [ ] Write unit tests for Claude service
  - [ ] Achieve 80%+ test coverage
  - **Assignee:** Development Team
  - **Due:** 2025-11-08
  - **Dependencies:** Testing infrastructure (completed)

- [ ] **Complete Frontend Test Coverage**
  - [ ] Write tests for AuthContext
  - [ ] Write tests for Login page
  - [ ] Write tests for Dashboard page
  - [ ] Write tests for CreateDailyUpdate page
  - [ ] Write tests for CreateWeeklyUpdate page
  - [ ] Write tests for History page
  - [ ] Write tests for API service
  - [ ] Achieve 80%+ test coverage
  - **Assignee:** Development Team
  - **Due:** 2025-11-09
  - **Dependencies:** Testing infrastructure (completed)

### Medium Priority

- [x] **Add Error Logging Service** — Sentry is integrated (`config/sentry.js`, `@sentry/node`)
  - [x] Integrate Sentry or similar service
  - [ ] Configure error tracking for backend
  - [ ] Configure error tracking for frontend
  - [ ] Set up error alerts
  - **Assignee:** DevOps
  - **Due:** 2025-11-10

- [x] **Implement Rate Limiting** — `express-rate-limit` in `middleware/rateLimiter.js`
  - [x] Install express-rate-limit
  - [ ] Configure rate limits per endpoint
  - [ ] Add rate limit tests
  - [ ] Document rate limit policies
  - **Assignee:** Backend Team
  - **Due:** 2025-11-12

- [ ] **Add Input Sanitization**
  - [ ] Install DOMPurify or similar
  - [ ] Sanitize all user inputs
  - [ ] Add XSS protection
  - [ ] Add tests for sanitization
  - **Assignee:** Backend Team
  - **Due:** 2025-11-12

### Low Priority

- [x] **Create API Documentation with Swagger** — served at `/api-docs` (+ `/api-docs.json`)
  - [x] Install swagger-jsdoc and swagger-ui-express
  - [ ] Add JSDoc comments to routes
  - [ ] Generate interactive API docs
  - [ ] Host at /api-docs endpoint
  - **Assignee:** Backend Team
  - **Due:** 2025-11-15

- [~] **Add Loading States Improvements** — skeletons on History/Companies/Templates
  - [x] Add skeleton loaders for History page
  - [ ] Add progress indicators for AI processing
  - [ ] Improve feedback during save operations
  - **Assignee:** Frontend Team
  - **Due:** 2025-11-15

## Blocked

- [ ] **E2E Testing with Playwright/Cypress**
  - **Blocker:** Need to decide on tool (Playwright vs Cypress)
  - **Action Required:** Team decision meeting
  - **Target:** 2025-11-10

## Upcoming (Next Sprint)

- [ ] Password reset functionality
- [ ] Email verification
- [ ] User profile editing
- [ ] Export updates to PDF
- [ ] Dark mode support
- [ ] Mobile app research

## Recently Completed

✅ Project setup (backend + frontend)
✅ Authentication system (JWT-based)
✅ Daily update creation with Claude AI
✅ Weekly update generation
✅ Historical management (CRUD)
✅ Testing infrastructure (Jest + Vitest)
✅ Comprehensive documentation
✅ Git repository setup
✅ MongoDB schema design
✅ API endpoint design
✅ Frontend UI with Chakra UI
✅ Protected routes
✅ Copy to clipboard functionality

## Notes

### Testing Strategy
- Follow TDD approach for all new features
- Write tests before implementation
- Maintain 80% minimum coverage
- Run tests in CI/CD pipeline

### Code Review Process
1. Create feature branch
2. Implement with tests
3. Run full test suite
4. Create pull request
5. Peer review
6. Merge to main

### Daily Standup Questions
1. What did you complete yesterday?
2. What are you working on today?
3. Are there any blockers?

## Quick Commands

```bash
# Backend
cd backend
npm test                    # Run all tests
npm run test:coverage       # Check coverage
npm run dev                 # Start dev server

# Frontend
cd frontend
npm test                    # Run all tests
npm run coverage           # Check coverage
npm run dev                # Start dev server

# Both
git status                 # Check changes
git add .                  # Stage changes
git commit -m "message"    # Commit
git push                   # Push to remote
```

## Team Availability

- Backend Team: Available
- Frontend Team: Available
- DevOps: Available
- QA: Not yet assigned

## Dependencies Tracking

| Task | Depends On | Status |
|------|-----------|--------|
| E2E Tests | Tool selection | Blocked |
| Production Deploy | Test coverage 80% | In Progress |
| Rate Limiting | Backend tests | Pending |
| Error Logging | Production deploy prep | Pending |

---

**Update this document daily during standup meetings**
