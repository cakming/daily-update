/**
 * Centralized Error Handling Utility
 * Provides user-friendly error messages and consistent error handling
 */

/**
 * Error message mappings for common API errors
 */
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',

  // Authentication errors
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',

  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',

  // Resource errors
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',

  // Server errors
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  DATABASE_ERROR: 'Database error. Please try again later.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',

  // Generic fallback
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

/**
 * Get user-friendly error message from error object
 * @param {Error|Object} error - Error object from API or network
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Network error (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  const { status, data } = error.response;

  // Try to get error message from response data
  if (data?.message) {
    // If backend provides a user-friendly message, use it
    return data.message;
  }

  // Map status codes to user-friendly messages
  switch (status) {
    case 400:
      return data?.error || ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 409:
      return ERROR_MESSAGES.ALREADY_EXISTS;
    case 429:
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.GENERIC_ERROR;
  }
};

/**
 * Get error title based on error type
 * @param {Error|Object} error - Error object
 * @returns {string} Error title for toast/alert
 */
export const getErrorTitle = (error) => {
  if (!error.response) {
    return 'Connection Error';
  }

  const { status } = error.response;

  switch (status) {
    case 400:
      return 'Invalid Input';
    case 401:
      return 'Authentication Required';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 429:
      return 'Too Many Requests';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server Error';
    default:
      return 'Error';
  }
};

/**
 * Show error toast with user-friendly message
 * @param {Error|Object} error - Error object
 * @param {string} customMessage - Optional custom message
 */
export const showErrorToast = (error, customMessage = null) => {
  const title = getErrorTitle(error);
  const description = customMessage || getErrorMessage(error);

  // Import toaster dynamically to avoid circular dependencies
  import('../services/toaster').then(({ toaster }) => {
    toaster.error({
      title,
      description,
      duration: 5000,
    });
  });
};

/**
 * Show success toast
 * @param {string} title - Toast title
 * @param {string} description - Toast description
 */
export const showSuccessToast = (title, description = '') => {
  import('../services/toaster').then(({ toaster }) => {
    toaster.success({
      title,
      description,
      duration: 3000,
    });
  });
};

/**
 * Show warning toast
 * @param {string} title - Toast title
 * @param {string} description - Toast description
 */
export const showWarningToast = (title, description = '') => {
  import('../services/toaster').then(({ toaster }) => {
    toaster.warning({
      title,
      description,
      duration: 4000,
    });
  });
};

/**
 * Show info toast
 * @param {string} title - Toast title
 * @param {string} description - Toast description
 */
export const showInfoToast = (title, description = '') => {
  import('../services/toaster').then(({ toaster }) => {
    toaster.info({
      title,
      description,
      duration: 4000,
    });
  });
};

/**
 * Extract validation errors from response
 * @param {Object} error - Error response object
 * @returns {Object} Field-specific error messages
 */
export const getValidationErrors = (error) => {
  if (!error.response?.data?.errors) {
    return {};
  }

  const errors = error.response.data.errors;
  const fieldErrors = {};

  // Handle express-validator error format
  if (Array.isArray(errors)) {
    errors.forEach((err) => {
      if (err.param) {
        fieldErrors[err.param] = err.msg;
      }
    });
  } else if (typeof errors === 'object') {
    // Handle object-based error format
    Object.keys(errors).forEach((field) => {
      fieldErrors[field] = errors[field];
    });
  }

  return fieldErrors;
};

/**
 * Handle API error with consistent error handling
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message if none available
 * @returns {Object} Processed error information
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);

  const errorInfo = {
    message: getErrorMessage(error),
    title: getErrorTitle(error),
    validationErrors: getValidationErrors(error),
    statusCode: error.response?.status,
  };

  // Show toast notification
  showErrorToast(error, defaultMessage);

  return errorInfo;
};

/**
 * Retry-able error check
 * @param {Error} error - Error object
 * @returns {boolean} Whether the error is retry-able
 */
export const isRetryableError = (error) => {
  if (!error.response) {
    return true; // Network errors are retry-able
  }

  const status = error.response.status;

  // Retry on server errors and rate limiting (after delay)
  return status >= 500 || status === 429;
};

/**
 * Format field name for display
 * @param {string} field - Field name (e.g., 'emailAddress')
 * @returns {string} Formatted field name (e.g., 'Email Address')
 */
export const formatFieldName = (field) => {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default {
  getErrorMessage,
  getErrorTitle,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  getValidationErrors,
  handleApiError,
  isRetryableError,
  formatFieldName,
};
