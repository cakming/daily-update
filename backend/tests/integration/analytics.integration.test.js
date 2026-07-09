import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';

// Mock Anthropic SDK before importing app so seeding via POST /api/daily-updates
// does not make real network calls.
const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }))
}));

// Dynamic imports after mocking
const { default: app } = await import('../../app.js');
const { default: User } = await import('../../models/User.js');
const { default: Update } = await import('../../models/Update.js');
const { default: Company } = await import('../../models/Company.js');

describe('Analytics Integration Tests', () => {
  let authToken;
  let userId;
  let companyId;

  beforeAll(async () => {
    await connectTestDB();
  }, 30000);

  afterAll(async () => {
    await closeTestDB();
  }, 30000);

  beforeEach(async () => {
    // Clear database before each test
    await clearTestDB();

    // Canned Anthropic response so daily-update creation succeeds during seeding
    mockCreate.mockResolvedValue({
      content: [{
        text: '🗓️ Daily Update — test\n\n✅ Today\'s Progress\n- did work'
      }]
    });

    // Create test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analytics Test User',
        email: `analytics-test-${Date.now()}@test.com`,
        password: 'Test123456',
      });

    if (!userRes.body.success || !userRes.body.data.token) {
      console.error('Registration failed:', userRes.body);
      throw new Error('Failed to create test user');
    }

    authToken = userRes.body.data.token;
    userId = userRes.body.data._id;

    // Create a test company
    const companyRes = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Company Analytics',
        description: 'Test company for analytics',
        color: '#FF0000',
      });

    companyId = companyRes.body.data._id;

    // Create some test updates
    await request(app)
      .post('/api/daily-updates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        rawInput: 'Test update 1',
        date: '2025-11-01',
        companyId,
      });

    await request(app)
      .post('/api/daily-updates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        rawInput: 'Test update 2',
        date: '2025-11-02',
      });
  });

  describe('GET /api/analytics/dashboard', () => {
    test('should return dashboard analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary.totalUpdates');
      expect(res.body.data).toHaveProperty('byType.daily');
      expect(res.body.data).toHaveProperty('byType.weekly');
      expect(res.body.data).toHaveProperty('activityByDay');
      expect(res.body.data.summary.totalUpdates).toBeGreaterThanOrEqual(2);
      expect(res.body.data.byType.daily).toBeGreaterThanOrEqual(2);
    });

    test('should filter dashboard by company', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .query({ companyId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Only one seeded update carries this companyId
      expect(res.body.data.summary.totalUpdates).toBe(1);
    });

    test('should filter dashboard by date range', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-02',
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/analytics/dashboard');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/analytics/trends', () => {
    test('should return trend analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('trend');
      expect(res.body.data).toHaveProperty('period');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('average');
      expect(Array.isArray(res.body.data.trend)).toBe(true);
      // Each point carries a date and a count
      expect(res.body.data.trend[0]).toHaveProperty('date');
      expect(res.body.data.trend[0]).toHaveProperty('count');
    });

    test('should filter trends by company', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .query({ companyId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should filter trends by date range', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should size the trend window to the period provided', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .query({ period: 5 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Controller fills one trend point per day in the requested period
      expect(res.body.data.period).toBe('5 days');
      expect(res.body.data.trend.length).toBe(5);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/analytics/trends');

      expect(res.status).toBe(401);
    });
  });
});
