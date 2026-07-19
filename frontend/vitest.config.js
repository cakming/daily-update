import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only measure application source — not build output, e2e specs, test
      // helpers, or non-product infrastructure (monitoring shims, decorative
      // animation/perf utilities).
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/__tests__/**',
        'src/test-utils/**',
        'src/main.jsx',
        'src/App.jsx',
        'src/**/*.config.js',
        'src/config/**',
        'src/utils/animations.js',
        'src/utils/performance.js',
        'src/utils/sentry.js',
        '**/vite-env.d.ts',
      ],
      // Ratchet gate: set just below current source coverage so the build stays
      // green while preventing regressions. Target is 80% (matching the
      // backend) — raise these numbers as component tests are added.
      thresholds: {
        statements: 75,
        branches: 72,
        lines: 75,
        functions: 47,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
