import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import speakeasy from 'speakeasy';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
} from '../../../controllers/twoFactorController.js';

describe('Two Factor Controller', () => {
  let mockReq;
  let mockRes;
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
      createUserFixture({ email: 'twofa@example.com', password: 'password123' })
    );
    mockReq = { body: {}, params: {}, query: {}, user: testUser };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('get2FAStatus', () => {
    it('should report 2FA disabled by default', async () => {
      await get2FAStatus(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { twoFactorEnabled: false } })
      );
    });
  });

  describe('setup2FA', () => {
    it('should generate a secret and QR code', async () => {
      await setup2FA(mockReq, mockRes);
      const payload = mockRes.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.secret).toBeTruthy();
      expect(payload.data.qrCode).toContain('data:image/png;base64');

      const stored = await User.findById(testUser._id).select('+twoFactorSecret');
      expect(stored.twoFactorSecret).toBe(payload.data.secret);
    });

    it('should reject setup when 2FA is already enabled', async () => {
      await User.findByIdAndUpdate(testUser._id, { twoFactorEnabled: true });
      await setup2FA(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('verify2FA', () => {
    it('should reject when no token is provided', async () => {
      await verify2FA(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject when 2FA has not been set up', async () => {
      mockReq.body.token = '123456';
      await verify2FA(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('set up 2FA') })
      );
    });

    it('should reject an invalid token', async () => {
      await setup2FA(mockReq, mockRes);
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      mockReq.body.token = 'invalidtoken';
      await verify2FA(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should enable 2FA and return backup codes with a valid token', async () => {
      await setup2FA(mockReq, mockRes);
      const secret = mockRes.json.mock.calls[0][0].data.secret;
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      const token = speakeasy.totp({ secret, encoding: 'base32' });
      mockReq.body.token = token;
      await verify2FA(mockReq, mockRes);

      const payload = mockRes.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.backupCodes).toHaveLength(10);

      const stored = await User.findById(testUser._id);
      expect(stored.twoFactorEnabled).toBe(true);
    });
  });

  describe('disable2FA', () => {
    it('should reject without a password', async () => {
      await disable2FA(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject with an incorrect password', async () => {
      mockReq.body.password = 'wrongpassword';
      await disable2FA(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should disable 2FA with the correct password', async () => {
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: 'SOMESECRET',
      });
      mockReq.body.password = 'password123';
      await disable2FA(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
      const stored = await User.findById(testUser._id);
      expect(stored.twoFactorEnabled).toBe(false);
    });
  });
});
