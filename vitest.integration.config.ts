import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/integration/**/*.integration.vitest.{ts,tsx}'],
    environment: 'happy-dom',
    setupFiles: ['test/integration/setup.ts'],
    globals: true,
  },
});
