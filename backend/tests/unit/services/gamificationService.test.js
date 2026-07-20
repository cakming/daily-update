import { describe, it, expect } from '@jest/globals';
import { computeGamification } from '../../../services/gamificationService.js';

// Build a daily update whose effective date is the given ISO day (UTC midnight).
const daily = (iso) => ({ type: 'daily', date: new Date(`${iso}T12:00:00.000Z`) });
const weekly = (iso) => ({
  type: 'weekly',
  dateRange: { start: new Date(`${iso}T12:00:00.000Z`), end: new Date(`${iso}T12:00:00.000Z`) },
});

// A fixed "now" so streak anchoring is deterministic.
const NOW = new Date('2026-01-10T12:00:00.000Z');

describe('computeGamification', () => {
  it('returns zeroed stats and no earned achievements for no updates', () => {
    const r = computeGamification([], 'UTC', NOW);
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(0);
    expect(r.totalUpdates).toBe(0);
    expect(r.earnedCount).toBe(0);
    expect(r.achievements.every((a) => !a.earned)).toBe(true);
  });

  it('counts a current streak anchored to today', () => {
    const r = computeGamification(
      [daily('2026-01-10'), daily('2026-01-09'), daily('2026-01-08')],
      'UTC',
      NOW
    );
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
  });

  it('keeps the current streak alive when the latest active day is yesterday', () => {
    const r = computeGamification([daily('2026-01-09'), daily('2026-01-08')], 'UTC', NOW);
    expect(r.currentStreak).toBe(2);
  });

  it('reports a broken current streak once a full day is missed', () => {
    // Latest activity is two days ago -> current streak is 0, but history counts.
    const r = computeGamification([daily('2026-01-08'), daily('2026-01-07')], 'UTC', NOW);
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(2);
  });

  it('finds the longest historical streak even when not current', () => {
    const r = computeGamification(
      [
        daily('2026-01-01'),
        daily('2026-01-02'),
        daily('2026-01-03'),
        daily('2026-01-04'), // 4-day run
        daily('2026-01-10'), // isolated today
      ],
      'UTC',
      NOW
    );
    expect(r.longestStreak).toBe(4);
    expect(r.currentStreak).toBe(1);
  });

  it('deduplicates multiple updates on the same day', () => {
    const r = computeGamification([daily('2026-01-10'), daily('2026-01-10')], 'UTC', NOW);
    expect(r.activeDays).toBe(1);
    expect(r.currentStreak).toBe(1);
    expect(r.totalUpdates).toBe(2);
  });

  it('counts weekly updates as active days and toward the Reflector badge', () => {
    const r = computeGamification([weekly('2026-01-10')], 'UTC', NOW);
    expect(r.totalWeekly).toBe(1);
    expect(r.activeDays).toBe(1);
    expect(r.achievements.find((a) => a.id === 'weekly_summary').earned).toBe(true);
  });

  it('earns milestone and streak badges at the right thresholds', () => {
    const updates = [];
    // 10 consecutive days ending today -> 10 updates, 10-day streak.
    for (let d = 1; d <= 10; d++) {
      updates.push(daily(`2026-01-${String(d).padStart(2, '0')}`));
    }
    const r = computeGamification(updates, 'UTC', NOW);
    const byId = Object.fromEntries(r.achievements.map((a) => [a.id, a]));
    expect(byId.first_update.earned).toBe(true);
    expect(byId.ten_updates.earned).toBe(true);
    expect(byId.fifty_updates.earned).toBe(false);
    expect(byId.streak_3.earned).toBe(true);
    expect(byId.streak_7.earned).toBe(true);
    expect(byId.streak_14.earned).toBe(false);
  });

  it('exposes clamped progress toward each achievement target', () => {
    const r = computeGamification([daily('2026-01-10'), daily('2026-01-09')], 'UTC', NOW);
    const tenUpdates = r.achievements.find((a) => a.id === 'ten_updates');
    expect(tenUpdates.progress).toBe(2); // 2 of 10
    expect(tenUpdates.target).toBe(10);
    const firstUpdate = r.achievements.find((a) => a.id === 'first_update');
    expect(firstUpdate.progress).toBe(1); // clamped to target, not 2
  });

  it('earns the Consistent badge with 5 active days in the trailing week', () => {
    const r = computeGamification(
      [
        daily('2026-01-10'),
        daily('2026-01-09'),
        daily('2026-01-08'),
        daily('2026-01-06'),
        daily('2026-01-05'),
      ],
      'UTC',
      NOW
    );
    expect(r.achievements.find((a) => a.id === 'consistent_week').earned).toBe(true);
  });

  it('respects the user timezone when bucketing days', () => {
    // 2026-01-11T02:00Z is still Jan 10 in New York (UTC-5); with tz it should
    // count as today (Jan 10) and extend the streak rather than being Jan 11.
    const update = { type: 'daily', date: new Date('2026-01-11T02:00:00.000Z') };
    const r = computeGamification([update, daily('2026-01-09')], 'America/New_York', NOW);
    expect(r.currentStreak).toBe(2); // Jan 10 (today) + Jan 09
  });

  it('falls back to createdAt when an update has no date', () => {
    const r = computeGamification(
      [{ type: 'daily', createdAt: new Date('2026-01-10T12:00:00.000Z') }],
      'UTC',
      NOW
    );
    expect(r.activeDays).toBe(1);
    expect(r.currentStreak).toBe(1);
  });
});
