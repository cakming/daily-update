/**
 * Unit tests for the v2 useToast compatibility hook (hooks/useToast.js).
 *
 * The hook adapts the `toast({ status })` call signature onto the standalone
 * `toaster` (services/toaster.js). We mock that service to a spyable toaster
 * and assert the hook maps each status onto the matching toaster method.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockToaster } = vi.hoisted(() => ({
  mockToaster: {
    success: vi.fn(() => 'id'),
    error: vi.fn(() => 'id'),
    warning: vi.fn(() => 'id'),
    info: vi.fn(() => 'id'),
    loading: vi.fn(() => 'id'),
    remove: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('../services/toaster', () => ({ toaster: mockToaster, default: mockToaster }));

import { useToast } from '../hooks/useToast';

describe('useToast hook (v2 compatibility)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps each status to the matching toaster method', () => {
    const { result } = renderHook(() => useToast());
    result.current({ title: 'S', status: 'success' });
    result.current({ title: 'E', status: 'error' });
    result.current({ title: 'W', status: 'warning' });
    result.current({ title: 'I', status: 'info' });
    expect(mockToaster.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'S' }));
    expect(mockToaster.error).toHaveBeenCalledWith(expect.objectContaining({ title: 'E' }));
    expect(mockToaster.warning).toHaveBeenCalledWith(expect.objectContaining({ title: 'W' }));
    expect(mockToaster.info).toHaveBeenCalledWith(expect.objectContaining({ title: 'I' }));
  });

  it('defaults to info when status is omitted', () => {
    const { result } = renderHook(() => useToast());
    result.current({ title: 'X' });
    expect(mockToaster.info).toHaveBeenCalled();
  });

  it('loading forces duration null', () => {
    const { result } = renderHook(() => useToast());
    result.current({ title: 'L', status: 'loading' });
    expect(mockToaster.loading).toHaveBeenCalledWith(expect.objectContaining({ duration: null }));
  });

  it('helper methods, close/closeAll and isActive work', () => {
    const { result } = renderHook(() => useToast());
    result.current.success({ title: 'S' });
    result.current.error({ title: 'E' });
    expect(mockToaster.success).toHaveBeenCalled();
    expect(mockToaster.error).toHaveBeenCalled();

    result.current.close('id1');
    result.current.closeAll();
    expect(mockToaster.remove).toHaveBeenCalledWith('id1');
    expect(mockToaster.dismiss).toHaveBeenCalled();

    expect(result.current.isActive('x')).toBe(false);
  });
});
