import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // PGlite arranca un Postgres por archivo; le sobra con esto y no queda
    // colgado para siempre si algo se traba.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
