import mongoose from 'mongoose';

/**
 * Scheduled Update Schema
 * Stores information about scheduled daily/weekly updates
 */
const scheduledUpdateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly'],
      required: [true, 'Update type is required'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    content: {
      type: String,
      required: [true, 'Content template is required'],
      trim: true,
    },
    scheduleType: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      required: true,
      default: 'once',
    },
    scheduledTime: {
      type: String, // Format: "HH:MM" (24-hour format)
      required: [true, 'Scheduled time is required'],
    },
    scheduledDate: {
      type: Date, // For one-time schedules
    },
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday) for weekly schedules
      min: 0,
      max: 6,
    },
    dayOfMonth: {
      type: Number, // 1-31 for monthly schedules
      min: 1,
      max: 31,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastRun: {
      type: Date,
    },
    nextRun: {
      type: Date,
      index: true,
    },
    recipients: [
      {
        type: String, // Email addresses to send the update to
        trim: true,
      },
    ],
    sendEmail: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding scheduled tasks to run
scheduledUpdateSchema.index({ userId: 1, isActive: 1, nextRun: 1 });

// Calculate next run time
scheduledUpdateSchema.methods.calculateNextRun = function () {
  const now = new Date();
  const [hours, minutes] = this.scheduledTime.split(':').map(Number);

  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (this.scheduleType) {
    case 'once':
      if (this.scheduledDate) {
        nextRun = new Date(this.scheduledDate);
        nextRun.setHours(hours, minutes, 0, 0);
      }
      break;

    case 'daily':
      // If today's time has passed, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      // Find next occurrence of the specified day of week
      const targetDay = this.dayOfWeek;
      const currentDay = nextRun.getDay();
      let daysUntilTarget = targetDay - currentDay;

      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }

      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case 'monthly':
      // Set to the specified day of month
      nextRun.setDate(this.dayOfMonth);

      // If this month's date has passed, schedule for next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }

  return nextRun;
};

const ScheduledUpdate = mongoose.model('ScheduledUpdate', scheduledUpdateSchema);

export default ScheduledUpdate;
