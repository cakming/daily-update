# Claude Development Guide

This document provides guidelines for Claude (AI assistant) when working on this project. It ensures consistency, quality, and best practices across all development tasks.

## Project Overview

**Daily Update App** - A production-ready application for transforming technical updates into client-friendly reports using AI.

- **Backend**: Node.js, Express, MongoDB, Claude API
- **Frontend**: React, Chakra UI, Vite
- **Testing**: Jest (backend), Vitest (frontend), Supertest, React Testing Library

## Core Principles

### 1. Test-Driven Development (TDD)

**Always follow the TDD cycle:**

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code quality while keeping tests green

**Test Coverage Requirements:**
- Unit Tests: Minimum 80% coverage
- Integration Tests: All API endpoints
- E2E Tests: Critical user flows
- Edge Cases: Error handling, validation, boundary conditions

### 2. Production-Ready Code

**No Mock Data in Production Code:**
- Use mock data only in tests
- All features must work with real databases and APIs
- Environment-based configuration (dev/test/prod)

**Production Standards:**
- Proper error handling and logging
- Input validation and sanitization
- Security best practices (JWT, password hashing, rate limiting)
- Database transactions where needed
- Proper HTTP status codes
- Meaningful error messages

### 3. Code Quality

**Code Standards:**
- Follow ESLint rules
- Use TypeScript-style JSDoc comments
- Consistent naming conventions
- DRY (Don't Repeat Yourself)
- SOLID principles
- Clear, self-documenting code

**Code Review Checklist:**
- [ ] Tests written and passing
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] Environment variables used for config
- [ ] Security considerations addressed

## Documentation Structure

### Directory Organization

```
docs/
├── setup/              # Installation and setup guides
├── deployment/         # Deployment and infrastructure docs
├── technical-docs/     # Technical specifications and architecture
├── architecture/       # System design and architecture diagrams
├── testing/           # Testing strategies and guides
└── todo/              # Project tasks and planning
```

### Documentation Standards

**All documentation must include:**
- Clear title and purpose
- Last updated date
- Table of contents (for docs > 100 lines)
- Code examples where applicable
- Links to related documents

**File naming convention:**
- Use kebab-case: `api-endpoints.md`
- Be descriptive: `mongodb-schema-design.md`
- Include version if needed: `api-v1-specification.md`

## Testing Guidelines

### Backend Testing

**Structure:**
```
backend/
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   ├── controllers/
│   │   └── services/
│   ├── integration/
│   │   └── routes/
│   └── setup/
│       ├── testDb.js
│       └── fixtures.js
```

**Test File Naming:**
- Unit tests: `filename.test.js`
- Integration tests: `filename.integration.test.js`
- E2E tests: `filename.e2e.test.js`

**Test Structure:**
```javascript
describe('Feature Name', () => {
  describe('Specific Function/Method', () => {
    it('should handle success case', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Frontend Testing

**Structure:**
```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│   └── test-utils/
│       └── setup.js
```

**Test Priorities:**
1. User interactions (clicks, form submissions)
2. Data fetching and display
3. Error states
4. Loading states
5. Edge cases

## Development Workflow

### 1. Starting New Feature

1. Create feature branch: `feature/feature-name`
2. Write tests first (TDD)
3. Implement feature to pass tests
4. Refactor and optimize
5. Update documentation
6. Run full test suite
7. Commit with conventional commits

### 2. Bug Fixes

1. Create bug branch: `fix/bug-description`
2. Write failing test that reproduces bug
3. Fix the bug
4. Ensure test passes
5. Add additional edge case tests
6. Update documentation if needed
7. Commit and create PR

### 3. Refactoring

1. Ensure all tests are passing
2. Make incremental changes
3. Run tests after each change
4. Keep tests green throughout
5. Update tests if behavior changes
6. Document architectural changes

## Git Commit Conventions

**Format:** `type(scope): subject`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality
fix(api): handle null values in update endpoint
docs(setup): update MongoDB installation steps
test(auth): add integration tests for login flow
refactor(controllers): extract common validation logic
```

## API Development Standards

### Request Validation

**Always validate:**
- Required fields
- Data types
- Format (email, date, etc.)
- Length constraints
- Business logic rules

**Use express-validator:**
```javascript
const validation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim(),
];
```

### Error Responses

**Consistent error format:**
```javascript
{
  success: false,
  message: "User-friendly error message",
  errors: [
    {
      field: "email",
      message: "Invalid email format"
    }
  ],
  code: "VALIDATION_ERROR"
}
```

