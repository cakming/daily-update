import express from 'express';
import {
  getPreferences,
  updatePreferences,
  resetPreferences,
} from '../controllers/notificationPreferenceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/notification-preferences
// @desc    Get user's notification preferences
// @access  Private
router.get('/', getPreferences);

// @route   PUT /api/notification-preferences
// @desc    Update user's notification preferences
// @access  Private
router.put('/', updatePreferences);

// @route   POST /api/notification-preferences/reset
// @desc    Reset notification preferences to default
// @access  Private
router.post('/reset', resetPreferences);

export default router;
