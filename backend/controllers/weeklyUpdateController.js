import Update from '../models/Update.js';
import { processWeeklyUpdate } from '../services/claudeService.js';

/**
 * @desc    Generate a weekly update from daily updates
 * @route   POST /api/weekly-updates/generate
 * @access  Private
 */
export const generateWeeklyUpdate = async (req, res) => {
  try {
    const { startDate, endDate, rawInput, companyId, tags } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both start date and end date'
      });
    }

    // Build query for daily updates
    const dailyQuery = {
      userId: req.user._id,
      type: 'daily',
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Filter by company if provided
    if (companyId) {
      dailyQuery.companyId = companyId;
    }

    // Filter by tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      dailyQuery.tags = { $in: tags };
    }

    // Fetch daily updates for the date range
    const dailyUpdates = await Update.find(dailyQuery).sort({ date: 1 });

    if (dailyUpdates.length === 0 && !rawInput) {
      return res.status(400).json({
        success: false,
        message: 'No daily updates found for the specified date range. Please provide raw input instead.'
      });
    }

    let formattedOutput, sections;

    if (rawInput) {
      // If raw input is provided, use it directly (useful for manual weekly summaries)
      const result = await processWeeklyUpdate([{ rawInput, date: startDate }], startDate, endDate);
      formattedOutput = result.formattedOutput;
      sections = result.sections;
    } else {
      // Generate from daily updates
      const result = await processWeeklyUpdate(dailyUpdates, startDate, endDate);
      formattedOutput = result.formattedOutput;
      sections = result.sections;
    }

    res.json({
      success: true,
      data: {
        formattedOutput,
        sections,
        dailyUpdatesUsed: dailyUpdates.length
      }
    });
  } catch (error) {
    console.error('Generate weekly update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly update',
      error: error.message
    });
  }
};

/**
 * @desc    Create and save a weekly update
 * @route   POST /api/weekly-updates
 * @access  Private
 */
export const createWeeklyUpdate = async (req, res) => {
  try {
    const { startDate, endDate, rawInput, formattedOutput, sections, companyId, tags } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both start date and end date'
      });
    }

    if (!formattedOutput) {
      return res.status(400).json({
        success: false,
        message: 'Please provide formatted output. Use /generate endpoint first.'
      });
    }

    // Build query to check for existing update
    const existingQuery = {
      userId: req.user._id,
      type: 'weekly',
      'dateRange.start': new Date(startDate),
      'dateRange.end': new Date(endDate)
    };

    // Check for same company if companyId is provided
    if (companyId) {
      existingQuery.companyId = companyId;
    } else {
      existingQuery.companyId = { $exists: false };
    }

    const existingUpdate = await Update.findOne(existingQuery);

    if (existingUpdate) {
      return res.status(400).json({
        success: false,
        message: 'A weekly update already exists for this date range and company. Please use the update endpoint to modify it.'
      });
    }

    // Create the weekly update
    const updateData = {
      userId: req.user._id,
      type: 'weekly',
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate)
      },
      rawInput: rawInput || 'Generated from daily updates',
      formattedOutput,
      sections
    };

    // Add companyId if provided
    if (companyId) {
      updateData.companyId = companyId;
    }

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      updateData.tags = tags;
    }

    const update = await Update.create(updateData);

    res.status(201).json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Create weekly update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create weekly update',
      error: error.message
    });
  }
};

/**
 * @desc    Get all weekly updates for the logged-in user
 * @route   GET /api/weekly-updates
 * @access  Private
 */
export const getWeeklyUpdates = async (req, res) => {
  try {
    const { search, companyId, tags } = req.query;

    let query = {
      userId: req.user._id,
      type: 'weekly'
    };

    // Filter by company if provided
    if (companyId) {
      query.companyId = companyId;
    }

    // Filter by tags if provided
    if (tags) {
      const tagIds = tags.split(',').map(id => id.trim());
      query.tags = { $in: tagIds };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { rawInput: { $regex: search, $options: 'i' } },
        { formattedOutput: { $regex: search, $options: 'i' } }
      ];
    }

    const updates = await Update.find(query)
      .populate('companyId', 'name color')
      .populate('tags', 'name color category')
      .sort({ 'dateRange.start': -1 });

    res.json({
      success: true,
      count: updates.length,
      data: updates
    });
  } catch (error) {
    console.error('Get weekly updates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly updates',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single weekly update by ID
 * @route   GET /api/weekly-updates/:id
 * @access  Private
 */
export const getWeeklyUpdateById = async (req, res) => {
  try {
    const update = await Update.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'weekly'
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Weekly update not found'
      });
    }

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Get weekly update by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly update',
      error: error.message
    });
  }
};

/**
 * @desc    Update a weekly update
 * @route   PUT /api/weekly-updates/:id
 * @access  Private
 */
export const updateWeeklyUpdate = async (req, res) => {
  try {
    const { rawInput, startDate, endDate } = req.body;

    let update = await Update.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'weekly'
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Weekly update not found'
      });
    }

    // If raw input or dates changed, regenerate
    if (rawInput && rawInput !== update.rawInput) {
      const start = startDate ? new Date(startDate) : update.dateRange.start;
      const end = endDate ? new Date(endDate) : update.dateRange.end;

      // Build query for daily updates
      const dailyQuery = {
        userId: req.user._id,
        type: 'daily',
        date: {
          $gte: start,
          $lte: end
        }
      };

      // Filter by company if the weekly update has a companyId
      if (update.companyId) {
        dailyQuery.companyId = update.companyId;
      }

      // Fetch daily updates for the new date range
      const dailyUpdates = await Update.find(dailyQuery).sort({ date: 1 });

      const { formattedOutput, sections } = await processWeeklyUpdate(
        dailyUpdates.length > 0 ? dailyUpdates : [{ rawInput, date: start }],
        start,
        end
      );

      update.rawInput = rawInput;
      update.formattedOutput = formattedOutput;
      update.sections = sections;
    }

    // Update dates if provided
    if (startDate) {
      update.dateRange.start = new Date(startDate);
    }
    if (endDate) {
      update.dateRange.end = new Date(endDate);
    }

    await update.save();

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Update weekly update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weekly update',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a weekly update
 * @route   DELETE /api/weekly-updates/:id
 * @access  Private
 */
export const deleteWeeklyUpdate = async (req, res) => {
  try {
    const update = await Update.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'weekly'
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Weekly update not found'
      });
    }

    await update.deleteOne();

    res.json({
      success: true,
      message: 'Weekly update deleted successfully'
    });
  } catch (error) {
    console.error('Delete weekly update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete weekly update',
      error: error.message
    });
  }
};
