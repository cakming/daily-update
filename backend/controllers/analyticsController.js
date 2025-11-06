import Update from '../models/Update.js';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

/**
 * Get user's analytics dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all updates for the user
    const allUpdates = await Update.find({ userId });

    // Calculate various metrics
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = endOfWeek(now);
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    // This week's updates
    const thisWeekUpdates = allUpdates.filter(u => {
      const date = u.date || u.dateRange?.start;
      return date && date >= thisWeekStart && date <= thisWeekEnd;
    });

    // Last week's updates
    const lastWeekUpdates = allUpdates.filter(u => {
      const date = u.date || u.dateRange?.start;
      return date && date >= lastWeekStart && date <= lastWeekEnd;
    });

    // This month's updates
    const thisMonthUpdates = allUpdates.filter(u => {
      const date = u.date || u.dateRange?.start;
      return date && date >= thisMonthStart && date <= thisMonthEnd;
    });

    // Get updates by type
    const updatesByType = {
      daily: allUpdates.filter(u => u.type === 'daily').length,
      weekly: allUpdates.filter(u => u.type === 'weekly').length
    };

    // Calculate streak (consecutive days with updates)
    const dailyUpdates = allUpdates
      .filter(u => u.type === 'daily' && u.date)
      .map(u => new Date(u.date).toDateString())
      .sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (let i = 0; i < dailyUpdates.length; i++) {
      const currentDate = new Date(dailyUpdates[i]);

      if (lastDate) {
        const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
        // Check if today or yesterday
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (currentDate.toDateString() === today || currentDate.toDateString() === yesterday) {
          currentStreak = 1;
        }
      }

      lastDate = currentDate;
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Activity by day of week
    const activityByDay = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };

    allUpdates.forEach(update => {
      const date = update.date || update.dateRange?.start;
      if (date) {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        activityByDay[dayName]++;
      }
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentActivity = allUpdates.filter(u => {
      const date = u.date || u.dateRange?.start;
      return date && date >= thirtyDaysAgo;
    });

    // Activity by month (last 6 months)
    const activityByMonth = {};
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const count = allUpdates.filter(u => {
        const date = u.date || u.dateRange?.start;
        return date && date >= monthStart && date <= monthEnd;
      }).length;

      activityByMonth[monthName] = count;
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalUpdates: allUpdates.length,
          thisWeek: thisWeekUpdates.length,
          lastWeek: lastWeekUpdates.length,
          thisMonth: thisMonthUpdates.length,
          currentStreak,
          maxStreak
        },
        byType: updatesByType,
        activityByDay,
        activityByMonth,
        recentActivity: {
          count: recentActivity.length,
          avgPerWeek: (recentActivity.length / 4).toFixed(1)
        },
        growth: {
          weekOverWeek: lastWeekUpdates.length > 0
            ? (((thisWeekUpdates.length - lastWeekUpdates.length) / lastWeekUpdates.length) * 100).toFixed(1)
            : thisWeekUpdates.length > 0 ? 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

/**
 * Get productivity trends
 * @route   GET /api/analytics/trends
 * @access  Private
 */
export const getProductivityTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query; // days

    const daysAgo = parseInt(period);
    const startDate = subDays(new Date(), daysAgo);

    const updates = await Update.find({
      userId,
      $or: [
        { date: { $gte: startDate } },
        { 'dateRange.start': { $gte: startDate } }
      ]
    }).sort({ createdAt: 1 });

    // Group by date
    const dailyCounts = {};
    updates.forEach(update => {
      const date = (update.date || update.dateRange?.start)?.toISOString().split('T')[0];
      if (date) {
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }
    });

    // Fill in missing dates with 0
    const trend = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = subDays(new Date(), i).toISOString().split('T')[0];
      trend.push({
        date,
        count: dailyCounts[date] || 0
      });
    }

    res.json({
      success: true,
      data: {
        period: `${daysAgo} days`,
        trend,
        average: (updates.length / daysAgo).toFixed(2),
        total: updates.length
      }
    });
  } catch (error) {
    console.error('Productivity trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching productivity trends',
      error: error.message
    });
  }
};
