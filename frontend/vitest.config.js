import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.js'],
    env: {
      VITE_API_URL: 'http://localhost:5000/api'
    },
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000'
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.test.{js,jsx}',
        '**/*.config.js',
        '**/dist/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
