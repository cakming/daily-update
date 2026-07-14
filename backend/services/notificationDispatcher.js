import User from '../models/User.js';
import Update from '../models/Update.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { sendUpdateToTelegram } from './telegramBot.js';
import { sendDailyUpdateToGoogleChat, sendWeeklySummaryToGoogleChat } from './googleChat.js';
import { sendDailyUpdateToSlack, sendWeeklySummaryToSlack } from './slack.js';
import { getSummaryMode } from './updateFormatter.js';
import { shouldSendNotification } from '../controllers/notificationPreferenceController.js';

/**
 * Push a freshly-created update to the user's linked bot channels when
 * botNotifications.sendOnCreate is enabled, respecting quiet hours and the
 * per-channel toggles. Fire-and-forget: this never throws, so it can't fail the
 * update that triggered it.
 */
export const dispatchOnCreate = async (userId, update) => {
  try {
    const prefs = await NotificationPreference.findOne({ userId });
    if (!prefs?.botNotifications?.sendOnCreate) return;

    // Quiet hours suppress automatic sends (manual sends bypass this).
    if (!(await shouldSendNotification(userId))) return;

    const user = await User.findById(userId).select('+googleChatWebhook +slackWebhook');
    if (!user) return;

    // The created doc has unpopulated refs; populate so the formatter can read
    // the company name and tag names.
    const populated = await Update.findById(update._id)
      .populate('companyId', 'name')
      .populate('tags', 'name');
    if (!populated) return;

    const isDaily = populated.type === 'daily';
    const opts = { summaryMode: await getSummaryMode(userId) };
    const bot = prefs.botNotifications;
    const tasks = [];

    if (user.telegramId && bot.telegram !== false) {
      tasks.push(sendUpdateToTelegram(user.telegramId, populated, opts));
    }
    if (user.googleChatWebhook && bot.googleChat !== false) {
      tasks.push(
        isDaily
          ? sendDailyUpdateToGoogleChat(user.googleChatWebhook, populated, user, opts)
          : sendWeeklySummaryToGoogleChat(user.googleChatWebhook, populated, user, opts)
      );
    }
    if (user.slackWebhook && bot.slack !== false) {
      tasks.push(
        isDaily
          ? sendDailyUpdateToSlack(user.slackWebhook, populated, user, opts)
          : sendWeeklySummaryToSlack(user.slackWebhook, populated, user, opts)
      );
    }

    await Promise.allSettled(tasks);
  } catch (error) {
    console.error('dispatchOnCreate error:', error);
  }
};

export default { dispatchOnCreate };
