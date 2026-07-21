import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['test/integration/**/*.integration.vitest.{ts,tsx}'],
    environment: 'happy-dom',
    setupFiles: ['test/integration/setup.ts'],
    globals: true,
  },
});
