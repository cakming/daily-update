import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture } from '../../setup/fixtures.js';

// Mock Anthropic SDK before any imports
const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }))
}));

// Dynamic imports after mocking
const { default: app } = await import('../../../app.js');
const { default: User } = await import('../../../models/User.js');
const { default: Update } = await import('../../../models/Update.js');

describe('Daily Updates API Integration Tests', () => {
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

    // Mock Anthropic SDK response
    mockCreate.mockResolvedValue({
      content: [{
        text: '🗓️ Daily Update\n\n✅ Test progress'
      }]
    });

    // Create and login user
    const userData = createUserFixture({
      email: 'test@example.com',
      password: 'password123'
    });

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    testUser = await User.findOne({ email: 'test@example.com' });
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('POST /api/daily-updates', () => {
    it('should create a daily update with authentication', async () => {
      const updateData = {
        rawInput: 'Fixed authentication bug',
        date: '2025-11-06'
      };

      const response = await request(app)
        .post('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.rawInput).toBe('Fixed authentication bug');
      expect(response.body.data.type).toBe('daily');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/daily-updates')
        .send({
          rawInput: 'Test',
          date: '2025-11-06'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject without rawInput', async () => {
      const response = await request(app)
        .post('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2025-11-06'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('raw input and date');
    });

    it('should reject duplicate update for same date', async () => {
      const updateData = {
        rawInput: 'First update',
        date: '2025-11-06'
      };

      // Create first update
      await request(app)
        .post('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Second update',
          date: '2025-11-06'
        })
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/daily-updates', () => {
    beforeEach(async () => {
      // Create test updates
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-01'),
        rawInput: 'Update 1'
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-05'),
        rawInput: 'Update 2'
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-10'),
        rawInput: 'Update 3'
      }));
    });

    it('should get all daily updates for authenticated user', async () => {
      const response = await request(app)
        .get('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .get('/api/daily-updates')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/daily-updates')
        .query({ startDate: '2025-11-02', endDate: '2025-11-09' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(1); // Only Nov 5
      expect(response.body.data[0].rawInput).toBe('Update 2');
    });

    it('should search in updates', async () => {
      const response = await request(app)
        .get('/api/daily-updates')
        .query({ search: 'Update 2' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].rawInput).toContain('Update 2');
    });

    it('should not return other users updates', async () => {
      // Create another user
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send(createUserFixture({
          email: 'user2@example.com',
          password: 'password123'
        }));

      const user2Token = user2Response.body.data.token;

      const response = await request(app)
        .get('/api/daily-updates')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/daily-updates/:id', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06')
      });
      testUpdate = await Update.create(updateData);
    });

    it('should get update by ID', async () => {
      const response = await request(app)
        .get(`/api/daily-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUpdate._id.toString());
    });

    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .get('/api/daily-updates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not return other users update', async () => {
      // Create another user
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send(createUserFixture({
          email: 'user2@example.com',
          password: 'password123'
        }));

      const response = await request(app)
        .get(`/api/daily-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${user2Response.body.data.token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/daily-updates/:id', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06'),
        rawInput: 'Original input'
      });
      testUpdate = await Update.create(updateData);
    });

    it('should update daily update', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          text: 'Updated output'
        }]
      });

      const response = await request(app)
        .put(`/api/daily-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Updated input'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rawInput).toBe('Updated input');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .put('/api/daily-updates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Updated'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not update other users update', async () => {
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send(createUserFixture({
          email: 'user2@example.com',
          password: 'password123'
        }));

      const response = await request(app)
        .put(`/api/daily-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${user2Response.body.data.token}`)
        .send({
          rawInput: 'Hacked'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/daily-updates/:id', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06')
      });
      testUpdate = await Update.create(updateData);
    });

    it('should delete daily update', async () => {
      const response = await request(app)
        .delete(`/api/daily-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deleted from database
      const deleted = await Update.findById(testUpdate._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .delete('/api/daily-updates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not delete other users update', async () => {
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send(createUserFixture({
          email: 'user2@example.com',
          password: 'password123'
        }));

      const response = await request(app)
        .delete(`/api/daily-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${user2Response.body.data.token}`)
        .expect(404);

      // Verify not deleted
      const stillExists = await Update.findById(testUpdate._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full CRUD cycle with authentication', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/daily-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Test update',
          date: '2025-11-06'
        })
        .expect(201);

      const updateId = createResponse.body.data._id;

      // Read
      await request(app)
        .get(`/api/daily-updates/${updateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Update
      mockCreate.mockResolvedValue({
        content: [{
          text: 'Modified'
        }]
      });

      await request(app)
        .put(`/api/daily-updates/${updateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Modified update'
        })
        .expect(200);

      // Delete
      await request(app)
        .delete(`/api/daily-updates/${updateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
