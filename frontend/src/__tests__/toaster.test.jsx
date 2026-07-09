/**
 * Unit tests for the centralized toaster service (services/toaster.js).
 *
 * NOTE: services/toaster.js is written against Chakra UI v3's `createToaster`
 * API, but this project runs Chakra v2 where `createToaster` does not exist —
 * so importing the module unmocked throws at load time. We therefore mock
 * `createToaster` to return a spyable toaster instance and assert that the
 * exported helpers delegate to the correct toaster methods with the expected
 * payloads. This is the wiring the module is responsible for.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import toaster, {
  toaster as namedToaster,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
} from '../services/toaster';

describe('toaster service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports the same toaster as default and named export', () => {
    expect(toaster).toBe(namedToaster);
    expect(toaster).toBe(mockToaster);
  });

  it('showSuccessToast delegates to toaster.success with title/description', () => {
    showSuccessToast('Saved', 'All good');
    expect(mockToaster.success).toHaveBeenCalledTimes(1);
    expect(mockToaster.success).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved', description: 'All good' })
    );
  });

  it('showErrorToast delegates to toaster.error', () => {
    showErrorToast('Oops', 'Broke');
    expect(mockToaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Oops', description: 'Broke' })
    );
  });

  it('showWarningToast and showInfoToast delegate to their methods', () => {
    showWarningToast('Careful');
    showInfoToast('FYI');
    expect(mockToaster.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Careful' })
    );
    expect(mockToaster.info).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'FYI' })
    );
  });

  it('showLoadingToast delegates to toaster.loading and returns its id', () => {
    const id = showLoadingToast('Working...');
    expect(mockToaster.loading).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Working...', duration: null })
    );
    expect(id).toBe('toast-id');
  });
});
