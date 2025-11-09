import express from 'express';
import {
  getHistory,
  getHistoryById,
  getHistoryBySchedule,
  getStatistics,
  deleteHistory,
  deleteHistoryBySchedule,
} from '../controllers/scheduleHistoryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/schedule-history
// @desc    Get schedule execution history for user
// @access  Private
router.get('/', getHistory);

// @route   GET /api/schedule-history/stats
// @desc    Get overall schedule execution statistics
// @access  Private
router.get('/stats', getStatistics);

// @route   GET /api/schedule-history/schedule/:scheduleId
// @desc    Get execution history for a specific schedule
// @access  Private
router.get('/schedule/:scheduleId', getHistoryBySchedule);

// @route   GET /api/schedule-history/:id
// @desc    Get single schedule execution history entry
// @access  Private
router.get('/:id', getHistoryById);

// @route   DELETE /api/schedule-history/:id
// @desc    Delete schedule history entry
// @access  Private
router.delete('/:id', deleteHistory);

// @route   DELETE /api/schedule-history/schedule/:scheduleId
// @desc    Delete all history for a specific schedule
// @access  Private
router.delete('/schedule/:scheduleId', deleteHistoryBySchedule);

export default router;
