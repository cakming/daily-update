import express from 'express';
import { body } from 'express-validator';
import {
  generateWeeklyUpdate,
  createWeeklyUpdate,
  getWeeklyUpdates,
  getWeeklyUpdateById,
  updateWeeklyUpdate,
  deleteWeeklyUpdate,
  enableShare,
  disableShare
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

/**
 * @openapi
 * /weekly-updates/generate:
 *   post:
 *     summary: Generate a weekly update from daily updates in a date range (AI)
 *     tags: [Weekly Updates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               companyId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated weekly update content
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /weekly-updates:
 *   post:
 *     summary: Save a weekly update
 *     tags: [Weekly Updates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate, formattedOutput]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               formattedOutput:
 *                 type: string
 *               companyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Weekly update created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *   get:
 *     summary: Get all weekly updates for the authenticated user
 *     tags: [Weekly Updates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of weekly updates
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /weekly-updates/{id}:
 *   get:
 *     summary: Get a weekly update by ID
 *     tags: [Weekly Updates]
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
 *         description: Weekly update details
 *       404:
 *         description: Weekly update not found
 *       401:
 *         description: Not authenticated
 *   put:
 *     summary: Update a weekly update
 *     tags: [Weekly Updates]
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
 *               formattedOutput:
 *                 type: string
 *     responses:
 *       200:
 *         description: Weekly update updated
 *       404:
 *         description: Weekly update not found
 *       401:
 *         description: Not authenticated
 *   delete:
 *     summary: Delete a weekly update
 *     tags: [Weekly Updates]
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
 *         description: Weekly update deleted
 *       404:
 *         description: Weekly update not found
 *       401:
 *         description: Not authenticated
 */

// Routes
router.post('/generate', generateValidation, generateWeeklyUpdate);
router.post('/', createValidation, createWeeklyUpdate);
router.get('/', getWeeklyUpdates);
router.get('/:id', getWeeklyUpdateById);
router.put('/:id', updateWeeklyUpdate);
router.delete('/:id', deleteWeeklyUpdate);

/**
 * @openapi
 * /weekly-updates/{id}/share:
 *   post:
 *     summary: Enable a public read-only share link for a weekly summary
 *     tags: [Weekly Updates]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 'Returns { shareToken }; view at /api/public/updates/{token}' }
 *       404: { description: Weekly summary not found }
 *   delete:
 *     summary: Disable the public share link
 *     tags: [Weekly Updates]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sharing disabled }
 *       404: { description: Weekly summary not found }
 */
router.post('/:id/share', enableShare);
router.delete('/:id/share', disableShare);

export default router;
