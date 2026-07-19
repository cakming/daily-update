import User from '../models/User.js';
import Update from '../models/Update.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { sendUpdateToTelegram } from './telegramBot.js';
import { sendDailyUpdateToGoogleChat, sendWeeklySummaryToGoogleChat } from './googleChat.js';
import { sendDailyUpdateToSlack, sendWeeklySummaryToSlack } from './slack.js';
import { getSummaryMode } from './updateFormatter.js';
import { shouldSendNotification } from '../controllers/notificationPreferenceController.js';

/**
 * Push an update to an explicit set of bot channels. Each channel fires only if
 * the user has it linked. Fire-and-forget: never throws.
 *
 * @param {string} userId
 * @param {object} update - a saved Update (refs may be unpopulated)
 * @param {{telegram?:boolean, googleChat?:boolean, slack?:boolean}} channels
 */
export const dispatchToChannels = async (userId, update, channels) => {
  try {
    if (!channels || !(channels.telegram || channels.googleChat || channels.slack)) return;

    const user = await User.findById(userId).select('+googleChatWebhook +slackWebhook');
    if (!user) return;

    // Populate refs so the formatter can read company/tag names.
    const populated = await Update.findById(update._id)
      .populate('companyId', 'name')
      .populate('tags', 'name');
    if (!populated) return;

    const isDaily = populated.type === 'daily';
    const opts = { summaryMode: await getSummaryMode(userId) };
    const tasks = [];

    if (channels.telegram && user.telegramId) {
      tasks.push(sendUpdateToTelegram(user.telegramId, populated, opts));
    }
    if (channels.googleChat && user.googleChatWebhook) {
      tasks.push(
        isDaily
          ? sendDailyUpdateToGoogleChat(user.googleChatWebhook, populated, user, opts)
          : sendWeeklySummaryToGoogleChat(user.googleChatWebhook, populated, user, opts)
      );
    }
    if (channels.slack && user.slackWebhook) {
      tasks.push(
        isDaily
          ? sendDailyUpdateToSlack(user.slackWebhook, populated, user, opts)
          : sendWeeklySummaryToSlack(user.slackWebhook, populated, user, opts)
      );
    }

    await Promise.allSettled(tasks);
  } catch (error) {
    console.error('dispatchToChannels error:', error);
  }
};

/**
 * Push a freshly-created update to the user's linked bot channels when
 * botNotifications.sendOnCreate is enabled, respecting quiet hours and the
 * per-channel toggles. Fire-and-forget.
 */
export const dispatchOnCreate = async (userId, update) => {
  try {
    const prefs = await NotificationPreference.findOne({ userId });
    if (!prefs?.botNotifications?.sendOnCreate) return;

    // Quiet hours suppress automatic sends (manual sends bypass this).
    if (!(await shouldSendNotification(userId))) return;

    const bot = prefs.botNotifications;
    await dispatchToChannels(userId, update, {
      telegram: bot.telegram !== false,
      googleChat: bot.googleChat !== false,
      slack: bot.slack !== false,
    });
  } catch (error) {
    console.error('dispatchOnCreate error:', error);
  }
};

export default { dispatchToChannels, dispatchOnCreate };
