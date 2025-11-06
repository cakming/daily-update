import Update from '../models/Update.js';
import { processDailyUpdate } from '../services/claudeService.js';

/**
 * @desc    Create a new daily update
 * @route   POST /api/daily-updates
 * @access  Private
 */
export const createDailyUpdate = async (req, res) => {
  try {
    const { rawInput, date } = req.body;

    if (!rawInput || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both raw input and date'
      });
    }

    // Check if update already exists for this date
    const existingUpdate = await Update.findOne({
      userId: req.user._id,
      type: 'daily',
      date: new Date(date)
    });

    if (existingUpdate) {
      return res.status(400).json({
        success: false,
        message: 'An update already exists for this date. Please use the update endpoint to modify it.'
      });
    }

    // Process the update with Claude API
    const { formattedOutput, sections } = await processDailyUpdate(rawInput, date);

    // Create the update
    const update = await Update.create({
      userId: req.user._id,
      type: 'daily',
      date: new Date(date),
      rawInput,
      formattedOutput,
      sections
    });

    res.status(201).json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Create daily update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create daily update',
      error: error.message
    });
  }
};

/**
 * @desc    Get all daily updates for the logged-in user
 * @route   GET /api/daily-updates
 * @access  Private
 */
export const getDailyUpdates = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;

    let query = {
      userId: req.user._id,
      type: 'daily'
    };

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { rawInput: { $regex: search, $options: 'i' } },
        { formattedOutput: { $regex: search, $options: 'i' } }
      ];
    }

    const updates = await Update.find(query).sort({ date: -1 });

    res.json({
      success: true,
      count: updates.length,
      data: updates
    });
  } catch (error) {
    console.error('Get daily updates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily updates',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single daily update by ID
 * @route   GET /api/daily-updates/:id
 * @access  Private
 */
export const getDailyUpdateById = async (req, res) => {
  try {
    const update = await Update.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'daily'
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Daily update not found'
      });
    }

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Get daily update by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily update',
      error: error.message
    });
  }
};

/**
 * @desc    Update a daily update
 * @route   PUT /api/daily-updates/:id
 * @access  Private
 */
export const updateDailyUpdate = async (req, res) => {
  try {
    const { rawInput, date } = req.body;

    let update = await Update.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'daily'
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Daily update not found'
      });
    }

    // If raw input changed, reprocess with Claude
    if (rawInput && rawInput !== update.rawInput) {
      const { formattedOutput, sections } = await processDailyUpdate(
        rawInput,
        date || update.date
      );

      update.rawInput = rawInput;
      update.formattedOutput = formattedOutput;
      update.sections = sections;
    }

    // Update date if provided
    if (date) {
      update.date = new Date(date);
    }

    await update.save();

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Update daily update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily update',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a daily update
 * @route   DELETE /api/daily-updates/:id
 * @access  Private
 */
export const deleteDailyUpdate = async (req, res) => {
  try {
    const update = await Update.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'daily'
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Daily update not found'
      });
    }

    await update.deleteOne();

    res.json({
      success: true,
      message: 'Daily update deleted successfully'
    });
  } catch (error) {
    console.error('Delete daily update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily update',
      error: error.message
    });
  }
};
