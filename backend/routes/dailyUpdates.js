import express from 'express';
import { body } from 'express-validator';
import {
  createDailyUpdate,
  getDailyUpdates,
  getDailyUpdateById,
  updateDailyUpdate,
  deleteDailyUpdate
} from '../controllers/dailyUpdateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const createUpdateValidation = [
  body('rawInput').trim().notEmpty().withMessage('Raw input is required'),
  body('date').isISO8601().withMessage('Valid date is required')
];

const updateValidation = [
  body('rawInput').optional().trim().notEmpty().withMessage('Raw input cannot be empty'),
  body('date').optional().isISO8601().withMessage('Valid date is required')
];

// All routes are protected
router.use(protect);

// Routes
router.post('/', createUpdateValidation, createDailyUpdate);
router.get('/', getDailyUpdates);
router.get('/:id', getDailyUpdateById);
router.put('/:id', updateValidation, updateDailyUpdate);
router.delete('/:id', deleteDailyUpdate);

export default router;
