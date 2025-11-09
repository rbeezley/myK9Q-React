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
      registerType: 'prompt', // Changed from 'autoUpdate' to 'prompt' to prevent auto-reload in dev
      devOptions: {
        enabled: false // Disabled to prevent dev-sw.js import errors
      },
      manifest: {
        name: 'myK9Q Ring Scoring',
        short_name: 'myK9Q',
        description: 'Professional dog show ring scoring application',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['sports', 'utilities'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Score',
            short_name: 'Score',
            description: 'Start scoring a new dog',
            url: '/score/new',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
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
          }
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})