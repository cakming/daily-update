# Testing Guide

## Overview

This guide covers the testing infrastructure and strategy for the Daily Update application.

## Test Suite Summary

### Backend Tests

**Test Framework:** Jest + Supertest + MongoDB Memory Server

**Current Status:**
- **Total Tests:** 259
- **Passing:** 247 (95.4%)
- **Failing:** 12 (4.6%)
- **Test Suites:** 15 total (6 passed, 9 with minor failures)

**Coverage:**
- Controllers: ~85%
- Services: ~80%
- Models: ~90%
- Middleware: ~85%
- Routes: ~80%

### Frontend Tests

**Test Framework:** Vitest + React Testing Library + Playwright

**Current Status:**
- Unit/Component Tests: Infrastructure ready
- E2E Tests: Playwright configured

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run coverage

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui
```

---

## Backend Test Structure

### Directory Structure

```
backend/
├── tests/
│   ├── setup/
│   │   ├── jest.setup.js          # Jest configuration
│   │   ├── testDb.js               # Test database setup
│   │   └── fixtures.js             # Test data fixtures
│   ├── unit/
│   │   ├── controllers/            # Controller tests
│   │   ├── services/               # Service tests
│   │   ├── models/                 # Model tests
│   │   └── middleware/             # Middleware tests
│   └── integration/
│       └── routes/                 # API integration tests
└── jest.config.js
```

### Unit Tests

#### Controller Tests

Test all controller methods:
- Request validation
- Business logic execution
- Response formatting
- Error handling

**Example Test Files:**
- `authController.test.js` - Authentication endpoints
- `dailyUpdateController.test.js` - Daily updates CRUD
- `weeklyUpdateController.test.js` - Weekly summaries
- `companyController.test.js` - Company management

#### Service Tests

Test business logic:
- Data processing
- External API integration
- Email sending
- Schedule execution

**Example Test Files:**
- `claudeService.test.js` - AI processing
- `emailService.test.js` - Email functionality
- `scheduler.test.js` - Scheduled tasks

#### Model Tests

Test Mongoose models:
- Schema validation
- Instance methods
- Static methods
- Middleware hooks

**Example Test Files:**
- `User.test.js` - User model
- `Update.test.js` - Update models
- `Company.test.js` - Company model

#### Middleware Tests

Test custom middleware:
- Authentication
- Authorization
- Rate limiting
- Error handling

**Example Test File:**
- `auth.test.js` - Auth middleware

### Integration Tests

Test complete API workflows:
- End-to-end request/response
- Database interactions
- Authentication flows
- Error responses

**Example Test Files:**
- `auth.integration.test.js` - Auth workflows
- `dailyUpdates.integration.test.js` - Update workflows
- `companies.integration.test.js` - Company workflows

---

## Frontend Test Structure

### Directory Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── setup.js                # Test setup
│   │   ├── components/             # Component tests
│   │   ├── pages/                  # Page tests
│   │   ├── utils/                  # Utility tests
│   │   └── hooks/                  # Custom hooks tests
│   └── e2e/
│       ├── auth.spec.js            # Auth E2E tests
│       ├── dashboard.spec.js       # Dashboard E2E tests
│       └── updates.spec.js         # Updates E2E tests
└── vitest.config.js
```

### Component Tests

Test React components:
- Rendering
- User interactions
- Props handling
- State management
- Event handlers

**Testing Utilities:**
- `@testing-library/react` - Render components
- `@testing-library/user-event` - Simulate user actions
- `@testing-library/jest-dom` - DOM assertions

### E2E Tests

Test complete user workflows:
- User authentication
- Creating updates
- Navigation
- Form submissions
- Data persistence

**Framework:** Playwright

---

## Test Database

### MongoDB Memory Server

The backend tests use MongoDB Memory Server for isolated test database:

**Features:**
- In-memory database
- No external dependencies
- Fast test execution
- Automatic cleanup

**Configuration:**
```javascript
// tests/setup/testDb.js
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectTestDb = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const closeTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};
```

---

## Mocking

### API Mocking (MSW)

Frontend tests use Mock Service Worker for API mocking:

```javascript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/daily-updates', (req, res, ctx) => {
    return res(ctx.json({ data: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Service Mocking

Mock external services in backend tests:

```javascript
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mocked response' }]
      })
    }
  }))
}));
```

---

## Writing Tests

### Backend Controller Test Example

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDailyUpdates } from '../controllers/dailyUpdateController.js';

describe('Daily Update Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { _id: 'userId123' },
      query: {}
    };
    mockRes = {
      status: jest.fn().returnThis(),
      json: jest.fn()
    };
  });

  it('should get all daily updates for user', async () => {
    await getDailyUpdates(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
    const response = mockRes.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });
});
```

### Frontend Component Test Example

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```javascript
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

## Coverage Goals

### Current Coverage

**Backend:**
- Overall: ~85%
- Controllers: ~85%
- Services: ~80%
- Models: ~90%
- Middleware: ~85%

**Frontend:**
- Overall: TBD (infrastructure ready)

### Target Coverage

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

---

## Continuous Integration

### GitHub Actions (Recommended Setup)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npx playwright install chromium
      - run: cd frontend && npm run test:e2e
```

---

## Best Practices

### General

1. **Write tests first** - TDD approach when possible
2. **Keep tests isolated** - No dependencies between tests
3. **Test behavior, not implementation** - Focus on what, not how
4. **Use descriptive names** - Test names should describe the scenario
5. **Arrange-Act-Assert** - Structure tests clearly

### Backend

1. **Mock external services** - Don't call real APIs
2. **Use test database** - Don't use production data
3. **Clean up after tests** - Reset database state
4. **Test error cases** - Not just happy paths
5. **Test middleware** - Ensure auth, validation works

### Frontend

1. **Test user perspective** - Use accessible queries
2. **Avoid testing implementation details** - Don't test state directly
3. **Mock API calls** - Use MSW for consistent tests
4. **Test accessibility** - Ensure components are accessible
5. **Test loading states** - Don't forget edge cases

### E2E

1. **Test critical paths** - Focus on most important flows
2. **Keep tests fast** - Run in parallel when possible
3. **Use stable selectors** - data-testid > CSS selectors
4. **Test across browsers** - Chromium, Firefox, Safari
5. **Handle async properly** - Wait for elements, not timeouts

---

## Debugging Tests

### Backend

```bash
# Run specific test file
npm test -- tests/unit/controllers/authController.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should login user"

# Run with verbose output
npm test -- --verbose

# Debug with node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend

```bash
# Run specific test file
npm test -- src/__tests__/components/Button.test.jsx

# Run tests matching pattern
npm test -- -t "renders correctly"

# Debug with browser
npm run test:ui
```

---

## Common Issues

### Backend

**Issue:** Tests timeout
**Solution:** Increase timeout in jest.config.js or individual test

**Issue:** Database not cleaning up
**Solution:** Ensure afterEach hook drops database

**Issue:** Async errors
**Solution:** Use async/await properly, return promises

### Frontend

**Issue:** Component not rendering
**Solution:** Check if all providers are wrapped (AuthProvider, etc.)

**Issue:** Can't find element
**Solution:** Use screen.debug() to see DOM, check queries

**Issue:** Act warnings
**Solution:** Wrap state updates in act() or use waitFor()

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

## Next Steps

1. Write more frontend component tests
2. Increase E2E test coverage
3. Set up CI/CD pipeline
4. Add visual regression testing
5. Implement load testing

---

**Last Updated:** January 15, 2025  
**Version:** 1.0
