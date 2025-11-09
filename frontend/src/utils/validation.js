/**
 * Form Validation Utility
 * Provides reusable validation functions and error messages
 */

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
};

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_MISMATCH: 'Passwords do not match',
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Name must not exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  INVALID_URL: 'Please enter a valid URL',
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_DATE_ONLY: 'Date must be in the future',
  PAST_DATE_ONLY: 'Date must be in the past',
  INVALID_TIME: 'Please enter a valid time',
  POSITIVE_NUMBER: 'Please enter a positive number',
  INTEGER_ONLY: 'Please enter a whole number',
};

/**
 * Check if value is empty
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate required field
 * @param {any} value - Field value
 * @returns {string|null} Error message or null
 */
export const validateRequired = (value) => {
  return isEmpty(value) ? VALIDATION_MESSAGES.REQUIRED : null;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {string|null} Error message or null
 */
export const validateEmail = (email) => {
  if (isEmpty(email)) return null;
  return VALIDATION_RULES.EMAIL.test(email) ? null : VALIDATION_MESSAGES.INVALID_EMAIL;
};

/**
 * Validate password length
 * @param {string} password - Password
 * @returns {string|null} Error message or null
 */
export const validatePassword = (password) => {
  if (isEmpty(password)) return null;
  return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH
    ? null
    : VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {string|null} Error message or null
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (isEmpty(confirmPassword)) return null;
  return password === confirmPassword ? null : VALIDATION_MESSAGES.PASSWORD_MISMATCH;
};

/**
 * Validate name length
 * @param {string} name - Name
 * @returns {string|null} Error message or null
 */
export const validateName = (name) => {
  if (isEmpty(name)) return null;

  const trimmedName = name.trim();

  if (trimmedName.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return VALIDATION_MESSAGES.NAME_TOO_SHORT;
  }

  if (trimmedName.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return VALIDATION_MESSAGES.NAME_TOO_LONG;
  }

  return null;
};

/**
 * Validate URL format
 * @param {string} url - URL
 * @returns {string|null} Error message or null
 */
export const validateUrl = (url) => {
  if (isEmpty(url)) return null;

  try {
    new URL(url);
    return null;
  } catch {
    return VALIDATION_MESSAGES.INVALID_URL;
  }
};

/**
 * Validate date
 * @param {string} date - Date string
 * @returns {string|null} Error message or null
 */
export const validateDate = (date) => {
  if (isEmpty(date)) return null;

  const dateObj = new Date(date);
  return isNaN(dateObj.getTime()) ? VALIDATION_MESSAGES.INVALID_DATE : null;
};

/**
 * Validate future date
 * @param {string} date - Date string
 * @returns {string|null} Error message or null
 */
export const validateFutureDate = (date) => {
  if (isEmpty(date)) return null;

  const dateError = validateDate(date);
  if (dateError) return dateError;

  const dateObj = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return dateObj >= now ? null : VALIDATION_MESSAGES.FUTURE_DATE_ONLY;
};

/**
 * Validate past date
 * @param {string} date - Date string
 * @returns {string|null} Error message or null
 */
export const validatePastDate = (date) => {
  if (isEmpty(date)) return null;

  const dateError = validateDate(date);
  if (dateError) return dateError;

  const dateObj = new Date(date);
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  return dateObj <= now ? null : VALIDATION_MESSAGES.PAST_DATE_ONLY;
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string
 * @returns {string|null} Error message or null
 */
export const validateTime = (time) => {
  if (isEmpty(time)) return null;

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time) ? null : VALIDATION_MESSAGES.INVALID_TIME;
};

/**
 * Validate positive number
 * @param {number|string} value - Number value
 * @returns {string|null} Error message or null
 */
export const validatePositiveNumber = (value) => {
  if (isEmpty(value)) return null;

  const num = Number(value);
  return !isNaN(num) && num > 0 ? null : VALIDATION_MESSAGES.POSITIVE_NUMBER;
};

/**
 * Validate integer
 * @param {number|string} value - Number value
 * @returns {string|null} Error message or null
 */
export const validateInteger = (value) => {
  if (isEmpty(value)) return null;

  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num) ? null : VALIDATION_MESSAGES.INTEGER_ONLY;
};

/**
 * Validate form fields
 * @param {Object} values - Form values
 * @param {Object} rules - Validation rules { fieldName: [validator1, validator2, ...] }
 * @returns {Object} Validation errors { fieldName: errorMessage }
 */
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const validators = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    const value = values[field];

    for (const validator of validators) {
      const error = typeof validator === 'function' ? validator(value, values) : null;
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });

  return errors;
};

/**
 * Check if form has errors
 * @param {Object} errors - Error object
 * @returns {boolean}
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).some((key) => errors[key] !== null && errors[key] !== '');
};

/**
 * Create a custom validator
 * @param {Function} validateFn - Validation function
 * @param {string} errorMessage - Error message
 * @returns {Function} Validator function
 */
export const createValidator = (validateFn, errorMessage) => {
  return (value, allValues) => {
    return validateFn(value, allValues) ? null : errorMessage;
  };
};

/**
 * Combine multiple validators
 * @param {...Function} validators - Validator functions
 * @returns {Function} Combined validator
 */
export const combineValidators = (...validators) => {
  return (value, allValues) => {
    for (const validator of validators) {
      const error = validator(value, allValues);
      if (error) return error;
    }
    return null;
  };
};

/**
 * Common validation rule sets
 */
export const COMMON_VALIDATIONS = {
  email: [validateRequired, validateEmail],
  password: [validateRequired, validatePassword],
  name: [validateRequired, validateName],
  requiredField: [validateRequired],
  url: [validateUrl],
  date: [validateDate],
  futureDate: [validateRequired, validateFutureDate],
  pastDate: [validateRequired, validatePastDate],
  time: [validateTime],
  positiveNumber: [validateRequired, validatePositiveNumber],
  integer: [validateRequired, validateInteger],
};

export default {
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
  isEmpty,
  VALIDATION_RULES,
  VALIDATION_MESSAGES,
  COMMON_VALIDATIONS,
};
