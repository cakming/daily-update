import { describe, it, expect } from '@jest/globals';
import { zonedWallClockToUtc, partsInZone, addDays } from '../../../utils/timezone.js';
import ScheduledUpdate from '../../../models/ScheduledUpdate.js';

describe('timezone utils', () => {
  it('converts a wall-clock time in a zone to the correct UTC instant', () => {
    // 2026-01-15 09:00 in New York (EST, UTC-5) === 14:00 UTC.
    const utc = zonedWallClockToUtc(
      { year: 2026, month: 1, day: 15, hour: 9, minute: 0 },
      'America/New_York'
    );
    expect(utc.toISOString()).toBe('2026-01-15T14:00:00.000Z');
  });

  it('round-trips wall-clock parts through a zone', () => {
    const utc = zonedWallClockToUtc(
      { year: 2026, month: 7, day: 1, hour: 8, minute: 30 },
      'Asia/Tokyo'
    );
    const parts = partsInZone(utc, 'Asia/Tokyo');
    expect(parts).toMatchObject({ year: 2026, month: 7, day: 1, hour: 8, minute: 30 });
  });

  it('addDays normalizes month/year overflow', () => {
    expect(addDays({ year: 2026, month: 1, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 2,
      day: 1,
    });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
  });

  it('falls back to UTC for an invalid timezone', () => {
    const utc = zonedWallClockToUtc(
      { year: 2026, month: 1, day: 1, hour: 12, minute: 0 },
      'Not/AZone'
    );
    expect(utc.toISOString()).toBe('2026-01-01T12:00:00.000Z');
  });
});

describe('ScheduledUpdate.calculateNextRun (timezone-aware)', () => {
  const makeSchedule = (overrides) =>
    new ScheduledUpdate({
      userId: '507f1f77bcf86cd799439011',
      type: 'daily',
      content: 'x',
      scheduledTime: '09:00',
      ...overrides,
    });

  it('fires at the scheduled wall-clock time in the schedule timezone', () => {
    const sched = makeSchedule({
      scheduleType: 'daily',
      timezone: 'America/New_York',
    });
    const next = sched.calculateNextRun();
    const parts = partsInZone(next, 'America/New_York');
    expect(parts.hour).toBe(9);
    expect(parts.minute).toBe(0);
    expect(next.getTime()).toBeGreaterThan(Date.now());
  });

  it('uses a different instant for the same time in a different timezone', () => {
    const ny = makeSchedule({ scheduleType: 'daily', timezone: 'America/New_York' }).calculateNextRun();
    const tokyo = makeSchedule({ scheduleType: 'daily', timezone: 'Asia/Tokyo' }).calculateNextRun();
    // Same wall-clock 09:00 but different zones -> different UTC minute-of-day.
    const nyMin = partsInZone(ny, 'UTC').hour * 60 + partsInZone(ny, 'UTC').minute;
    const tokyoMin = partsInZone(tokyo, 'UTC').hour * 60 + partsInZone(tokyo, 'UTC').minute;
    expect(nyMin).not.toBe(tokyoMin);
  });

  it('computes the correct weekday occurrence in the timezone', () => {
    const sched = makeSchedule({
      scheduleType: 'weekly',
      dayOfWeek: 3, // Wednesday
      timezone: 'UTC',
    });
    const next = sched.calculateNextRun();
    expect(partsInZone(next, 'UTC').weekday).toBe(3);
    expect(next.getTime()).toBeGreaterThan(Date.now());
  });
});
