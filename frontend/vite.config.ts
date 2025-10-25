import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import frontendConfig from './src/config/frontendConfig.json'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/auth': path.resolve(__dirname, './src/auth'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  esbuild: {
    target: 'es2024',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: frontendConfig.server.url,
        changeOrigin: true,
        secure: false,
      },
      '/exported-files': {
        target: frontendConfig.server.url,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2024',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          router: ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api': {
        target: frontendConfig.server.url,
        changeOrigin: true,
        secure: false,
      }
    },
  },
})