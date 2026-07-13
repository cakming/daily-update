import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Unit tests for services/telegramBot.js
 *
 * `telegraf` and the mongoose models are mocked before the service is imported.
 * The fake Telegraf captures every registered command / error handler so they
 * can be invoked directly with a fake ctx, exercising both the happy path and
 * the error handling inside each command. No real bot is ever launched.
 */

// ---------------------------------------------------------------------------
// telegraf mock — a fake bot that records handlers.
// ---------------------------------------------------------------------------
let commandHandlers = {};
let catchHandler = null;
const botLaunch = jest.fn(() => Promise.resolve());
const botStop = jest.fn();
const telegramSendMessage = jest.fn(() => Promise.resolve());
let constructorShouldThrow = false;

const Telegraf = jest.fn(function (token) {
  if (constructorShouldThrow) {
    throw new Error('bad token');
  }
  this.token = token;
  this.command = jest.fn((name, fn) => {
    commandHandlers[name] = fn;
  });
  this.catch = jest.fn((fn) => {
    catchHandler = fn;
  });
  this.launch = botLaunch;
  this.stop = botStop;
  this.telegram = { sendMessage: telegramSendMessage };
});

jest.unstable_mockModule('telegraf', () => ({ Telegraf }));

// ---------------------------------------------------------------------------
// User model mock.
// ---------------------------------------------------------------------------
let foundUser = null;
let userFindShouldReject = false;
const userFindOne = jest.fn(() =>
  userFindShouldReject
    ? Promise.reject(new Error('db error'))
    : Promise.resolve(foundUser)
);
jest.unstable_mockModule('../../../models/User.js', () => ({
  default: { findOne: userFindOne },
}));

// ---------------------------------------------------------------------------
// Update model mock (used for both DailyUpdate and WeeklyUpdate).
// A thenable query supporting populate/sort/limit chaining.
// ---------------------------------------------------------------------------
function makeQuery(result) {
  const q = {};
  q.populate = jest.fn(() => q);
  q.sort = jest.fn(() => q);
  q.limit = jest.fn(() => q);
  q.then = (res, rej) => Promise.resolve(result).then(res, rej);
  return q;
}

let findResult = [];
let findOneResult = null;
let dailyCount = 0;
let weeklyCount = 0;

const MockUpdate = {
  find: jest.fn(() => makeQuery(findResult)),
  findOne: jest.fn(() => makeQuery(findOneResult)),
  countDocuments: jest.fn((query) =>
    // The service calls countDocuments twice via Promise.all; distinguish by
    // resolving from module-level counters (both use the same filter shape).
    Promise.resolve(MockUpdate.countDocuments.mock.calls.length % 2 === 1 ? dailyCount : weeklyCount)
  ),
};
jest.unstable_mockModule('../../../models/Update.js', () => ({
  default: MockUpdate,
}));

// ---------------------------------------------------------------------------
// Import service under test AFTER mocks.
// ---------------------------------------------------------------------------
const { startTelegramBot, stopTelegramBot, sendTelegramMessage } = await import(
  '../../../services/telegramBot.js'
);

function makeCtx(overrides = {}) {
  return {
    from: { id: 987654, username: 'bob', first_name: 'Bob' },
    reply: jest.fn(() => Promise.resolve()),
    ...overrides,
  };
}

// Combined reply text from a ctx (single call expected).
const replyText = (ctx) => ctx.reply.mock.calls.map((c) => c[0]).join('\n');

