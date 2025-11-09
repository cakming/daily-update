import NotificationPreference from '../models/NotificationPreference.js';

/**
 * Notification Preference Controller
 * Handles user notification preference management
 */

/**
 * @route   GET /api/notification-preferences
 * @desc    Get user's notification preferences
 * @access  Private
 */
export const getPreferences = async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.user._id });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId: req.user._id });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/notification-preferences
 * @desc    Update user's notification preferences
 * @access  Private
 */
export const updatePreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      inAppNotifications,
      botNotifications,
      quietHours,
    } = req.body;

    let preferences = await NotificationPreference.findOne({ userId: req.user._id });

    if (!preferences) {
      // Create if doesn't exist
      preferences = new NotificationPreference({
        userId: req.user._id,
        emailNotifications,
        inAppNotifications,
        botNotifications,
        quietHours,
      });
    } else {
      // Update existing preferences
      if (emailNotifications) {
        preferences.emailNotifications = {
          ...preferences.emailNotifications.toObject(),
          ...emailNotifications,
        };
      }
      if (inAppNotifications) {
        preferences.inAppNotifications = {
          ...preferences.inAppNotifications.toObject(),
          ...inAppNotifications,
        };
      }
      if (botNotifications) {
        preferences.botNotifications = {
          ...preferences.botNotifications.toObject(),
          ...botNotifications,
        };
      }
      if (quietHours) {
        preferences.quietHours = {
          ...preferences.quietHours.toObject(),
          ...quietHours,
        };
      }
    }

    await preferences.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/notification-preferences/reset
 * @desc    Reset notification preferences to default
 * @access  Private
 */
export const resetPreferences = async (req, res) => {
  try {
    await NotificationPreference.findOneAndDelete({ userId: req.user._id });

    // Create new default preferences
    const preferences = await NotificationPreference.create({ userId: req.user._id });

    res.json({
      success: true,
      message: 'Notification preferences reset to default',
      data: preferences,
    });
  } catch (error) {
    console.error('Reset notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences',
      error: error.message,
    });
  }
};

/**
 * Check if notifications should be sent based on quiet hours
 */
export const shouldSendNotification = async (userId) => {
  try {
    const preferences = await NotificationPreference.findOne({ userId });

    if (!preferences || !preferences.quietHours.enabled) {
      return true;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const { startTime, endTime } = preferences.quietHours;

    // If quiet hours span across midnight
    if (startTime > endTime) {
      return currentTime < startTime && currentTime >= endTime;
    }

    // Normal case
    return currentTime < startTime || currentTime >= endTime;
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return true; // Default to allowing notifications on error
  }
};
