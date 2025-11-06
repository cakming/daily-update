import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend Vitest's expect with Jest DOM matchers
expect.extend(matchers);

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:5000/api');

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
  global.localStorage.clear();
});

// Close MSW server after all tests
afterAll(() => server.close());

// Mock localStorage with actual storage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock window.location
delete window.location;
window.location = { href: '', assign: vi.fn(), replace: vi.fn(), reload: vi.fn() };