### Success Responses

**Consistent success format:**
```javascript
{
  success: true,
  data: { /* response data */ },
  message: "Optional success message"
}
```

## Database Guidelines

### Schema Design

**Best Practices:**
- Use appropriate indexes
- Include timestamps (createdAt, updatedAt)
- Use refs for relationships
- Add validation at schema level
- Use enums for fixed values

**Example:**
```javascript
const schema = new mongoose.Schema({
  // Field definitions
}, {
  timestamps: true, // Auto-add createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
schema.index({ userId: 1, date: -1 });
```

### Transactions

**Use transactions for multi-document operations:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Operations
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Security Guidelines

### Authentication

- Use JWT with secure secret
- Set appropriate expiration times
- Validate tokens on protected routes
- Don't expose sensitive data in tokens

### Password Security

- Hash passwords with bcrypt (salt rounds: 10+)
- Never log passwords
- Validate password strength
- Implement rate limiting on auth endpoints

### Input Sanitization

- Validate all user inputs
- Sanitize HTML/special characters
- Prevent NoSQL injection
- Use parameterized queries

### API Security

- Implement rate limiting
- Use CORS properly
- Set security headers (helmet)
- Validate content-type
- Implement CSRF protection for state-changing operations

## Performance Guidelines

### Backend

- Use database indexes
- Implement pagination
- Cache frequently accessed data
- Use lean() for read-only queries
- Avoid N+1 queries
- Use select() to limit fields

### Frontend

- Implement code splitting
- Lazy load routes
- Optimize images
- Use React.memo for expensive components
- Debounce search inputs
- Implement infinite scroll for long lists

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code coverage meets requirements
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Error logging configured
- [ ] Database backups enabled

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Monitoring enabled
- [ ] Logs reviewed
- [ ] Performance metrics checked
- [ ] Rollback plan ready

## Troubleshooting Guide

### Common Issues

**1. Tests Failing:**
- Check test database connection
- Verify environment variables
- Clear test database between runs
- Check for async issues

**2. API Errors:**
- Verify request format
- Check authentication token
- Review server logs
- Test with Postman/curl

**3. Database Issues:**
- Check connection string
- Verify credentials
- Check network access
- Review indexes

## Resources

### Internal Documentation
- [Setup Guide](docs/setup/installation.md)
- [API Documentation](docs/technical-docs/api-endpoints.md)
- [Testing Strategy](docs/testing/testing-strategy.md)
- [Architecture Overview](docs/architecture/system-design.md)

### External Resources
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Schema Design](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## Project Commands

### Backend
```bash
npm test              # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run dev          # Development server
npm start            # Production server
npm run lint         # Run linter
```

### Frontend
```bash
npm test              # Run tests
npm run test:ui      # Vitest UI
npm run coverage     # Coverage report
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
```

## Code Review Guidelines

### For Reviewers

**Check for:**
- Tests exist and are meaningful
- Code follows style guide
- No security vulnerabilities
- Performance implications
- Error handling
- Documentation updates

**Review Checklist:**
- [ ] Tests added/updated
- [ ] Code is readable and maintainable
- [ ] No obvious bugs
- [ ] Follows project conventions
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] Error cases handled

### For Developers

**Before submitting PR:**
- Run full test suite
- Update documentation
- Add meaningful commit messages
- Test manually in dev environment
- Review your own code first
- Add comments for complex logic

## Monitoring and Logging

### Logging Standards

**Log Levels:**
- `error`: Application errors that need immediate attention
- `warn`: Warning messages for potential issues
- `info`: General informational messages
- `debug`: Detailed debugging information (dev only)

**What to Log:**
- API requests/responses (excluding sensitive data)
- Database operations
- Authentication attempts
- Errors with stack traces
- Performance metrics

**Never Log:**
- Passwords
- API keys
- Personal identifiable information (PII)
- Credit card numbers
- Session tokens

### Error Tracking

**Production Requirements:**
- Error monitoring service (e.g., Sentry)
- Alert on critical errors
- Group similar errors
- Track error trends
- Include context (user, request, environment)

## Contributing

When contributing to this project:

1. Read this guide thoroughly
2. Follow TDD approach
3. Maintain code quality standards
4. Update documentation
5. Write meaningful commit messages
6. Request code reviews

## Questions and Support

For questions or clarifications:
1. Check existing documentation
2. Review similar implementations in codebase
3. Check git history for context
4. Ask in team discussions

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
**Maintainer:** Development Team
