import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import User from '../../../models/User.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

// Mock external integration services so no real network calls are made.
const mockSendTelegramMessage = jest.fn().mockResolvedValue(true);
const mockSendGoogleChatMessage = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule('../../../services/telegramBot.js', () => ({
  sendTelegramMessage: mockSendTelegramMessage,
  startTelegramBot: jest.fn(),
  stopTelegramBot: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../services/googleChat.js', () => ({
  sendGoogleChatMessage: mockSendGoogleChatMessage,
  sendGoogleChatCard: jest.fn(),
  sendDailyUpdateToGoogleChat: jest.fn(),
  sendWeeklySummaryToGoogleChat: jest.fn(),
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
  });
});
