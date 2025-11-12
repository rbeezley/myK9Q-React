/**
 * IndexedDB Diagnostics Utility
 *
 * Provides diagnostic tools to identify and resolve IndexedDB corruption issues.
 * Use this when the database is in a stuck/corrupted state and cannot be opened or deleted.
 */

import { deleteDB } from 'idb';

const DB_NAME = 'myK9Q_Replication';

export interface DiagnosticResult {
  status: 'healthy' | 'corrupted' | 'locked' | 'unknown';
  details: string[];
  recommendations: string[];
  canAutoFix: boolean;
}

/**
 * Run comprehensive IndexedDB diagnostics
 */
export async function runIndexedDBDiagnostics(): Promise<DiagnosticResult> {
  const details: string[] = [];
  const recommendations: string[] = [];
  let status: DiagnosticResult['status'] = 'unknown';
  let canAutoFix = false;

  try {
    // Step 1: Check if IndexedDB is supported
    if (!('indexedDB' in window)) {
      details.push('❌ IndexedDB not supported in this browser');
      recommendations.push('Use a modern browser that supports IndexedDB');
      return { status: 'corrupted', details, recommendations, canAutoFix: false };
    }
    details.push('✅ IndexedDB is supported');

    // Step 2: List all databases
    try {
      if ('databases' in indexedDB) {
        const databases = await indexedDB.databases();
        details.push(`📊 Found ${databases.length} IndexedDB database(s):`);
        databases.forEach(db => {
          details.push(`  - ${db.name} (version: ${db.version || 'unknown'})`);
        });

        const myK9QDB = databases.find(db => db.name === DB_NAME);
        if (myK9QDB) {
          details.push(`🎯 Found ${DB_NAME} database (version: ${myK9QDB.version || 'unknown'})`);
        } else {
          details.push(`⚠️ ${DB_NAME} database not found - may need creation`);
          status = 'healthy';
          canAutoFix = true;
        }
      } else {
        details.push('⚠️ indexedDB.databases() not supported - cannot list databases');
      }
    } catch (error) {
      details.push(`❌ Failed to list databases: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 3: Try to open the database with timeout
    details.push(`🔍 Attempting to open ${DB_NAME}...`);
    const openTest = await testDatabaseOpen();
    if (openTest.success) {
      details.push('✅ Database opens successfully');
      status = 'healthy';
    } else {
      details.push(`❌ Database open failed: ${openTest.error}`);
      status = openTest.error?.includes('timeout') ? 'locked' : 'corrupted';
      recommendations.push('Database is stuck/locked and cannot be opened');
      recommendations.push('Try closing all tabs with this app open');
      recommendations.push('Check browser DevTools → Application → Storage → IndexedDB');
      canAutoFix = false;
    }

    // Step 4: If locked, try to delete
    if (status === 'locked' || status === 'corrupted') {
      details.push(`🗑️ Attempting to delete ${DB_NAME}...`);
      const deleteTest = await testDatabaseDelete();
      if (deleteTest.success) {
        details.push('✅ Database deleted successfully');
        recommendations.push('Database was corrupted but has been cleaned up');
        recommendations.push('Refresh the page to recreate the database');
        canAutoFix = true;
        status = 'healthy';
      } else {
        details.push(`❌ Database delete failed: ${deleteTest.error}`);
        recommendations.push('⚠️ CRITICAL: Database cannot be deleted programmatically');
        recommendations.push('Manual cleanup required - see instructions below');
        canAutoFix = false;
      }
    }

    // Step 5: Check Service Worker state
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        details.push(`🔧 Found ${registrations.length} active Service Worker(s)`);
        recommendations.push('Service Workers may be holding database locks');
        recommendations.push('Try unregistering Service Workers from DevTools');
      } else {
        details.push('✅ No active Service Workers');
      }
    }

  } catch (error) {
    details.push(`❌ Diagnostic error: ${error instanceof Error ? error.message : String(error)}`);
    status = 'unknown';
  }

  return { status, details, recommendations, canAutoFix };
}

/**
 * Test if database can be opened (with timeout)
 */
async function testDatabaseOpen(): Promise<{ success: boolean; error?: string }> {
  const TIMEOUT_MS = 5000;

  const openPromise = new Promise<boolean>((resolve) => {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      request.result.close();
      resolve(true);
    };

    request.onerror = () => {
      resolve(false);
    };

    request.onblocked = () => {
      resolve(false);
    };
  });

  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([openPromise, timeoutPromise]);
    return { success: result, error: result ? undefined : 'Open timed out or failed' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Test if database can be deleted (with timeout)
 */
async function testDatabaseDelete(): Promise<{ success: boolean; error?: string }> {
  const TIMEOUT_MS = 5000;

  const deletePromise = (async () => {
    try {
      await deleteDB(DB_NAME);
      return true;
    } catch {
      return false;
    }
  })();

  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([deletePromise, timeoutPromise]);
    return { success: result, error: result ? undefined : 'Delete timed out or failed' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get manual cleanup instructions
 */
export function getManualCleanupInstructions(): string[] {
  return [
    '🔧 MANUAL INDEXEDDB CLEANUP INSTRUCTIONS',
    '',
    '1. Close ALL tabs/windows with myK9Q open',
    '   - Only keep this tab open',
    '',
    '2. Open Chrome DevTools (F12 or Right-click → Inspect)',
    '',
    '3. Go to: Application → Storage → IndexedDB',
    '',
    '4. Find "myK9Q_Replication" database',
    '   - Right-click → Delete database',
    '   - Wait for confirmation',
    '',
    '5. Check for other myK9Q databases:',
    '   - "myK9Q_OfflineCache" (legacy - safe to delete)',
    '   - "myK9Q_Mutations" (legacy - safe to delete)',
    '',
    '6. Clear Service Worker cache:',
    '   - Application → Service Workers',
    '   - Click "Unregister" on all myK9Q workers',
    '',
    '7. Hard refresh the page:',
    '   - Windows/Linux: Ctrl + Shift + R',
    '   - Mac: Cmd + Shift + R',
    '',
    '8. Verify database recreates successfully:',
    '   - Check console for "[ReplicatedTable] ✅ Shared database initialized"',
    '   - Check Application → IndexedDB for fresh "myK9Q_Replication" database',
    '',
    '⚠️ If problems persist:',
    '   - Clear ALL browser data for this site: Application → Storage → Clear site data',
    '   - Or try in Incognito/Private mode to test with fresh browser state',
  ];
}

/**
 * Attempt automatic cleanup (if possible)
 */
export async function attemptAutoCleanup(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[IndexedDB Diagnostics] Starting auto-cleanup...');

    // Try to delete the database
    await deleteDB(DB_NAME);

    // Also delete legacy databases
    try {
      await deleteDB('myK9Q_OfflineCache');
      await deleteDB('myK9Q_Mutations');
    } catch {
      // Ignore errors for legacy databases
    }

    return {
      success: true,
      message: 'Database cleaned successfully. Please refresh the page to recreate the database.',
    };
  } catch (error) {
    return {
      success: false,
      message: `Auto-cleanup failed: ${error instanceof Error ? error.message : String(error)}. Manual cleanup required.`,
    };
  }
}

/**
 * Log diagnostic report to console
 */
export async function logDiagnosticReport(): Promise<void> {
  console.log('%c═══════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold');
  console.log('%c🔍 INDEXEDDB DIAGNOSTIC REPORT', 'color: #3b82f6; font-weight: bold; font-size: 16px');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold');
  console.log('');

  const result = await runIndexedDBDiagnostics();

  console.log(`%cStatus: ${result.status.toUpperCase()}`, `color: ${
    result.status === 'healthy' ? '#10b981' :
    result.status === 'locked' ? '#f59e0b' : '#ef4444'
  }; font-weight: bold`);
  console.log('');

  console.log('%cDetails:', 'color: #3b82f6; font-weight: bold');
  result.details.forEach(detail => console.log(`  ${detail}`));
  console.log('');

  if (result.recommendations.length > 0) {
    console.log('%cRecommendations:', 'color: #f59e0b; font-weight: bold');
    result.recommendations.forEach(rec => console.log(`  ${rec}`));
    console.log('');
  }

  if (!result.canAutoFix && result.status !== 'healthy') {
    console.log('%c📋 MANUAL CLEANUP REQUIRED', 'color: #ef4444; font-weight: bold; font-size: 14px');
    console.log('');
    getManualCleanupInstructions().forEach(instruction => {
      console.log(instruction);
    });
  } else if (result.status === 'healthy') {
    console.log('%c✅ IndexedDB is healthy and ready to use', 'color: #10b981; font-weight: bold');
  }

  console.log('');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold');
}

/**
 * Window-accessible diagnostic function
 * Usage in browser console: window.diagnoseIndexedDB()
 */
if (typeof window !== 'undefined') {
  (window as any).diagnoseIndexedDB = logDiagnosticReport;
  (window as any).cleanupIndexedDB = attemptAutoCleanup;
}
