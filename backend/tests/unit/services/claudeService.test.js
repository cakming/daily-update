import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the Anthropic SDK BEFORE importing the service
const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }))
}));

// Dynamic import after mocking
const { processDailyUpdate, processWeeklyUpdate, deriveSummary } = await import('../../../services/claudeService.js');

describe('Claude Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deriveSummary', () => {
    it('prefers the first progress highlights', () => {
      const summary = deriveSummary('ignored', {
        todaysProgress: ['Shipped login', 'Fixed billing bug', 'Third item'],
        ongoingWork: ['Working on X'],
      });
      expect(summary).toContain('Shipped login');
      expect(summary).toContain('Fixed billing bug');
      expect(summary).not.toContain('Third item'); // only the first two
    });

    it('falls back to ongoingWork, then to formatted bullets', () => {
      expect(
        deriveSummary('x', { todaysProgress: [], ongoingWork: ['Ongoing thing'] })
      ).toContain('Ongoing thing');

      const fromBullets = deriveSummary(
        '🗓️ Daily Update\n\n✅ Progress\n- Bullet one\n- Bullet two',
        {}
      );
      expect(fromBullets).toContain('Bullet one');
    });

    it('caps the length and tolerates empty input', () => {
      const long = deriveSummary('x', { todaysProgress: ['y'.repeat(500)] });
      expect(long.length).toBeLessThanOrEqual(280);
      expect(deriveSummary('', {})).toBe('');
    });
  });

  describe('processDailyUpdate', () => {
    it('should process technical update and return formatted output', async () => {
      const mockResponse = {
        content: [{
          text: `🗓️ Daily Update — Wednesday, November 6, 2025

✅ Today's Progress
- Fixed authentication bug in login endpoint
- Implemented password reset feature

🔄 Ongoing Work
- Database query optimization

📅 Next Steps (Tomorrow)
- Continue performance improvements

⚠️ Issues / Pending Items
No major issues reported`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const technicalText = 'Fixed auth bug. Added password reset. Working on DB optimization.';
      const date = new Date('2025-11-06');

      const result = await processDailyUpdate(technicalText, date);

      expect(result).toBeDefined();
      expect(result.formattedOutput).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.formattedOutput).toContain('🗓️ Daily Update');
      expect(result.formattedOutput).toContain('November 6, 2025');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should parse sections correctly from formatted output', async () => {
      const mockResponse = {
        content: [{
          text: `🗓️ Daily Update — Wednesday, November 6, 2025

✅ Today's Progress
- Completed feature A
- Fixed bug B

🔄 Ongoing Work
- Working on feature C

📅 Next Steps (Tomorrow)
- Plan feature D

⚠️ Issues / Pending Items
- Blocker with API`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processDailyUpdate('test input', new Date('2025-11-06'));

      expect(result.sections.todaysProgress).toEqual(['Completed feature A', 'Fixed bug B']);
      expect(result.sections.ongoingWork).toEqual(['Working on feature C']);
      expect(result.sections.nextSteps).toEqual(['Plan feature D']);
      expect(result.sections.issues).toEqual(['Blocker with API']);
    });

    it('should handle no issues reported', async () => {
      const mockResponse = {
        content: [{
          text: `🗓️ Daily Update — Wednesday, November 6, 2025

✅ Today's Progress
- Completed tasks

🔄 Ongoing Work
- Working on items

📅 Next Steps (Tomorrow)
- Plan next tasks

⚠️ Issues / Pending Items
No major issues reported`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processDailyUpdate('test input', new Date('2025-11-06'));

      expect(result.sections.issues).toContain('No major issues reported');
    });

    it('should handle empty sections', async () => {
      const mockResponse = {
        content: [{
          text: `🗓️ Daily Update — Wednesday, November 6, 2025

✅ Today's Progress

🔄 Ongoing Work

📅 Next Steps (Tomorrow)

⚠️ Issues / Pending Items
No major issues reported`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processDailyUpdate('test input', new Date('2025-11-06'));

      expect(result.sections.todaysProgress).toEqual([]);
      expect(result.sections.ongoingWork).toEqual([]);
      expect(result.sections.nextSteps).toEqual([]);
    });

    it('should handle multiple items in each section', async () => {
      const mockResponse = {
        content: [{
          text: `🗓️ Daily Update — Wednesday, November 6, 2025

✅ Today's Progress
- Task 1
- Task 2
- Task 3

🔄 Ongoing Work
- Item 1
- Item 2

📅 Next Steps (Tomorrow)
- Next 1
- Next 2
- Next 3
- Next 4

⚠️ Issues / Pending Items
- Issue 1
- Issue 2`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processDailyUpdate('test input', new Date('2025-11-06'));

      expect(result.sections.todaysProgress).toHaveLength(3);
      expect(result.sections.ongoingWork).toHaveLength(2);
      expect(result.sections.nextSteps).toHaveLength(4);
      expect(result.sections.issues).toHaveLength(2);
    });

    it('should use correct Claude model', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      await processDailyUpdate('test input', new Date('2025-11-06'));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-5',
          max_tokens: 3000
        })
      );
    });

    it('should include date in the prompt', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const date = new Date('2025-11-06');
      await processDailyUpdate('test input', date);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('November 6, 2025');
    });

    it('should include technical text in the prompt', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const technicalText = 'Fixed critical bug in authentication system';
      await processDailyUpdate(technicalText, new Date('2025-11-06'));

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain(technicalText);
    });

    it('should throw error when Claude API fails', async () => {
      const error = new Error('API Error: Rate limit exceeded');
      mockCreate.mockRejectedValue(error);

      await expect(processDailyUpdate('test', new Date())).rejects.toThrow(
        'Failed to process update with Claude API'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockCreate.mockRejectedValue(networkError);

      await expect(processDailyUpdate('test', new Date())).rejects.toThrow();
    });

    it('should handle malformed API response', async () => {
      const mockResponse = {
        content: [] // Empty content array
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(processDailyUpdate('test', new Date())).rejects.toThrow();
    });

    it('should trim whitespace from formatted output', async () => {
      const mockResponse = {
        content: [{
          text: `

🗓️ Daily Update — Wednesday, November 6, 2025

✅ Today's Progress
- Task


          `
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processDailyUpdate('test', new Date('2025-11-06'));

      expect(result.formattedOutput).not.toMatch(/^\s+/);
      expect(result.formattedOutput).not.toMatch(/\s+$/);
    });
  });

  describe('processWeeklyUpdate', () => {
    it('should generate weekly summary from daily updates', async () => {
      const mockResponse = {
        content: [{
          text: `📊 Weekly Update — November 4, 2025 to November 8, 2025

✅ This Week's Achievements
- Completed authentication system
- Implemented password reset

🔄 Ongoing Initiatives
- Performance optimization

📅 Next Week's Focus
- User profile features

⚠️ Challenges & Action Items
No major challenges this week`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const dailyUpdates = [
        {
          date: new Date('2025-11-04'),
          rawInput: 'Started auth system'
        },
        {
          date: new Date('2025-11-05'),
          rawInput: 'Completed auth system'
        }
      ];

      const result = await processWeeklyUpdate(
        dailyUpdates,
        new Date('2025-11-04'),
        new Date('2025-11-08')
      );

      expect(result).toBeDefined();
      expect(result.formattedOutput).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.formattedOutput).toContain('📊 Weekly Update');
      expect(result.formattedOutput).toContain('November 4, 2025');
      expect(result.formattedOutput).toContain('November 8, 2025');
    });

    it('should parse weekly sections correctly', async () => {
      const mockResponse = {
        content: [{
          text: `📊 Weekly Update — November 4, 2025 to November 8, 2025

✅ This Week's Achievements
- Achievement 1
- Achievement 2

🔄 Ongoing Initiatives
- Initiative 1

📅 Next Week's Focus
- Focus 1
- Focus 2

⚠️ Challenges & Action Items
- Challenge 1`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processWeeklyUpdate(
        [{ rawInput: 'test', date: new Date() }],
        new Date('2025-11-04'),
        new Date('2025-11-08')
      );

      expect(result.sections.todaysProgress).toEqual(['Achievement 1', 'Achievement 2']);
      expect(result.sections.ongoingWork).toEqual(['Initiative 1']);
      expect(result.sections.nextSteps).toEqual(['Focus 1', 'Focus 2']);
      expect(result.sections.issues).toEqual(['Challenge 1']);
    });

    it('should handle no challenges', async () => {
      const mockResponse = {
        content: [{
          text: `📊 Weekly Update — November 4, 2025 to November 8, 2025

✅ This Week's Achievements
- Done tasks

🔄 Ongoing Initiatives
- Ongoing items

📅 Next Week's Focus
- Next items

⚠️ Challenges & Action Items
No major challenges this week`
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processWeeklyUpdate(
        [{ rawInput: 'test', date: new Date() }],
        new Date('2025-11-04'),
        new Date('2025-11-08')
      );

      expect(result.sections.issues).toContain('No major challenges this week');
    });

    it('should combine multiple daily updates', async () => {
      const mockResponse = {
        content: [{ text: '📊 Weekly Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const dailyUpdates = [
        { date: new Date('2025-11-04'), rawInput: 'Monday work' },
        { date: new Date('2025-11-05'), rawInput: 'Tuesday work' },
        { date: new Date('2025-11-06'), rawInput: 'Wednesday work' },
        { date: new Date('2025-11-07'), rawInput: 'Thursday work' },
        { date: new Date('2025-11-08'), rawInput: 'Friday work' }
      ];

      await processWeeklyUpdate(dailyUpdates, new Date('2025-11-04'), new Date('2025-11-08'));

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;

      expect(prompt).toContain('Monday work');
      expect(prompt).toContain('Tuesday work');
      expect(prompt).toContain('Wednesday work');
      expect(prompt).toContain('Thursday work');
      expect(prompt).toContain('Friday work');
    });

    it('should format dates in combined updates', async () => {
      const mockResponse = {
        content: [{ text: '📊 Weekly Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const dailyUpdates = [
        { date: new Date('2025-11-04'), rawInput: 'Work' }
      ];

      await processWeeklyUpdate(dailyUpdates, new Date('2025-11-04'), new Date('2025-11-08'));

      const callArgs = mockCreate.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;

      // Should include formatted date like "Monday, Nov 4"
      expect(prompt).toMatch(/Nov\s+4/);
    });

    it('should use higher max_tokens for weekly updates', async () => {
      const mockResponse = {
        content: [{ text: '📊 Weekly Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      await processWeeklyUpdate(
        [{ rawInput: 'test', date: new Date() }],
        new Date('2025-11-04'),
        new Date('2025-11-08')
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-5',
          max_tokens: 3500 // Higher than daily updates (3000)
        })
      );
    });

    it('should throw error when Claude API fails', async () => {
      const error = new Error('API Error');
      mockCreate.mockRejectedValue(error);

      await expect(
        processWeeklyUpdate([], new Date(), new Date())
      ).rejects.toThrow('Failed to generate weekly update with Claude API');
    });

    it('should handle empty daily updates array', async () => {
      const mockResponse = {
        content: [{ text: '📊 Weekly Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processWeeklyUpdate(
        [],
        new Date('2025-11-04'),
        new Date('2025-11-08')
      );

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle single daily update', async () => {
      const mockResponse = {
        content: [{ text: '📊 Weekly Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await processWeeklyUpdate(
        [{ date: new Date('2025-11-04'), rawInput: 'Single day work' }],
        new Date('2025-11-04'),
        new Date('2025-11-08')
      );

      expect(result).toBeDefined();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('Single day work');
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error message on API failure', async () => {
      const apiError = new Error('Authentication failed');
      mockCreate.mockRejectedValue(apiError);

      await expect(processDailyUpdate('test', new Date())).rejects.toThrow(
        /Failed to process update with Claude API.*Authentication failed/
      );
    });

    it('should handle API timeout', async () => {
      const timeoutError = new Error('Request timeout');
      mockCreate.mockRejectedValue(timeoutError);

      await expect(processDailyUpdate('test', new Date())).rejects.toThrow();
    });

    it('should handle invalid API key', async () => {
      const authError = new Error('Invalid API key');
      mockCreate.mockRejectedValue(authError);

      await expect(processDailyUpdate('test', new Date())).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long technical text', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const longText = 'A'.repeat(5000);
      const result = await processDailyUpdate(longText, new Date('2025-11-06'));

      expect(result).toBeDefined();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain(longText);
    });

    it('should handle special characters in text', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const specialText = '!@#$%^&*()_+{}|:"<>?[];,./\\';
      await processDailyUpdate(specialText, new Date('2025-11-06'));

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain(specialText);
    });

    it('should handle emojis in technical text', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const emojiText = '✅ Fixed bug 🐛 in feature 🚀';
      await processDailyUpdate(emojiText, new Date('2025-11-06'));

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain(emojiText);
    });

    it('should handle line breaks in technical text', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — test' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const multilineText = 'Line 1\nLine 2\nLine 3';
      await processDailyUpdate(multilineText, new Date('2025-11-06'));

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('Line 1');
      expect(callArgs.messages[0].content).toContain('Line 2');
      expect(callArgs.messages[0].content).toContain('Line 3');
    });

    it('should handle different date formats', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — December 25, 2025' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const christmasDate = new Date('2025-12-25');
      const result = await processDailyUpdate('test', christmasDate);

      expect(result.formattedOutput).toContain('December 25, 2025');
    });

    it('should handle past dates', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — January 1, 2020' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const pastDate = new Date('2020-01-01');
      const result = await processDailyUpdate('test', pastDate);

      expect(result.formattedOutput).toContain('2020');
    });

    it('should handle future dates', async () => {
      const mockResponse = {
        content: [{ text: '🗓️ Daily Update — December 31, 2099' }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const futureDate = new Date('2099-12-31');
      const result = await processDailyUpdate('test', futureDate);

      expect(result.formattedOutput).toContain('2099');
    });
  });
});
