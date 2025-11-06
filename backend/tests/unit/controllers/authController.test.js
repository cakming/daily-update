import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import { register, login, getMe } from '../../../controllers/authController.js';

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Setup mock request and response objects
    mockReq = {
      body: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = createUserFixture({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: expect.anything(),
            name: userData.name,
            email: userData.email,
            token: expect.any(String)
          })
        })
      );
    });

    it('should return token with valid JWT format', async () => {
      const userData = createUserFixture({
        email: 'test@example.com',
        password: 'password123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.token).toBeDefined();
      expect(response.data.token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should not return password in response', async () => {
      const userData = createUserFixture({
        email: 'test@example.com',
        password: 'password123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.password).toBeUndefined();
    });

    it('should reject registration if email already exists', async () => {
      const userData = createUserFixture({
        email: 'duplicate@example.com',
        password: 'password123'
      });

      // Create first user
      await User.create(userData);

      // Try to register with same email
      mockReq.body = userData;

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists with this email'
      });
    });

    it('should handle validation errors for missing name', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
        // name is missing
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration'
        })
      );
    });

    it('should handle validation errors for missing email', async () => {
      mockReq.body = {
        name: 'John Doe',
        password: 'password123'
        // email is missing
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration'
        })
      );
    });

    it('should handle validation errors for missing password', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'test@example.com'
        // password is missing
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration'
        })
      );
    });

    it('should handle validation errors for invalid email format', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration'
        })
      );
    });

    it('should handle validation errors for short password', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'test@example.com',
        password: '123' // Too short
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration'
        })
      );
    });

    it('should convert email to lowercase', async () => {
      const userData = createUserFixture({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.email).toBe('test@example.com');
    });

    it('should trim whitespace from name and email', async () => {
      const userData = createUserFixture({
        name: '  John Doe  ',
        email: '  test@example.com  ',
        password: 'password123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.name).toBe('John Doe');
      expect(response.data.email).toBe('test@example.com');
    });

    it('should create user in database', async () => {
      const userData = createUserFixture({
        email: 'newuser@example.com',
        password: 'password123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(userData.email.toLowerCase());
    });

    it('should hash password before storing', async () => {
      const userData = createUserFixture({
        email: 'test@example.com',
        password: 'plainPassword123'
      });

      mockReq.body = userData;

      await register(mockReq, mockRes);

      const dbUser = await User.findOne({ email: userData.email }).select('+password');
      expect(dbUser.password).not.toBe('plainPassword123');
      expect(dbUser.password.length).toBeGreaterThan(20); // Bcrypt hash is longer
    });
  });

  describe('login', () => {
    let existingUser;

    beforeEach(async () => {
      // Create a user for login tests
      const userData = createUserFixture({
        name: 'Test User',
        email: 'login@example.com',
        password: 'password123'
      });
      existingUser = await User.create(userData);
    });

    it('should login user with correct credentials', async () => {
      mockReq.body = {
        email: 'login@example.com',
        password: 'password123'
      };

      await login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            token: expect.any(String)
          })
        })
      );
    });

    it('should return valid JWT token', async () => {
      mockReq.body = {
        email: 'login@example.com',
        password: 'password123'
      };

      await login(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.token).toBeDefined();
      expect(response.data.token.split('.').length).toBe(3);
    });

    it('should not return password in response', async () => {
      mockReq.body = {
        email: 'login@example.com',
        password: 'password123'
      };

      await login(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.password).toBeUndefined();
    });

    it('should reject login with incorrect password', async () => {
      mockReq.body = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should reject login with non-existent email', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should handle case-insensitive email login', async () => {
      mockReq.body = {
        email: 'LOGIN@EXAMPLE.COM', // Uppercase
        password: 'password123'
      };

      await login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'login@example.com' // Stored as lowercase
          })
        })
      );
    });

    it('should reject login with missing email', async () => {
      mockReq.body = {
        password: 'password123'
        // email is missing
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should reject login with missing password', async () => {
      mockReq.body = {
        email: 'login@example.com'
        // password is missing
      };

      await login(mockReq, mockRes);

      // Missing password causes internal error during comparePassword
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during login'
        })
      );
    });

    it('should reject login with empty password', async () => {
      mockReq.body = {
        email: 'login@example.com',
        password: ''
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should handle login with whitespace in email', async () => {
      mockReq.body = {
        email: '  login@example.com  ',
        password: 'password123'
      };

      await login(mockReq, mockRes);

      // Mongoose trims the email during query, so login succeeds
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'login@example.com'
          })
        })
      );
    });

    it('should not expose whether email exists', async () => {
      // Test with non-existent email
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await login(mockReq, mockRes);
      const response1 = mockRes.json.mock.calls[0][0];

      jest.clearAllMocks();

      // Test with wrong password
      mockReq.body = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      await login(mockReq, mockRes);
      const response2 = mockRes.json.mock.calls[0][0];

      // Both should return same generic error message
      expect(response1.message).toBe(response2.message);
      expect(response1.message).toBe('Invalid credentials');
    });
  });

  describe('getMe', () => {
    let testUser;

    beforeEach(async () => {
      // Create a user for getMe tests
      const userData = createUserFixture({
        name: 'Current User',
        email: 'current@example.com',
        password: 'password123'
      });
      testUser = await User.create(userData);
    });

    it('should return current user data', async () => {
      mockReq.user = await User.findById(testUser._id);

      await getMe(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: testUser._id,
          name: testUser.name,
          email: testUser.email
        }
      });
    });

    it('should not return password', async () => {
      mockReq.user = await User.findById(testUser._id);

      await getMe(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.password).toBeUndefined();
    });

    it('should not return token', async () => {
      mockReq.user = await User.findById(testUser._id);

      await getMe(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.token).toBeUndefined();
    });

    it('should return user with correct ID', async () => {
      mockReq.user = await User.findById(testUser._id);

      await getMe(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data._id.toString()).toBe(testUser._id.toString());
    });

    it('should return user with correct email', async () => {
      mockReq.user = await User.findById(testUser._id);

      await getMe(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.email).toBe(testUser.email);
    });

    it('should return user with correct name', async () => {
      mockReq.user = await User.findById(testUser._id);

      await getMe(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.name).toBe(testUser.name);
    });

    it('should handle error when user is undefined', async () => {
      mockReq.user = undefined;

      await getMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error'
        })
      );
    });

    it('should handle error when user is null', async () => {
      mockReq.user = null;

      await getMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors during registration', async () => {
      // Close database connection
      await closeTestDB();

      mockReq.body = createUserFixture({
        email: 'test@example.com',
        password: 'password123'
      });

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration'
        })
      );

      // Reconnect for other tests
      await connectTestDB();
    });

    it('should include error message in response', async () => {
      mockReq.body = {
        name: 'Test',
        email: 'invalid-email',
        password: 'pass'
      };

      await register(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe('string');
    });
  });

  describe('Integration Scenarios', () => {
    it('should allow register then login flow', async () => {
      // Register
      const userData = createUserFixture({
        name: 'Integration Test',
        email: 'integration@example.com',
        password: 'password123'
      });

      mockReq.body = userData;
      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);

      // Clear mocks
      jest.clearAllMocks();

      // Login
      mockReq.body = {
        email: userData.email,
        password: userData.password
      };

      await login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: userData.email.toLowerCase(),
            token: expect.any(String)
          })
        })
      );
    });

    it('should prevent duplicate registration', async () => {
      const userData = createUserFixture({
        email: 'duplicate@example.com',
        password: 'password123'
      });

      // First registration
      mockReq.body = userData;
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);

      jest.clearAllMocks();

      // Second registration attempt
      mockReq.body = userData;
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists with this email'
      });
    });

    it('should maintain user data consistency across login', async () => {
      const userData = createUserFixture({
        name: 'Consistency Test',
        email: 'consistency@example.com',
        password: 'password123'
      });

      // Register
      mockReq.body = userData;
      await register(mockReq, mockRes);
      const registerResponse = mockRes.json.mock.calls[0][0];

      jest.clearAllMocks();

      // Login
      mockReq.body = {
        email: userData.email,
        password: userData.password
      };
      await login(mockReq, mockRes);
      const loginResponse = mockRes.json.mock.calls[0][0];

      // Should have same user data
      expect(registerResponse.data._id).toEqual(loginResponse.data._id);
      expect(registerResponse.data.name).toBe(loginResponse.data.name);
      expect(registerResponse.data.email).toBe(loginResponse.data.email);
    });
  });
});
