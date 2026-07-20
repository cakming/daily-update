import express from 'express';
import { getGamification } from '../controllers/gamificationController.js';
import { protect } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected and rate-limited.
router.use(protect);
router.use(apiLimiter);

/**
 * @route   GET /api/gamification
 * @desc    Current/longest streak and achievement badges for the user
 * @access  Private
 */
router.get('/', getGamification);

export default router;