describe('Telegram Bot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    commandHandlers = {};
    catchHandler = null;
    constructorShouldThrow = false;
    foundUser = null;
    userFindShouldReject = false;
    findResult = [];
    findOneResult = null;
    dailyCount = 0;
    weeklyCount = 0;
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  afterEach(() => {
    stopTelegramBot();
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    jest.restoreAllMocks();
  });

  // Convenience: start the bot with a token so handlers are registered.
  function start() {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    return startTelegramBot();
  }

  describe('startTelegramBot', () => {
    it('returns null and does not construct a bot without a token', () => {
      const result = startTelegramBot();
      expect(result).toBeNull();
      expect(Telegraf).not.toHaveBeenCalled();
    });

    it('constructs, registers commands and launches the bot with a token', () => {
      const result = start();

      expect(result).not.toBeNull();
      expect(Telegraf).toHaveBeenCalledWith('test-token');
      expect(botLaunch).toHaveBeenCalled();
      expect(Object.keys(commandHandlers).sort()).toEqual(
        ['help', 'latest', 'link', 'start', 'stats', 'today', 'week'].sort()
      );
      expect(catchHandler).toBeInstanceOf(Function);
    });

    it('returns null when the Telegraf constructor throws', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      constructorShouldThrow = true;

      const result = startTelegramBot();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to start Telegram bot:',
        expect.any(Error)
      );
    });
  });

  describe('static commands', () => {
    it('/start replies with the welcome message', async () => {
      start();
      const ctx = makeCtx();
      await commandHandlers.start(ctx);
      expect(replyText(ctx)).toContain('Welcome to Daily Update Bot');
    });

    it('/help replies with the help message', async () => {
      start();
      const ctx = makeCtx();
      await commandHandlers.help(ctx);
      expect(replyText(ctx)).toContain('Available Commands');
    });

    it('/link replies with the Telegram id and username (markdown)', async () => {
      start();
      const ctx = makeCtx();
      await commandHandlers.link(ctx);
      const [message, opts] = ctx.reply.mock.calls[0];
      expect(message).toContain('987654');
      expect(message).toContain('@bob');
      expect(opts).toEqual({ parse_mode: 'Markdown' });
    });

    it('/link falls back to first_name when username is missing', async () => {
      start();
      const ctx = makeCtx({ from: { id: 1, username: undefined, first_name: 'Alice' } });
      await commandHandlers.link(ctx);
      expect(replyText(ctx)).toContain('@Alice');
    });
  });

  describe('/today', () => {
    it('prompts to link when the account is not connected', async () => {
      start();
      foundUser = null;
      const ctx = makeCtx();
      await commandHandlers.today(ctx);
      expect(replyText(ctx)).toContain('not linked');
    });

    it('reports when there are no updates today', async () => {
      start();
      foundUser = { _id: 'u1' };
      findResult = [];
      const ctx = makeCtx();
      await commandHandlers.today(ctx);
      expect(replyText(ctx)).toContain('No updates found for today');
    });

    it('lists today updates including company name and AI summary', async () => {
      start();
      foundUser = { _id: 'u1' };
      findResult = [
        { companyId: { name: 'Acme' }, aiSummary: 'Did things' },
        { companyId: null },
      ];
      const ctx = makeCtx();
      await commandHandlers.today(ctx);
      const text = replyText(ctx);
      expect(text).toContain("Today's Updates (2)");
      expect(text).toContain('Acme');
      expect(text).toContain('Did things');
      expect(text).toContain('No Company');
    });

    it('handles errors gracefully', async () => {
      start();
      userFindShouldReject = true;
      const ctx = makeCtx();
      await commandHandlers.today(ctx);
      expect(replyText(ctx)).toContain('An error occurred');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('/week', () => {
    it('prompts to link when not connected', async () => {
      start();
      foundUser = null;
      const ctx = makeCtx();
      await commandHandlers.week(ctx);
      expect(replyText(ctx)).toContain('not linked');
    });

    it('reports when no weekly summary exists', async () => {
      start();
      foundUser = { _id: 'u1' };
      findResult = [];
      const ctx = makeCtx();
      await commandHandlers.week(ctx);
      expect(replyText(ctx)).toContain('No weekly summary');
    });

    it('renders the weekly summary with company and AI summary', async () => {
      start();
      foundUser = { _id: 'u1' };
      findResult = [
        { companyId: { name: 'Acme' }, aiSummary: 'Weekly recap', dailyUpdates: [1, 2, 3] },
      ];
      const ctx = makeCtx();
      await commandHandlers.week(ctx);
      const text = replyText(ctx);
      expect(text).toContain('Weekly Summary - Acme');
      expect(text).toContain('Weekly recap');
      expect(text).toContain('Updates: 3');
    });

    it('renders the weekly summary with no company and no AI summary', async () => {
      start();
      foundUser = { _id: 'u1' };
      findResult = [{ companyId: null, dailyUpdates: undefined }];
      const ctx = makeCtx();
      await commandHandlers.week(ctx);
      const text = replyText(ctx);
      expect(text).toContain('Weekly Summary - All Companies');
      expect(text).toContain('Updates: 0');
    });

    it('handles errors gracefully', async () => {
      start();
      userFindShouldReject = true;
      const ctx = makeCtx();
      await commandHandlers.week(ctx);
      expect(replyText(ctx)).toContain('An error occurred');
    });
  });

  describe('/stats', () => {
    it('prompts to link when not connected', async () => {
      start();
      foundUser = null;
      const ctx = makeCtx();
      await commandHandlers.stats(ctx);
      expect(replyText(ctx)).toContain('not linked');
    });

    it('reports the user statistics', async () => {
      start();
      foundUser = { _id: 'u1', name: 'Bob', email: 'bob@example.com' };
      dailyCount = 5;
      weeklyCount = 2;
      const ctx = makeCtx();
      await commandHandlers.stats(ctx);
      const text = replyText(ctx);
      expect(text).toContain('Your Statistics');
      expect(text).toContain('Bob');
      expect(text).toContain('bob@example.com');
    });

    it('handles errors gracefully', async () => {
      start();
      userFindShouldReject = true;
      const ctx = makeCtx();
      await commandHandlers.stats(ctx);
      expect(replyText(ctx)).toContain('An error occurred');
    });
  });

  describe('/latest', () => {
    it('prompts to link when not connected', async () => {
      start();
      foundUser = null;
      const ctx = makeCtx();
      await commandHandlers.latest(ctx);
      expect(replyText(ctx)).toContain('not linked');
    });

    it('reports when there are no updates', async () => {
      start();
      foundUser = { _id: 'u1' };
      findOneResult = null;
      const ctx = makeCtx();
      await commandHandlers.latest(ctx);
      expect(replyText(ctx)).toContain('No updates found');
    });

    it('renders the latest update and truncates long content', async () => {
      start();
      foundUser = { _id: 'u1' };
      findOneResult = {
        companyId: { name: 'Acme' },
        createdAt: new Date('2026-01-01'),
        aiSummary: 'Summary here',
        content: 'x'.repeat(600),
      };
      const ctx = makeCtx();
      await commandHandlers.latest(ctx);
      const text = replyText(ctx);
      expect(text).toContain('Latest Update');
      expect(text).toContain('Acme');
      expect(text).toContain('Summary here');
      expect(text).toContain('...'); // content > 500 chars truncated
    });

    it('renders short content without truncation and no company', async () => {
      start();
      foundUser = { _id: 'u1' };
      findOneResult = {
        companyId: null,
        createdAt: new Date('2026-01-01'),
        content: 'short content',
      };
      const ctx = makeCtx();
      await commandHandlers.latest(ctx);
      const text = replyText(ctx);
      expect(text).toContain('No Company');
      expect(text).toContain('short content');
      expect(text).not.toContain('...');
    });

    it('handles errors gracefully', async () => {
      start();
      userFindShouldReject = true;
      const ctx = makeCtx();
      await commandHandlers.latest(ctx);
      expect(replyText(ctx)).toContain('An error occurred');
    });
  });

  describe('bot.catch handler', () => {
    it('logs the error and replies to the user', () => {
      start();
      const ctx = makeCtx();
      catchHandler(new Error('boom'), ctx);
      expect(console.error).toHaveBeenCalledWith(
        'Telegram bot error:',
        expect.any(Error)
      );
      expect(ctx.reply).toHaveBeenCalled();
    });
  });

  describe('stopTelegramBot', () => {
    it('stops a running bot and is a no-op otherwise', () => {
      start();
      stopTelegramBot();
      expect(botStop).toHaveBeenCalled();
      // Second call hits the falsy branch without throwing.
      expect(() => stopTelegramBot()).not.toThrow();
      expect(botStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendTelegramMessage', () => {
    it('returns false when the bot is not running', async () => {
      // No bot started in this test.
      const result = await sendTelegramMessage('123', 'hi');
      expect(result).toBe(false);
      expect(telegramSendMessage).not.toHaveBeenCalled();
    });

    it('sends the message and returns true when running', async () => {
      start();
      const result = await sendTelegramMessage('123', 'hi');
      expect(result).toBe(true);
      expect(telegramSendMessage).toHaveBeenCalledWith('123', 'hi');
    });

    it('returns false when sending fails', async () => {
      start();
      telegramSendMessage.mockImplementationOnce(() =>
        Promise.reject(new Error('send failed'))
      );
      const result = await sendTelegramMessage('123', 'hi');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Telegram message:',
        expect.any(Error)
      );
    });
  });
});
