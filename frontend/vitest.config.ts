import { defineConfig } from 'vitest/config'
import baseConfig from './vite.config'

export default defineConfig({
  ...baseConfig,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    css: true,
  },
})

