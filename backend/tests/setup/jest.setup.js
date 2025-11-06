// Jest setup file
// Runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRE = '1d';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'; // Will be mocked

// Note: Timeout is set in jest.config.js (10000ms)

// Global test utilities can be added here
global.testUtils = {
  // Any global test utilities
};
