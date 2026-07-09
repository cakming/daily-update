import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const {
  sendGoogleChatMessage,
  sendGoogleChatCard,
  sendDailyUpdateToGoogleChat,
  sendWeeklySummaryToGoogleChat,
} = await import('../../../services/googleChat.js');

const WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAAA/messages?key=k&token=t';

// Extract the parsed JSON body from a fetch call.
const bodyOf = (call) => JSON.parse(call[1].body);

describe('Google Chat Service', () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    errorSpy.mockRestore();
    jest.clearAllMocks();
    delete global.fetch;
  });

  describe('sendGoogleChatMessage', () => {
    it('should POST text payload and return true on ok response', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const result = await sendGoogleChatMessage(WEBHOOK, 'Hello team');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(WEBHOOK);
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(bodyOf(global.fetch.mock.calls[0])).toEqual({ text: 'Hello team' });
    });

    it('should return false and log error on non-ok response', async () => {
      global.fetch.mockResolvedValue({ ok: false, statusText: 'Bad Request' });

      const result = await sendGoogleChatMessage(WEBHOOK, 'Hello');

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send Google Chat message:',
        expect.objectContaining({ message: expect.stringContaining('Bad Request') })
      );
    });

    it('should return false when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('network down'));

      const result = await sendGoogleChatMessage(WEBHOOK, 'Hello');

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send Google Chat message:',
        expect.objectContaining({ message: 'network down' })
      );
    });
  });

  describe('sendGoogleChatCard', () => {
    const card = { header: { title: 'Test' }, sections: [] };

    it('should POST card payload and return true on ok response', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const result = await sendGoogleChatCard(WEBHOOK, card);

      expect(result).toBe(true);
      expect(bodyOf(global.fetch.mock.calls[0])).toEqual({ cards: [card] });
    });

    it('should return false and log error on non-ok response', async () => {
      global.fetch.mockResolvedValue({ ok: false, statusText: 'Forbidden' });

      const result = await sendGoogleChatCard(WEBHOOK, card);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send Google Chat card:',
        expect.objectContaining({ message: expect.stringContaining('Forbidden') })
      );
    });

    it('should return false when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('timeout'));

      const result = await sendGoogleChatCard(WEBHOOK, card);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send Google Chat card:',
        expect.objectContaining({ message: 'timeout' })
      );
    });
  });

  describe('sendDailyUpdateToGoogleChat', () => {
    const user = { name: 'Alice' };

    it('should build a full card with company, aiSummary and tags', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const update = {
        createdAt: '2026-01-15T10:00:00Z',
        company: { name: 'Acme Corp' },
        aiSummary: 'Shipped the login flow',
        content: 'Worked on authentication and tests.',
        tags: [{ name: 'backend' }, { name: 'auth' }],
      };

      const result = await sendDailyUpdateToGoogleChat(WEBHOOK, update, user);

      expect(result).toBe(true);
      const card = bodyOf(global.fetch.mock.calls[0]).cards[0];
      expect(card.header.title).toBe('📝 Daily Update');
      expect(card.header.subtitle).toContain('Acme Corp');

      const widgetText = card.sections[0].widgets.map((w) => w.textParagraph.text).join('\n');
      expect(widgetText).toContain('AI Summary');
      expect(widgetText).toContain('Shipped the login flow');
      expect(widgetText).toContain('Worked on authentication and tests.');
      expect(widgetText).toContain('Tags:</b> backend, auth');
      expect(widgetText).toContain('From: Alice');
    });

    it('should omit aiSummary and tags widgets when absent, default company name', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const update = {
        createdAt: '2026-01-15T10:00:00Z',
        content: 'Simple update with no extras.',
        // no company, no aiSummary, no tags
      };

      const result = await sendDailyUpdateToGoogleChat(WEBHOOK, update, user);

      expect(result).toBe(true);
      const card = bodyOf(global.fetch.mock.calls[0]).cards[0];
      expect(card.header.subtitle).toContain('No Company');

      const widgetText = card.sections[0].widgets.map((w) => w.textParagraph.text).join('\n');
      expect(widgetText).not.toContain('AI Summary');
      expect(widgetText).not.toContain('Tags:');
      expect(widgetText).toContain('Simple update with no extras.');
      // aiSummary(0) + content(1) + from(1) = 2 widgets when both optional blocks absent
      expect(card.sections[0].widgets).toHaveLength(2);
    });

    it('should truncate content longer than 500 chars with ellipsis', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const longContent = 'x'.repeat(600);
      const update = {
        createdAt: '2026-01-15T10:00:00Z',
        company: { name: 'Acme' },
        content: longContent,
      };

      await sendDailyUpdateToGoogleChat(WEBHOOK, update, user);

      const card = bodyOf(global.fetch.mock.calls[0]).cards[0];
      const contentWidget = card.sections[0].widgets.find((w) =>
        w.textParagraph.text.includes('Update Content:')
      );
      expect(contentWidget.textParagraph.text).toContain('x'.repeat(500) + '...');
      expect(contentWidget.textParagraph.text).not.toContain('x'.repeat(501));
    });

    it('should propagate false when underlying send fails', async () => {
      global.fetch.mockResolvedValue({ ok: false, statusText: 'Server Error' });

      const update = { createdAt: '2026-01-15T10:00:00Z', content: 'hi' };
      const result = await sendDailyUpdateToGoogleChat(WEBHOOK, update, user);

      expect(result).toBe(false);
    });
  });

  describe('sendWeeklySummaryToGoogleChat', () => {
    const user = { name: 'Bob' };

    it('should build a full weekly card with stats, aiSummary and tags', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const update = {
        period: { startDate: '2026-01-05', endDate: '2026-01-11' },
        company: { name: 'Globex' },
        aiSummary: 'Productive week',
        content: 'Delivered several features.',
        dailyUpdates: [{}, {}, {}],
        tags: [{ name: 'sprint' }],
      };

      const result = await sendWeeklySummaryToGoogleChat(WEBHOOK, update, user);

      expect(result).toBe(true);
      const card = bodyOf(global.fetch.mock.calls[0]).cards[0];
      expect(card.header.title).toBe('📊 Weekly Summary');
      expect(card.header.subtitle).toContain('Globex');

      const widgetText = card.sections[0].widgets.map((w) => w.textParagraph.text).join('\n');
      expect(widgetText).toContain('AI Summary');
      expect(widgetText).toContain('Productive week');
      expect(widgetText).toContain('Updates Included: 3');
      expect(widgetText).toContain('Delivered several features.');
      expect(widgetText).toContain('Tags:</b> sprint');
      expect(widgetText).toContain('From: Bob');
    });

    it('should default stats to 0, omit optional widgets, default company name', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const update = {
        period: { startDate: '2026-01-05', endDate: '2026-01-11' },
        content: 'Quiet week.',
        // no company, aiSummary, dailyUpdates, tags
      };

      const result = await sendWeeklySummaryToGoogleChat(WEBHOOK, update, user);

      expect(result).toBe(true);
      const card = bodyOf(global.fetch.mock.calls[0]).cards[0];
      expect(card.header.subtitle).toContain('No Company');

      const widgetText = card.sections[0].widgets.map((w) => w.textParagraph.text).join('\n');
      expect(widgetText).not.toContain('AI Summary');
      expect(widgetText).not.toContain('Tags:');
      expect(widgetText).toContain('Updates Included: 0');
      // stats(1) + content(1) + from(1) = 3 widgets
      expect(card.sections[0].widgets).toHaveLength(3);
    });

    it('should truncate weekly content longer than 500 chars', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const update = {
        period: { startDate: '2026-01-05', endDate: '2026-01-11' },
        content: 'y'.repeat(700),
      };

      await sendWeeklySummaryToGoogleChat(WEBHOOK, update, user);

      const card = bodyOf(global.fetch.mock.calls[0]).cards[0];
      const contentWidget = card.sections[0].widgets.find((w) =>
        w.textParagraph.text.includes('Weekly Summary:')
      );
      expect(contentWidget.textParagraph.text).toContain('y'.repeat(500) + '...');
    });

    it('should return false when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('boom'));

      const update = {
        period: { startDate: '2026-01-05', endDate: '2026-01-11' },
        content: 'hi',
      };
      const result = await sendWeeklySummaryToGoogleChat(WEBHOOK, update, user);

      expect(result).toBe(false);
    });
  });
});
