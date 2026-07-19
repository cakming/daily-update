import { describe, it, expect, beforeEach, jest } from '@jest/globals';

let prefs = null;
let foundUser = null;
let populatedUpdate = null;
let quietOk = true;

const sendTelegram = jest.fn().mockResolvedValue(true);
const sendDailyGChat = jest.fn().mockResolvedValue(true);
const sendWeeklyGChat = jest.fn().mockResolvedValue(true);
const sendDailySlack = jest.fn().mockResolvedValue(true);
const sendWeeklySlack = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule('../../../models/NotificationPreference.js', () => ({
  default: { findOne: () => Promise.resolve(prefs) },
}));
jest.unstable_mockModule('../../../models/User.js', () => ({
  default: { findById: () => ({ select: () => Promise.resolve(foundUser) }) },
}));
jest.unstable_mockModule('../../../models/Update.js', () => ({
  default: {
    findById: () => ({ populate: () => ({ populate: () => Promise.resolve(populatedUpdate) }) }),
  },
}));
jest.unstable_mockModule('../../../services/telegramBot.js', () => ({
  sendUpdateToTelegram: sendTelegram,
}));
jest.unstable_mockModule('../../../services/googleChat.js', () => ({
  sendDailyUpdateToGoogleChat: sendDailyGChat,
  sendWeeklySummaryToGoogleChat: sendWeeklyGChat,
}));
jest.unstable_mockModule('../../../services/slack.js', () => ({
  sendDailyUpdateToSlack: sendDailySlack,
  sendWeeklySummaryToSlack: sendWeeklySlack,
}));
jest.unstable_mockModule('../../../services/updateFormatter.js', () => ({
  getSummaryMode: jest.fn(() => Promise.resolve('full')),
}));
jest.unstable_mockModule('../../../controllers/notificationPreferenceController.js', () => ({
  shouldSendNotification: jest.fn(() => Promise.resolve(quietOk)),
}));

const { dispatchOnCreate, dispatchToChannels } = await import(
  '../../../services/notificationDispatcher.js'
);

describe('dispatchOnCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    prefs = { botNotifications: { sendOnCreate: true, telegram: true, googleChat: true, slack: true } };
    foundUser = { _id: 'u1', name: 'Alice', telegramId: '123', googleChatWebhook: 'gc', slackWebhook: 'sl' };
    populatedUpdate = { _id: 'up1', type: 'daily', formattedOutput: 'body', companyId: { name: 'Acme' }, tags: [] };
    quietOk = true;
  });

  it('pushes to every linked channel when sendOnCreate is on', async () => {
    await dispatchOnCreate('u1', { _id: 'up1' });
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendDailyGChat).toHaveBeenCalledTimes(1);
    expect(sendDailySlack).toHaveBeenCalledTimes(1);
  });

  it('does nothing when sendOnCreate is off', async () => {
    prefs = { botNotifications: { sendOnCreate: false } };
    await dispatchOnCreate('u1', { _id: 'up1' });
    expect(sendTelegram).not.toHaveBeenCalled();
    expect(sendDailyGChat).not.toHaveBeenCalled();
    expect(sendDailySlack).not.toHaveBeenCalled();
  });

  it('does nothing during quiet hours', async () => {
    quietOk = false;
    await dispatchOnCreate('u1', { _id: 'up1' });
    expect(sendTelegram).not.toHaveBeenCalled();
  });

  it('uses the weekly senders and skips unlinked channels', async () => {
    populatedUpdate = {
      _id: 'up1', type: 'weekly', formattedOutput: 'w',
      companyId: null, tags: [], dateRange: {}, dailyUpdates: [],
    };
    foundUser = { _id: 'u1', name: 'Alice', slackWebhook: 'sl' }; // only Slack linked
    await dispatchOnCreate('u1', { _id: 'up1' });
    expect(sendWeeklySlack).toHaveBeenCalledTimes(1);
    expect(sendTelegram).not.toHaveBeenCalled();
    expect(sendWeeklyGChat).not.toHaveBeenCalled();
  });

  it('respects a per-channel toggle (googleChat disabled)', async () => {
    prefs = { botNotifications: { sendOnCreate: true, telegram: true, googleChat: false, slack: true } };
    await dispatchOnCreate('u1', { _id: 'up1' });
    expect(sendDailyGChat).not.toHaveBeenCalled();
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendDailySlack).toHaveBeenCalledTimes(1);
  });

  it('never throws when a send fails', async () => {
    sendDailySlack.mockRejectedValueOnce(new Error('boom'));
    await expect(dispatchOnCreate('u1', { _id: 'up1' })).resolves.toBeUndefined();
  });

  describe('dispatchToChannels', () => {
    it('sends only to the explicitly selected, linked channels', async () => {
      await dispatchToChannels('u1', { _id: 'up1' }, { telegram: true, googleChat: false, slack: true });
      expect(sendTelegram).toHaveBeenCalledTimes(1);
      expect(sendDailyGChat).not.toHaveBeenCalled();
      expect(sendDailySlack).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when no channels are selected', async () => {
      await dispatchToChannels('u1', { _id: 'up1' }, { telegram: false, googleChat: false, slack: false });
      expect(sendTelegram).not.toHaveBeenCalled();
    });

    it('skips a selected channel the user has not linked', async () => {
      foundUser = { _id: 'u1', name: 'Alice', telegramId: '123' }; // no gchat/slack webhooks
      await dispatchToChannels('u1', { _id: 'up1' }, { telegram: true, googleChat: true, slack: true });
      expect(sendTelegram).toHaveBeenCalledTimes(1);
      expect(sendDailyGChat).not.toHaveBeenCalled();
      expect(sendDailySlack).not.toHaveBeenCalled();
    });
  });
});
