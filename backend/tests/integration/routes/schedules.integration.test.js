import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import ScheduledUpdate from '../../../models/ScheduledUpdate.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

const buildSchedule = (userId, overrides = {}) => ({
  userId,
  type: 'daily',
  content: 'Daily standup content',
  scheduleType: 'daily',
  scheduledTime: '09:00',
  ...overrides,
});

describe('Schedules API Integration Tests', () => {
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
      createUserFixture({ email: 'schedules-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/schedules', () => {
    it('should create a daily schedule', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'daily', content: 'body', scheduleType: 'daily', scheduledTime: '09:30' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduledTime).toBe('09:30');
      expect(res.body.data.nextRun).toBeTruthy();
    });

    it('should reject when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'daily' })
        .expect(400);
      expect(res.body.message).toContain('provide');
    });

    it('should require scheduledDate for one-time schedules', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'daily', content: 'b', scheduleType: 'once', scheduledTime: '09:00' })
        .expect(400);
      expect(res.body.message).toContain('date is required');
    });

    it('should require dayOfWeek for weekly schedules', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'daily', content: 'b', scheduleType: 'weekly', scheduledTime: '09:00' })
        .expect(400);
      expect(res.body.message).toContain('Day of week');
    });

    it('should reject an invalid time format', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'daily', content: 'b', scheduleType: 'daily', scheduledTime: '25:99' })
        .expect(400);
      expect(res.body.message).toContain('Invalid time format');
    });

    it('should require authentication', async () => {
      await request(app).post('/api/schedules').send({}).expect(401);
    });
  });

  describe('GET /api/schedules', () => {
    it('should list only the user schedules', async () => {
      await ScheduledUpdate.create(buildSchedule(testUser._id));
      const other = await User.create(
        createUserFixture({ email: 'other-sched@example.com', password: 'password123' })
      );
      await ScheduledUpdate.create(buildSchedule(other._id));

      const res = await request(app)
        .get('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
    });

    it('should filter by isActive', async () => {
      await ScheduledUpdate.create(buildSchedule(testUser._id, { isActive: true }));
      await ScheduledUpdate.create(buildSchedule(testUser._id, { isActive: false }));

      const res = await request(app)
        .get('/api/schedules?isActive=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].isActive).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/schedules').expect(401);
    });
  });

  describe('GET /api/schedules/:id', () => {
    it('should get a schedule by id', async () => {
      const s = await ScheduledUpdate.create(buildSchedule(testUser._id));
      const res = await request(app)
        .get(`/api/schedules/${s._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data._id).toBe(s._id.toString());
    });

    it('should return 404 for a non-existent schedule', async () => {
      await request(app)
        .get('/api/schedules/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 403 for another user's schedule", async () => {
      const other = await User.create(
        createUserFixture({ email: 'owner-sched@example.com', password: 'password123' })
      );
      const s = await ScheduledUpdate.create(buildSchedule(other._id));
      await request(app)
        .get(`/api/schedules/${s._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/schedules/:id', () => {
    it('should update a schedule', async () => {
      const s = await ScheduledUpdate.create(buildSchedule(testUser._id));
      const res = await request(app)
        .put(`/api/schedules/${s._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'updated content', scheduledTime: '10:15' })
        .expect(200);
      expect(res.body.data.content).toBe('updated content');
      expect(res.body.data.scheduledTime).toBe('10:15');
    });

    it("should return 403 for another user's schedule", async () => {
      const other = await User.create(
        createUserFixture({ email: 'owner-sched2@example.com', password: 'password123' })
      );
      const s = await ScheduledUpdate.create(buildSchedule(other._id));
      await request(app)
        .put(`/api/schedules/${s._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'x' })
        .expect(403);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('should delete a schedule', async () => {
      const s = await ScheduledUpdate.create(buildSchedule(testUser._id));
      await request(app)
        .delete(`/api/schedules/${s._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(await ScheduledUpdate.findById(s._id)).toBeNull();
    });

    it('should return 404 for a non-existent schedule', async () => {
      await request(app)
        .delete('/api/schedules/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/schedules/:id/toggle', () => {
    it('should toggle active status', async () => {
      const s = await ScheduledUpdate.create(buildSchedule(testUser._id, { isActive: true }));
      const res = await request(app)
        .post(`/api/schedules/${s._id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.isActive).toBe(false);
      expect(res.body.message).toContain('deactivated');
    });
  });
});
