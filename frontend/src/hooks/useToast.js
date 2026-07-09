/**
 * useToast compatibility hook.
 *
 * Thin adapter over the standalone `toaster` (services/toaster.js, Chakra v2)
 * exposing the familiar `toast({ status })` signature plus helper methods.
 * Most components can just use Chakra's built-in `useToast` from
 * `@chakra-ui/react`; this exists for code that already imports it.
 */

import { useCallback } from 'react';
import { toaster } from '../services/toaster';

/**
 * @returns {Function} Toast function with .success/.error/.warning/.info/.loading/.close/.closeAll
 */
export const useToast = () => {
  const toast = useCallback((options) => {
    const {
      title,
      description = '',
      status = 'info',
      duration = 5000,
      isClosable = true,
      position = 'top-right',
      ...rest
    } = options;

    // Map status to toaster method
    const toastConfig = {
      title,
      description,
      duration,
      ...rest,
    };

    switch (status) {
      case 'success':
        return toaster.success(toastConfig);
      case 'error':
        return toaster.error(toastConfig);
      case 'warning':
        return toaster.warning(toastConfig);
      case 'info':
        return toaster.info(toastConfig);
      case 'loading':
        return toaster.loading({ ...toastConfig, duration: null });
      default:
        return toaster.info(toastConfig);
    }
  }, []);

  // Add helper methods
  toast.success = useCallback((options) => {
    return toast({ ...options, status: 'success' });
  }, [toast]);

  toast.error = useCallback((options) => {
    return toast({ ...options, status: 'error' });
  }, [toast]);

  toast.warning = useCallback((options) => {
    return toast({ ...options, status: 'warning' });
  }, [toast]);

  toast.info = useCallback((options) => {
    return toast({ ...options, status: 'info' });
  }, [toast]);

  toast.loading = useCallback((options) => {
    return toast({ ...options, status: 'loading' });
  }, [toast]);

  // Close and closeAll methods
  toast.close = useCallback((id) => {
    toaster.remove(id);
  }, []);

  toast.closeAll = useCallback(() => {
    toaster.dismiss();
  }, []);

  toast.isActive = useCallback((id) => {
    // Chakra v3 doesn't have direct isActive, return false
    return false;
  }, []);

  return toast;
};

export default useToast;
