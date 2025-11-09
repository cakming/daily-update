import mongoose from 'mongoose';

/**
 * Notification Preference Schema
 * Stores user preferences for different types of notifications
 */
const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Email notifications
    emailNotifications: {
      enabled: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
      updateReminders: { type: Boolean, default: true },
    },
    // In-app notifications
    inAppNotifications: {
      enabled: { type: Boolean, default: true },
      systemNotifications: { type: Boolean, default: true },
      updateNotifications: { type: Boolean, default: true },
      reminderNotifications: { type: Boolean, default: true },
      achievementNotifications: { type: Boolean, default: true },
    },
    // Bot notifications (Telegram/Google Chat)
    botNotifications: {
      telegram: { type: Boolean, default: true },
      googleChat: { type: Boolean, default: true },
      sendOnCreate: { type: Boolean, default: false },
      sendDailySummary: { type: Boolean, default: false },
      sendWeeklySummary: { type: Boolean, default: true },
    },
    // Quiet hours (when not to send notifications)
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' }, // Format: "HH:MM"
      endTime: { type: String, default: '08:00' },
      timezone: { type: String, default: 'UTC' },
    },
  },
  {
    timestamps: true,
  }
);

const NotificationPreference = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);

export default NotificationPreference;
