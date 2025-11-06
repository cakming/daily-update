import Template from '../models/Template.js';

/**
 * Create a new template
 * @route   POST /api/templates
 * @access  Private
 */
export const createTemplate = async (req, res) => {
  try {
    const { name, description, content, type, category, companyId } = req.body;

    // Validate required fields
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name and content are required',
      });
    }

    // Check for duplicate template name for this user
    const existingTemplate = await Template.findOne({
      userId: req.user._id,
      name,
      isActive: true,
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'A template with this name already exists',
      });
    }

    // Create template
    const template = await Template.create({
      userId: req.user._id,
      name,
      description,
      content,
      type: type || 'daily',
      category,
      companyId: companyId || null,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating template',
      error: error.message,
    });
  }
};

/**
 * Get all templates for the authenticated user
 * @route   GET /api/templates
 * @access  Private
 */
export const getTemplates = async (req, res) => {
  try {
    const { type, category, companyId, search } = req.query;

    // Build query
    const query = {
      userId: req.user._id,
      isActive: true,
    };

    if (type) query.type = type;
    if (category) query.category = category;
    if (companyId) query.companyId = companyId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const templates = await Template.find(query)
      .populate('companyId', 'name color')
      .sort({ lastUsedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error.message,
    });
  }
};

/**
 * Get a single template by ID
 * @route   GET /api/templates/:id
 * @access  Private
 */
export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    }).populate('companyId', 'name color');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template',
      error: error.message,
    });
  }
};

/**
 * Update a template
 * @route   PUT /api/templates/:id
 * @access  Private
 */
export const updateTemplate = async (req, res) => {
  try {
    const { name, description, content, type, category, companyId } = req.body;

    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== template.name) {
      const existingTemplate = await Template.findOne({
        userId: req.user._id,
        name,
        isActive: true,
        _id: { $ne: req.params.id },
      });

      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: 'A template with this name already exists',
        });
      }
    }

    // Update fields
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (content !== undefined) template.content = content;
    if (type !== undefined) template.type = type;
    if (category !== undefined) template.category = category;
    if (companyId !== undefined) template.companyId = companyId;

    await template.save();

    const updatedTemplate = await Template.findById(template._id).populate(
      'companyId',
      'name color'
    );

    res.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template',
      error: error.message,
    });
  }
};

/**
 * Delete a template (soft delete)
 * @route   DELETE /api/templates/:id
 * @access  Private
 */
export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Soft delete
    template.isActive = false;
    await template.save();

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error.message,
    });
  }
};

/**
 * Mark template as used (increment usage count)
 * @route   POST /api/templates/:id/use
 * @access  Private
 */
export const useTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    await template.incrementUsage();

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording template usage',
      error: error.message,
    });
  }
};

/**
 * Get template statistics
 * @route   GET /api/templates/stats
 * @access  Private
 */
export const getTemplateStats = async (req, res) => {
  try {
    const templates = await Template.find({
      userId: req.user._id,
      isActive: true,
    });

    const stats = {
      total: templates.length,
      byType: {
        daily: templates.filter((t) => t.type === 'daily').length,
        weekly: templates.filter((t) => t.type === 'weekly').length,
      },
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
      mostUsed: templates.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template statistics',
      error: error.message,
    });
  }
};
