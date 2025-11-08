/**
 * Chakra UI v3 Toaster Configuration
 * Centralized toast notification system
 */

import { createToaster } from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'top-right',
  duration: 5000,
  pauseOnPageIdle: true,
});

/**
 * Helper functions for common toast types
 */

export const showSuccessToast = (title, description = '') => {
  toaster.success({
    title,
    description,
    duration: 3000,
  });
};

export const showErrorToast = (title, description = '') => {
  toaster.error({
    title,
    description,
    duration: 5000,
  });
};

export const showWarningToast = (title, description = '') => {
  toaster.warning({
    title,
    description,
    duration: 4000,
  });
};

export const showInfoToast = (title, description = '') => {
  toaster.info({
    title,
    description,
    duration: 4000,
  });
};

export const showLoadingToast = (title, description = '') => {
  return toaster.loading({
    title,
    description,
    duration: null, // Stay until manually closed
  });
};

export const showPromiseToast = (promise, options) => {
  return toaster.promise(promise, {
    success: options.success,
    error: options.error,
    loading: options.loading,
  });
};

export default toaster;
