/**
 * Minimal timezone helpers built on the platform Intl API (no dependencies),
 * so scheduled times are interpreted in the user's timezone rather than the
 * server's. DST-correct: offsets are computed at the specific instant.
 */

// How many minutes `timeZone` is ahead of UTC at the given instant.
const zoneOffsetMinutes = (timeZone, date) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  // Intl renders 24:00 as hour "24" at midnight in some environments.
  const hour = p.hour === '24' ? 0 : Number(p.hour);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, hour, p.minute, p.second);
  return (asUTC - date.getTime()) / 60000;
};

/**
 * Convert a wall-clock time expressed in `timeZone` to a UTC Date instant.
 * Falls back to treating the input as UTC when the zone is invalid.
 */
export const zonedWallClockToUtc = ({ year, month, day, hour = 0, minute = 0 }, timeZone) => {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  try {
    const offset = zoneOffsetMinutes(timeZone, new Date(guessUtc));
    return new Date(guessUtc - offset * 60000);
  } catch {
    return new Date(guessUtc);
  }
};

const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Wall-clock parts of `date` as seen in `timeZone`.
 */
export const partsInZone = (date, timeZone) => {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
    return {
      year: Number(p.year),
      month: Number(p.month),
      day: Number(p.day),
      hour: p.hour === '24' ? 0 : Number(p.hour),
      minute: Number(p.minute),
      weekday: WEEKDAY[p.weekday],
    };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      weekday: date.getUTCDay(),
    };
  }
};

/**
 * Return {year, month, day} `n` calendar days after the given parts, with
 * month/year overflow normalized.
 */
export const addDays = (parts, n) => {
  const t = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + n));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};
