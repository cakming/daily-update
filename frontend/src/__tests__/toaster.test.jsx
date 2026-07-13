/**
 * Unit tests for the centralized toaster service (services/toaster.js).
 *
 * The service uses Chakra v2's `createStandaloneToast`, which returns a
 * `toast()` function (with .close/.closeAll/.promise). We mock it to a spyable
 * function and assert the exported helpers fire toasts with the right status
 * and payload.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockToast } = vi.hoisted(() => {
  const t = vi.fn(() => 'toast-id');
  t.close = vi.fn();
  t.closeAll = vi.fn();
  t.promise = vi.fn(() => 'toast-id');
  return { mockToast: t };
});

vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createStandaloneToast: () => ({ toast: mockToast, ToastContainer: () => null }),
  };
});

import toaster, {
  toaster as namedToaster,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
} from '../services/toaster';

describe('toaster service (Chakra v2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('default and named exports are the same toaster', () => {
    expect(toaster).toBe(namedToaster);
  });

  it('toaster.success fires a success-status toast', () => {
    toaster.success({ title: 'Saved' });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', title: 'Saved' })
    );
  });

  it('showSuccessToast delegates with success status + title/description', () => {
    showSuccessToast('Saved', 'All good');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', title: 'Saved', description: 'All good' })
    );
  });

  it('showErrorToast fires an error toast', () => {
    showErrorToast('Oops', 'Broke');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', title: 'Oops', description: 'Broke' })
    );
  });

  it('warning and info helpers map to their statuses', () => {
    showWarningToast('Careful');
    showInfoToast('FYI');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'warning', title: 'Careful' })
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'info', title: 'FYI' })
    );
  });

  it('showLoadingToast fires a loading toast with duration null and returns the id', () => {
    const id = showLoadingToast('Working...');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'loading', title: 'Working...', duration: null })
    );
    expect(id).toBe('toast-id');
  });

  it('remove/dismiss delegate to toast.close/closeAll', () => {
    toaster.remove('abc');
    toaster.dismiss();
    expect(mockToast.close).toHaveBeenCalledWith('abc');
    expect(mockToast.closeAll).toHaveBeenCalled();
  });
});
