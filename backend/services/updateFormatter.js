import NotificationPreference from '../models/NotificationPreference.js';

/**
 * Shared formatting layer for notification surfaces (email, Telegram, Google
 * Chat). Every surface used to read Update fields directly and each drifted
 * from the schema independently (company vs companyId, content vs
 * formattedOutput, period vs dateRange, a non-existent aiSummary). This module
 * is the single place those fields are read, so a schema change only has to be
 * reflected here.
 *
 * `formatUpdate` returns a normalized view; each surface renders it in its own
 * shape (HTML, Markdown, a card).
 */

const DEFAULT_MAX_BODY = 500;

/**
 * Normalize a (populated) Update into the fields every surface needs.
 * @param {object} update - an Update document (companyId/tags may be populated)
 * @param {object} [options]
 * @param {'full'|'summary'} [options.summaryMode='full'] - body content mode
 */
export const formatUpdate = (update, { summaryMode = 'full' } = {}) => {
  const isWeekly = update.type === 'weekly';
  const companyName = update.companyId?.name || null;

  const full = update.formattedOutput || '';
  const summary = update.aiSummary || '';
  // In summary mode use the short aiSummary, falling back to the full output
  // when no summary was derived (older records).
  const body = summaryMode === 'summary' ? summary || full : full;

  return {
    kind: isWeekly ? 'weekly' : 'daily',
    title: isWeekly ? 'Weekly Summary' : 'Daily Update',
    companyName,
    companyLabel: companyName || 'No Company',
    date: isWeekly ? null : update.date || update.createdAt,
    dateRange: isWeekly
      ? { start: update.dateRange?.start, end: update.dateRange?.end }
      : null,
    dailyUpdatesCount: isWeekly ? update.dailyUpdates?.length || 0 : null,
    tags: (update.tags || []).map((t) => t?.name).filter(Boolean),
    body,
    summaryMode,
  };
};

/**
 * Truncate text to `max` chars, appending an ellipsis when cut.
 */
export const truncate = (text = '', max = DEFAULT_MAX_BODY) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

/**
 * Resolve a user's notification summary mode, defaulting to 'full' when no
 * preference row exists.
 */
export const getSummaryMode = async (userId) => {
  try {
    const prefs = await NotificationPreference.findOne({ userId }).select('summaryMode');
    return prefs?.summaryMode === 'summary' ? 'summary' : 'full';
  } catch {
    return 'full';
  }
};
