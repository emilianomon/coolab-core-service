import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@self': resolve(__dirname, './src'),
    },
  },
  test: {
    coverage: {
      exclude: [
        'eslint.config.cjs',
        '**/*.config.*',
        '**/*.d.ts',
        '**/index.ts',
        'dist/**',
        'node_modules/**',
        'scripts/**',
        'src/database/migrations/**',
        'src/database/tables/**',
        'src/validation/**',
      ],
      provider: 'v8',
      reporter: ['text'],
    },
    environment: 'node',
    exclude: ['node_modules', 'dist', '.git'],
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10000,
  },
});
