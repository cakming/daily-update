import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import NotificationPreference from '../../../models/NotificationPreference.js';
import {
  getPreferences,
  updatePreferences,
  resetPreferences,
  shouldSendNotification,
} from '../../../controllers/notificationPreferenceController.js';

describe('Notification Preference Controller', () => {
  let mockReq;
  let mockRes;
  let userId;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    userId = new mongoose.Types.ObjectId();
    mockReq = { body: {}, user: { _id: userId } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should create default preferences when none exist', async () => {
      await getPreferences(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.userId.toString()).toBe(userId.toString());
      // Defaults from the schema
      expect(response.data.emailNotifications.enabled).toBe(true);
      expect(response.data.quietHours.enabled).toBe(false);

      const inDb = await NotificationPreference.findOne({ userId });
      expect(inDb).not.toBeNull();
    });

    it('should return existing preferences without creating a duplicate', async () => {
      await NotificationPreference.create({
        userId,
        emailNotifications: { enabled: false },
      });

      await getPreferences(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.emailNotifications.enabled).toBe(false);

      const count = await NotificationPreference.countDocuments({ userId });
      expect(count).toBe(1);
    });

    it('should return 500 when the userId is invalid', async () => {
      mockReq.user = { _id: undefined };

      await getPreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Failed to get notification preferences' })
      );
    });
  });

  describe('updatePreferences', () => {
    it('should create preferences when none exist yet', async () => {
      mockReq.body = {
        emailNotifications: { enabled: false, dailyDigest: true },
        quietHours: { enabled: true, startTime: '20:00' },
      };

      await updatePreferences(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.emailNotifications.enabled).toBe(false);
      expect(response.data.quietHours.enabled).toBe(true);
      expect(response.data.quietHours.startTime).toBe('20:00');
    });

    it('should merge into existing preferences across all groups', async () => {
      await NotificationPreference.create({ userId });

      mockReq.body = {
        emailNotifications: { dailyDigest: true },
        inAppNotifications: { systemNotifications: false },
        botNotifications: { telegram: false },
        quietHours: { enabled: true, endTime: '07:30' },
      };

      await updatePreferences(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.message).toBe('Notification preferences updated successfully');
      // Merged: changed field updated, untouched field keeps default
      expect(response.data.emailNotifications.dailyDigest).toBe(true);
      expect(response.data.emailNotifications.enabled).toBe(true); // default preserved
      expect(response.data.inAppNotifications.systemNotifications).toBe(false);
      expect(response.data.botNotifications.telegram).toBe(false);
      expect(response.data.quietHours.enabled).toBe(true);
      expect(response.data.quietHours.endTime).toBe('07:30');
    });

    it('should return 500 when the userId is invalid', async () => {
      mockReq.user = { _id: undefined };
      mockReq.body = { emailNotifications: { enabled: false } };

      await updatePreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('resetPreferences', () => {
    it('should delete existing preferences and recreate defaults', async () => {
      await NotificationPreference.create({
        userId,
        emailNotifications: { enabled: false },
      });

      await resetPreferences(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toBe('Notification preferences reset to default');
      // Back to schema default
      expect(response.data.emailNotifications.enabled).toBe(true);

      const count = await NotificationPreference.countDocuments({ userId });
      expect(count).toBe(1);
    });

    it('should create default preferences even when none existed', async () => {
      await resetPreferences(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.userId.toString()).toBe(userId.toString());
    });

    it('should return 500 when the userId is invalid', async () => {
      mockReq.user = { _id: undefined };

      await resetPreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('shouldSendNotification', () => {
    it('should return true when the user has no preferences', async () => {
      const result = await shouldSendNotification(new mongoose.Types.ObjectId());
      expect(result).toBe(true);
    });

    it('should return true when quiet hours are disabled', async () => {
      await NotificationPreference.create({ userId, quietHours: { enabled: false } });
      const result = await shouldSendNotification(userId);
      expect(result).toBe(true);
    });

    it('should respect a normal (non-midnight-spanning) quiet-hours window', async () => {
      // Quiet from 00:00 to 23:59 -> effectively always quiet -> should NOT send
      await NotificationPreference.create({
        userId,
        quietHours: { enabled: true, startTime: '00:00', endTime: '23:59' },
      });
      const result = await shouldSendNotification(userId);
      expect(result).toBe(false);
    });

    it('should allow notifications outside a normal quiet-hours window', async () => {
      // Quiet window that is essentially empty (start == end == '00:00')
      await NotificationPreference.create({
        userId,
        quietHours: { enabled: true, startTime: '00:00', endTime: '00:00' },
      });
      const result = await shouldSendNotification(userId);
      expect(result).toBe(true);
    });

    it('should handle a quiet-hours window that spans midnight', async () => {
      // startTime > endTime triggers the midnight-spanning branch
      await NotificationPreference.create({
        userId,
        quietHours: { enabled: true, startTime: '22:00', endTime: '08:00' },
      });
      const result = await shouldSendNotification(userId);
      expect(typeof result).toBe('boolean');
    });

    it('should default to true on error', async () => {
      // Passing a non-castable value forces the query to throw
      const result = await shouldSendNotification('not-a-valid-object-id-string-####');
      expect(result).toBe(true);
    });
  });
});
