import express from 'express';
import { getPublicUpdate } from '../controllers/weeklyUpdateController.js';

// Public, unauthenticated routes for shared read-only content.
const router = express.Router();

/**
 * @openapi
 * /public/updates/{token}:
 *   get:
 *     summary: Fetch a shared update by its public token (no auth)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 'Presentation fields only (no userId/rawInput/token)' }
 *       404: { description: Shared update not found }
 */
router.get('/updates/:token', getPublicUpdate);

export default router;
