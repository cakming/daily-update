/**
 * Gamification: streaks + achievements derived from a user's update history.
 *
 * Everything here is a PURE function of (updates, timezone, now) so it is
 * trivially testable and has no DB or clock dependency. The controller loads
 * the updates + the user's timezone and passes them in.
 *
 * "Active day" = a calendar day (in the user's timezone) on which the user
 * logged at least one update (daily or weekly). Streaks are runs of
 * consecutive active days; the current streak is anchored to today (or
 * yesterday, so a streak isn't reported broken until a full day is missed).
 */
import { partsInZone } from '../utils/timezone.js';

// Calendar day index (days since the Unix epoch) for `date` as seen in `tz`.
// Built from the zoned wall-clock parts so day-to-day differences are true
// calendar-day gaps regardless of DST.
const dayNumber = (date, tz) => {
  const p = partsInZone(date, tz);
  return Math.round(Date.UTC(p.year, p.month - 1, p.day) / 86400000);
};

// The date a given update "counts" on: daily -> its date; weekly -> range
// start; fall back to createdAt so malformed rows still contribute.
const effectiveDate = (u) => u.date || u.dateRange?.start || u.createdAt;

/**
 * Achievement catalog. Each entry is derived purely from the computed stats,
 * so adding a badge is just adding a row here. `target`/`value` drive a
 * progress bar in the UI; `earned` is value >= target.
 */
const ACHIEVEMENTS = [
  {
    id: 'first_update',
    title: 'Getting Started',
    description: 'Log your first update',
    icon: '🌱',
    target: 1,
    value: (s) => s.totalUpdates,
  },
  {
    id: 'ten_updates',
    title: 'Regular',
    description: 'Log 10 updates',
    icon: '✍️',
    target: 10,
    value: (s) => s.totalUpdates,
  },
  {
    id: 'fifty_updates',
    title: 'Prolific',
    description: 'Log 50 updates',
    icon: '📚',
    target: 50,
    value: (s) => s.totalUpdates,
  },
  {
    id: 'hundred_updates',
    title: 'Centurion',
    description: 'Log 100 updates',
    icon: '💯',
    target: 100,
    value: (s) => s.totalUpdates,
  },
  {
    id: 'streak_3',
    title: 'On a Roll',
    description: 'Reach a 3-day streak',
    icon: '🔥',
    target: 3,
    value: (s) => s.longestStreak,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: '⚡',
    target: 7,
    value: (s) => s.longestStreak,
  },
  {
    id: 'streak_14',
    title: 'Fortnight',
    description: 'Reach a 14-day streak',
    icon: '🗓️',
    target: 14,
    value: (s) => s.longestStreak,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak',
    icon: '🏆',
    target: 30,
    value: (s) => s.longestStreak,
  },
  {
    id: 'weekly_summary',
    title: 'Reflector',
    description: 'Write a weekly summary',
    icon: '🪞',
    target: 1,
    value: (s) => s.totalWeekly,
  },
  {
    id: 'consistent_week',
    title: 'Consistent',
    description: 'Stay active 5 days in a week',
    icon: '📈',
    target: 5,
    value: (s) => s.activeDaysLast7,
  },
];

/**
 * Compute streaks + achievements for a set of updates.
 *
 * @param {Object[]} updates  - Update documents (need type/date/dateRange/createdAt).
 * @param {string}   timezone - IANA zone (e.g. 'America/New_York'); defaults to UTC.
 * @param {Date}     now      - "current" instant; injectable for tests.
 * @returns {Object} stats + achievement list.
 */
export const computeGamification = (updates = [], timezone = 'UTC', now = new Date()) => {
  const tz = timezone || 'UTC';

  const totalDaily = updates.filter((u) => u.type === 'daily').length;
  const totalWeekly = updates.filter((u) => u.type === 'weekly').length;
  const totalUpdates = updates.length;

  // Distinct active days as calendar-day indices.
  const dayset = new Set();
  for (const u of updates) {
    const d = effectiveDate(u);
    if (d) dayset.add(dayNumber(new Date(d), tz));
  }
  const days = [...dayset].sort((a, b) => a - b);
  const activeDays = days.length;

  const todayNum = dayNumber(now, tz);

  // Current streak: anchor to today, else yesterday (grace period), else none.
  let currentStreak = 0;
  let anchor = null;
  if (dayset.has(todayNum)) anchor = todayNum;
  else if (dayset.has(todayNum - 1)) anchor = todayNum - 1;
  if (anchor !== null) {
    let d = anchor;
    while (dayset.has(d)) {
      currentStreak++;
      d--;
    }
  }

  // Longest streak: longest run of consecutive day indices.
  let longestStreak = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  // Active days within the trailing 7-day window (for the "Consistent" badge).
  let activeDaysLast7 = 0;
  for (let d = todayNum - 6; d <= todayNum; d++) {
    if (dayset.has(d)) activeDaysLast7++;
  }

  const stats = {
    totalUpdates,
    totalDaily,
    totalWeekly,
    activeDays,
    currentStreak,
    longestStreak,
    activeDaysLast7,
  };

  const achievements = ACHIEVEMENTS.map((a) => {
    const value = Math.max(0, a.value(stats));
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      target: a.target,
      progress: Math.min(value, a.target),
      earned: value >= a.target,
    };
  });

  const earnedCount = achievements.filter((a) => a.earned).length;

  return {
    currentStreak,
    longestStreak,
    totalUpdates,
    totalDaily,
    totalWeekly,
    activeDays,
    achievements,
    earnedCount,
    totalAchievements: achievements.length,
  };
};

export default { computeGamification };
