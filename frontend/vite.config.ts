import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: ['polyedge.aitradepulse.com', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8100',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8100',
        ws: true,
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: ['polyedge.aitradepulse.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8100',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8100',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
