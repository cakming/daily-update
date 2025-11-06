import express from 'express';
import { body } from 'express-validator';
import {
  generateWeeklyUpdate,
  createWeeklyUpdate,
  getWeeklyUpdates,
  getWeeklyUpdateById,
  updateWeeklyUpdate,
  deleteWeeklyUpdate
} from '../controllers/weeklyUpdateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const generateValidation = [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
];

const createValidation = [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('formattedOutput').trim().notEmpty().withMessage('Formatted output is required')
];

// All routes are protected
router.use(protect);

// Routes
router.post('/generate', generateValidation, generateWeeklyUpdate);
router.post('/', createValidation, createWeeklyUpdate);
router.get('/', getWeeklyUpdates);
router.get('/:id', getWeeklyUpdateById);
router.put('/:id', updateWeeklyUpdate);
router.delete('/:id', deleteWeeklyUpdate);

export default router;
