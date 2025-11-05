import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Ensure public assets (robots.txt, sitemap.xml, etc.) are copied to dist
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Copy public folder contents to dist root
    copyPublicDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    css: true,
  },
})
