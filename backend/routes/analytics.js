import express from 'express';
import {
  getDashboard,
  getProductivityTrends
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected and rate-limited
router.use(protect);
router.use(apiLimiter);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get analytics dashboard with key metrics
 * @access  Private
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get productivity trends over time
 * @query   period (days, default: 30)
 * @access  Private
 */
router.get('/trends', getProductivityTrends);

export default router;
