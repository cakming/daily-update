import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import { protect, generateToken } from '../../../middleware/auth.js';

describe('Auth Middleware', () => {
  let testUser;
  let validToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test user
    const userData = createUserFixture({
      email: 'test@example.com',
      password: 'password123'
    });
    testUser = await User.create(userData);

    // Generate valid token
    validToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should allow request with valid token', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should attach user to req.user without password', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.password).toBeUndefined();
      expect(req.user.email).toBe('test@example.com');
      expect(req.user.name).toBe(testUser.name);
    });

    it('should reject request without authorization header', async () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
    });

    it('should reject request without Bearer prefix', async () => {
      const req = {
        headers: {
          authorization: validToken // Missing 'Bearer '
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
    });

    it('should reject request with invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, token failed'
      });
    });

    it('should reject request with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, token failed'
      });
    });

    it('should reject request with token signed with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { id: testUser._id },
        'wrong-secret',
        { expiresIn: '1d' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${wrongToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, token failed'
      });
    });

    it('should reject request when user not found', async () => {
      // Create token with non-existent user ID
      const fakeUserId = '507f1f77bcf86cd799439011';
      const fakeToken = generateToken(fakeUserId);

      const req = {
        headers: {
          authorization: `Bearer ${fakeToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should reject request when user is deleted after token was issued', async () => {
      // Generate token
      const token = generateToken(testUser._id);

      // Delete user
      await User.findByIdAndDelete(testUser._id);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle malformed authorization header', async () => {
      const req = {
        headers: {
          authorization: 'Bearer' // No token after Bearer
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle authorization header with extra spaces', async () => {
      const req = {
        headers: {
          authorization: `Bearer  ${validToken}  ` // Extra spaces
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      // Should fail because split(' ')[1] will have extra spaces
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should preserve user data across middleware chain', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      // Verify user data is accessible
      expect(req.user._id).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
      expect(req.user.name).toBeDefined();
      expect(req.user.createdAt).toBeDefined();
      // Note: updatedAt might not be selected by default with .select('-password')
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testUser._id);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include user ID in token payload', () => {
      const token = generateToken(testUser._id);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(testUser._id.toString());
    });

    it('should set expiration time', () => {
      const token = generateToken(testUser._id);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should be verifiable with JWT_SECRET', () => {
      const token = generateToken(testUser._id);

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).not.toThrow();
    });

    it('should fail verification with wrong secret', () => {
      const token = generateToken(testUser._id);

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken(testUser._id);
      const fakeUserId = '507f1f77bcf86cd799439011';
      const token2 = generateToken(fakeUserId);

      expect(token1).not.toBe(token2);

      const decoded1 = jwt.verify(token1, process.env.JWT_SECRET);
      const decoded2 = jwt.verify(token2, process.env.JWT_SECRET);

      expect(decoded1.id).not.toBe(decoded2.id);
    });

    it('should generate tokens with consistent expiration', () => {
      const token1 = generateToken(testUser._id);
      const token2 = generateToken(testUser._id);

      const decoded1 = jwt.verify(token1, process.env.JWT_SECRET);
      const decoded2 = jwt.verify(token2, process.env.JWT_SECRET);

      // Expiration should be similar (within 1 second due to generation time difference)
      expect(Math.abs(decoded1.exp - decoded2.exp)).toBeLessThan(2);
    });

    it('should accept ObjectId or string as input', () => {
      const tokenFromObjectId = generateToken(testUser._id);
      const tokenFromString = generateToken(testUser._id.toString());

      const decoded1 = jwt.verify(tokenFromObjectId, process.env.JWT_SECRET);
      const decoded2 = jwt.verify(tokenFromString, process.env.JWT_SECRET);

      expect(decoded1.id).toBe(decoded2.id);
    });
  });

  describe('Integration scenarios', () => {
    it('should work in a typical request flow', async () => {
      // 1. User logs in and gets token
      const token = generateToken(testUser._id);

      // 2. User makes authenticated request
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      // 3. Verify middleware allows request
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe(testUser.email);
    });

    it('should handle multiple sequential requests with same token', async () => {
      const token = generateToken(testUser._id);

      // First request
      const req1 = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next1 = jest.fn();

      await protect(req1, res1, next1);

      // Second request with same token
      const req2 = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next2 = jest.fn();

      await protect(req2, res2, next2);

      // Both should succeed
      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
      expect(req1.user._id.toString()).toBe(req2.user._id.toString());
    });

    it('should handle token refresh scenario', async () => {
      // Original token
      const oldToken = generateToken(testUser._id);

      // New token (e.g., after refresh)
      const newToken = generateToken(testUser._id);

      // Both should work
      const req1 = {
        headers: {
          authorization: `Bearer ${oldToken}`
        }
      };
      const res1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next1 = jest.fn();

      await protect(req1, res1, next1);

      const req2 = {
        headers: {
          authorization: `Bearer ${newToken}`
        }
      };
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next2 = jest.fn();

      await protect(req2, res2, next2);

      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });
  });
});
