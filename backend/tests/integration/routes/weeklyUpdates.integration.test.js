import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture, createWeeklyUpdateFixture } from '../../setup/fixtures.js';

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

describe('Weekly Updates API Integration Tests', () => {
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
        text: '📊 Weekly Summary\n\n✨ Achievements\n- Test achievement'
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

    // Create some daily updates for testing
    await Update.create(createDailyUpdateFixture(testUser._id, {
      date: new Date('2025-11-01')
    }));
    await Update.create(createDailyUpdateFixture(testUser._id, {
      date: new Date('2025-11-05')
    }));
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('POST /api/weekly-updates/generate', () => {
    it('should generate weekly update from daily updates', async () => {
      const response = await request(app)
        .post('/api/weekly-updates/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.formattedOutput).toBeDefined();
      expect(response.body.data.dailyUpdatesUsed).toBe(2);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should generate from rawInput', async () => {
      const response = await request(app)
        .post('/api/weekly-updates/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07',
          rawInput: 'Manual weekly summary'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/weekly-updates/generate')
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject without date range', async () => {
      const response = await request(app)
        .post('/api/weekly-updates/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('start date and end date');
    });
  });

  describe('POST /api/weekly-updates', () => {
    it('should create weekly update', async () => {
      const response = await request(app)
        .post('/api/weekly-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07',
          formattedOutput: 'Test weekly output',
          sections: { achievements: ['Test'] }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('weekly');
      expect(response.body.data.formattedOutput).toBe('Test weekly output');
    });

    it('should reject without formattedOutput', async () => {
      const response = await request(app)
        .post('/api/weekly-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07'
        })
        .expect(400);

      expect(response.body.message).toContain('formatted output');
    });

    it('should reject duplicate for same date range', async () => {
      // Create first update
      await request(app)
        .post('/api/weekly-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07',
          formattedOutput: 'First'
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/weekly-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07',
          formattedOutput: 'Second'
        })
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/weekly-updates', () => {
    beforeEach(async () => {
      await Update.create(createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') },
        rawInput: 'Week 1'
      }));
      await Update.create(createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-08'), end: new Date('2025-11-14') },
        rawInput: 'Week 2'
      }));
    });

    it('should get all weekly updates', async () => {
      const response = await request(app)
        .get('/api/weekly-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should search in updates', async () => {
      const response = await request(app)
        .get('/api/weekly-updates')
        .query({ search: 'Week 1' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].rawInput).toContain('Week 1');
    });

    it('should not return other users updates', async () => {
      // Create another user
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send(createUserFixture({
          email: 'user2@example.com',
          password: 'password123'
        }));

      const response = await request(app)
        .get('/api/weekly-updates')
        .set('Authorization', `Bearer ${user2Response.body.data.token}`)
        .expect(200);

      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/weekly-updates/:id', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') }
      });
      testUpdate = await Update.create(updateData);
    });

    it('should get update by ID', async () => {
      const response = await request(app)
        .get(`/api/weekly-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUpdate._id.toString());
    });

    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .get('/api/weekly-updates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/weekly-updates/:id', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') },
        rawInput: 'Original input'
      });
      testUpdate = await Update.create(updateData);
    });

    it('should update weekly update', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          text: 'Updated output'
        }]
      });

      const response = await request(app)
        .put(`/api/weekly-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Updated input'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rawInput).toBe('Updated input');
    });

    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .put('/api/weekly-updates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Updated'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/weekly-updates/:id', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') }
      });
      testUpdate = await Update.create(updateData);
    });

    it('should delete weekly update', async () => {
      const response = await request(app)
        .delete(`/api/weekly-updates/${testUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deleted
      const deleted = await Update.findById(testUpdate._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .delete('/api/weekly-updates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Full Weekly Workflow', () => {
    it('should complete full weekly update workflow', async () => {
      // Generate
      const generateResponse = await request(app)
        .post('/api/weekly-updates/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07'
        })
        .expect(200);

      const { formattedOutput, sections } = generateResponse.body.data;

      // Create
      const createResponse = await request(app)
        .post('/api/weekly-updates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2025-11-01',
          endDate: '2025-11-07',
          formattedOutput,
          sections
        })
        .expect(201);

      const updateId = createResponse.body.data._id;

      // Read
      await request(app)
        .get(`/api/weekly-updates/${updateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Update
      mockCreate.mockResolvedValue({
        content: [{
          text: 'Modified weekly output'
        }]
      });

      await request(app)
        .put(`/api/weekly-updates/${updateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rawInput: 'Modified weekly summary'
        })
        .expect(200);

      // Delete
      await request(app)
        .delete(`/api/weekly-updates/${updateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
