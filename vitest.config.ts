import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@piercyn/db': path.resolve(__dirname, './packages/db/src'),
      '@piercyn/types': path.resolve(__dirname, './packages/types/src'),
      '@piercyn/config': path.resolve(__dirname, './packages/config/src'),
      '@piercyn/utils': path.resolve(__dirname, './packages/utils/src'),
    },
  },
});
