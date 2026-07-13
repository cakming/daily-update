import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Unit tests for services/scheduler.js
 *
 * All heavy external dependencies (node-cron, the mongoose models and the
 * email transport) are mocked with jest.unstable_mockModule BEFORE the service
 * is dynamically imported. No real cron jobs, database access or network calls
 * happen. The cron callback is captured so the scheduled-run body can be
 * invoked directly to exercise success / partial / failure branches.
 */

// ---------------------------------------------------------------------------
// node-cron mock — capture the schedule expression and the callback.
// ---------------------------------------------------------------------------
let cronExpr = null;
let cronCallback = null;
const cronStop = jest.fn();
const cronSchedule = jest.fn((expr, cb) => {
  cronExpr = expr;
  cronCallback = cb;
  return { stop: cronStop };
});
jest.unstable_mockModule('node-cron', () => ({
  default: { schedule: cronSchedule },
}));

// ---------------------------------------------------------------------------
// ScheduledUpdate model mock — only the static find(...) is used.
// ---------------------------------------------------------------------------
let dueUpdates = [];
let findShouldReject = false;
const scheduledFind = jest.fn(() => {
  const finalPopulate = () =>
    findShouldReject
      ? Promise.reject(new Error('find failed'))
      : Promise.resolve(dueUpdates);
  return { populate: () => ({ populate: finalPopulate }) };
});
jest.unstable_mockModule('../../../models/ScheduledUpdate.js', () => ({
  default: { find: scheduledFind },
}));

// ---------------------------------------------------------------------------
// Update model mock — used both as `DailyUpdate` and `WeeklyUpdate`
// (the source imports the same file twice). Acts as a constructor with a
// static find(...).select(...).
// ---------------------------------------------------------------------------
let updateSaveShouldReject = false;
let updateCount = 0;
function MockUpdate(data) {
  Object.assign(this, data);
  updateCount += 1;
  this._id = `update-${updateCount}`;
  this.save = jest.fn(() =>
    updateSaveShouldReject
      ? Promise.reject(new Error('save failed'))
      : Promise.resolve(this)
  );
  this.populate = jest.fn(() => Promise.resolve(this));
}
MockUpdate.find = jest.fn(() => ({
  select: jest.fn(() => Promise.resolve([{ _id: 'daily-1' }, { _id: 'daily-2' }])),
}));
jest.unstable_mockModule('../../../models/Update.js', () => ({
  default: MockUpdate,
}));

// ---------------------------------------------------------------------------
// ScheduleHistory model mock — constructor + save, instances captured.
// ---------------------------------------------------------------------------
let historyEntries = [];
let historySaveShouldReject = false;
function MockHistory(data) {
  Object.assign(this, data);
  historyEntries.push(this);
  this.save = jest.fn(() =>
    historySaveShouldReject
      ? Promise.reject(new Error('history save failed'))
      : Promise.resolve(this)
  );
}
jest.unstable_mockModule('../../../models/ScheduleHistory.js', () => ({
  default: MockHistory,
}));

// ---------------------------------------------------------------------------
// User model mock — findById used inside sendScheduledEmail.
// ---------------------------------------------------------------------------
let foundUser = { _id: 'user1', name: 'Test User', email: 'user@example.com' };
const userFindById = jest.fn(() => Promise.resolve(foundUser));
jest.unstable_mockModule('../../../models/User.js', () => ({
  default: { findById: userFindById },
}));

// ---------------------------------------------------------------------------
// Email config mock.
// ---------------------------------------------------------------------------
let transporterNull = false;
let sendMailShouldReject = false;
const sendMail = jest.fn(() =>
  sendMailShouldReject
    ? Promise.reject(new Error('smtp failed'))
    : Promise.resolve({ messageId: 'x' })
);
const getTransporter = jest.fn(() => (transporterNull ? null : { sendMail }));
const emailTemplates = {
  dailyUpdate: jest.fn(() => ({ subject: 's', text: 't', html: 'h' })),
  weeklySummary: jest.fn(() => ({ subject: 's', text: 't', html: 'h' })),
};
jest.unstable_mockModule('../../../config/email.js', () => ({
  getTransporter,
  emailTemplates,
}));

// ---------------------------------------------------------------------------
// Import the service under test AFTER all mocks are registered.
// ---------------------------------------------------------------------------
const { startScheduler, stopScheduler } = await import(
  '../../../services/scheduler.js'
);

// Flush pending microtasks (the cron callback fires processScheduledUpdates
// without awaiting it). One macrotask boundary drains the mocked promise chain.
const flush = async () => {
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
};

function makeScheduled(overrides = {}) {
  const s = {
    _id: 'sched-1',
    userId: 'user1',
    type: 'daily',
    company: { _id: 'comp1', name: 'Acme' },
    tags: [{ _id: 'tag1' }],
    content: 'Some content',
    scheduleType: 'daily',
    scheduledTime: '09:00',
    recipients: ['recipient@example.com'],
    sendEmail: false,
    isActive: true,
    calculateNextRun: jest.fn(() => new Date('2030-01-01T00:00:00Z')),
    ...overrides,
  };
  s.save = jest.fn(() => Promise.resolve(s));
  return s;
}

