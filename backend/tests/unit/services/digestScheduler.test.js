import { describe, it, expect, beforeEach, jest } from '@jest/globals';

let prefsList = [];
let foundUser = null;
let updatesList = [];
let quietOk = true;
let transporter = null;

jest.unstable_mockModule('node-cron', () => ({
  default: { schedule: jest.fn(() => ({ stop: jest.fn() })) },
}));
jest.unstable_mockModule('../../../models/NotificationPreference.js', () => ({
  default: { find: () => Promise.resolve(prefsList) },
}));
jest.unstable_mockModule('../../../models/User.js', () => ({
  default: { findById: () => Promise.resolve(foundUser) },
}));
jest.unstable_mockModule('../../../models/Update.js', () => ({
  default: { find: () => ({ populate: () => ({ sort: () => Promise.resolve(updatesList) }) }) },
}));
jest.unstable_mockModule('../../../config/email.js', () => ({
  getTransporter: () => transporter,
  emailTemplates: { digest: jest.fn(() => ({ subject: 'S', text: 't', html: 'h' })) },
}));
jest.unstable_mockModule('../../../services/updateFormatter.js', () => ({
  getSummaryMode: jest.fn(() => Promise.resolve('full')),
}));
jest.unstable_mockModule('../../../controllers/notificationPreferenceController.js', () => ({
  shouldSendNotification: jest.fn(() => Promise.resolve(quietOk)),
}));

const { runDigests } = await import('../../../services/digestScheduler.js');

describe('runDigests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    prefsList = [{ userId: 'u1' }];
    foundUser = { _id: 'u1', name: 'Alice', email: 'a@example.com' };
    updatesList = [
      { _id: 'up1', type: 'daily', formattedOutput: 'body', companyId: { name: 'Acme' }, tags: [] },
    ];
    quietOk = true;
    transporter = { sendMail: jest.fn().mockResolvedValue({}) };
  });

  it('sends a digest to an eligible user with updates', async () => {
    const result = await runDigests('daily');
    expect(result.sent).toBe(1);
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it('skips users with no updates in the window', async () => {
    updatesList = [];
    const result = await runDigests('daily');
    expect(result).toEqual({ sent: 0, skipped: 1 });
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('skips during quiet hours', async () => {
    quietOk = false;
    const result = await runDigests('weekly');
    expect(result.sent).toBe(0);
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('does nothing when email is not configured', async () => {
    transporter = null;
    const result = await runDigests('daily');
    expect(result).toEqual({ sent: 0, skipped: 0 });
  });
});
