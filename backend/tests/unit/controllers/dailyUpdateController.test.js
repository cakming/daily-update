import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import Update from '../../../models/Update.js';

// Mock the Claude service
const mockProcessDailyUpdate = jest.fn();
jest.unstable_mockModule('../../../services/claudeService.js', () => ({
  processDailyUpdate: mockProcessDailyUpdate
}));

// Dynamic import after mocking
const { createDailyUpdate, getDailyUpdates, getDailyUpdateById, updateDailyUpdate, deleteDailyUpdate } = await import('../../../controllers/dailyUpdateController.js');

describe('Daily Update Controller', () => {
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

    // Create test user
    const userData = createUserFixture({
      email: 'test@example.com',
      password: 'password123'
    });
    testUser = await User.create(userData);

    // Setup mock request and response objects
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: testUser
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Setup default mock response for Claude service
    mockProcessDailyUpdate.mockResolvedValue({
      formattedOutput: '🗓️ Daily Update — Wednesday, November 6, 2025\n\n✅ Today\'s Progress\n- Test item',
      sections: {
        todaysProgress: ['Test item'],
        ongoingWork: [],
        nextSteps: [],
        issues: ['No major issues reported']
      }
    });
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('createDailyUpdate', () => {
    it('should create a daily update successfully', async () => {
      mockReq.body = {
        rawInput: 'Fixed bug in authentication',
        date: '2025-11-06'
      };

      await createDailyUpdate(mockReq, mockRes);

      expect(mockProcessDailyUpdate).toHaveBeenCalledWith('Fixed bug in authentication', '2025-11-06');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userId: testUser._id,
            type: 'daily',
            rawInput: 'Fixed bug in authentication',
            formattedOutput: expect.any(String),
            sections: expect.any(Object)
          })
        })
      );
    });

    it('should create update in database', async () => {
      mockReq.body = {
        rawInput: 'Test input',
        date: '2025-11-06'
      };

      await createDailyUpdate(mockReq, mockRes);

      const dbUpdate = await Update.findOne({ userId: testUser._id, type: 'daily' });
      expect(dbUpdate).toBeDefined();
      expect(dbUpdate.rawInput).toBe('Test input');
    });

    it('should reject if rawInput is missing', async () => {
      mockReq.body = {
        date: '2025-11-06'
        // rawInput is missing
      };

      await createDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide both raw input and date'
      });
    });

    it('should reject if date is missing', async () => {
      mockReq.body = {
        rawInput: 'Test input'
        // date is missing
      };

      await createDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide both raw input and date'
      });
    });

    it('should reject if update already exists for the date', async () => {
      // Create existing update
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06')
      });
      await Update.create(updateData);

      // Try to create another update for same date
      mockReq.body = {
        rawInput: 'New input',
        date: '2025-11-06'
      };

      await createDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'An update already exists for this date. Please use the update endpoint to modify it.'
      });
    });

    it('should call Claude service with correct parameters', async () => {
      const rawInput = 'Test technical update';
      const date = '2025-11-06';

      mockReq.body = { rawInput, date };

      await createDailyUpdate(mockReq, mockRes);

      expect(mockProcessDailyUpdate).toHaveBeenCalledWith(rawInput, date);
    });

    it('should handle Claude API errors', async () => {
      mockProcessDailyUpdate.mockRejectedValue(new Error('Claude API failed'));

      mockReq.body = {
        rawInput: 'Test input',
        date: '2025-11-06'
      };

      await createDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create daily update'
        })
      );
    });

    it('should store sections from Claude response', async () => {
      mockProcessDailyUpdate.mockResolvedValue({
        formattedOutput: 'Formatted text',
        sections: {
          todaysProgress: ['Item 1', 'Item 2'],
          ongoingWork: ['Task A'],
          nextSteps: ['Plan B'],
          issues: ['No issues']
        }
      });

      mockReq.body = {
        rawInput: 'Test input',
        date: '2025-11-06'
      };

      await createDailyUpdate(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.sections.todaysProgress).toHaveLength(2);
      expect(response.data.sections.ongoingWork).toHaveLength(1);
    });

    it('should allow different users to create updates for same date', async () => {
      // Create another user
      const user2 = await User.create(createUserFixture({
        email: 'user2@example.com',
        password: 'password123'
      }));

      // User 1 creates update
      mockReq.body = {
        rawInput: 'User 1 update',
        date: '2025-11-06'
      };
      await createDailyUpdate(mockReq, mockRes);

      jest.clearAllMocks();

      // User 2 creates update for same date
      mockReq.user = user2;
      mockReq.body = {
        rawInput: 'User 2 update',
        date: '2025-11-06'
      };
      await createDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getDailyUpdates', () => {
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

    it('should get all daily updates for user', async () => {
      await getDailyUpdates(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3,
          data: expect.any(Array)
        })
      );

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data).toHaveLength(3);
    });

    it('should sort updates by date descending', async () => {
      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(new Date(response.data[0].date)).toBeInstanceOf(Date);
      expect(response.data[0].date >= response.data[1].date).toBe(true);
      expect(response.data[1].date >= response.data[2].date).toBe(true);
    });

    it('should filter by start date', async () => {
      mockReq.query = {
        startDate: '2025-11-05'
      };

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(2); // Nov 5 and Nov 10
    });

    it('should filter by end date', async () => {
      mockReq.query = {
        endDate: '2025-11-05'
      };

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(2); // Nov 1 and Nov 5
    });

    it('should filter by date range', async () => {
      mockReq.query = {
        startDate: '2025-11-02',
        endDate: '2025-11-09'
      };

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(1); // Only Nov 5
    });

    it('should search in rawInput', async () => {
      mockReq.query = {
        search: 'Update 2'
      };

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].rawInput).toContain('Update 2');
    });

    it('should perform case-insensitive search', async () => {
      mockReq.query = {
        search: 'update 2'
      };

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should return empty array if no updates found', async () => {
      await clearTestDB();
      testUser = await User.create(createUserFixture());
      mockReq.user = testUser;

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(0);
      expect(response.data).toEqual([]);
    });

    it('should not return other users updates', async () => {
      const user2 = await User.create(createUserFixture({
        email: 'user2@example.com',
        password: 'password123'
      }));

      mockReq.user = user2;

      await getDailyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(0);
    });

    it('should handle database errors', async () => {
      await closeTestDB();

      await getDailyUpdates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to fetch daily updates'
        })
      );

      await connectTestDB();
    });
  });

  describe('getDailyUpdateById', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06')
      });
      testUpdate = await Update.create(updateData);
    });

    it('should get daily update by ID', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await getDailyUpdateById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: testUpdate._id,
          type: 'daily'
        })
      });
    });

    it('should return 404 if update not found', async () => {
      mockReq.params = {
        id: '507f1f77bcf86cd799439011' // Valid ObjectId but doesn't exist
      };

      await getDailyUpdateById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Daily update not found'
      });
    });

    it('should not return other users update', async () => {
      const user2 = await User.create(createUserFixture({
        email: 'user2@example.com',
        password: 'password123'
      }));

      mockReq.user = user2;
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await getDailyUpdateById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle invalid ObjectId', async () => {
      mockReq.params = {
        id: 'invalid-id'
      };

      await getDailyUpdateById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to fetch daily update'
        })
      );
    });
  });

  describe('updateDailyUpdate', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06'),
        rawInput: 'Original input',
        formattedOutput: 'Original formatted'
      });
      testUpdate = await Update.create(updateData);
    });

    it('should update daily update with new rawInput', async () => {
      mockProcessDailyUpdate.mockResolvedValue({
        formattedOutput: 'New formatted output',
        sections: {
          todaysProgress: ['New item'],
          ongoingWork: [],
          nextSteps: [],
          issues: ['No issues']
        }
      });

      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: 'Updated input'
      };

      await updateDailyUpdate(mockReq, mockRes);

      expect(mockProcessDailyUpdate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            rawInput: 'Updated input',
            formattedOutput: 'New formatted output'
          })
        })
      );
    });

    it('should not reprocess if rawInput unchanged', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: testUpdate.rawInput
      };

      await updateDailyUpdate(mockReq, mockRes);

      expect(mockProcessDailyUpdate).not.toHaveBeenCalled();
    });

    it('should update date without reprocessing', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        date: '2025-11-07'
      };

      await updateDailyUpdate(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(new Date(response.data.date)).toEqual(new Date('2025-11-07'));
      expect(mockProcessDailyUpdate).not.toHaveBeenCalled();
    });

    it('should update both rawInput and date', async () => {
      mockProcessDailyUpdate.mockResolvedValue({
        formattedOutput: 'New output',
        sections: { todaysProgress: [], ongoingWork: [], nextSteps: [], issues: [] }
      });

      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: 'New input',
        date: '2025-11-07'
      };

      await updateDailyUpdate(mockReq, mockRes);

      expect(mockProcessDailyUpdate).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.rawInput).toBe('New input');
      expect(new Date(response.data.date)).toEqual(new Date('2025-11-07'));
    });

    it('should return 404 if update not found', async () => {
      mockReq.params = {
        id: '507f1f77bcf86cd799439011'
      };
      mockReq.body = {
        rawInput: 'New input'
      };

      await updateDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Daily update not found'
      });
    });

    it('should not update other users update', async () => {
      const user2 = await User.create(createUserFixture({
        email: 'user2@example.com',
        password: 'password123'
      }));

      mockReq.user = user2;
      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: 'Hacked input'
      };

      await updateDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle Claude API errors during update', async () => {
      mockProcessDailyUpdate.mockRejectedValue(new Error('Claude API failed'));

      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: 'New input'
      };

      await updateDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to update daily update'
        })
      );
    });

    it('should persist changes to database', async () => {
      mockProcessDailyUpdate.mockResolvedValue({
        formattedOutput: 'Persisted output',
        sections: { todaysProgress: ['Persisted'], ongoingWork: [], nextSteps: [], issues: [] }
      });

      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: 'Persisted input'
      };

      await updateDailyUpdate(mockReq, mockRes);

      const dbUpdate = await Update.findById(testUpdate._id);
      expect(dbUpdate.rawInput).toBe('Persisted input');
      expect(dbUpdate.formattedOutput).toBe('Persisted output');
    });
  });

  describe('deleteDailyUpdate', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06')
      });
      testUpdate = await Update.create(updateData);
    });

    it('should delete daily update', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await deleteDailyUpdate(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Daily update deleted successfully'
      });
    });

    it('should remove update from database', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await deleteDailyUpdate(mockReq, mockRes);

      const dbUpdate = await Update.findById(testUpdate._id);
      expect(dbUpdate).toBeNull();
    });

    it('should return 404 if update not found', async () => {
      mockReq.params = {
        id: '507f1f77bcf86cd799439011'
      };

      await deleteDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Daily update not found'
      });
    });

    it('should not delete other users update', async () => {
      const user2 = await User.create(createUserFixture({
        email: 'user2@example.com',
        password: 'password123'
      }));

      mockReq.user = user2;
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await deleteDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);

      // Verify update still exists
      const dbUpdate = await Update.findById(testUpdate._id);
      expect(dbUpdate).not.toBeNull();
    });

    it('should handle invalid ObjectId', async () => {
      mockReq.params = {
        id: 'invalid-id'
      };

      await deleteDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to delete daily update'
        })
      );
    });

    it('should handle database errors', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await closeTestDB();

      await deleteDailyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);

      await connectTestDB();
    });
  });
});
