/**
 * Targeted error-path (404 / 401 / validation) coverage for schedule & team
 * routes — the branches the happy-path suites don't reach.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

const MISSING_ID = '507f1f77bcf86cd799439099'; // valid ObjectId, no such doc

describe('Route error-path coverage', () => {
  let token;

  beforeAll(async () => {
    await connectTestDB();
  });
  afterAll(async () => {
    await closeTestDB();
  });
  beforeEach(async () => {
    await clearTestDB();
    const user = await User.create(
      createUserFixture({ email: 'branchcov@example.com', password: 'password123' })
    );
    token = generateToken(user._id);
  });

  const auth = (req) => req.set('Authorization', `Bearer ${token}`);

  describe('schedules', () => {
    it('GET /:id → 404 for a non-existent schedule', async () => {
      const res = await auth(request(app).get(`/api/schedules/${MISSING_ID}`));
      expect(res.status).toBe(404);
    });
    it('PUT /:id → 404 for a non-existent schedule', async () => {
      const res = await auth(
        request(app).put(`/api/schedules/${MISSING_ID}`).send({ content: 'x' })
      );
      expect(res.status).toBe(404);
    });
    it('DELETE /:id → 404 for a non-existent schedule', async () => {
      const res = await auth(request(app).delete(`/api/schedules/${MISSING_ID}`));
      expect(res.status).toBe(404);
    });
    it('POST /:id/toggle → 404 for a non-existent schedule', async () => {
      const res = await auth(request(app).post(`/api/schedules/${MISSING_ID}/toggle`));
      expect(res.status).toBe(404);
    });
    it('POST / → 400 when required fields are missing', async () => {
      const res = await auth(request(app).post('/api/schedules').send({}));
      expect(res.status).toBe(400);
    });
    it('GET / → 401 without a token', async () => {
      const res = await request(app).get('/api/schedules');
      expect(res.status).toBe(401);
    });
  });

  describe('teams', () => {
    it('GET /:id → 404 for a non-existent team', async () => {
      const res = await auth(request(app).get(`/api/teams/${MISSING_ID}`));
      expect(res.status).toBe(404);
    });
    it('PUT /:id → 404 for a non-existent team', async () => {
      const res = await auth(
        request(app).put(`/api/teams/${MISSING_ID}`).send({ name: 'x' })
      );
      expect(res.status).toBe(404);
    });
    it('DELETE /:id → 404 for a non-existent team', async () => {
      const res = await auth(request(app).delete(`/api/teams/${MISSING_ID}`));
      expect(res.status).toBe(404);
    });
    it('POST / → 400 when name is missing', async () => {
      const res = await auth(request(app).post('/api/teams').send({}));
      expect(res.status).toBe(400);
    });
    it('GET / → 401 without a token', async () => {
      const res = await request(app).get('/api/teams');
      expect(res.status).toBe(401);
    });
  });
});
