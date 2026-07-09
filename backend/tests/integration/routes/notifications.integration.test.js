import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Notification from '../../../models/Notification.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

const buildNotification = (userId, overrides = {}) => ({
  userId,
  title: 'Title',
  message: 'Message body',
  type: 'info',
  category: 'system',
  ...overrides,
});

describe('Notifications API Integration Tests', () => {
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
      createUserFixture({ email: 'notif-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/notifications', () => {
    it('should create a notification', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hi', message: 'There', type: 'success', category: 'update' })
        .expect(201);
      expect(res.body.data.title).toBe('Hi');
      expect(res.body.data.isRead).toBe(false);
    });

    it('should reject without title or message', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only title' })
        .expect(400);
      expect(res.body.message).toContain('required');
    });

    it('should require authentication', async () => {
      await request(app).post('/api/notifications').send({ title: 'a', message: 'b' }).expect(401);
    });
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      await Notification.create(buildNotification(testUser._id, { isRead: false }));
      await Notification.create(buildNotification(testUser._id, { isRead: true }));
    });

    it('should return notifications with an unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.unreadCount).toBe(1);
    });

    it('should filter by isRead', async () => {
      const res = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should only return the user notifications', async () => {
      const other = await User.create(
        createUserFixture({ email: 'other-notif@example.com', password: 'password123' })
      );
      await Notification.create(buildNotification(other._id));
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return the unread count', async () => {
      await Notification.create(buildNotification(testUser._id, { isRead: false }));
      await Notification.create(buildNotification(testUser._id, { isRead: false }));
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.count).toBe(2);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const n = await Notification.create(buildNotification(testUser._id, { isRead: false }));
      const res = await request(app)
        .put(`/api/notifications/${n._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should return 404 for a non-existent notification', async () => {
      await request(app)
        .put('/api/notifications/507f1f77bcf86cd799439011/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await Notification.create(buildNotification(testUser._id, { isRead: false }));
      await Notification.create(buildNotification(testUser._id, { isRead: false }));
      await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(await Notification.countDocuments({ userId: testUser._id, isRead: false })).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      const n = await Notification.create(buildNotification(testUser._id));
      await request(app)
        .delete(`/api/notifications/${n._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(await Notification.findById(n._id)).toBeNull();
    });

    it('should return 404 for a non-existent notification', async () => {
      await request(app)
        .delete('/api/notifications/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/notifications/clear-read', () => {
    it('should delete all read notifications', async () => {
      await Notification.create(buildNotification(testUser._id, { isRead: true }));
      await Notification.create(buildNotification(testUser._id, { isRead: true }));
      await Notification.create(buildNotification(testUser._id, { isRead: false }));
      const res = await request(app)
        .delete('/api/notifications/clear-read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.message).toContain('2');
      expect(await Notification.countDocuments({ userId: testUser._id })).toBe(1);
    });
  });
});
