import Update from '../models/Update.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { computeGamification } from '../services/gamificationService.js';

/**
 * @desc    Streaks + achievements for the authenticated user
 * @route   GET /api/gamification
 * @access  Private
 */
export const getGamification = async (req, res) => {
  try {
    const userId = req.user._id;

    // Only the fields the streak/achievement math needs — keep the payload light.
    const [updates, pref] = await Promise.all([
      Update.find({ userId }).select('type date dateRange createdAt').lean(),
      NotificationPreference.findOne({ userId }).select('timezone').lean(),
    ]);

    const timezone = pref?.timezone || 'UTC';
    const result = computeGamification(updates, timezone);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Gamification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gamification data',
      error: error.message,
    });
  }
};

export default { getGamification };
