// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.js',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit parallel workers for stress tests
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  use: {
    // Base URL - update to your app
    baseURL: process.env.APP_URL || 'http://localhost:5174',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video for debugging
    video: 'retain-on-failure',
  },

  projects: [
    // ========== LOCAL DEVELOPMENT ==========
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Kiosk display (large screen)
    {
      name: 'kiosk',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile (exhibitor checking scores)
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },

    // ========== PRODUCTION (Vercel) ==========
    {
      name: 'production',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://app.myk9q.com',
      },
    },

    {
      name: 'production-mobile',
      use: {
        ...devices['iPhone 13'],
        baseURL: 'https://app.myk9q.com',
      },
    },

    {
      name: 'production-kiosk',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        baseURL: 'https://app.myk9q.com',
      },
    },
  ],
});
