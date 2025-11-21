/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    hookTimeout: 30000, // Increase from default 10s to 30s for IndexedDB cleanup
    testTimeout: 15000, // 15s timeout for individual tests
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**/*.spec.ts', // Exclude Playwright tests
      'tests/**/*.spec.tsx',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'dist/',
        'public/',
      ],
    },
  },
  server: {
    host: true,
    // Enable HTTPS for mobile testing (optional)
    // https: {
    //   key: fs.readFileSync('path/to/key.pem'),
    //   cert: fs.readFileSync('path/to/cert.pem'),
    // }
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react') || id.includes('clsx')) {
              return 'ui-vendor';
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }
            if (id.includes('@tanstack/react-virtual')) {
              return 'virtual-vendor';
            }
          }
          // App chunks
          if (id.includes('/stores/')) {
            return 'stores';
          }
          if (id.includes('/services/')) {
            return 'services';
          }
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify CSS
    cssMinify: true,
    // Source maps only for errors in production
    sourcemap: 'hidden'
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
      'lucide-react'
    ]
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // Use our custom service worker
      srcDir: 'public',
      filename: 'sw-custom.js',
      registerType: 'prompt', // Changed from 'autoUpdate' to 'prompt' to prevent auto-reload in dev
      devOptions: {
        enabled: true, // Enable for offline testing
        type: 'classic' // Use classic service worker (not ES module) because we use importScripts
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
      },
      manifest: {
        name: 'myK9Q',
        short_name: 'myK9Q',
        description: 'Professional dog show ring scoring application',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['sports', 'utilities'],
        icons: [
          {
            src: '/myK9Q-logo-teal.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/myK9Q-icon-teal.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Score',
            short_name: 'Score',
            description: 'Start scoring a new dog',
            url: '/score/new',
            icons: [{ src: '/myK9Q-notification-icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Precache all build artifacts including lazy-loaded chunks
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],

        // Enable navigation preload for faster page loads
        navigationPreload: true,

        // Clean up old caches automatically
        cleanupOutdatedCaches: true,

        // Use NetworkFirst strategy for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache navigation requests (SPA routes) with CacheFirst strategy
          {
            urlPattern: ({ request, url }) => {
              // Match navigation requests to our app
              return request.mode === 'navigate' && url.origin === self.location.origin;
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'navigation-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          // Cache JavaScript and CSS chunks with CacheFirst strategy
          {
            urlPattern: /\/assets\/.*\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})