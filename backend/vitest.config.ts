import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.test.ts',
        'tests/',
        'src/index.ts',
        'drizzle.config.ts',
        'vitest.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});