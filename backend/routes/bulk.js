import express from 'express';
import {
  bulkDelete,
  bulkAssignTags,
  bulkRemoveTags,
  bulkAssignCompany,
  bulkExport
} from '../controllers/bulkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/bulk/delete
// @desc    Bulk delete updates
// @access  Private
router.post('/delete', bulkDelete);

// @route   POST /api/bulk/assign-tags
// @desc    Bulk assign tags to updates
// @access  Private
router.post('/assign-tags', bulkAssignTags);

// @route   POST /api/bulk/remove-tags
// @desc    Bulk remove tags from updates
// @access  Private
router.post('/remove-tags', bulkRemoveTags);

// @route   POST /api/bulk/assign-company
// @desc    Bulk assign company to updates
// @access  Private
router.post('/assign-company', bulkAssignCompany);

// @route   POST /api/bulk/export
// @desc    Bulk export updates
// @access  Private
router.post('/export', bulkExport);

export default router;
