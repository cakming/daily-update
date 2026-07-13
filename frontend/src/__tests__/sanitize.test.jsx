/**
 * Unit tests for the HTML sanitization helpers in utils/sanitize.js.
 *
 * These exercise the two exported helpers (`sanitize` and `sanitizeText`)
 * directly — no DOM rendering is required beyond the jsdom `window` DOMPurify
 * relies on. The focus is the security-relevant behavior: event handlers,
 * <script> tags and javascript: URIs must never survive sanitization, and
 * non-string input must degrade to an empty string.
 */
import { describe, it, expect } from 'vitest';
import { sanitize, sanitizeText } from '../utils/sanitize';
import defaultSanitize from '../utils/sanitize';

describe('sanitize()', () => {
  it('strips inline event handlers like onerror', () => {
    const result = sanitize('<img src=x onerror=alert(1)>');
    expect(result.toLowerCase()).not.toContain('onerror');
    expect(result.toLowerCase()).not.toContain('alert');
  });

  it('removes <script> tags entirely', () => {
    const result = sanitize('<div>ok</div><script>alert(1)</script>');
    expect(result).toContain('ok');
    expect(result.toLowerCase()).not.toContain('<script');
  });

  it('neutralizes javascript: URIs on anchors', () => {
    const result = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result.toLowerCase()).not.toContain('javascript:');
    // The link text is preserved even though the dangerous href is stripped.
    expect(result).toContain('click');
  });

  it('keeps benign markup intact', () => {
    const result = sanitize('<p>Hello <strong>world</strong></p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('world');
  });

  it('returns an empty string for non-string input', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
    expect(sanitize(42)).toBe('');
    expect(sanitize({})).toBe('');
  });

  it('exposes sanitize as the default export', () => {
    expect(defaultSanitize).toBe(sanitize);
  });
});

describe('sanitizeText()', () => {
  it('strips all markup, leaving only text', () => {
    expect(sanitizeText('<b>hi</b>')).toBe('hi');
    expect(sanitizeText('<p>one</p><p>two</p>')).toContain('one');
    expect(sanitizeText('<p>one</p><p>two</p>')).not.toContain('<p>');
  });

  it('returns an empty string for non-string input', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(123)).toBe('');
  });
});
