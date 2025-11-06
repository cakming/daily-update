import express from 'express';
import {
  exportAsCSV,
  exportAsJSON,
  exportAsMarkdown,
  getExportMetadata
} from '../controllers/exportController.js';
import { protect } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected and rate-limited
router.use(protect);
router.use(apiLimiter);

/**
 * @route   GET /api/export/metadata
 * @desc    Get export metadata (count, size estimates)
 * @access  Private
 */
router.get('/metadata', getExportMetadata);

/**
 * @route   GET /api/export/csv
 * @desc    Export updates as CSV
 * @query   startDate, endDate, type
 * @access  Private
 */
router.get('/csv', exportAsCSV);

/**
 * @route   GET /api/export/json
 * @desc    Export updates as JSON
 * @query   startDate, endDate, type
 * @access  Private
 */
router.get('/json', exportAsJSON);

/**
 * @route   GET /api/export/markdown
 * @desc    Export updates as Markdown
 * @query   startDate, endDate, type
 * @access  Private
 */
router.get('/markdown', exportAsMarkdown);

export default router;
