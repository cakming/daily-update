import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import User from '../../../models/User.js';
import Update from '../../../models/Update.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import {
  createUserFixture,
  createDailyUpdateFixture,
  createWeeklyUpdateFixture,
} from '../../setup/fixtures.js';

// Mock the email config module so no real transport is created.
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
const mockGetTransporter = jest.fn(() => ({ sendMail: mockSendMail }));
const mockVerifyEmailConfig = jest
  .fn()
  .mockResolvedValue({ success: true, message: 'Email configuration verified' });

jest.unstable_mockModule('../../../config/email.js', () => ({
  getTransporter: mockGetTransporter,
  verifyEmailConfig: mockVerifyEmailConfig,
  emailTemplates: {
    dailyUpdate: jest.fn(() => ({ subject: 'Daily', text: 'text', html: '<p>daily</p>' })),
    weeklySummary: jest.fn(() => ({ subject: 'Weekly', text: 'text', html: '<p>weekly</p>' })),
  },
  default: {},
}));

const app = (await import('../../../app.js')).default;

describe('Email API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    testUser = await User.create(
      createUserFixture({ email: 'email-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('GET /api/email/config-status', () => {
    it('should return the email configuration status', async () => {
      const res = await request(app)
        .get('/api/email/config-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.configured).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/email/config-status').expect(401);
    });
  });

  describe('POST /api/email/test', () => {
    it('should send a test email', async () => {
      const res = await request(app)
        .post('/api/email/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'recipient@example.com' })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should reject a test without an email', async () => {
      await request(app)
        .post('/api/email/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/email/daily/:id', () => {
    // Regression: the controller must populate `companyId` (the real schema
    // path), not `company`. Populating a non-existent path throws under
    // Mongoose strictPopulate and used to 500 the request.
    it('sends a daily update email for an existing update', async () => {
      const update = await Update.create(createDailyUpdateFixture(testUser._id));
      const res = await request(app)
        .post(`/api/email/daily/${update._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipients: ['a@example.com', 'b@example.com'] })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(2); // one send per recipient
    });

    it('should reject without recipients', async () => {
      const update = await Update.create(createDailyUpdateFixture(testUser._id));
      await request(app)
        .post(`/api/email/daily/${update._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipients: [] })
        .expect(400);
    });

    it('should reject invalid email addresses', async () => {
      const update = await Update.create(createDailyUpdateFixture(testUser._id));
      await request(app)
        .post(`/api/email/daily/${update._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipients: ['not-an-email'] })
        .expect(400);
    });

    it('should return 404 for a non-existent update', async () => {
      await request(app)
        .post('/api/email/daily/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipients: ['a@example.com'] })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/email/daily/507f1f77bcf86cd799439011')
        .send({ recipients: ['a@example.com'] })
        .expect(401);
    });
  });

  describe('POST /api/email/weekly/:id', () => {
    // Regression: same fix as the daily route — populate `companyId`, and drop
    // the invalid `.populate('dailyUpdates')` (not a schema path).
    it('sends a weekly summary email for an existing summary', async () => {
      const update = await Update.create(createWeeklyUpdateFixture(testUser._id));
      const res = await request(app)
        .post(`/api/email/weekly/${update._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipients: ['a@example.com'] })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should return 404 for a non-existent summary', async () => {
      await request(app)
        .post('/api/email/weekly/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipients: ['a@example.com'] })
        .expect(404);
    });
  });
});
