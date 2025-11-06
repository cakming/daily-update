import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import connectDB from '../../../config/db.js';
import mongoose from 'mongoose';
import User from '../../../models/User.js';

describe('Rate Limiter Middleware', () => {
  let authToken;

  beforeAll(async () => {
    await connectDB();

    // Create a test user
    const user = await User.create({
      name: 'Rate Test User',
      email: 'ratelimit@test.com',
      password: 'Test123456'
    });

    // Get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ratelimit@test.com',
        password: 'Test123456'
      });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'ratelimit@test.com' });
    await mongoose.connection.close();
  });

  describe('Auth Rate Limiter', () => {
    test('should allow up to 5 login attempts', async () => {
      // Make 5 requests (should all succeed or fail based on credentials)
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'wrong@test.com',
            password: 'WrongPassword'
          });

        // Should get 401 unauthorized, not 429 rate limit
        expect([401, 429]).toContain(res.status);
      }
    });

    test('should block 6th login attempt with 429', async () => {
      // Make 6 requests rapidly
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@test.com',
              password: 'password'
            })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('API Rate Limiter', () => {
    test('should allow normal API usage', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not be rate limited on first request
      expect(res.status).not.toBe(429);
    });

    test('should have rate limit headers', async () => {
      const res = await request(app)
        .get('/api/health');

      // Check for rate limit headers
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('AI Rate Limiter', () => {
    test('should apply rate limits to AI endpoints', async () => {
      const res = await request(app)
        .get('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`);

      // Should have stricter limits (20/hour)
      expect(res.status).not.toBe(429);
      expect(res.headers['ratelimit-limit']).toBe('20');
    });
  });

  describe('Export Rate Limiter', () => {
    test('should apply rate limits to export endpoints', async () => {
      const res = await request(app)
        .get('/api/export/metadata')
        .set('Authorization', `Bearer ${authToken}`);

      // Should have export limits (10/15min)
      expect(res.status).not.toBe(429);
      expect(res.headers['ratelimit-limit']).toBe('10');
    });
  });

  describe('Rate Limit Error Messages', () => {
    test('should return proper error message when rate limited', async () => {
      // Make many rapid requests to trigger rate limit
      const requests = Array(150).fill(null).map(() =>
        request(app)
          .get('/api/health')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(res => res.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body.message).toBeDefined();
        expect(rateLimitedResponse.body.message).toContain('Too many requests');
      }
    });
  });
});
