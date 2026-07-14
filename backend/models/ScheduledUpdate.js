import mongoose from 'mongoose';
import { zonedWallClockToUtc, partsInZone, addDays } from '../utils/timezone.js';

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

// Calculate the next run time, interpreting scheduledTime in the schedule's
// timezone (not the server's) and returning a UTC instant.
scheduledUpdateSchema.methods.calculateNextRun = function () {
  const now = new Date();
  const tz = this.timezone || 'UTC';
  const [hours, minutes] = this.scheduledTime.split(':').map(Number);
  const nowParts = partsInZone(now, tz);

  // Build a UTC instant for the given wall-clock date at the scheduled time.
  const at = ({ year, month, day }) =>
    zonedWallClockToUtc({ year, month, day, hour: hours, minute: minutes }, tz);

  switch (this.scheduleType) {
    case 'once': {
      const base = this.scheduledDate
        ? partsInZone(new Date(this.scheduledDate), tz)
        : nowParts;
      return at(base);
    }

    case 'daily': {
      let next = at(nowParts);
      if (next <= now) {
        next = at(addDays(nowParts, 1));
      }
      return next;
    }

    case 'weekly': {
      const targetDay = this.dayOfWeek ?? nowParts.weekday;
      let daysUntil = targetDay - nowParts.weekday;
      if (daysUntil < 0) daysUntil += 7;
      let next = at(addDays(nowParts, daysUntil));
      // Same day but the time already passed -> next week.
      if (next <= now) {
        next = at(addDays(nowParts, daysUntil + 7));
      }
      return next;
    }

    case 'monthly': {
      const dom = this.dayOfMonth ?? nowParts.day;
      let next = at({ year: nowParts.year, month: nowParts.month, day: dom });
      if (next <= now) {
        // month + 1 overflows into the next year correctly via Date.UTC.
        next = at({ year: nowParts.year, month: nowParts.month + 1, day: dom });
      }
      return next;
    }

    default:
      return at(nowParts);
  }
};

const ScheduledUpdate = mongoose.model('ScheduledUpdate', scheduledUpdateSchema);

export default ScheduledUpdate;
