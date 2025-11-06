import express from 'express';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  useTemplate,
  getTemplateStats,
} from '../controllers/templateController.js';
import { protect } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected and rate-limited
router.use(protect);
router.use(apiLimiter);

/**
 * @route   GET /api/templates/stats
 * @desc    Get template statistics
 * @access  Private
 */
router.get('/stats', getTemplateStats);

/**
 * @route   POST /api/templates
 * @desc    Create a new template
 * @access  Private
 */
router.post('/', createTemplate);

/**
 * @route   GET /api/templates
 * @desc    Get all templates for authenticated user
 * @query   type, category, companyId, search
 * @access  Private
 */
router.get('/', getTemplates);

/**
 * @route   GET /api/templates/:id
 * @desc    Get a single template by ID
 * @access  Private
 */
router.get('/:id', getTemplateById);

/**
 * @route   PUT /api/templates/:id
 * @desc    Update a template
 * @access  Private
 */
router.put('/:id', updateTemplate);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete a template (soft delete)
 * @access  Private
 */
router.delete('/:id', deleteTemplate);

/**
 * @route   POST /api/templates/:id/use
 * @desc    Mark template as used (increment usage count)
 * @access  Private
 */
router.post('/:id/use', useTemplate);

export default router;
