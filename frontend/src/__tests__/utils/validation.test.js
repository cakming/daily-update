import { describe, it, expect } from 'vitest';
import {
  isEmpty,
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
  validateUrl,
  validateDate,
  validateFutureDate,
  validatePastDate,
  validateTime,
  validatePositiveNumber,
  validateInteger,
  validateForm,
  hasErrors,
  createValidator,
  combineValidators,
} from '../../utils/validation';

describe('validation utils', () => {
  describe('isEmpty', () => {
    it('detects empty across types', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty('x')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty(0)).toBe(false);
    });
  });

  describe('field validators return null when valid, a message when not', () => {
    it('validateRequired', () => {
      expect(validateRequired('')).toBeTruthy();
      expect(validateRequired('x')).toBeNull();
    });

    it('validateEmail', () => {
      expect(validateEmail('')).toBeNull(); // empty defers to required
      expect(validateEmail('nope')).toBeTruthy();
      expect(validateEmail('a@b.com')).toBeNull();
    });

    it('validatePassword', () => {
      expect(validatePassword('short')).toBeTruthy();
      expect(validatePassword('longenough123')).toBeNull();
    });

    it('validatePasswordMatch', () => {
      expect(validatePasswordMatch('a', 'b')).toBeTruthy();
      expect(validatePasswordMatch('abc', 'abc')).toBeNull();
      expect(validatePasswordMatch('abc', '')).toBeNull();
    });

    it('validateName (too short / too long / ok)', () => {
      expect(validateName('a')).toBeTruthy();
      expect(validateName('y'.repeat(200))).toBeTruthy();
      expect(validateName('Alice')).toBeNull();
    });

    it('validateUrl', () => {
      expect(validateUrl('not a url')).toBeTruthy();
      expect(validateUrl('https://example.com')).toBeNull();
      expect(validateUrl('')).toBeNull();
    });

    it('validateDate', () => {
      expect(validateDate('not-a-date')).toBeTruthy();
      expect(validateDate('2026-01-01')).toBeNull();
    });

    it('validateFutureDate / validatePastDate', () => {
      const past = '2000-01-01';
      const future = '2999-01-01';
      expect(validateFutureDate(past)).toBeTruthy();
      expect(validateFutureDate(future)).toBeNull();
      expect(validatePastDate(future)).toBeTruthy();
      expect(validatePastDate(past)).toBeNull();
    });

    it('validateTime', () => {
      expect(validateTime('99:99')).toBeTruthy();
      expect(validateTime('09:30')).toBeNull();
    });

    it('validatePositiveNumber / validateInteger', () => {
      expect(validatePositiveNumber('-1')).toBeTruthy();
      expect(validatePositiveNumber('5')).toBeNull();
      expect(validateInteger('1.5')).toBeTruthy();
      expect(validateInteger('3')).toBeNull();
    });
  });

  describe('validateForm + hasErrors', () => {
    it('collects the first error per field and reports presence', () => {
      const errors = validateForm(
        { email: 'bad', name: '' },
        { email: [validateRequired, validateEmail], name: [validateRequired] }
      );
      expect(errors.email).toBeTruthy();
      expect(errors.name).toBeTruthy();
      expect(hasErrors(errors)).toBe(true);

      const clean = validateForm(
        { email: 'a@b.com' },
        { email: [validateRequired, validateEmail] }
      );
      expect(hasErrors(clean)).toBe(false);
    });
  });

  describe('createValidator + combineValidators', () => {
    it('createValidator maps a predicate to an error message', () => {
      const isYes = createValidator((v) => v === 'yes', 'must be yes');
      expect(isYes('no')).toBe('must be yes');
      expect(isYes('yes')).toBeNull();
    });

    it('combineValidators returns the first error', () => {
      const combined = combineValidators(validateRequired, validateEmail);
      expect(combined('')).toBeTruthy(); // required fires first
      expect(combined('bad')).toBeTruthy(); // then email
      expect(combined('a@b.com')).toBeNull();
    });
  });
});
