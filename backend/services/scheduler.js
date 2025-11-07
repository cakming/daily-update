import cron from 'node-cron';
import ScheduledUpdate from '../models/ScheduledUpdate.js';
import DailyUpdate from '../models/DailyUpdate.js';
import WeeklyUpdate from '../models/WeeklyUpdate.js';
import User from '../models/User.js';
import { getTransporter, emailTemplates } from '../config/email.js';
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
  try {
    console.log(`Executing scheduled update ${scheduled._id} (${scheduled.type})`);

    let createdUpdate = null;

    if (scheduled.type === 'daily') {
      // Create daily update
      const dailyUpdate = new DailyUpdate({
        userId: scheduled.userId,
        company: scheduled.company?._id,
        content: scheduled.content,
        tags: scheduled.tags.map((tag) => tag._id),
      });

      createdUpdate = await dailyUpdate.save();
      await createdUpdate.populate(['company', 'tags']);

      console.log(`Created daily update ${createdUpdate._id}`);
    } else if (scheduled.type === 'weekly') {
      // Create weekly update
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      // Get daily updates for the period
      const dailyUpdates = await DailyUpdate.find({
        userId: scheduled.userId,
        company: scheduled.company?._id,
        createdAt: { $gte: startDate, $lte: endDate },
      }).select('_id');

      const weeklyUpdate = new WeeklyUpdate({
        userId: scheduled.userId,
        company: scheduled.company?._id,
        content: scheduled.content,
        tags: scheduled.tags.map((tag) => tag._id),
        period: {
          startDate,
          endDate,
        },
        dailyUpdates: dailyUpdates.map((du) => du._id),
      });

      createdUpdate = await weeklyUpdate.save();
      await createdUpdate.populate(['company', 'tags']);

      console.log(`Created weekly update ${createdUpdate._id}`);
    }

    // Send email if enabled
    if (scheduled.sendEmail && scheduled.recipients && scheduled.recipients.length > 0 && createdUpdate) {
      await sendScheduledEmail(scheduled, createdUpdate);
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
  } catch (error) {
    console.error(`Error executing scheduled update ${scheduled._id}:`, error);
    throw error;
  }
};

/**
 * Send email for scheduled update
 */
const sendScheduledEmail = async (scheduled, update) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('Email not configured, skipping email send');
      return;
    }

    // Get user
    const user = await User.findById(scheduled.userId);
    if (!user) {
      console.log('User not found, skipping email send');
      return;
    }

    // Generate email content
    const emailContent =
      scheduled.type === 'daily'
        ? emailTemplates.dailyUpdate(update, user)
        : emailTemplates.weeklySummary(update, user);

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
  } catch (error) {
    console.error(`Error sending scheduled email:`, error);
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
