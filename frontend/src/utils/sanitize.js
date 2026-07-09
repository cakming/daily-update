/**
 * HTML sanitization helpers (DOMPurify).
 *
 * SECURITY AUDIT NOTE
 * -------------------
 * As of this writing there are NO `dangerouslySetInnerHTML` usages anywhere in
 * `frontend/src` (verified via `grep -rn "dangerouslySetInnerHTML" frontend/src`).
 * Every place that renders user- or AI-generated content (daily/weekly update
 * output, template content, company descriptions, etc.) renders it as plain
 * text through JSX, and React auto-escapes text nodes. The XSS risk in the
 * current UI is therefore already low, and we deliberately do NOT force
 * DOMPurify into the render path where it would strip legitimate characters
 * from plain-text output.
 *
 * This module exists as the single, reusable place to sanitize HTML if/when a
 * feature genuinely needs to render raw markup (e.g. rendering rich-text or
 * Markdown-converted-to-HTML from AI responses). If you ever reach for
 * `dangerouslySetInnerHTML`, wrap the value in `sanitize()` first.
 *
 * Usage:
 *   import { sanitize } from '../utils/sanitize';
 *   <div dangerouslySetInnerHTML={{ __html: sanitize(htmlFromApi) }} />
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string, returning markup safe to inject via
 * dangerouslySetInnerHTML. Non-string input yields an empty string.
 *
 * @param {string} dirty - Untrusted HTML (e.g. AI/user generated).
 * @param {object} [options] - Optional DOMPurify config overrides.
 * @returns {string} Sanitized HTML.
 */
export const sanitize = (dirty, options = {}) => {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    // Never allow inline event handlers or javascript: URIs to survive.
    FORBID_ATTR: ['style', 'onerror', 'onload'],
    ...options,
  });
};

/**
 * Strip ALL markup, returning plain text only. Useful for defensively
 * neutralizing any HTML in values that are meant to be displayed as text
 * (e.g. before passing to a context where escaping is not guaranteed).
 *
 * @param {string} dirty - Untrusted string.
 * @returns {string} Text with all tags removed.
 */
export const sanitizeText = (dirty) => {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export default sanitize;
