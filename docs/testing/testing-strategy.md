# Testing Strategy

**Last Updated:** 2025-11-06

## Overview

This project follows Test-Driven Development (TDD) principles. All features must be tested before deployment.

## Testing Pyramid

```
    /\
   /E2E\        <- Few, critical user flows
  /------\
 /Integration\ <- API endpoints, component integration
/--------------\
/  Unit Tests  \ <- Many, fast, isolated tests
```

## Test Coverage Requirements

- **Minimum Overall Coverage:** 80%
- **Critical Paths:** 100%
- **Controllers:** 90%
- **Services:** 90%
- **Models:** 85%
- **Utilities:** 85%

## Testing Frameworks

### Backend
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertions
- **MongoDB Memory Server**: In-memory database for tests
- **Faker**: Generate test data

### Frontend
- **Vitest**: Fast Vite-native test runner
- **React Testing Library**: Component testing
- **Jest DOM**: DOM assertions
- **User Event**: Simulate user interactions
- **MSW**: Mock Service Worker for API mocking

## Backend Testing

### Unit Tests

**Location:** `backend/tests/unit/`

**Purpose:** Test individual functions and methods in isolation

**Example Structure:**
```javascript
// tests/unit/services/claudeService.test.js
import { processDailyUpdate } from '../../../services/claudeService';

describe('Claude Service', () => {
  describe('processDailyUpdate', () => {
    it('should format technical update correctly', async () => {
      const input = 'Fixed bug in auth';
      const date = new Date('2025-11-06');

      const result = await processDailyUpdate(input, date);

      expect(result).toHaveProperty('formattedOutput');
      expect(result).toHaveProperty('sections');
      expect(result.formattedOutput).toContain('🗓️');
    });

    it('should handle empty input', async () => {
      await expect(processDailyUpdate('', new Date()))
        .rejects
        .toThrow();
    });
  });
});
```

**What to Test:**
- Function return values
- Error handling
- Edge cases
- Input validation
- Business logic

### Integration Tests

**Location:** `backend/tests/integration/`

**Purpose:** Test API endpoints with real database

**Example Structure:**
```javascript
// tests/integration/routes/auth.integration.test.js
import request from 'supertest';
import app from '../../../server';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb';

describe('Auth API', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

**What to Test:**
- HTTP status codes
- Response format
- Database operations
- Authentication/authorization
- Error responses
- Validation

### Test Database Setup

**File:** `backend/tests/setup/testDb.js`

```javascript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};
```

## Frontend Testing

### Component Tests

**Location:** `frontend/src/__tests__/components/`

**Purpose:** Test UI components in isolation

**Example Structure:**
```javascript
// src/__tests__/components/ProtectedRoute.test.jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

describe('ProtectedRoute', () => {
  it('should redirect to login when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    // Mock authenticated state
    // ... test implementation
  });
});
```

**What to Test:**
- Rendering with different props
- User interactions (clicks, typing)
- Conditional rendering
- Error states
- Loading states

### Page Tests

**Location:** `frontend/src/__tests__/pages/`

**Purpose:** Test complete page functionality

**Example Structure:**
```javascript
// src/__tests__/pages/Login.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import { AuthProvider } from '../../context/AuthContext';

describe('Login Page', () => {
  it('should handle successful login', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });

  it('should display error message on failed login', async () => {
    // ... test implementation
  });
});
```

### Integration Tests (Frontend)

**Location:** `frontend/src/__tests__/integration/`

**Purpose:** Test component interactions with API

**Mock API Responses:**
```javascript
// src/test-utils/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          token: 'fake-token',
          user: { name: 'Test User', email: 'test@example.com' }
        }
      })
    );
  }),

  rest.get('/api/daily-updates', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: []
      })
    );
  }),
];
```

## E2E Testing

**Tool:** Playwright or Cypress (to be added)

**Location:** `e2e/`

**Purpose:** Test complete user workflows

**Example Scenarios:**
1. User registration → Login → Create daily update → View in history
2. User login → Generate weekly summary → Copy to clipboard
3. User login → Search history → Delete update

## Test Data Management

### Fixtures

**Location:** `backend/tests/setup/fixtures.js`

```javascript
import { faker } from '@faker-js/faker';

export const createUserFixture = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: 'password123',
  ...overrides
});

export const createDailyUpdateFixture = (userId, overrides = {}) => ({
  userId,
  type: 'daily',
  date: new Date(),
  rawInput: faker.lorem.paragraph(),
  formattedOutput: '🗓️ Daily Update...',
  sections: {
    todaysProgress: [faker.lorem.sentence()],
    ongoingWork: [faker.lorem.sentence()],
    nextSteps: [faker.lorem.sentence()],
    issues: ['No major issues reported']
  },
  ...overrides
});
```

## Mocking

### Backend

**Mock External Services:**
```javascript
// Mock Claude API in tests
jest.mock('../../../services/claudeService', () => ({
  processDailyUpdate: jest.fn().mockResolvedValue({
    formattedOutput: 'Mocked output',
    sections: { /* ... */ }
  })
}));
```

### Frontend

**Mock API calls with MSW:**
```javascript
// src/test-utils/setup.js
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Running Tests

### Backend

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- auth.test.js

# Integration tests only
npm test -- --testPathPattern=integration
```

### Frontend

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage
npm run coverage

# Specific file
npm test Login.test.jsx
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci
        working-directory: ./backend

      - name: Run tests
        run: npm test
        working-directory: ./backend

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### DO

✅ Write tests before implementation (TDD)
✅ Test behavior, not implementation
✅ Use descriptive test names
✅ Keep tests independent
✅ Test edge cases and errors
✅ Mock external dependencies
✅ Clean up after tests
✅ Use setup/teardown hooks

### DON'T

❌ Test implementation details
❌ Write flaky tests
❌ Use production database for tests
❌ Skip error cases
❌ Have test interdependencies
❌ Use hardcoded IDs or values
❌ Leave console.logs in tests

## Test Naming Conventions

### Unit Tests

```
describe('[Component/Function Name]', () => {
  describe('[method/function]', () => {
    it('should [expected behavior] when [condition]', () => {
      // test
    });
  });
});
```

### Integration Tests

```
describe('[API Endpoint]', () => {
  describe('[HTTP Method] [path]', () => {
    it('should return [status code] when [scenario]', () => {
      // test
    });
  });
});
```

## Coverage Reports

After running tests with coverage:

```bash
# View HTML report
open coverage/lcov-report/index.html

# View summary in terminal
npm run test:coverage
```

**Reviewing Coverage:**
- Identify untested code
- Add tests for uncovered lines
- Focus on critical paths first
- Don't chase 100% for trivial code

## Debugging Tests

### VS Code Debug Configuration

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Common Issues

**Test timeout:**
```javascript
// Increase timeout for slow tests
jest.setTimeout(10000); // 10 seconds
```

**Async issues:**
```javascript
// Always await async operations
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

**Database not clearing:**
```javascript
// Ensure proper cleanup
afterEach(async () => {
  await clearTestDB();
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Next Steps

1. Set up test environment
2. Write first test (TDD)
3. Implement feature
4. Refactor with confidence
5. Maintain test coverage

---

**Remember:** Tests are documentation. Write them well, and they'll serve as excellent examples of how your code should be used.
