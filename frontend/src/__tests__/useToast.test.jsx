/**
 * Unit tests for the v2-compatibility useToast hook (hooks/useToast.js).
 *
 * The hook adapts the old Chakra v2 useToast call signature onto the v3-style
 * `toaster` created in services/toaster.js. Because that service uses Chakra
 * v3's `createToaster` (absent in this project's Chakra v2), we mock
 * `createToaster` to return a spyable toaster and assert the hook maps each
 * `status` onto the correct toaster method.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockToaster } = vi.hoisted(() => ({
  mockToaster: {
    create: vi.fn(() => 'toast-id'),
    success: vi.fn(() => 'toast-id'),
    error: vi.fn(() => 'toast-id'),
    warning: vi.fn(() => 'toast-id'),
    info: vi.fn(() => 'toast-id'),
    loading: vi.fn(() => 'toast-id'),
    promise: vi.fn(() => 'toast-id'),
    remove: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createToaster: () => mockToaster };
});

import { useToast } from '../hooks/useToast';

describe('useToast hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a callable toast function with helper methods', () => {
    const { result } = renderHook(() => useToast());
    const toast = result.current;

    expect(typeof toast).toBe('function');
    ['success', 'error', 'warning', 'info', 'loading', 'close', 'closeAll', 'isActive']
      .forEach((m) => expect(typeof toast[m]).toBe('function'));
  });

  it('maps each status to the matching toaster method', () => {
    const { result } = renderHook(() => useToast());
    const toast = result.current;

    toast({ title: 'S', status: 'success' });
    expect(mockToaster.success).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'S' })
    );

    toast({ title: 'E', status: 'error' });
    expect(mockToaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'E' })
    );

    toast({ title: 'W', status: 'warning' });
    expect(mockToaster.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'W' })
    );

    toast({ title: 'L', status: 'loading' });
    expect(mockToaster.loading).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'L', duration: null })
    );
  });

  it('defaults to the info toaster when status is omitted', () => {
    const { result } = renderHook(() => useToast());
    result.current({ title: 'Default' });
    expect(mockToaster.info).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Default' })
    );
  });

  it('convenience helpers route through the correct method', () => {
    const { result } = renderHook(() => useToast());
    const toast = result.current;

    toast.success({ title: 'yay' });
    expect(mockToaster.success).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'yay' })
    );

    toast.error({ title: 'boo' });
    expect(mockToaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'boo' })
    );
  });

  it('closeAll delegates to toaster.dismiss and isActive returns false', () => {
    const { result } = renderHook(() => useToast());
    result.current.closeAll();
    expect(mockToaster.dismiss).toHaveBeenCalled();
    expect(result.current.isActive('x')).toBe(false);
  });
});
