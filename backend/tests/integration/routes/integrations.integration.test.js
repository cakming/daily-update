import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import User from '../../../models/User.js';
import Update from '../../../models/Update.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import {
  createUserFixture,
  createDailyUpdateFixture,
  createWeeklyUpdateFixture,
} from '../../setup/fixtures.js';

// Mock external integration services so no real network calls are made.
const mockSendTelegramMessage = jest.fn().mockResolvedValue(true);
const mockSendGoogleChatMessage = jest.fn().mockResolvedValue(true);
const mockSendDailyGChat = jest.fn().mockResolvedValue(true);
const mockSendWeeklyGChat = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule('../../../services/telegramBot.js', () => ({
  sendTelegramMessage: mockSendTelegramMessage,
  startTelegramBot: jest.fn(),
  stopTelegramBot: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../services/googleChat.js', () => ({
  sendGoogleChatMessage: mockSendGoogleChatMessage,
  sendGoogleChatCard: jest.fn(),
  sendDailyUpdateToGoogleChat: mockSendDailyGChat,
  sendWeeklySummaryToGoogleChat: mockSendWeeklyGChat,
  default: {},
}));

const app = (await import('../../../app.js')).default;

const VALID_WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAAA/messages?key=abc';

describe('Integrations API Integration Tests', () => {
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
      createUserFixture({ email: 'integrations-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('Telegram', () => {
    it('should report not linked initially', async () => {
      const res = await request(app)
        .get('/api/integrations/telegram/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.linked).toBe(false);
    });

    it('should link a Telegram account and send a confirmation', async () => {
      const res = await request(app)
        .post('/api/integrations/telegram/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ telegramId: '123456789' })
        .expect(200);
      expect(res.body.data.telegramId).toBe('123456789');
      expect(mockSendTelegramMessage).toHaveBeenCalledTimes(1);

      const updated = await User.findById(testUser._id);
      expect(updated.telegramId).toBe('123456789');
    });

    it('should reject linking without a telegramId', async () => {
      await request(app)
        .post('/api/integrations/telegram/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject a telegramId already linked to another user', async () => {
      const other = await User.create(
        createUserFixture({ email: 'tg-owner@example.com', password: 'password123' })
      );
      other.telegramId = '999';
      await other.save({ validateBeforeSave: false });

      await request(app)
        .post('/api/integrations/telegram/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ telegramId: '999' })
        .expect(400);
    });

    it('should send a test message when linked', async () => {
      testUser.telegramId = '555';
      await testUser.save({ validateBeforeSave: false });

      await request(app)
        .post('/api/integrations/telegram/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(mockSendTelegramMessage).toHaveBeenCalledTimes(1);
    });

    it('should reject a test message when not linked', async () => {
      await request(app)
        .post('/api/integrations/telegram/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should unlink a linked account', async () => {
      testUser.telegramId = '777';
      await testUser.save({ validateBeforeSave: false });

      await request(app)
        .delete('/api/integrations/telegram/unlink')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updated = await User.findById(testUser._id);
      expect(updated.telegramId).toBeFalsy();
    });

    it('should reject unlinking when nothing is linked', async () => {
      await request(app)
        .delete('/api/integrations/telegram/unlink')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/integrations/telegram/status').expect(401);
    });
  });

  describe('Google Chat', () => {
    it('should report not linked initially', async () => {
      const res = await request(app)
        .get('/api/integrations/googlechat/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.linked).toBe(false);
    });

    it('should link a valid webhook', async () => {
      const res = await request(app)
        .post('/api/integrations/googlechat/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ webhookUrl: VALID_WEBHOOK })
        .expect(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findById(testUser._id).select('+googleChatWebhook');
      expect(updated.googleChatWebhook).toBe(VALID_WEBHOOK);
    });

    it('should reject a webhook without a URL', async () => {
      await request(app)
        .post('/api/integrations/googlechat/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject an invalid webhook URL', async () => {
      await request(app)
        .post('/api/integrations/googlechat/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ webhookUrl: 'https://example.com/hook' })
        .expect(400);
    });

    it('should send a test message when linked', async () => {
      const user = await User.findById(testUser._id).select('+googleChatWebhook');
      user.googleChatWebhook = VALID_WEBHOOK;
      await user.save({ validateBeforeSave: false });

      await request(app)
        .post('/api/integrations/googlechat/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(mockSendGoogleChatMessage).toHaveBeenCalledTimes(1);
    });

    it('should reject a test message when not linked', async () => {
      await request(app)
        .post('/api/integrations/googlechat/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should unlink a linked webhook', async () => {
      const user = await User.findById(testUser._id).select('+googleChatWebhook');
      user.googleChatWebhook = VALID_WEBHOOK;
      await user.save({ validateBeforeSave: false });

      await request(app)
        .delete('/api/integrations/googlechat/unlink')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updated = await User.findById(testUser._id).select('+googleChatWebhook');
      expect(updated.googleChatWebhook).toBeFalsy();
    });

    describe('deliver updates to Google Chat', () => {
      const linkWebhook = async () => {
        const user = await User.findById(testUser._id).select('+googleChatWebhook');
        user.googleChatWebhook = VALID_WEBHOOK;
        await user.save({ validateBeforeSave: false });
      };

      it('sends a daily update when linked', async () => {
        await linkWebhook();
        const update = await Update.create(createDailyUpdateFixture(testUser._id));

        const res = await request(app)
          .post(`/api/integrations/googlechat/daily/${update._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(mockSendDailyGChat).toHaveBeenCalledTimes(1);
      });

      it('sends a weekly summary when linked', async () => {
        await linkWebhook();
        const update = await Update.create(createWeeklyUpdateFixture(testUser._id));

        await request(app)
          .post(`/api/integrations/googlechat/weekly/${update._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(mockSendWeeklyGChat).toHaveBeenCalledTimes(1);
      });

      it('rejects delivery when no webhook is linked', async () => {
        const update = await Update.create(createDailyUpdateFixture(testUser._id));
        await request(app)
          .post(`/api/integrations/googlechat/daily/${update._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
        expect(mockSendDailyGChat).not.toHaveBeenCalled();
      });

      it('returns 404 for a non-existent update', async () => {
        await linkWebhook();
        await request(app)
          .post('/api/integrations/googlechat/daily/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('returns 404 when the id is the wrong update type', async () => {
        await linkWebhook();
        const weekly = await Update.create(createWeeklyUpdateFixture(testUser._id));
        await request(app)
          .post(`/api/integrations/googlechat/daily/${weekly._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it("returns 403 for another user's update", async () => {
        await linkWebhook();
        const other = await User.create(
          createUserFixture({ email: 'gc-other@example.com', password: 'password123' })
        );
        const update = await Update.create(createDailyUpdateFixture(other._id));

        await request(app)
          .post(`/api/integrations/googlechat/daily/${update._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('returns 502 when the Google Chat send fails', async () => {
        await linkWebhook();
        mockSendDailyGChat.mockResolvedValueOnce(false);
        const update = await Update.create(createDailyUpdateFixture(testUser._id));

        await request(app)
          .post(`/api/integrations/googlechat/daily/${update._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(502);
      });

      it('requires authentication', async () => {
        await request(app)
          .post('/api/integrations/googlechat/daily/507f1f77bcf86cd799439011')
          .expect(401);
      });
    });
  });
});
