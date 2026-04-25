// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cached separately
          'vendor-react': ['react', 'react-dom'],

          // Router — cached separately
          'vendor-router': ['react-router-dom'],

          // Landing page + heavy shader — separate chunk
          // loads only when user visits "/"
          'chunk-landing': [
            './src/pages/LandingPage',
            './src/components/ui/animated-shader-hero',
            './src/components/landing/Navbar',
            './src/components/landing/AboutSection',
            './src/components/landing/FeaturesSection',
            './src/components/landing/Footer',
          ],

          // Demo test — separate chunk
          // loads only when user visits "/demo"
          'chunk-demo': [
            './src/pages/DemoTestPage',
            './src/pages/DemoResultPage',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Minify aggressively
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // removes console.log in production
        drop_debugger: true,
      },
    },
  },
})

