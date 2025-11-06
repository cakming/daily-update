import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture, createWeeklyUpdateFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import Update from '../../../models/Update.js';

// Mock the Claude service
const mockProcessWeeklyUpdate = jest.fn();
jest.unstable_mockModule('../../../services/claudeService.js', () => ({
  processWeeklyUpdate: mockProcessWeeklyUpdate
}));

// Dynamic import after mocking
const { generateWeeklyUpdate, createWeeklyUpdate, getWeeklyUpdates, getWeeklyUpdateById, updateWeeklyUpdate, deleteWeeklyUpdate } = await import('../../../controllers/weeklyUpdateController.js');

describe('Weekly Update Controller', () => {
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

    const userData = createUserFixture({
      email: 'test@example.com',
      password: 'password123'
    });
    testUser = await User.create(userData);

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

    mockProcessWeeklyUpdate.mockResolvedValue({
      formattedOutput: '📊 Weekly Summary\n\n✨ Achievements\n- Test achievement',
      sections: {
        achievements: ['Test achievement'],
        challenges: [],
        nextWeek: [],
        metrics: []
      }
    });
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('generateWeeklyUpdate', () => {
    beforeEach(async () => {
      // Create daily updates for the week
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-01')
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-05')
      }));
    });

    it('should generate weekly update from daily updates', async () => {
      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      expect(mockProcessWeeklyUpdate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            formattedOutput: expect.any(String),
            sections: expect.any(Object),
            dailyUpdatesUsed: 2
          })
        })
      );
    });

    it('should reject if startDate is missing', async () => {
      mockReq.body = {
        endDate: '2025-11-07'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide both start date and end date'
      });
    });

    it('should reject if endDate is missing', async () => {
      mockReq.body = {
        startDate: '2025-11-01'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should generate from rawInput if provided', async () => {
      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        rawInput: 'Manual weekly summary'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      expect(mockProcessWeeklyUpdate).toHaveBeenCalledWith(
        [{ rawInput: 'Manual weekly summary', date: '2025-11-01' }],
        '2025-11-01',
        '2025-11-07'
      );
    });

    it('should reject if no daily updates and no rawInput', async () => {
      await clearTestDB();
      testUser = await User.create(createUserFixture());
      mockReq.user = testUser;

      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No daily updates found for the specified date range. Please provide raw input instead.'
      });
    });

    it('should fetch daily updates in date range', async () => {
      // Add more updates outside range
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-10-30') // Before range
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-10') // After range
      }));

      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.dailyUpdatesUsed).toBe(2);
    });

    it('should handle Claude API errors', async () => {
      mockProcessWeeklyUpdate.mockRejectedValue(new Error('Claude API failed'));

      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07'
      };

      await generateWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to generate weekly update'
        })
      );
    });
  });

  describe('createWeeklyUpdate', () => {
    it('should create weekly update successfully', async () => {
      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        formattedOutput: 'Test weekly output',
        sections: { achievements: ['Test'] }
      };

      await createWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userId: testUser._id,
            type: 'weekly',
            formattedOutput: 'Test weekly output'
          })
        })
      );
    });

    it('should reject if startDate is missing', async () => {
      mockReq.body = {
        endDate: '2025-11-07',
        formattedOutput: 'Test'
      };

      await createWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject if formattedOutput is missing', async () => {
      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07'
      };

      await createWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide formatted output. Use /generate endpoint first.'
      });
    });

    it('should reject if update already exists for date range', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: {
          start: new Date('2025-11-01'),
          end: new Date('2025-11-07')
        }
      });
      await Update.create(updateData);

      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        formattedOutput: 'Test'
      };

      await createWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'A weekly update already exists for this date range. Please use the update endpoint to modify it.'
      });
    });

    it('should use default rawInput if not provided', async () => {
      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        formattedOutput: 'Test'
      };

      await createWeeklyUpdate(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.rawInput).toBe('Generated from daily updates');
    });

    it('should persist to database', async () => {
      mockReq.body = {
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        formattedOutput: 'Persisted output',
        sections: { achievements: ['Persisted'] }
      };

      await createWeeklyUpdate(mockReq, mockRes);

      const dbUpdate = await Update.findOne({ userId: testUser._id, type: 'weekly' });
      expect(dbUpdate).toBeDefined();
      expect(dbUpdate.formattedOutput).toBe('Persisted output');
    });
  });

  describe('getWeeklyUpdates', () => {
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

    it('should get all weekly updates for user', async () => {
      await getWeeklyUpdates(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: expect.any(Array)
        })
      );
    });

    it('should search in rawInput', async () => {
      mockReq.query = {
        search: 'Week 1'
      };

      await getWeeklyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should perform case-insensitive search', async () => {
      mockReq.query = {
        search: 'week 1'
      };

      await getWeeklyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should not return other users updates', async () => {
      const user2 = await User.create(createUserFixture({
        email: 'user2@example.com',
        password: 'password123'
      }));

      mockReq.user = user2;

      await getWeeklyUpdates(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.count).toBe(0);
    });
  });

  describe('getWeeklyUpdateById', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') }
      });
      testUpdate = await Update.create(updateData);
    });

    it('should get weekly update by ID', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await getWeeklyUpdateById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: testUpdate._id,
          type: 'weekly'
        })
      });
    });

    it('should return 404 if update not found', async () => {
      mockReq.params = {
        id: '507f1f77bcf86cd799439011'
      };

      await getWeeklyUpdateById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Weekly update not found'
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

      await getWeeklyUpdateById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateWeeklyUpdate', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') },
        rawInput: 'Original input',
        formattedOutput: 'Original formatted'
      });
      testUpdate = await Update.create(updateData);

      // Create some daily updates
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-01')
      }));
    });

    it('should update weekly update with new rawInput', async () => {
      mockProcessWeeklyUpdate.mockResolvedValue({
        formattedOutput: 'New formatted output',
        sections: { achievements: ['New'] }
      });

      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        rawInput: 'Updated input'
      };

      await updateWeeklyUpdate(mockReq, mockRes);

      expect(mockProcessWeeklyUpdate).toHaveBeenCalled();
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

      await updateWeeklyUpdate(mockReq, mockRes);

      expect(mockProcessWeeklyUpdate).not.toHaveBeenCalled();
    });

    it('should update date range', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };
      mockReq.body = {
        startDate: '2025-11-02',
        endDate: '2025-11-08'
      };

      await updateWeeklyUpdate(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(new Date(response.data.dateRange.start)).toEqual(new Date('2025-11-02'));
      expect(new Date(response.data.dateRange.end)).toEqual(new Date('2025-11-08'));
    });

    it('should return 404 if update not found', async () => {
      mockReq.params = {
        id: '507f1f77bcf86cd799439011'
      };
      mockReq.body = {
        rawInput: 'New input'
      };

      await updateWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Weekly update not found'
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

      await updateWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteWeeklyUpdate', () => {
    let testUpdate;

    beforeEach(async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: { start: new Date('2025-11-01'), end: new Date('2025-11-07') }
      });
      testUpdate = await Update.create(updateData);
    });

    it('should delete weekly update', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await deleteWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Weekly update deleted successfully'
      });
    });

    it('should remove update from database', async () => {
      mockReq.params = {
        id: testUpdate._id.toString()
      };

      await deleteWeeklyUpdate(mockReq, mockRes);

      const dbUpdate = await Update.findById(testUpdate._id);
      expect(dbUpdate).toBeNull();
    });

    it('should return 404 if update not found', async () => {
      mockReq.params = {
        id: '507f1f77bcf86cd799439011'
      };

      await deleteWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Weekly update not found'
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

      await deleteWeeklyUpdate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);

      // Verify update still exists
      const dbUpdate = await Update.findById(testUpdate._id);
      expect(dbUpdate).not.toBeNull();
    });
  });
});
