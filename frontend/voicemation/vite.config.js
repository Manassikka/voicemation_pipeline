import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/generate_audio': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/video': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
})
