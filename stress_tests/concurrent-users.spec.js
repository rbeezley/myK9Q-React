// @ts-check
import { test, expect } from '@playwright/test';

/**
 * CONCURRENT USERS FRONTEND TEST - myK9Qv3
 *
 * Simulates multiple users accessing the results page simultaneously.
 * Unlike k6 (which hits APIs directly), this actually renders the React app.
 *
 * Run with: npx playwright test concurrent-users.spec.js --workers=10
 *
 * NOTE: Requires login. The /results route uses AuthContext to get showContext.
 * For stress testing, use the public /results/:licenseKey route instead.
 */

// Configuration for myK9Qv3
const CONFIG = {
  // Public results page with license key (no login required)
  resultsUrl: '/results/myK9Q1-a260f472-e0d76a33-4b6c264c',

  // CSS selectors for myK9Qv3 Results page components
  selectors: {
    resultsContainer: '.results-page',
    resultsGrid: '.results-page__grid',
    podiumCard: '.podium-card',
    loadingState: '.results-page__loading',
    errorState: '.results-page__error',
    emptyState: '.results-page__empty',
  },

  // Timeout for page load
  loadTimeoutMs: 10000,
};

test.describe('Concurrent Users - Results Page', () => {

  // This test will be run in parallel by multiple workers
  test('user can load and view results', async ({ page }) => {
    const metrics = {
      startTime: Date.now(),
      loadTime: 0,
      renderTime: 0,
      hasError: false,
    };

    try {
      await page.goto(CONFIG.resultsUrl);
      metrics.loadTime = Date.now() - metrics.startTime;

      // Wait for results page to render (not just network idle)
      await page.waitForSelector(CONFIG.selectors.resultsContainer, {
        timeout: CONFIG.loadTimeoutMs,
      });
      metrics.renderTime = Date.now() - metrics.startTime;

      // Verify no error state
      const errorElement = await page.$(CONFIG.selectors.errorState);
      expect(errorElement).toBeNull();

      // Verify results page loaded (either with results grid or empty state)
      const resultsContainer = await page.$(CONFIG.selectors.resultsContainer);
      expect(resultsContainer).not.toBeNull();

      console.log(`✅ Worker loaded results in ${metrics.renderTime}ms`);

    } catch (error) {
      metrics.hasError = true;
      console.error(`❌ Worker failed: ${error.message}`);
      throw error;
    }
  });

  // Simulate user interaction flow
  test('user can navigate through results', async ({ page }) => {
    await page.goto(CONFIG.resultsUrl);
    await page.waitForLoadState('networkidle');

    // Simulate scrolling (common user behavior)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // Click on a podium card if any exist
    const firstPodium = await page.$(CONFIG.selectors.podiumCard);
    if (firstPodium) {
      await firstPodium.click();
      await page.waitForTimeout(500);
    }

    // Page should still be responsive
    const isResponsive = await page.evaluate(() => document.readyState === 'complete');
    expect(isResponsive).toBe(true);
  });
});

test.describe('Rapid Refresh Test', () => {

  test('page handles rapid refreshes without crashing', async ({ page }) => {
    const refreshCount = 20;
    const errors = [];

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    for (let i = 0; i < refreshCount; i++) {
      await page.goto(CONFIG.resultsUrl);
      await page.waitForTimeout(200);  // Quick refresh
    }

    // Final load should work
    await page.goto(CONFIG.resultsUrl);
    await page.waitForLoadState('networkidle');

    console.log(`Completed ${refreshCount} rapid refreshes`);
    console.log(`Errors: ${errors.length}`);

    // Allow some transient errors but not critical ones
    const criticalErrors = errors.filter(e =>
      e.includes('crash') ||
      e.includes('out of memory') ||
      e.includes('Maximum call stack')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Mobile User Simulation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile user can view results', async ({ page }) => {
    await page.goto(CONFIG.resultsUrl);
    await page.waitForLoadState('networkidle');

    // Check mobile layout rendered
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(375);

    // Results page should be visible
    const resultsVisible = await page.isVisible(CONFIG.selectors.resultsContainer);
    expect(resultsVisible).toBe(true);

    // Page should be responsive (not frozen)
    const isResponsive = await page.evaluate(() => document.readyState === 'complete');
    expect(isResponsive).toBe(true);
  });
});
