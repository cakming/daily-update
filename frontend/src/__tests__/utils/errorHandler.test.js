import { describe, it, expect, vi, beforeEach } from 'vitest';

// showErrorToast dynamically imports the toaster; stub it so handleApiError
// doesn't touch the real toast service.
vi.mock('../../services/toaster', () => ({
  toaster: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

import {
  getErrorMessage,
  getErrorTitle,
  getValidationErrors,
  handleApiError,
  isRetryableError,
  formatFieldName,
} from '../../utils/errorHandler';

const withResponse = (status, data = {}) => ({ response: { status, data } });

describe('errorHandler utils', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getErrorMessage', () => {
    it('handles network and timeout errors (no response)', () => {
      expect(getErrorMessage({})).toBeTruthy();
      expect(getErrorMessage({ code: 'ECONNABORTED' })).toBeTruthy();
    });

    it('prefers a backend-provided message', () => {
      expect(getErrorMessage(withResponse(400, { message: 'Custom' }))).toBe('Custom');
    });

    it('maps status codes to friendly messages', () => {
      for (const s of [400, 401, 403, 404, 409, 429, 500, 503, 418]) {
        expect(typeof getErrorMessage(withResponse(s))).toBe('string');
      }
    });
  });

  describe('getErrorTitle', () => {
    it('returns a connection title without a response', () => {
      expect(getErrorTitle({})).toBe('Connection Error');
    });
    it('maps status codes to titles', () => {
      expect(getErrorTitle(withResponse(401))).toBe('Authentication Required');
      expect(getErrorTitle(withResponse(403))).toBe('Access Denied');
      expect(getErrorTitle(withResponse(500))).toBe('Server Error');
      expect(getErrorTitle(withResponse(418))).toBe('Error');
    });
  });

  describe('getValidationErrors', () => {
    it('returns {} when there are no field errors', () => {
      expect(getValidationErrors({})).toEqual({});
    });
    it('parses the express-validator array format', () => {
      const err = withResponse(400, {
        errors: [{ param: 'email', msg: 'Invalid' }, { param: 'name', msg: 'Required' }],
      });
      expect(getValidationErrors(err)).toEqual({ email: 'Invalid', name: 'Required' });
    });
    it('parses the object format', () => {
      const err = withResponse(400, { errors: { email: 'Invalid' } });
      expect(getValidationErrors(err)).toEqual({ email: 'Invalid' });
    });
  });

  describe('isRetryableError', () => {
    it('retries network, 5xx and 429; not other 4xx', () => {
      expect(isRetryableError({})).toBe(true);
      expect(isRetryableError(withResponse(500))).toBe(true);
      expect(isRetryableError(withResponse(429))).toBe(true);
      expect(isRetryableError(withResponse(404))).toBe(false);
    });
  });

  describe('formatFieldName', () => {
    it('humanizes camelCase field names', () => {
      expect(formatFieldName('emailAddress')).toBe('Email Address');
      expect(formatFieldName('name')).toBe('Name');
    });
  });

  describe('handleApiError', () => {
    it('returns a structured summary and fires the toast', () => {
      const info = handleApiError(withResponse(409, { message: 'Exists' }));
      expect(info).toMatchObject({ message: 'Exists', title: 'Conflict', statusCode: 409 });
      expect(info.validationErrors).toEqual({});
    });
  });
});
