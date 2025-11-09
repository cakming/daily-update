import Tag from '../models/Tag.js';
import Update from '../models/Update.js';

/**
 * @desc    Create a new tag
 * @route   POST /api/tags
 * @access  Private
 */
export const createTag = async (req, res) => {
  try {
    const { name, color, category } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Check if tag already exists for this user
    const existingTag = await Tag.findOne({
      userId: req.user._id,
      name: name.trim()
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const tag = await Tag.create({
      userId: req.user._id,
      name: name.trim(),
      color: color || '#3182CE',
      category: category || 'custom'
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get all tags for user
 * @route   GET /api/tags
 * @access  Private
 */
export const getTags = async (req, res) => {
  try {
    const { includeInactive, category } = req.query;

    const query = {
      userId: req.user._id
    };

    if (!includeInactive || includeInactive === 'false') {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    const tags = await Tag.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get tag by ID
 * @route   GET /api/tags/:id
 * @access  Private
 */
export const getTagById = async (req, res) => {
  try {
    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update tag
 * @route   PUT /api/tags/:id
 * @access  Private
 */
export const updateTag = async (req, res) => {
  try {
    const { name, color, category, isActive } = req.body;

    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      // Check if new name conflicts with existing tag
      if (name.trim() !== tag.name) {
        const existingTag = await Tag.findOne({
          userId: req.user._id,
          name: name.trim(),
          _id: { $ne: tag._id }
        });

        if (existingTag) {
          return res.status(400).json({
            success: false,
            message: 'Tag with this name already exists'
          });
        }

        tag.name = name.trim();
      }
    }

    if (color !== undefined) tag.color = color;
    if (category !== undefined) tag.category = category;
    if (isActive !== undefined) tag.isActive = isActive;

    await tag.save();

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
    });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Delete tag (soft delete by default)
 * @route   DELETE /api/tags/:id
 * @access  Private
 */
export const deleteTag = async (req, res) => {
  try {
    const { permanent } = req.query;

    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (permanent === 'true') {
      // Permanent delete - remove tag from all updates
      await Update.updateMany(
        { userId: req.user._id, tags: tag._id },
        { $pull: { tags: tag._id } }
      );

      await tag.deleteOne();

      res.json({
        success: true,
        message: 'Tag permanently deleted'
      });
    } else {
      // Soft delete
      tag.isActive = false;
      await tag.save();

      res.json({
        success: true,
        message: 'Tag deactivated'
      });
    }
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get tag statistics
 * @route   GET /api/tags/stats
 * @access  Private
 */
export const getTagStats = async (req, res) => {
  try {
    const tags = await Tag.find({
      userId: req.user._id,
      isActive: true
    }).sort({ usageCount: -1 });

    // Get update count for each tag
    const tagStats = await Promise.all(
      tags.map(async (tag) => {
        const updateCount = await Update.countDocuments({
          userId: req.user._id,
          tags: tag._id
        });

        return {
          _id: tag._id,
          name: tag.name,
          color: tag.color,
          category: tag.category,
          usageCount: tag.usageCount,
          updateCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalTags: tags.length,
        tagsByCategory: {
          project: tags.filter(t => t.category === 'project').length,
          priority: tags.filter(t => t.category === 'priority').length,
          status: tags.filter(t => t.category === 'status').length,
          custom: tags.filter(t => t.category === 'custom').length
        },
        mostUsed: tagStats.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get tag stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
