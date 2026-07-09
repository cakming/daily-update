// Jest setup file
// Runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRE = '1d';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'; // Will be mocked

// Note: Timeout is set in jest.config.js (10000ms)

// Register all Mongoose models so controllers that call .populate('tags'),
// .populate('companyId'), etc. don't throw "Schema hasn't been registered for
// model X" in tests that only import a subset of models.
import '../../models/User.js';
import '../../models/Company.js';
import '../../models/Tag.js';
import '../../models/Team.js';
import '../../models/Template.js';
import '../../models/Update.js';
import '../../models/Notification.js';
import '../../models/NotificationPreference.js';
import '../../models/ScheduledUpdate.js';
import '../../models/ScheduleHistory.js';

// Global test utilities can be added here
global.testUtils = {
  // Any global test utilities
};
