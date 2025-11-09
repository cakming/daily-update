import mongoose from 'mongoose';

/**
 * Schedule History Schema
 * Tracks execution history of scheduled updates
 */
const scheduleHistorySchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledUpdate',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    executedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      required: true,
      index: true,
    },
    updateType: {
      type: String,
      enum: ['daily', 'weekly'],
      required: true,
    },
    createdUpdateId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'updateModel',
    },
    updateModel: {
      type: String,
      enum: ['DailyUpdate', 'WeeklyUpdate'],
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailRecipients: [String],
    executionTimeMs: {
      type: Number, // Execution time in milliseconds
    },
    error: {
      message: String,
      stack: String,
    },
    metadata: {
      scheduleType: String,
      companyId: mongoose.Schema.Types.ObjectId,
      tagsCount: Number,
      contentLength: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
scheduleHistorySchema.index({ scheduleId: 1, executedAt: -1 });
scheduleHistorySchema.index({ userId: 1, status: 1, executedAt: -1 });
scheduleHistorySchema.index({ executedAt: -1 });

// Auto-delete old history after 90 days (optional cleanup)
scheduleHistorySchema.index({ executedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const ScheduleHistory = mongoose.model('ScheduleHistory', scheduleHistorySchema);

export default ScheduleHistory;