describe('Scheduler Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    cronExpr = null;
    cronCallback = null;
    dueUpdates = [];
    findShouldReject = false;
    updateSaveShouldReject = false;
    historyEntries = [];
    historySaveShouldReject = false;
    foundUser = { _id: 'user1', name: 'Test User', email: 'user@example.com' };
    transporterNull = false;
    sendMailShouldReject = false;
  });

  afterEach(() => {
    stopScheduler();
    jest.restoreAllMocks();
  });

  describe('startScheduler / stopScheduler', () => {
    it('schedules the cron job every 5 minutes and runs once on startup', async () => {
      startScheduler();
      await flush();

      expect(cronSchedule).toHaveBeenCalledTimes(1);
      expect(cronExpr).toBe('*/5 * * * *');
      // Ran once immediately on startup.
      expect(scheduledFind).toHaveBeenCalled();
    });

    it('does not start a second job if already running', () => {
      startScheduler();
      startScheduler();
      expect(cronSchedule).toHaveBeenCalledTimes(1);
    });

    it('stops the running job and is a no-op when not running', () => {
      startScheduler();
      stopScheduler();
      expect(cronStop).toHaveBeenCalledTimes(1);
      // Second stop hits the falsy branch without throwing.
      expect(() => stopScheduler()).not.toThrow();
      expect(cronStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduled run (cron callback body)', () => {
    // Start the scheduler with NO due work (so the startup run is a no-op),
    // then set up the due updates and invoke the captured cron callback so the
    // assertions observe exactly one processing run.
    async function runCallback(updates) {
      dueUpdates = [];
      startScheduler();
      await flush();

      dueUpdates = updates;
      historyEntries = [];
      sendMail.mockClear();
      getTransporter.mockClear();
      emailTemplates.dailyUpdate.mockClear();
      emailTemplates.weeklySummary.mockClear();
      MockUpdate.find.mockClear();

      cronCallback();
      await flush();
    }

    it('processes a due daily update successfully and sends email', async () => {
      const sched = makeScheduled({ type: 'daily', sendEmail: true });

      await runCallback([sched]);

      expect(historyEntries).toHaveLength(1);
      const h = historyEntries[0];
      expect(h.status).toBe('success');
      expect(h.updateModel).toBe('DailyUpdate');
      expect(h.emailSent).toBe(true);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(emailTemplates.dailyUpdate).toHaveBeenCalled();
      // Recurring schedule -> next run recomputed, still active.
      expect(sched.calculateNextRun).toHaveBeenCalled();
      expect(sched.isActive).toBe(true);
      expect(sched.save).toHaveBeenCalled();
    });

    it('processes a weekly one-time update, deactivates it, uses weekly template', async () => {
      const sched = makeScheduled({
        type: 'weekly',
        scheduleType: 'once',
        sendEmail: true,
      });

      await runCallback([sched]);

      expect(MockUpdate.find).toHaveBeenCalled(); // gathered daily updates for the period
      const h = historyEntries[0];
      expect(h.status).toBe('success');
      expect(h.updateModel).toBe('WeeklyUpdate');
      expect(emailTemplates.weeklySummary).toHaveBeenCalled();
      // One-time schedule is deactivated instead of rescheduled.
      expect(sched.isActive).toBe(false);
      expect(sched.calculateNextRun).not.toHaveBeenCalled();
    });

    it('records a partial run when the email send fails', async () => {
      // sendScheduledEmail reports 'failed' on an SMTP error, so the update was
      // created but the email did not go out: status is "partial" and emailSent
      // reflects reality (false).
      sendMailShouldReject = true;
      const sched = makeScheduled({ type: 'daily', sendEmail: true });

      await runCallback([sched]);

      expect(sendMail).toHaveBeenCalled();
      const h = historyEntries[0];
      expect(h.status).toBe('partial');
      expect(h.emailSent).toBe(false);
    });

    it('skips email gracefully when no transporter is configured', async () => {
      transporterNull = true;
      const sched = makeScheduled({ type: 'daily', sendEmail: true });

      await runCallback([sched]);

      expect(getTransporter).toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(historyEntries[0].status).toBe('success');
    });

    it('skips email gracefully when the user is not found', async () => {
      foundUser = null;
      const sched = makeScheduled({ type: 'daily', sendEmail: true });

      await runCallback([sched]);

      expect(sendMail).not.toHaveBeenCalled();
      expect(historyEntries[0].status).toBe('success');
    });

    it('does not send email when sendEmail is disabled', async () => {
      const sched = makeScheduled({ type: 'daily', sendEmail: false });

      await runCallback([sched]);

      expect(getTransporter).not.toHaveBeenCalled();
      expect(historyEntries[0].status).toBe('success');
    });

    it('records a failed history entry when update creation throws', async () => {
      updateSaveShouldReject = true;
      const sched = makeScheduled({ type: 'daily' });

      await runCallback([sched]);

      expect(historyEntries).toHaveLength(1);
      const h = historyEntries[0];
      expect(h.status).toBe('failed');
      expect(h.error).toBeDefined();
      expect(h.error.message).toBe('save failed');
      // The per-update error is caught by processScheduledUpdates.
      expect(console.error).toHaveBeenCalled();
    });

    it('handles a top-level error while querying due updates', async () => {
      findShouldReject = true;

      await runCallback([]);

      expect(historyEntries).toHaveLength(0);
      expect(console.error).toHaveBeenCalledWith(
        'Error in processScheduledUpdates:',
        expect.any(Error)
      );
    });

    it('processes multiple due updates', async () => {
      await runCallback([
        makeScheduled({ _id: 'a', type: 'daily' }),
        makeScheduled({ _id: 'b', type: 'daily' }),
      ]);

      expect(historyEntries).toHaveLength(2);
    });
  });
});
