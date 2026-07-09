import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import ScheduledUpdate from '../../../models/ScheduledUpdate.js';
import ScheduleHistory from '../../../models/ScheduleHistory.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

const buildSchedule = (userId) => ({
  userId,
  type: 'daily',
  content: 'content',
  scheduleType: 'daily',
  scheduledTime: '09:00',
});

const buildHistory = (userId, scheduleId, overrides = {}) => ({
  scheduleId,
  userId,
  status: 'success',
  updateType: 'daily',
  executedAt: new Date(),
  executionTimeMs: 120,
  ...overrides,
});

describe('Schedule History API Integration Tests', () => {
  let authToken;
  let testUser;
  let schedule;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    testUser = await User.create(
      createUserFixture({ email: 'history-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
    schedule = await ScheduledUpdate.create(buildSchedule(testUser._id));
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('GET /api/schedule-history', () => {
    it('should list history for the user', async () => {
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id));
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id, { status: 'failed' }));

      const res = await request(app)
        .get('/api/schedule-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id, { status: 'success' }));
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id, { status: 'failed' }));

      const res = await request(app)
        .get('/api/schedule-history?status=failed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/schedule-history').expect(401);
    });
  });

  describe('GET /api/schedule-history/stats', () => {
    it('should return execution statistics', async () => {
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id, { status: 'success' }));
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id, { status: 'failed' }));

      const res = await request(app)
        .get('/api/schedule-history/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.totalExecutions).toBe(2);
      expect(res.body.data.failedExecutions).toBe(1);
      expect(res.body.data.successRate).toBe(50);
    });
  });

  describe('GET /api/schedule-history/schedule/:scheduleId', () => {
    it('should return history for a specific schedule with statistics', async () => {
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id));

      const res = await request(app)
        .get(`/api/schedule-history/schedule/${schedule._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.statistics.total).toBe(1);
    });

    it('should return 404 for a non-existent schedule', async () => {
      await request(app)
        .get('/api/schedule-history/schedule/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 403 for another user's schedule", async () => {
      const other = await User.create(
        createUserFixture({ email: 'other-history@example.com', password: 'password123' })
      );
      const otherSchedule = await ScheduledUpdate.create(buildSchedule(other._id));
      await request(app)
        .get(`/api/schedule-history/schedule/${otherSchedule._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('GET /api/schedule-history/:id', () => {
    it('should get a single history entry', async () => {
      const h = await ScheduleHistory.create(buildHistory(testUser._id, schedule._id));
      const res = await request(app)
        .get(`/api/schedule-history/${h._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data._id).toBe(h._id.toString());
    });

    it('should return 404 for a non-existent entry', async () => {
      await request(app)
        .get('/api/schedule-history/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 403 for another user's entry", async () => {
      const other = await User.create(
        createUserFixture({ email: 'other-history2@example.com', password: 'password123' })
      );
      const otherSchedule = await ScheduledUpdate.create(buildSchedule(other._id));
      const h = await ScheduleHistory.create(buildHistory(other._id, otherSchedule._id));
      await request(app)
        .get(`/api/schedule-history/${h._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/schedule-history/:id', () => {
    it('should delete a history entry', async () => {
      const h = await ScheduleHistory.create(buildHistory(testUser._id, schedule._id));
      await request(app)
        .delete(`/api/schedule-history/${h._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(await ScheduleHistory.findById(h._id)).toBeNull();
    });

    it('should return 404 for a non-existent entry', async () => {
      await request(app)
        .delete('/api/schedule-history/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/schedule-history/schedule/:scheduleId', () => {
    it('should delete all history for a schedule', async () => {
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id));
      await ScheduleHistory.create(buildHistory(testUser._id, schedule._id));

      const res = await request(app)
        .delete(`/api/schedule-history/schedule/${schedule._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.deletedCount).toBe(2);
      expect(await ScheduleHistory.countDocuments({ scheduleId: schedule._id })).toBe(0);
    });
  });
});
