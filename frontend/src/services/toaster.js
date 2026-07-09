/**
 * Centralized toast notification system (Chakra UI v2).
 *
 * Uses Chakra v2's `createStandaloneToast` so toasts can be fired from
 * non-component code (e.g. utils/errorHandler.js). If you actually surface
 * these, mount the returned <ToastContainer/> once near the app root; React
 * components should generally use Chakra's `useToast` hook directly instead.
 */

import { createStandaloneToast } from '@chakra-ui/react';

const { toast, ToastContainer } = createStandaloneToast();

export { ToastContainer };

const fire = (status, options = {}) =>
  toast({
    position: 'top-right',
    isClosable: true,
    status,
    ...options,
  });

/**
 * Object with the same call surface the rest of the app expects
 * (toaster.success({ title, description }), toaster.remove(id), ...).
 */
export const toaster = {
  create: (options = {}) => toast({ position: 'top-right', isClosable: true, ...options }),
  success: (options) => fire('success', options),
  error: (options) => fire('error', options),
  warning: (options) => fire('warning', options),
  info: (options) => fire('info', options),
  loading: (options) => fire('loading', { duration: null, ...options }),
  promise: (promise, options) => toast.promise(promise, options),
  remove: (id) => toast.close(id),
  dismiss: () => toast.closeAll(),
};

/**
 * Helper functions for common toast types
 */

export const showSuccessToast = (title, description = '') =>
  toaster.success({ title, description, duration: 3000 });

export const showErrorToast = (title, description = '') =>
  toaster.error({ title, description, duration: 5000 });

export const showWarningToast = (title, description = '') =>
  toaster.warning({ title, description, duration: 4000 });

export const showInfoToast = (title, description = '') =>
  toaster.info({ title, description, duration: 4000 });

export const showLoadingToast = (title, description = '') =>
  toaster.loading({ title, description });

export const showPromiseToast = (promise, options) =>
  toaster.promise(promise, {
    success: options.success,
    error: options.error,
    loading: options.loading,
  });

export default toaster;
