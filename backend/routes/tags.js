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

/**
 * @openapi
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         color:
 *           type: string
 *           example: '#3182CE'
 *         category:
 *           type: string
 *           enum: [project, priority, status, custom]
 *         isActive:
 *           type: boolean
 *         usageCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /tags/stats:
 *   get:
 *     summary: Get tag statistics
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tag statistics
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /tags:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *                 example: '#3182CE'
 *               category:
 *                 type: string
 *                 enum: [project, priority, status, custom]
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Not authenticated
 *   get:
 *     summary: Get all tags for the authenticated user
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [project, priority, status, custom]
 *     responses:
 *       200:
 *         description: List of tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /tags/{id}:
 *   get:
 *     summary: Get a tag by ID
 *     tags: [Tags]
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
 *         description: Tag details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag not found
 *       401:
 *         description: Not authenticated
 *   put:
 *     summary: Update a tag
 *     tags: [Tags]
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
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [project, priority, status, custom]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Duplicate name
 *       404:
 *         description: Tag not found
 *       401:
 *         description: Not authenticated
 *   delete:
 *     summary: Delete a tag (soft delete by default)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Permanently delete the tag and remove it from updates
 *     responses:
 *       200:
 *         description: Tag deleted or deactivated
 *       404:
 *         description: Tag not found
 *       401:
 *         description: Not authenticated
 */

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
