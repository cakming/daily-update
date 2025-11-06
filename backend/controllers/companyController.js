import Company from '../models/Company.js';
import Update from '../models/Update.js';

/**
 * Create a new company
 * POST /api/companies
 */
export const createCompany = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Check if company name already exists for this user
    const existingCompany = await Company.findOne({
      userId: req.user._id,
      name: name.trim()
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'A company with this name already exists'
      });
    }

    // Create company
    const company = new Company({
      userId: req.user._id,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3182CE'
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('Create company error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating company'
    });
  }
};

/**
 * Get all companies for the authenticated user
 * GET /api/companies
 */
export const getAllCompanies = async (req, res) => {
  try {
    const { includeInactive = 'false' } = req.query;

    const filter = { userId: req.user._id };

    // Filter by active status unless includeInactive is true
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    const companies = await Company.find(filter)
      .sort({ createdAt: -1 });

    // Get update counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const updateCount = await Update.countDocuments({
          userId: req.user._id,
          companyId: company._id
        });

        return {
          ...company.toObject(),
          updateCount
        };
      })
    );

    res.json({
      success: true,
      data: companiesWithCounts,
      count: companiesWithCounts.length
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies'
    });
  }
};

/**
 * Get a single company by ID
 * GET /api/companies/:id
 */
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get update count for this company
    const updateCount = await Update.countDocuments({
      userId: req.user._id,
      companyId: company._id
    });

    res.json({
      success: true,
      data: {
        ...company.toObject(),
        updateCount
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company'
    });
  }
};

/**
 * Update a company
 * PUT /api/companies/:id
 */
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    // Find the company
    const company = await Company.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if new name conflicts with another company
    if (name && name.trim() !== company.name) {
      const existingCompany = await Company.findOne({
        userId: req.user._id,
        name: name.trim(),
        _id: { $ne: id }
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'A company with this name already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) company.name = name.trim();
    if (description !== undefined) company.description = description.trim();
    if (color !== undefined) company.color = color;
    if (isActive !== undefined) company.isActive = isActive;

    await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Update company error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating company'
    });
  }
};

/**
 * Delete a company (soft delete by default)
 * DELETE /api/companies/:id
 */
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = 'false' } = req.query;

    // Find the company
    const company = await Company.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (permanent === 'true') {
      // Permanent delete - remove company and all associated updates
      await Update.deleteMany({
        userId: req.user._id,
        companyId: id
      });

      await Company.deleteOne({ _id: id });

      return res.json({
        success: true,
        message: 'Company and associated updates permanently deleted'
      });
    } else {
      // Soft delete - just mark as inactive
      company.isActive = false;
      await company.save();

      return res.json({
        success: true,
        message: 'Company deactivated successfully',
        data: company
      });
    }
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company'
    });
  }
};

/**
 * Get company statistics
 * GET /api/companies/:id/stats
 */
export const getCompanyStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify company exists and belongs to user
    const company = await Company.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get statistics
    const totalUpdates = await Update.countDocuments({
      userId: req.user._id,
      companyId: id
    });

    const dailyUpdates = await Update.countDocuments({
      userId: req.user._id,
      companyId: id,
      type: 'daily'
    });

    const weeklyUpdates = await Update.countDocuments({
      userId: req.user._id,
      companyId: id,
      type: 'weekly'
    });

    // Get date range
    const firstUpdate = await Update.findOne({
      userId: req.user._id,
      companyId: id
    }).sort({ createdAt: 1 });

    const lastUpdate = await Update.findOne({
      userId: req.user._id,
      companyId: id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        company: company.toObject(),
        statistics: {
          totalUpdates,
          dailyUpdates,
          weeklyUpdates,
          firstUpdate: firstUpdate?.createdAt || null,
          lastUpdate: lastUpdate?.createdAt || null
        }
      }
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company statistics'
    });
  }
};
