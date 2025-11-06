import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import connectDB from '../../config/db.js';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Update from '../../models/Update.js';
import Company from '../../models/Company.js';

describe('Analytics Integration Tests', () => {
  let authToken;
  let userId;
  let companyId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /analytics-test/ });
    await Update.deleteMany({ userId });
    await Company.deleteMany({ name: /Test Company/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analytics Test User',
        email: `analytics-test-${Date.now()}@test.com`,
        password: 'Test123456',
      });

    authToken = userRes.body.token;
    userId = userRes.body.user._id;

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
      expect(res.body.data).toHaveProperty('totalUpdates');
      expect(res.body.data).toHaveProperty('dailyUpdates');
      expect(res.body.data).toHaveProperty('weeklyUpdates');
      expect(res.body.data.totalUpdates).toBeGreaterThanOrEqual(2);
    });

    test('should filter dashboard by company', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .query({ companyId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUpdates).toBeGreaterThanOrEqual(1);
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
      expect(res.body.data).toHaveProperty('daily');
      expect(res.body.data).toHaveProperty('weekly');
      expect(Array.isArray(res.body.data.daily)).toBe(true);
      expect(Array.isArray(res.body.data.weekly)).toBe(true);
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

    test('should limit results when limit provided', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.daily.length).toBeLessThanOrEqual(5);
    });

    test('should require authentication', async () => {
      const res = await request(app).get('/api/analytics/trends');

      expect(res.status).toBe(401);
    });
  });
});
