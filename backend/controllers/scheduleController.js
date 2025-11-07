import ScheduledUpdate from '../models/ScheduledUpdate.js';

/**
 * Schedule Controller
 * Handles scheduled update CRUD operations
 */

/**
 * @route   GET /api/schedules
 * @desc    Get all scheduled updates for user
 * @access  Private
 */
export const getSchedules = async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const query = { userId: req.user._id };

    if (type) {
      query.type = type;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const schedules = await ScheduledUpdate.find(query)
      .populate('company')
      .populate('tags')
      .sort({ nextRun: 1 });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/schedules/:id
 * @desc    Get single scheduled update
 * @access  Private
 */
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await ScheduledUpdate.findById(req.params.id)
      .populate('company')
      .populate('tags');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled update not found',
      });
    }

    // Check ownership
    if (schedule.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this scheduled update',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/schedules
 * @desc    Create scheduled update
 * @access  Private
 */
export const createSchedule = async (req, res) => {
  try {
    const {
      type,
      company,
      tags,
      content,
      scheduleType,
      scheduledTime,
      scheduledDate,
      dayOfWeek,
      dayOfMonth,
      timezone,
      recipients,
      sendEmail,
    } = req.body;

    // Validation
    if (!type || !content || !scheduleType || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, content, scheduleType, and scheduledTime',
      });
    }

    // Validate schedule type specific fields
    if (scheduleType === 'once' && !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date is required for one-time schedules',
      });
    }

    if (scheduleType === 'weekly' && (dayOfWeek === undefined || dayOfWeek === null)) {
      return res.status(400).json({
        success: false,
        message: 'Day of week is required for weekly schedules',
      });
    }

    if (scheduleType === 'monthly' && !dayOfMonth) {
      return res.status(400).json({
        success: false,
        message: 'Day of month is required for monthly schedules',
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduledTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM (24-hour format)',
      });
    }

    // Create scheduled update
    const schedule = new ScheduledUpdate({
      userId: req.user._id,
      type,
      company,
      tags,
      content,
      scheduleType,
      scheduledTime,
      scheduledDate,
      dayOfWeek,
      dayOfMonth,
      timezone: timezone || 'UTC',
      recipients: recipients || [],
      sendEmail: sendEmail || false,
    });

    // Calculate next run
    schedule.nextRun = schedule.calculateNextRun();

    await schedule.save();
    await schedule.populate(['company', 'tags']);

    res.status(201).json({
      success: true,
      message: 'Scheduled update created successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled update',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update scheduled update
 * @access  Private
 */
export const updateSchedule = async (req, res) => {
  try {
    const schedule = await ScheduledUpdate.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled update not found',
      });
    }

    // Check ownership
    if (schedule.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this scheduled update',
      });
    }

    const {
      type,
      company,
      tags,
      content,
      scheduleType,
      scheduledTime,
      scheduledDate,
      dayOfWeek,
      dayOfMonth,
      timezone,
      recipients,
      sendEmail,
      isActive,
    } = req.body;

    // Update fields
    if (type !== undefined) schedule.type = type;
    if (company !== undefined) schedule.company = company;
    if (tags !== undefined) schedule.tags = tags;
    if (content !== undefined) schedule.content = content;
    if (scheduleType !== undefined) schedule.scheduleType = scheduleType;
    if (scheduledTime !== undefined) schedule.scheduledTime = scheduledTime;
    if (scheduledDate !== undefined) schedule.scheduledDate = scheduledDate;
    if (dayOfWeek !== undefined) schedule.dayOfWeek = dayOfWeek;
    if (dayOfMonth !== undefined) schedule.dayOfMonth = dayOfMonth;
    if (timezone !== undefined) schedule.timezone = timezone;
    if (recipients !== undefined) schedule.recipients = recipients;
    if (sendEmail !== undefined) schedule.sendEmail = sendEmail;
    if (isActive !== undefined) schedule.isActive = isActive;

    // Recalculate next run if schedule details changed
    if (scheduleType || scheduledTime || scheduledDate || dayOfWeek || dayOfMonth) {
      schedule.nextRun = schedule.calculateNextRun();
    }

    await schedule.save();
    await schedule.populate(['company', 'tags']);

    res.json({
      success: true,
      message: 'Scheduled update updated successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled update',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete scheduled update
 * @access  Private
 */
export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await ScheduledUpdate.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled update not found',
      });
    }

    // Check ownership
    if (schedule.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this scheduled update',
      });
    }

    await schedule.deleteOne();

    res.json({
      success: true,
      message: 'Scheduled update deleted successfully',
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled update',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/schedules/:id/toggle
 * @desc    Toggle scheduled update active status
 * @access  Private
 */
export const toggleSchedule = async (req, res) => {
  try {
    const schedule = await ScheduledUpdate.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled update not found',
      });
    }

    // Check ownership
    if (schedule.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this scheduled update',
      });
    }

    schedule.isActive = !schedule.isActive;

    // Recalculate next run if activating
    if (schedule.isActive) {
      schedule.nextRun = schedule.calculateNextRun();
    }

    await schedule.save();
    await schedule.populate(['company', 'tags']);

    res.json({
      success: true,
      message: `Scheduled update ${schedule.isActive ? 'activated' : 'deactivated'}`,
      data: schedule,
    });
  } catch (error) {
    console.error('Toggle schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle scheduled update',
      error: error.message,
    });
  }
};
