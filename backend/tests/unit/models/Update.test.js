import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import Update from '../../../models/Update.js';
import User from '../../../models/User.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture, createWeeklyUpdateFixture } from '../../setup/fixtures.js';

describe('Update Model', () => {
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  // Create a test user before each test that needs one
  beforeEach(async () => {
    const userData = createUserFixture({
      email: 'testuser@example.com',
      password: 'password123'
    });
    testUser = await User.create(userData);
  });

  describe('Daily Update Creation', () => {
    it('should create a daily update with valid data', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06'),
        rawInput: 'Fixed authentication bug',
        formattedOutput: '🗓️ Daily Update...'
      });

      const update = await Update.create(updateData);

      expect(update).toBeDefined();
      expect(update.userId.toString()).toBe(testUser._id.toString());
      expect(update.type).toBe('daily');
      expect(update.date).toBeInstanceOf(Date);
      expect(update.rawInput).toBe('Fixed authentication bug');
      expect(update.formattedOutput).toBe('🗓️ Daily Update...');
      expect(update.sections).toBeDefined();
      expect(update.sections.todaysProgress).toBeInstanceOf(Array);
      expect(update.sections.ongoingWork).toBeInstanceOf(Array);
      expect(update.sections.nextSteps).toBeInstanceOf(Array);
      expect(update.sections.issues).toBeInstanceOf(Array);
      expect(update.createdAt).toBeInstanceOf(Date);
      expect(update.updatedAt).toBeInstanceOf(Date);
    });

    it('should require userId for daily update', async () => {
      const updateData = createDailyUpdateFixture(null);

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require type for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      delete updateData.type;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require date for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      delete updateData.date;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require rawInput for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      delete updateData.rawInput;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require formattedOutput for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      delete updateData.formattedOutput;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should accept empty sections for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        sections: {
          todaysProgress: [],
          ongoingWork: [],
          nextSteps: [],
          issues: []
        }
      });

      const update = await Update.create(updateData);

      expect(update.sections.todaysProgress).toEqual([]);
      expect(update.sections.ongoingWork).toEqual([]);
      expect(update.sections.nextSteps).toEqual([]);
      expect(update.sections.issues).toEqual([]);
    });

    it('should only accept valid type enum values', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      updateData.type = 'invalid-type';

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should accept date as string and convert to Date', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: '2025-11-06'
      });

      const update = await Update.create(updateData);

      expect(update.date).toBeInstanceOf(Date);
      expect(update.date.toISOString().split('T')[0]).toBe('2025-11-06');
    });

    it('should not require dateRange for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      delete updateData.dateRange;

      const update = await Update.create(updateData);

      // MongoDB returns empty object {} for undefined nested objects
      expect(update.dateRange).toBeDefined();
      expect(update.dateRange.start).toBeUndefined();
      expect(update.dateRange.end).toBeUndefined();
    });
  });

  describe('Weekly Update Creation', () => {
    it('should create a weekly update with valid data', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: {
          start: new Date('2025-11-04'),
          end: new Date('2025-11-08')
        },
        rawInput: 'Week summary',
        formattedOutput: '📊 Weekly Update...'
      });

      const update = await Update.create(updateData);

      expect(update).toBeDefined();
      expect(update.userId.toString()).toBe(testUser._id.toString());
      expect(update.type).toBe('weekly');
      expect(update.dateRange).toBeDefined();
      expect(update.dateRange.start).toBeInstanceOf(Date);
      expect(update.dateRange.end).toBeInstanceOf(Date);
      expect(update.rawInput).toBe('Week summary');
      expect(update.formattedOutput).toBe('📊 Weekly Update...');
    });

    it('should require userId for weekly update', async () => {
      const updateData = createWeeklyUpdateFixture(null);

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require type for weekly update', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id);
      delete updateData.type;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require dateRange.start for weekly update', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id);
      delete updateData.dateRange.start;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should require dateRange.end for weekly update', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id);
      delete updateData.dateRange.end;

      await expect(Update.create(updateData)).rejects.toThrow();
    });

    it('should not require date for weekly update', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id);
      updateData.date = undefined;

      const update = await Update.create(updateData);

      expect(update.date).toBeUndefined();
    });

    it('should accept dateRange as strings and convert to Dates', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id, {
        dateRange: {
          start: '2025-11-04',
          end: '2025-11-08'
        }
      });

      const update = await Update.create(updateData);

      expect(update.dateRange.start).toBeInstanceOf(Date);
      expect(update.dateRange.end).toBeInstanceOf(Date);
    });
  });

  describe('Sections Structure', () => {
    it('should store sections with all four arrays', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        sections: {
          todaysProgress: ['Task 1', 'Task 2'],
          ongoingWork: ['Task 3'],
          nextSteps: ['Task 4'],
          issues: ['Issue 1']
        }
      });

      const update = await Update.create(updateData);

      expect(update.sections.todaysProgress).toEqual(['Task 1', 'Task 2']);
      expect(update.sections.ongoingWork).toEqual(['Task 3']);
      expect(update.sections.nextSteps).toEqual(['Task 4']);
      expect(update.sections.issues).toEqual(['Issue 1']);
    });

    it('should accept sections with no issues', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        sections: {
          todaysProgress: ['Task 1'],
          ongoingWork: ['Task 2'],
          nextSteps: ['Task 3'],
          issues: []
        }
      });

      const update = await Update.create(updateData);

      expect(update.sections.issues).toEqual([]);
    });

    it('should handle sections with multiple items', async () => {
      const manyItems = Array(10).fill('Task');
      const updateData = createDailyUpdateFixture(testUser._id, {
        sections: {
          todaysProgress: manyItems,
          ongoingWork: manyItems,
          nextSteps: manyItems,
          issues: manyItems
        }
      });

      const update = await Update.create(updateData);

      expect(update.sections.todaysProgress).toHaveLength(10);
      expect(update.sections.ongoingWork).toHaveLength(10);
      expect(update.sections.nextSteps).toHaveLength(10);
      expect(update.sections.issues).toHaveLength(10);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt timestamp', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);

      const update = await Update.create(updateData);

      expect(update.createdAt).toBeInstanceOf(Date);
      expect(update.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should automatically set updatedAt timestamp', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);

      const update = await Update.create(updateData);

      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should update updatedAt when document is modified', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      const update = await Update.create(updateData);

      const originalUpdatedAt = update.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      update.rawInput = 'Updated raw input';
      await update.save();

      expect(update.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not change createdAt when document is modified', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      const update = await Update.create(updateData);

      const originalCreatedAt = update.createdAt;

      update.rawInput = 'Updated raw input';
      await update.save();

      expect(update.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Update Operations', () => {
    it('should update rawInput successfully', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        rawInput: 'Original input'
      });
      const update = await Update.create(updateData);

      update.rawInput = 'Updated input';
      await update.save();

      const foundUpdate = await Update.findById(update._id);
      expect(foundUpdate.rawInput).toBe('Updated input');
    });

    it('should update formattedOutput successfully', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      const update = await Update.create(updateData);

      update.formattedOutput = 'New formatted output';
      await update.save();

      const foundUpdate = await Update.findById(update._id);
      expect(foundUpdate.formattedOutput).toBe('New formatted output');
    });

    it('should update sections successfully', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      const update = await Update.create(updateData);

      update.sections.todaysProgress = ['New task'];
      await update.save();

      const foundUpdate = await Update.findById(update._id);
      expect(foundUpdate.sections.todaysProgress).toEqual(['New task']);
    });

    it('should update date for daily update', async () => {
      const updateData = createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-06')
      });
      const update = await Update.create(updateData);

      update.date = new Date('2025-11-07');
      await update.save();

      const foundUpdate = await Update.findById(update._id);
      expect(foundUpdate.date.toISOString().split('T')[0]).toBe('2025-11-07');
    });

    it('should update dateRange for weekly update', async () => {
      const updateData = createWeeklyUpdateFixture(testUser._id);
      const update = await Update.create(updateData);

      update.dateRange.start = new Date('2025-11-11');
      update.dateRange.end = new Date('2025-11-15');
      await update.save();

      const foundUpdate = await Update.findById(update._id);
      expect(foundUpdate.dateRange.start.toISOString().split('T')[0]).toBe('2025-11-11');
      expect(foundUpdate.dateRange.end.toISOString().split('T')[0]).toBe('2025-11-15');
    });
  });

  describe('Query Operations', () => {
    it('should find updates by userId', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      await Update.create(updateData);

      const updates = await Update.find({ userId: testUser._id });

      expect(updates).toHaveLength(1);
      expect(updates[0].userId.toString()).toBe(testUser._id.toString());
    });

    it('should find updates by type', async () => {
      await Update.create(createDailyUpdateFixture(testUser._id));
      await Update.create(createWeeklyUpdateFixture(testUser._id));

      const dailyUpdates = await Update.find({ type: 'daily' });
      const weeklyUpdates = await Update.find({ type: 'weekly' });

      expect(dailyUpdates).toHaveLength(1);
      expect(weeklyUpdates).toHaveLength(1);
      expect(dailyUpdates[0].type).toBe('daily');
      expect(weeklyUpdates[0].type).toBe('weekly');
    });

    it('should find updates by date range', async () => {
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-01')
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-05')
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-10')
      }));

      const updates = await Update.find({
        date: {
          $gte: new Date('2025-11-04'),
          $lte: new Date('2025-11-08')
        }
      });

      expect(updates).toHaveLength(1);
      expect(updates[0].date.toISOString().split('T')[0]).toBe('2025-11-05');
    });

    it('should sort updates by date descending', async () => {
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-01')
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-05')
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        date: new Date('2025-11-03')
      }));

      const updates = await Update.find({ type: 'daily' }).sort({ date: -1 });

      expect(updates[0].date.toISOString().split('T')[0]).toBe('2025-11-05');
      expect(updates[1].date.toISOString().split('T')[0]).toBe('2025-11-03');
      expect(updates[2].date.toISOString().split('T')[0]).toBe('2025-11-01');
    });

    it('should find updates with text search in rawInput', async () => {
      await Update.create(createDailyUpdateFixture(testUser._id, {
        rawInput: 'Fixed authentication bug'
      }));
      await Update.create(createDailyUpdateFixture(testUser._id, {
        rawInput: 'Added new feature'
      }));

      const updates = await Update.find({
        rawInput: { $regex: 'authentication', $options: 'i' }
      });

      expect(updates).toHaveLength(1);
      expect(updates[0].rawInput).toContain('authentication');
    });

    it('should populate userId reference', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      await Update.create(updateData);

      const updates = await Update.find({ userId: testUser._id }).populate('userId');

      expect(updates[0].userId.email).toBe('testuser@example.com');
      expect(updates[0].userId.name).toBeDefined();
    });
  });

  describe('Delete Operations', () => {
    it('should delete update successfully', async () => {
      const updateData = createDailyUpdateFixture(testUser._id);
      const update = await Update.create(updateData);

      await Update.findByIdAndDelete(update._id);

      const foundUpdate = await Update.findById(update._id);
      expect(foundUpdate).toBeNull();
    });

    it('should delete multiple updates for a user', async () => {
      await Update.create(createDailyUpdateFixture(testUser._id));
      await Update.create(createDailyUpdateFixture(testUser._id));
      await Update.create(createDailyUpdateFixture(testUser._id));

      await Update.deleteMany({ userId: testUser._id });

      const updates = await Update.find({ userId: testUser._id });
      expect(updates).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long rawInput', async () => {
      const longText = 'A'.repeat(10000);
      const updateData = createDailyUpdateFixture(testUser._id, {
        rawInput: longText
      });

      const update = await Update.create(updateData);

      expect(update.rawInput).toHaveLength(10000);
    });

    it('should handle special characters in text fields', async () => {
      const specialChars = '!@#$%^&*()_+{}|:"<>?[];,./\\';
      const updateData = createDailyUpdateFixture(testUser._id, {
        rawInput: specialChars,
        formattedOutput: specialChars
      });

      const update = await Update.create(updateData);

      expect(update.rawInput).toBe(specialChars);
      expect(update.formattedOutput).toBe(specialChars);
    });

    it('should handle emojis in text fields', async () => {
      const emojis = '🗓️ ✅ 🔄 📅 ⚠️ 📊';
      const updateData = createDailyUpdateFixture(testUser._id, {
        rawInput: emojis,
        formattedOutput: emojis
      });

      const update = await Update.create(updateData);

      expect(update.rawInput).toBe(emojis);
      expect(update.formattedOutput).toBe(emojis);
    });

    it('should handle updates with same date for different users', async () => {
      const user2Data = createUserFixture({ email: 'user2@example.com' });
      const user2 = await User.create(user2Data);

      const date = new Date('2025-11-06');
      await Update.create(createDailyUpdateFixture(testUser._id, { date }));
      await Update.create(createDailyUpdateFixture(user2._id, { date }));

      const user1Updates = await Update.find({ userId: testUser._id, date });
      const user2Updates = await Update.find({ userId: user2._id, date });

      expect(user1Updates).toHaveLength(1);
      expect(user2Updates).toHaveLength(1);
    });

    it('should handle updates with overlapping weekly date ranges', async () => {
      await Update.create(createWeeklyUpdateFixture(testUser._id, {
        dateRange: {
          start: new Date('2025-11-04'),
          end: new Date('2025-11-08')
        }
      }));
      await Update.create(createWeeklyUpdateFixture(testUser._id, {
        dateRange: {
          start: new Date('2025-11-06'),
          end: new Date('2025-11-10')
        }
      }));

      const updates = await Update.find({
        type: 'weekly',
        userId: testUser._id
      });

      expect(updates).toHaveLength(2);
    });
  });

  describe('Index Performance', () => {
    it('should have index on userId and type', async () => {
      const indexes = await Update.collection.getIndexes();

      const hasUserIdTypeIndex = Object.keys(indexes).some(key =>
        indexes[key].some(field => field[0] === 'userId') &&
        indexes[key].some(field => field[0] === 'type')
      );

      expect(hasUserIdTypeIndex).toBe(true);
    });

    it('should efficiently query by userId and createdAt', async () => {
      // Create many updates
      const promises = Array(50).fill(null).map((_, i) =>
        Update.create(createDailyUpdateFixture(testUser._id, {
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        }))
      );
      await Promise.all(promises);

      const startTime = Date.now();
      await Update.find({ userId: testUser._id }).sort({ createdAt: -1 }).limit(10);
      const endTime = Date.now();

      // Query should be fast (under 100ms even with 50 records)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
