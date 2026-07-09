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

/**
 * @openapi
 * /daily-updates:
 *   post:
 *     summary: Create a daily update (AI formats the raw input)
 *     tags: [Daily Updates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rawInput, date]
 *             properties:
 *               rawInput:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               companyId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Daily update created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *   get:
 *     summary: Get all daily updates for the authenticated user
 *     tags: [Daily Updates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of daily updates
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /daily-updates/{id}:
 *   get:
 *     summary: Get a daily update by ID
 *     tags: [Daily Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daily update details
 *       404:
 *         description: Daily update not found
 *       401:
 *         description: Not authenticated
 *   put:
 *     summary: Update a daily update
 *     tags: [Daily Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rawInput:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Daily update updated
 *       404:
 *         description: Daily update not found
 *       401:
 *         description: Not authenticated
 *   delete:
 *     summary: Delete a daily update
 *     tags: [Daily Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daily update deleted
 *       404:
 *         description: Daily update not found
 *       401:
 *         description: Not authenticated
 */

// Routes
router.post('/', createUpdateValidation, createDailyUpdate);
router.get('/', getDailyUpdates);
router.get('/:id', getDailyUpdateById);
router.put('/:id', updateValidation, updateDailyUpdate);
router.delete('/:id', deleteDailyUpdate);

export default router;
