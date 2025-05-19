import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000, // Change to a different port
    proxy: {
      // Proxy API requests to your backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/\/+$/, '') // Remove trailing slashes
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})