import cron from 'node-cron';
import { subDays } from 'date-fns';
import NotificationPreference from '../models/NotificationPreference.js';
import User from '../models/User.js';
import Update from '../models/Update.js';
import { getTransporter, emailTemplates } from '../config/email.js';
import { getSummaryMode } from './updateFormatter.js';
import { shouldSendNotification } from '../controllers/notificationPreferenceController.js';

/**
 * Send a digest email to every user who has the matching digest flag enabled
 * and has updates in the window. Honors quiet hours and summaryMode. Never
 * throws — returns a { sent, skipped } tally.
 *
 * @param {'daily'|'weekly'} period
 */
export const runDigests = async (period) => {
  const flag =
    period === 'daily'
      ? 'emailNotifications.dailyDigest'
      : 'emailNotifications.weeklyDigest';
  const since = subDays(new Date(), period === 'daily' ? 1 : 7);

  let sent = 0;
  let skipped = 0;

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { sent: 0, skipped: 0 };
    }

    const prefs = await NotificationPreference.find({
      'emailNotifications.enabled': true,
      [flag]: true,
    });

    for (const pref of prefs) {
      try {
        if (!(await shouldSendNotification(pref.userId))) {
          skipped++;
          continue;
        }

        const user = await User.findById(pref.userId);
        if (!user?.email) {
          skipped++;
          continue;
        }

        const updates = await Update.find({
          userId: pref.userId,
          createdAt: { $gte: since },
        })
          .populate('companyId', 'name')
          .sort({ createdAt: -1 });

        if (updates.length === 0) {
          skipped++;
          continue;
        }

        const summaryMode = await getSummaryMode(pref.userId);
        const content = emailTemplates.digest(period, updates, user, { summaryMode });

        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'Daily Update'}" <${
            process.env.EMAIL_FROM || process.env.EMAIL_USER
          }>`,
          to: user.email,
          subject: content.subject,
          text: content.text,
          html: content.html,
        });
        sent++;
      } catch (error) {
        console.error(`Digest send error for user ${pref.userId}:`, error);
        skipped++;
      }
    }
  } catch (error) {
    console.error('runDigests error:', error);
  }

  return { sent, skipped };
};

let dailyJob = null;
let weeklyJob = null;

/**
 * Schedule the digest jobs: daily at 08:00, weekly on Monday at 08:00 (server
 * time). No-op if already started.
 */
export const startDigestScheduler = () => {
  if (dailyJob) return;
  dailyJob = cron.schedule('0 8 * * *', () => {
    runDigests('daily').catch((e) => console.error('Daily digest run failed:', e));
  });
  weeklyJob = cron.schedule('0 8 * * 1', () => {
    runDigests('weekly').catch((e) => console.error('Weekly digest run failed:', e));
  });
  console.log('Digest scheduler started (daily 08:00, weekly Mon 08:00)');
};

export const stopDigestScheduler = () => {
  if (dailyJob) {
    dailyJob.stop();
    dailyJob = null;
  }
  if (weeklyJob) {
    weeklyJob.stop();
    weeklyJob = null;
  }
};

export default { runDigests, startDigestScheduler, stopDigestScheduler };
