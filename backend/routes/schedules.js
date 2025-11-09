import express from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
} from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/schedules
// @desc    Get all scheduled updates for user
// @access  Private
router.get('/', getSchedules);

// @route   POST /api/schedules
// @desc    Create scheduled update
// @access  Private
router.post('/', createSchedule);

// @route   GET /api/schedules/:id
// @desc    Get single scheduled update
// @access  Private
router.get('/:id', getScheduleById);

// @route   PUT /api/schedules/:id
// @desc    Update scheduled update
// @access  Private
router.put('/:id', updateSchedule);

// @route   DELETE /api/schedules/:id
// @desc    Delete scheduled update
// @access  Private
router.delete('/:id', deleteSchedule);

// @route   POST /api/schedules/:id/toggle
// @desc    Toggle scheduled update active status
// @access  Private
router.post('/:id/toggle', toggleSchedule);

export default router;
