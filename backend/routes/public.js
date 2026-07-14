import express from 'express';
import { getPublicUpdate } from '../controllers/weeklyUpdateController.js';

// Public, unauthenticated routes for shared read-only content.
const router = express.Router();

router.get('/updates/:token', getPublicUpdate);

export default router;
