import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import NotificationPreference from '../../../models/NotificationPreference.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

describe('Notification Preferences API Integration Tests', () => {
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
      createUserFixture({ email: 'prefs-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('GET /api/notification-preferences', () => {
    it('should create and return default preferences on first access', async () => {
      const res = await request(app)
        .get('/api/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.emailNotifications.enabled).toBe(true);
      expect(res.body.data.quietHours.enabled).toBe(false);

      const stored = await NotificationPreference.findOne({ userId: testUser._id });
      expect(stored).not.toBeNull();
    });

    it('should require authentication', async () => {
      await request(app).get('/api/notification-preferences').expect(401);
    });
  });

  describe('PUT /api/notification-preferences', () => {
    it('should merge updates into existing preferences', async () => {
      await NotificationPreference.create({ userId: testUser._id });

      const res = await request(app)
        .put('/api/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailNotifications: { enabled: false },
          quietHours: { enabled: true, startTime: '23:00' },
        })
        .expect(200);

      expect(res.body.data.emailNotifications.enabled).toBe(false);
      // Untouched nested field retains default
      expect(res.body.data.emailNotifications.weeklyDigest).toBe(true);
      expect(res.body.data.quietHours.enabled).toBe(true);
      expect(res.body.data.quietHours.startTime).toBe('23:00');
    });

    it('should create preferences if none exist yet', async () => {
      const res = await request(app)
        .put('/api/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ botNotifications: { telegram: false } })
        .expect(200);

      expect(res.body.data.botNotifications.telegram).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app).put('/api/notification-preferences').send({}).expect(401);
    });
  });

  describe('POST /api/notification-preferences/reset', () => {
    it('should reset preferences to defaults', async () => {
      await NotificationPreference.create({
        userId: testUser._id,
        emailNotifications: { enabled: false },
      });

      const res = await request(app)
        .post('/api/notification-preferences/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toContain('reset');
      expect(res.body.data.emailNotifications.enabled).toBe(true);
    });
  });
});
