// @ts-check
import { test, expect } from '@playwright/test';

/**
 * KIOSK ENDURANCE TEST - myK9Qv3
 *
 * This test simulates the TV/kiosk display running for an extended period.
 * It monitors for:
 * - Memory leaks from real-time subscriptions
 * - UI freezes or crashes
 * - Proper cleanup of event listeners
 *
 * Routes: /tv/:licenseKey for TV display
 */

// Configuration for myK9Qv3
const CONFIG = {
  // TV/Kiosk route with test license key
  kioskUrl: '/tv/myK9Q1-a260f472-e0d76a33-4b6c264c',

  // How long to run the endurance test (can override with env KIOSK_DURATION)
  testDurationMinutes: parseInt(process.env.KIOSK_DURATION) || 30,

  // How often to check metrics (in ms)
  checkIntervalMs: 30000,  // Every 30 seconds

  // Memory threshold (in MB) - alert if exceeded
  memoryThresholdMB: 500,

  // CSS selectors for myK9Qv3 TV components
  selectors: {
    tvContainer: '.tv-runorder',
    classCard: '.class-run-order',
    resultsGrid: '.tv-results-grid',
    podiumCard: '.podium-card',
    loadingState: '.results-page__loading',
  },
};

test.describe('Kiosk Endurance Tests', () => {
  
  test('kiosk display runs stable for extended period', async ({ page }) => {
    // Set a long timeout for this test
    test.setTimeout(CONFIG.testDurationMinutes * 60 * 1000 + 60000);
    
    const metrics = {
      startTime: Date.now(),
      memoryReadings: [],
      errors: [],
      refreshCount: 0,
    };
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        metrics.errors.push({
          time: Date.now() - metrics.startTime,
          message: msg.text(),
        });
      }
    });
    
    // Listen for page crashes
    page.on('crash', () => {
      metrics.errors.push({
        time: Date.now() - metrics.startTime,
        message: 'PAGE CRASHED!',
      });
    });
    
    // Navigate to kiosk page
    await page.goto(CONFIG.kioskUrl);
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    console.log(`\n🖥️  Kiosk Endurance Test Started`);
    console.log(`   Duration: ${CONFIG.testDurationMinutes} minutes`);
    console.log(`   URL: ${page.url()}\n`);
    
    // Collect metrics over time
    const endTime = Date.now() + (CONFIG.testDurationMinutes * 60 * 1000);
    
    while (Date.now() < endTime) {
      // Get memory usage
      const memoryUsage = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
          };
        }
        return null;
      });
      
      if (memoryUsage) {
        const usedMB = memoryUsage.usedJSHeapSize / (1024 * 1024);
        metrics.memoryReadings.push({
          time: Date.now() - metrics.startTime,
          usedMB,
          totalMB: memoryUsage.totalJSHeapSize / (1024 * 1024),
        });
        
        const elapsedMin = Math.floor((Date.now() - metrics.startTime) / 60000);
        console.log(`   [${elapsedMin}m] Memory: ${usedMB.toFixed(1)}MB`);
        
        // Check threshold
        if (usedMB > CONFIG.memoryThresholdMB) {
          console.warn(`   ⚠️  Memory exceeds ${CONFIG.memoryThresholdMB}MB threshold!`);
        }
      }
      
      // Verify page is still responsive
      const isResponsive = await page.evaluate(() => {
        return document.readyState === 'complete';
      });
      
      if (!isResponsive) {
        metrics.errors.push({
          time: Date.now() - metrics.startTime,
          message: 'Page became unresponsive',
        });
      }
      
      // Wait for next check
      await page.waitForTimeout(CONFIG.checkIntervalMs);
    }
    
    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('KIOSK ENDURANCE TEST RESULTS');
    console.log('='.repeat(60));
    
    if (metrics.memoryReadings.length > 0) {
      const memoryValues = metrics.memoryReadings.map(r => r.usedMB);
      const startMemory = memoryValues[0];
      const endMemory = memoryValues[memoryValues.length - 1];
      const maxMemory = Math.max(...memoryValues);
      const memoryGrowth = endMemory - startMemory;
      
      console.log(`\nMemory:`);
      console.log(`  Start:  ${startMemory.toFixed(1)}MB`);
      console.log(`  End:    ${endMemory.toFixed(1)}MB`);
      console.log(`  Max:    ${maxMemory.toFixed(1)}MB`);
      console.log(`  Growth: ${memoryGrowth.toFixed(1)}MB (${((memoryGrowth/startMemory)*100).toFixed(1)}%)`);
      
      if (memoryGrowth > 100) {
        console.log(`\n  ⚠️  Significant memory growth detected - possible leak!`);
      } else {
        console.log(`\n  ✅ Memory growth acceptable`);
      }
    }
    
    console.log(`\nErrors: ${metrics.errors.length}`);
    if (metrics.errors.length > 0) {
      metrics.errors.forEach(e => {
        console.log(`  - [${Math.floor(e.time/1000)}s] ${e.message}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Assertions
    expect(metrics.errors.filter(e => e.message === 'PAGE CRASHED!')).toHaveLength(0);
    
    if (metrics.memoryReadings.length > 0) {
      const endMemory = metrics.memoryReadings[metrics.memoryReadings.length - 1].usedMB;
      expect(endMemory).toBeLessThan(CONFIG.memoryThresholdMB);
    }
  });
});

test.describe('Kiosk Rotation Tests', () => {
  
  test('auto-rotation cycles through results without errors', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);  // 5 minutes
    
    await page.goto(CONFIG.kioskUrl);
    await page.waitForLoadState('networkidle');
    
    let rotationCount = 0;
    const errors = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Watch for DOM changes that indicate rotation
    await page.evaluate(() => {
      window._rotationCount = 0;
      const observer = new MutationObserver(() => {
        window._rotationCount++;
      });
      
      const target = document.body;
      observer.observe(target, { childList: true, subtree: true });
    });
    
    // Let it run for 3 minutes
    await page.waitForTimeout(3 * 60 * 1000);
    
    rotationCount = await page.evaluate(() => window._rotationCount);
    
    console.log(`Rotations detected: ${rotationCount}`);
    console.log(`Errors during rotation: ${errors.length}`);
    
    expect(errors).toHaveLength(0);
    expect(rotationCount).toBeGreaterThan(0);
  });
});
