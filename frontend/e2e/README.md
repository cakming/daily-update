# E2E Tests

End-to-end tests for the Daily Update App using Playwright.

## Overview

These tests verify the complete user workflows including:
- **Authentication Flow** (`auth.e2e.js`): Registration, login, logout, and protected routes
- **Daily Updates** (`daily-updates.e2e.js`): Creating and viewing daily updates
- **Weekly Updates** (`weekly-updates.e2e.js`): Generating weekly summaries from daily updates

## Prerequisites

1. **Backend server must be running** on `http://localhost:5000`
2. **MongoDB must be running** (tests will create/use test data)
3. **Playwright browsers installed**: `npm run playwright:install`

## Running E2E Tests

### 1. Start the Backend Server

In a separate terminal:

```bash
cd backend
npm run dev
```

### 2. Run E2E Tests

The frontend dev server will start automatically via Playwright config.

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with browser visible (headed mode)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth.e2e.js
```

## Test Coverage

### Authentication Flow (4 tests)
- ✅ User registration → login → dashboard access
- ✅ Login with registered credentials
- ✅ Invalid login shows error
- ✅ Protected routes redirect to login

### Daily Updates (4 tests)
- ✅ Create a daily update with AI formatting
- ✅ View updates in history
- ✅ Empty state when no updates
- ✅ Error handling for invalid input

### Weekly Updates (4 tests)
- ✅ Generate weekly summary from daily updates
- ✅ Structured sections (achievements, ongoing, next steps)
- ✅ Empty state handling
- ✅ Save generated summary

**Total: 12 E2E tests**

## Test Data

- Tests create unique users with timestamped emails
- Each test is isolated and creates its own test data
- Tests run serially to avoid database conflicts

## Debugging

### View test results
```bash
npx playwright show-report
```

### Run tests with debugging
```bash
npx playwright test --debug
```

### View traces for failed tests
Traces are automatically captured on first retry and can be viewed in the HTML report.

## Configuration

See `playwright.config.js` for:
- Base URL configuration
- Browser settings
- Timeouts
- Screenshots and traces

## Troubleshooting

### Backend not running
Error: `net::ERR_CONNECTION_REFUSED`
**Solution**: Start the backend server first

### MongoDB connection issues
Error: `MongoServerError: connect ECONNREFUSED`
**Solution**: Ensure MongoDB is running locally or via Docker

### Frontend port already in use
Error: `Port 3000 is already in use`
**Solution**: Stop other Vite dev servers or change the port in `playwright.config.js`

## CI/CD Integration

To run E2E tests in CI:

```bash
# Set environment variables
export CI=true
export DATABASE_URL=your_test_db_url

# Start backend in background
cd backend && npm start &

# Run E2E tests
cd frontend && npm run test:e2e
```
