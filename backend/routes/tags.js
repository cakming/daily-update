import express from 'express';
import {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  getTagStats
} from '../controllers/tagController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/tags/stats
// @desc    Get tag statistics
// @access  Private
router.get('/stats', getTagStats);

// @route   POST /api/tags
// @desc    Create a new tag
// @access  Private
router.post('/', createTag);

// @route   GET /api/tags
// @desc    Get all tags for user
// @access  Private
router.get('/', getTags);

// @route   GET /api/tags/:id
// @desc    Get tag by ID
// @access  Private
router.get('/:id', getTagById);

// @route   PUT /api/tags/:id
// @desc    Update tag
// @access  Private
router.put('/:id', updateTag);

// @route   DELETE /api/tags/:id
// @desc    Delete tag (soft delete by default, ?permanent=true for permanent)
// @access  Private
router.delete('/:id', deleteTag);

export default router;
