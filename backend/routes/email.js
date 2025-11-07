import express from 'express';
import {
  sendDailyUpdate,
  sendWeeklySummary,
  getEmailConfigStatus,
  sendTestEmail,
} from '../controllers/emailController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/email/config-status
// @desc    Check email configuration status
// @access  Private
router.get('/config-status', getEmailConfigStatus);

// @route   POST /api/email/test
// @desc    Send a test email
// @access  Private
router.post('/test', sendTestEmail);

// @route   POST /api/email/daily/:id
// @desc    Send daily update via email
// @access  Private
router.post('/daily/:id', sendDailyUpdate);

// @route   POST /api/email/weekly/:id
// @desc    Send weekly summary via email
// @access  Private
router.post('/weekly/:id', sendWeeklySummary);

export default router;
