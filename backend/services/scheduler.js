import cron from 'node-cron';
import ScheduledUpdate from '../models/ScheduledUpdate.js';
import ScheduleHistory from '../models/ScheduleHistory.js';
import DailyUpdate from '../models/Update.js';
import WeeklyUpdate from '../models/Update.js';
import User from '../models/User.js';
import { getTransporter, emailTemplates } from '../config/email.js';
import { processDailyUpdate, processWeeklyUpdate } from './claudeService.js';
import { getSummaryMode } from './updateFormatter.js';
import { shouldSendNotification } from '../controllers/notificationPreferenceController.js';
import { dispatchToChannels } from './notificationDispatcher.js';
import { subDays } from 'date-fns';

/**
 * Scheduler Service
 * Handles scheduled update creation and execution
 */

let schedulerTask = null;

/**
 * Process scheduled updates that are due
 */
const processScheduledUpdates = async () => {
  try {
    const now = new Date();

    // Find all active scheduled updates that are due
    const dueUpdates = await ScheduledUpdate.find({
      isActive: true,
      nextRun: { $lte: now },
    })
      .populate('company')
      .populate('tags');

    console.log(`Found ${dueUpdates.length} scheduled updates to process`);

    for (const scheduled of dueUpdates) {
      try {
        await executeScheduledUpdate(scheduled);
      } catch (error) {
        console.error(`Error executing scheduled update ${scheduled._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in processScheduledUpdates:', error);
  }
};

/**
 * Execute a single scheduled update
 */
const executeScheduledUpdate = async (scheduled) => {
  const startTime = Date.now();
  let historyEntry = null;
  let createdUpdate = null;
  let emailSent = false;
  let status = 'success';
  let error = null;

  try {
    console.log(`Executing scheduled update ${scheduled._id} (${scheduled.type})`);

    if (scheduled.type === 'daily') {
      // Generate and create a daily update via the same AI pipeline the
      // daily-update controller uses, matching the Update schema.
      const date = new Date();
      const { formattedOutput, sections, aiSummary } = await processDailyUpdate(
        scheduled.content,
        date
      );

      const dailyUpdate = new DailyUpdate({
        userId: scheduled.userId,
        type: 'daily',
        date,
        companyId: scheduled.company?._id,
        tags: scheduled.tags?.map((tag) => tag._id) || [],
        rawInput: scheduled.content,
        formattedOutput,
        aiSummary,
        sections,
      });

      createdUpdate = await dailyUpdate.save();
      await createdUpdate.populate(['companyId', 'tags']);

      console.log(`Created daily update ${createdUpdate._id}`);
    } else if (scheduled.type === 'weekly') {
      // Create weekly update
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      // Gather the week's daily updates (need date + rawInput to summarize).
      const dailyQuery = {
        userId: scheduled.userId,
        type: 'daily',
        date: { $gte: startDate, $lte: endDate },
      };
      if (scheduled.company?._id) {
        dailyQuery.companyId = scheduled.company._id;
      }
      const weekDailies = await DailyUpdate.find(dailyQuery).sort({ date: 1 });

      // Summarize the week's dailies, or fall back to the schedule's own
      // content template when there are none.
      const source =
        weekDailies.length > 0
          ? weekDailies
          : [{ rawInput: scheduled.content, date: startDate }];
      const { formattedOutput, sections, aiSummary } = await processWeeklyUpdate(
        source,
        startDate,
        endDate
      );

      const weeklyUpdate = new WeeklyUpdate({
        userId: scheduled.userId,
        type: 'weekly',
        dateRange: { start: startDate, end: endDate },
        companyId: scheduled.company?._id,
        tags: scheduled.tags?.map((tag) => tag._id) || [],
        rawInput: scheduled.content,
        formattedOutput,
        aiSummary,
        sections,
        dailyUpdates: weekDailies.map((du) => du._id),
      });

      createdUpdate = await weeklyUpdate.save();
      await createdUpdate.populate(['companyId', 'tags']);

      console.log(`Created weekly update ${createdUpdate._id}`);
    }

    // Send email if enabled. sendScheduledEmail reports its own outcome
    // ('sent' | 'skipped' | 'failed') instead of throwing on an SMTP error, so a
    // failed send is recorded as a "partial" run (update created, email failed)
    // while a graceful skip (not configured / no user) stays "success".
    if (scheduled.sendEmail && scheduled.recipients && scheduled.recipients.length > 0 && createdUpdate) {
      const emailResult = await sendScheduledEmail(scheduled, createdUpdate);
      emailSent = emailResult === 'sent';
      if (emailResult === 'failed') {
        status = 'partial'; // Update created but email failed
      }
    }

    // Deliver to the schedule's chosen bot channels (quiet hours suppress
    // automatic sends). Each channel fires only if the user has it linked.
    const ch = scheduled.channels;
    if (createdUpdate && ch && (ch.telegram || ch.googleChat || ch.slack)) {
      if (await shouldSendNotification(scheduled.userId)) {
        await dispatchToChannels(scheduled.userId, createdUpdate, {
          telegram: ch.telegram,
          googleChat: ch.googleChat,
          slack: ch.slack,
        });
      }
    }

    // Update schedule
    scheduled.lastRun = new Date();

    if (scheduled.scheduleType === 'once') {
      // Deactivate one-time schedules after execution
      scheduled.isActive = false;
    } else {
      // Calculate next run for recurring schedules
      scheduled.nextRun = scheduled.calculateNextRun();
    }

    await scheduled.save();

    console.log(`Scheduled update ${scheduled._id} executed successfully`);
  } catch (err) {
    console.error(`Error executing scheduled update ${scheduled._id}:`, err);
    status = 'failed';
    error = {
      message: err.message,
      stack: err.stack,
    };
  } finally {
    // Log execution to history
    const executionTime = Date.now() - startTime;

    historyEntry = new ScheduleHistory({
      scheduleId: scheduled._id,
      userId: scheduled.userId,
      executedAt: new Date(),
      status,
      updateType: scheduled.type,
      createdUpdateId: createdUpdate?._id,
      updateModel: scheduled.type === 'daily' ? 'DailyUpdate' : 'WeeklyUpdate',
      emailSent,
      emailRecipients: scheduled.sendEmail ? scheduled.recipients : [],
      executionTimeMs: executionTime,
      error,
      metadata: {
        scheduleType: scheduled.scheduleType,
        companyId: scheduled.company?._id,
        tagsCount: scheduled.tags?.length || 0,
        contentLength: scheduled.content?.length || 0,
      },
    });

    await historyEntry.save();

    if (status === 'failed') {
      throw new Error(error.message);
    }
  }
};

/**
 * Send email for scheduled update
 */
// Returns the send outcome so the caller can distinguish a genuine send
// failure ('failed' -> partial run) from an intentional skip ('skipped' ->
// still a success) or a successful send ('sent').
const sendScheduledEmail = async (scheduled, update) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured, skipping email send');
    return 'skipped';
  }

  // Respect quiet hours for automatic (scheduled) sends.
  if (!(await shouldSendNotification(scheduled.userId))) {
    console.log('Within quiet hours, skipping scheduled email');
    return 'skipped';
  }

  // Get user
  const user = await User.findById(scheduled.userId);
  if (!user) {
    console.log('User not found, skipping email send');
    return 'skipped';
  }

  // Generate email content, honoring the user's summary-mode preference.
  const summaryMode = await getSummaryMode(scheduled.userId);
  const emailContent =
    scheduled.type === 'daily'
      ? emailTemplates.dailyUpdate(update, user, { summaryMode })
      : emailTemplates.weeklySummary(update, user, { summaryMode });

  try {
    // Send to all recipients
    const sendPromises = scheduled.recipients.map((recipient) =>
      transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Daily Update'}" <${
          process.env.EMAIL_FROM || process.env.EMAIL_USER
        }>`,
        to: recipient,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    );

    await Promise.all(sendPromises);

    console.log(`Email sent to ${scheduled.recipients.length} recipient(s) for scheduled update ${scheduled._id}`);
    return 'sent';
  } catch (error) {
    console.error(`Error sending scheduled email:`, error);
    return 'failed';
  }
};

/**
 * Start the scheduler
 */
export const startScheduler = () => {
  if (schedulerTask) {
    console.log('Scheduler already running');
    return;
  }

  console.log('Starting scheduler service...');

  // Run every 5 minutes
  schedulerTask = cron.schedule('*/5 * * * *', () => {
    console.log('Running scheduled task check...');
    processScheduledUpdates();
  });

  // Run once on startup
  processScheduledUpdates();

  console.log('Scheduler service started (runs every 5 minutes)');
};

/**
 * Stop the scheduler
 */
export const stopScheduler = () => {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('Scheduler service stopped');
  }
};

export default {
  startScheduler,
  stopScheduler,
};
