import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-globe': ['three', 'react-globe.gl'],
          'vendor-maps': ['mapbox-gl', 'react-map-gl', 'react-simple-maps', 'leaflet', 'react-leaflet', 'd3-geo'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
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
