import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB limit
      },
      manifest: {
        name: 'TotemBound',
        short_name: 'TotemBound',
        description: 'Blockchain-based NFT game where players raise, train, and evolve mystical owl companions',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'tb-logo-180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: 'tb-logo-540.png',
            sizes: '540x540',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  },

  server: {
    port: 3000,
    host: true,
    open: true,
    hmr: {
      overlay: true
    }
  },

  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          blockchain: ['ethers'],
          ui: ['lucide-react', 'tailwind-merge']
        }
      }
    }
  },

  define: {
    global: 'globalThis',
    // Polyfill for Node.js globals used by ethers.js
    'process.env': {}
  },

  optimizeDeps: {
    include: ['ethers', 'posthog-js']
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts']
  }
})