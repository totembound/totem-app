import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// Serve /docs as static files, bypassing SPA fallback
function docsStaticPlugin() {
  return {
    name: 'docs-static',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        // Redirect /docs to /docs/ so the static index.html is served
        if (req.url === '/docs') {
          req.url = '/docs/index.html'
        }
        next()
      })
    }
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    docsStaticPlugin(),
    react(),
    visualizer({
      filename: 'dist/stats.html'
    }),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        globIgnores: ['docs/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB limit
      },
      manifest: {
        name: 'TotemBound',
        short_name: 'TotemBound',
        description: 'A game where players raise, train, and evolve mystical animal spirit companions',
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
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/node_modules/react-router/') || id.includes('/node_modules/react-router-dom/') || id.includes('/node_modules/@remix-run/router/')) return 'router';
          if (id.includes('/node_modules/lucide-react/') || id.includes('/node_modules/tailwind-merge/')) return 'ui';
          if (id.includes('/node_modules/mqtt/') || id.includes('/node_modules/mqtt-packet/')) return 'mqtt';
          // Everything else from node_modules (including react/react-dom/scheduler
          // and their transitive deps) goes into one vendor chunk to avoid
          // circular chunk edges between vendor and deps.
          return 'vendor';
        }
      }
    }
  },

  define: {
    global: 'globalThis',
    'process.env': {}
  },

  optimizeDeps: {
    include: ['posthog-js']
  },

  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000'
      }
    },
    env: {
      VITE_API_URL: 'http://localhost:3001'
    },
    setupFiles: ['./src/setupTests.ts']
  }
}))