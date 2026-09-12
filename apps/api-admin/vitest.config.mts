import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    hookTimeout: 120_000,
    testTimeout: 30_000,
    resolve: {
      alias: [
        { find: '@repo/auth', replacement: '/Users/rudraabhisheksharma/open-source-pw-ioi-batch-1/packages/auth/dist' },
        { find: '@repo/models', replacement: '/Users/rudraabhisheksharma/open-source-pw-ioi-batch-1/packages/models/dist' },
        { find: '@repo/validation', replacement: '/Users/rudraabhisheksharma/open-source-pw-ioi-batch-1/packages/validation/dist' },
        { find: '@repo/http', replacement: '/Users/rudraabhisheksharma/open-source-pw-ioi-batch-1/packages/http/dist' },
        { find: '@repo/services', replacement: '/Users/rudraabhisheksharma/open-source-pw-ioi-batch-1/packages/services/dist' },
      ],
    },
  },
})
