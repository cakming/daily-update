import ScheduleHistory from '../models/ScheduleHistory.js';
import ScheduledUpdate from '../models/ScheduledUpdate.js';

/**
 * Schedule History Controller
 * Handles schedule execution history retrieval
 */

/**
 * @route   GET /api/schedule-history
 * @desc    Get schedule execution history for user
 * @access  Private
 */
export const getHistory = async (req, res) => {
  try {
    const { scheduleId, status, limit = 50, skip = 0 } = req.query;

    const query = { userId: req.user._id };

    if (scheduleId) {
      query.scheduleId = scheduleId;
    }

    if (status) {
      query.status = status;
    }

    const history = await ScheduleHistory.find(query)
      .populate({
        path: 'scheduleId',
        select: 'type company scheduleType',
        populate: {
          path: 'company',
          select: 'name',
        },
      })
      .populate({
        path: 'createdUpdateId',
      })
      .sort({ executedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ScheduleHistory.countDocuments(query);

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get schedule history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule history',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/schedule-history/:id
 * @desc    Get single schedule execution history entry
 * @access  Private
 */
export const getHistoryById = async (req, res) => {
  try {
    const history = await ScheduleHistory.findById(req.params.id)
      .populate({
        path: 'scheduleId',
        populate: {
          path: 'company tags',
        },
      })
      .populate('createdUpdateId');

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History entry not found',
      });
    }

    // Check ownership
    if (history.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this history entry',
      });
    }

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get history by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history entry',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/schedule-history/schedule/:scheduleId
 * @desc    Get execution history for a specific schedule
 * @access  Private
 */
export const getHistoryBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    // Verify schedule belongs to user
    const schedule = await ScheduledUpdate.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    if (schedule.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this schedule',
      });
    }

    const history = await ScheduleHistory.find({ scheduleId })
      .populate('createdUpdateId')
      .sort({ executedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ScheduleHistory.countDocuments({ scheduleId });

    // Calculate statistics
    const stats = await ScheduleHistory.aggregate([
      { $match: { scheduleId: schedule._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgExecutionTime: { $avg: '$executionTimeMs' },
        },
      },
    ]);

    const statistics = {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgExecutionTimeMs: Math.round(stat.avgExecutionTime || 0),
        };
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      data: history,
      statistics,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get history by schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule history',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/schedule-history/stats
 * @desc    Get overall schedule execution statistics
 * @access  Private
 */
export const getStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await ScheduleHistory.aggregate([
      {
        $match: {
          userId: req.user._id,
          executedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$executedAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
          avgExecutionTime: { $avg: '$executionTimeMs' },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    const totalExecutions = await ScheduleHistory.countDocuments({
      userId: req.user._id,
      executedAt: { $gte: startDate },
    });

    const failedExecutions = await ScheduleHistory.countDocuments({
      userId: req.user._id,
      status: 'failed',
      executedAt: { $gte: startDate },
    });

    const successRate =
      totalExecutions > 0 ? ((totalExecutions - failedExecutions) / totalExecutions) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalExecutions,
        failedExecutions,
        successRate: Math.round(successRate * 100) / 100,
        dailyStats: stats,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/schedule-history/:id
 * @desc    Delete schedule history entry
 * @access  Private
 */
export const deleteHistory = async (req, res) => {
  try {
    const history = await ScheduleHistory.findById(req.params.id);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History entry not found',
      });
    }

    // Check ownership
    if (history.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this history entry',
      });
    }

    await history.deleteOne();

    res.json({
      success: true,
      message: 'History entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history entry',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/schedule-history/schedule/:scheduleId
 * @desc    Delete all history for a specific schedule
 * @access  Private
 */
export const deleteHistoryBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Verify schedule belongs to user
    const schedule = await ScheduledUpdate.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    if (schedule.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this schedule history',
      });
    }

    const result = await ScheduleHistory.deleteMany({ scheduleId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history entries`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Delete history by schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule history',
      error: error.message,
    });
  }
};
