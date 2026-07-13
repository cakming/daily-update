import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import {
  apiLimiter,
  authLimiter,
  aiLimiter,
  strictLimiter,
  exportLimiter,
  resetPasswordLimiter,
} from '../../../middleware/rateLimiter.js';

const makeApp = (limiter) => {
  const app = express();
  app.use(limiter);
  app.get('/', (req, res) => res.json({ ok: true }));
  return app;
};

describe('Rate Limiter Middleware', () => {
  // The limiters skip when NODE_ENV === 'test' (so integration suites don't 429).
  // This unit test must exercise the real limiting behaviour, so disable the skip.
  const originalEnv = process.env.NODE_ENV;
  beforeAll(() => { process.env.NODE_ENV = 'development'; });
  afterAll(() => { process.env.NODE_ENV = originalEnv; });

  it('should export all limiters as middleware functions', () => {
    for (const limiter of [
      apiLimiter,
      authLimiter,
      aiLimiter,
      strictLimiter,
      exportLimiter,
      resetPasswordLimiter,
    ]) {
      expect(typeof limiter).toBe('function');
    }
  });

  it('should allow requests under the limit and set RateLimit headers', async () => {
    // exportLimiter (max 10) is only exercised here to avoid shared-store contamination.
    const app = makeApp(exportLimiter);
    const res = await request(app).get('/').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });

  it('should block requests once the limit is exceeded (strictLimiter, max 3)', async () => {
    const app = makeApp(strictLimiter);

    await request(app).get('/').expect(200);
    await request(app).get('/').expect(200);
    await request(app).get('/').expect(200);

    const blocked = await request(app).get('/').expect(429);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.message).toContain('Rate limit exceeded');
  });

  it('should return the custom message for the password reset limiter (max 3)', async () => {
    const app = makeApp(resetPasswordLimiter);

    await request(app).get('/').expect(200);
    await request(app).get('/').expect(200);
    await request(app).get('/').expect(200);

    const blocked = await request(app).get('/').expect(429);
    expect(blocked.body.message).toContain('password reset');
  });
});
