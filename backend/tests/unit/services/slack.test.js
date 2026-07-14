import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const { sendSlackMessage, sendDailyUpdateToSlack, sendWeeklySummaryToSlack } = await import(
  '../../../services/slack.js'
);

const WEBHOOK = 'https://hooks.slack.com/services/T000/B000/xyz';
const bodyOf = (call) => JSON.parse(call[1].body);
const textOf = (payload) =>
  (payload.blocks || [])
    .flatMap((b) => (b.text ? [b.text.text] : (b.elements || []).map((e) => e.text)))
    .join('\n');

describe('Slack Service', () => {
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

  describe('sendSlackMessage', () => {
    it('POSTs a text payload and returns true on ok', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const result = await sendSlackMessage(WEBHOOK, 'Hello team');
      expect(result).toBe(true);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(WEBHOOK);
      expect(options.method).toBe('POST');
      expect(bodyOf(global.fetch.mock.calls[0])).toEqual({ text: 'Hello team' });
    });

    it('returns false and logs on a non-ok response', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });
      const result = await sendSlackMessage(WEBHOOK, 'Hi');
      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('returns false when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('network down'));
      expect(await sendSlackMessage(WEBHOOK, 'Hi')).toBe(false);
    });
  });

  describe('sendDailyUpdateToSlack', () => {
    const user = { name: 'Alice' };

    it('builds Block Kit blocks from the real Update fields', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const update = {
        type: 'daily',
        date: '2026-01-15T10:00:00Z',
        companyId: { name: 'Acme Corp' },
        formattedOutput: 'Worked on authentication and tests.',
        tags: [{ name: 'backend' }, { name: 'auth' }],
      };

      const result = await sendDailyUpdateToSlack(WEBHOOK, update, user);

      expect(result).toBe(true);
      const payload = bodyOf(global.fetch.mock.calls[0]);
      const header = payload.blocks.find((b) => b.type === 'header');
      expect(header.text.text).toContain('Acme Corp');
      const text = textOf(payload);
      expect(text).toContain('Worked on authentication and tests.');
      expect(text).toContain('backend, auth');
      expect(text).toContain('From Alice');
    });

    it('defaults the company label and propagates a failed send', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });
      const result = await sendDailyUpdateToSlack(
        WEBHOOK,
        { type: 'daily', date: '2026-01-15T10:00:00Z', formattedOutput: 'x' },
        user
      );
      expect(result).toBe(false);
    });
  });

  describe('sendWeeklySummaryToSlack', () => {
    const user = { name: 'Bob' };

    it('renders the date range and the linked-update count', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const update = {
        type: 'weekly',
        dateRange: { start: '2026-01-05', end: '2026-01-11' },
        companyId: { name: 'Globex' },
        formattedOutput: 'Delivered several features.',
        dailyUpdates: [{}, {}, {}],
        tags: [{ name: 'sprint' }],
      };

      const result = await sendWeeklySummaryToSlack(WEBHOOK, update, user);

      expect(result).toBe(true);
      const payload = bodyOf(global.fetch.mock.calls[0]);
      const header = payload.blocks.find((b) => b.type === 'header');
      expect(header.text.text).toContain('Globex');
      const text = textOf(payload);
      expect(text).toContain('Updates:* 3');
      expect(text).toContain('Delivered several features.');
    });
  });
});
