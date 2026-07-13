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

describe('Export Integration Tests', () => {
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
        name: 'Export Test User',
        email: `export-test-${Date.now()}@test.com`,
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
        name: 'Test Company Export',
        description: 'Test company for export',
        color: '#00FF00',
      });

    companyId = companyRes.body.data._id;

    // Create test updates
    await request(app)
      .post('/api/daily-updates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        rawInput: 'Export test update 1',
        date: '2025-11-05',
        companyId,
      });

    await request(app)
      .post('/api/daily-updates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        rawInput: 'Export test update 2',
        date: '2025-11-06',
      });
  });

  describe('GET /api/export/metadata', () => {
    test('should return export metadata', async () => {
      const res = await request(app)
        .get('/api/export/metadata')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
      expect(res.body.data).toHaveProperty('dateRange');
      expect(res.body.data).toHaveProperty('types');
      expect(res.body.data).toHaveProperty('estimatedSizes');
      expect(res.body.data.count).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(res.body.data.types)).toBe(true);
      expect(res.body.data.types).toContain('daily');
    });

    test('should filter metadata by company', async () => {
      const res = await request(app)
        .get('/api/export/metadata')
        .query({ companyId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Only one seeded update carries this companyId
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.types).toContain('daily');
    });

    test('should filter metadata by type', async () => {
      const res = await request(app)
        .get('/api/export/metadata')
        .query({ type: 'daily' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/export/metadata');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/export/csv', () => {
    test('should export updates as CSV', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.csv');
      expect(res.text).toContain('Date,Type');
    });

    test('should filter CSV export by company', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .query({ companyId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('Date,Type');
    });

    test('should filter CSV export by type', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .query({ type: 'daily' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should filter CSV export by date range', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/export/csv');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/export/json', () => {
    test('should export updates as JSON', async () => {
      const res = await request(app)
        .get('/api/export/json')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.json');

      const data = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
      expect(data).toHaveProperty('updates');
      expect(Array.isArray(data.updates)).toBe(true);
    });

    test('should filter JSON export by company', async () => {
      const res = await request(app)
        .get('/api/export/json')
        .query({ companyId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/export/json');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/export/markdown', () => {
    test('should export updates as Markdown', async () => {
      const res = await request(app)
        .get('/api/export/markdown')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.md');
      expect(res.text).toContain('# Daily Updates Export');
    });

    test('should include company names in markdown', async () => {
      const res = await request(app)
        .get('/api/export/markdown')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // Should contain company name for updates with company
      expect(res.text).toContain('Test Company Export');
    });

    test('should filter markdown export by type', async () => {
      const res = await request(app)
        .get('/api/export/markdown')
        .query({ type: 'daily' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/export/markdown');

      expect(res.status).toBe(401);
    });
  });
});
