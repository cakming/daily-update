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

/**
 * @openapi
 * /notification-preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               summaryMode:
 *                 type: string
 *                 enum: [full, summary]
 *                 description: 'Full formatted output, or the short AI summary, in notifications'
 *               emailNotifications: { type: object }
 *               botNotifications: { type: object }
 *               quietHours: { type: object }
 *     responses:
 *       200: { description: Updated preferences }
 */
router.put('/', updatePreferences);

// @route   POST /api/notification-preferences/reset
// @desc    Reset notification preferences to default
// @access  Private
router.post('/reset', resetPreferences);

export default router;
