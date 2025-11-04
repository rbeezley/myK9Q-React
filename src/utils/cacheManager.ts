/**
 * Cache Management Utility
 *
 * Provides functions to clear various caches and stored data.
 * Used by Settings page for cache clearing functionality.
 */

import { logger } from './logger';

/**
 * Store for undo functionality
 */
let undoData: {
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  timeout?: NodeJS.Timeout;
} | null = null;

/**
 * Clear all service worker caches
 */
async function clearServiceWorkerCaches(): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      logger.log(`Cleared ${cacheNames.length} service worker caches`);
    } catch (error) {
      logger.error('Failed to clear service worker caches:', error);
      throw error;
    }
  }
}

/**
 * Clear IndexedDB databases (except sensitive ones)
 */
async function clearIndexedDB(): Promise<void> {
  if ('indexedDB' in window) {
    try {
      const databases = await indexedDB.databases();
      const promises = databases
        .filter((db) => {
          // Don't delete auth-related databases
          const name = db.name || '';
          return !name.includes('auth') && !name.includes('firebase');
        })
        .map((db) => {
          return new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(db.name!);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        });

      await Promise.all(promises);
      logger.log(`Cleared ${promises.length} IndexedDB databases`);
    } catch (error) {
      logger.error('Failed to clear IndexedDB:', error);
      throw error;
    }
  }
}

/**
 * Clear localStorage (except auth and settings)
 */
function clearLocalStorage(options: { preserveAuth?: boolean; preserveSettings?: boolean } = {}): void {
  const { preserveAuth = true, preserveSettings = true } = options;

  try {
    // Save items we want to keep
    const preservedItems: Record<string, string> = {};

    if (preserveAuth) {
      const authKey = localStorage.getItem('myK9Q_auth');
      if (authKey) preservedItems['myK9Q_auth'] = authKey;
    }

    if (preserveSettings) {
      const settings = localStorage.getItem('myK9Q_settings');
      if (settings) preservedItems['myK9Q_settings'] = settings;
    }

    // Clear everything
    localStorage.clear();

    // Restore preserved items
    Object.entries(preservedItems).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    logger.log('Cleared localStorage (preserved auth and settings)');
  } catch (error) {
    logger.error('Failed to clear localStorage:', error);
    throw error;
  }
}

/**
 * Clear scroll positions from sessionStorage
 */
export function clearScrollPositions(): void {
  try {
    // Find and remove all scroll position keys
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('scroll') || key.includes('position'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    logger.log(`Cleared ${keysToRemove.length} scroll positions`);
  } catch (error) {
    logger.error('Failed to clear scroll positions:', error);
    throw error;
  }
}

/**
 * Clear all caches (with undo support)
 */
export async function clearAllCaches(options: {
  enableUndo?: boolean;
  undoDuration?: number;
} = {}): Promise<void> {
  const { enableUndo = true, undoDuration = 5000 } = options;

  try {
    // Save data for undo if enabled
    if (enableUndo) {
      const localStorageBackup: Record<string, string> = {};
      const sessionStorageBackup: Record<string, string> = {};

      // Backup localStorage (except auth and settings)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('myK9Q_auth') && !key.includes('myK9Q_settings')) {
          const value = localStorage.getItem(key);
          if (value) localStorageBackup[key] = value;
        }
      }

      // Backup sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) sessionStorageBackup[key] = value;
        }
      }

      undoData = {
        localStorage: localStorageBackup,
        sessionStorage: sessionStorageBackup,
      };

      // Set timeout to clear undo data
      undoData.timeout = setTimeout(() => {
        undoData = null;
      }, undoDuration);
    }

    // Clear all caches
    await Promise.all([
      clearServiceWorkerCaches(),
      clearIndexedDB(),
    ]);

    clearLocalStorage({ preserveAuth: true, preserveSettings: true });
    sessionStorage.clear();

    logger.log('All caches cleared successfully');
  } catch (error) {
    logger.error('Failed to clear all caches:', error);
    throw error;
  }
}

/**
 * Undo the last cache clear operation
 */
export function undoCacheClear(): boolean {
  if (!undoData) {
    logger.warn('No undo data available');
    return false;
  }

  try {
    // Clear timeout
    if (undoData.timeout) {
      clearTimeout(undoData.timeout);
    }

    // Restore localStorage
    if (undoData.localStorage) {
      Object.entries(undoData.localStorage).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }

    // Restore sessionStorage
    if (undoData.sessionStorage) {
      Object.entries(undoData.sessionStorage).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });
    }

    undoData = null;
    logger.log('Cache clear undone successfully');
    return true;
  } catch (error) {
    logger.error('Failed to undo cache clear:', error);
    return false;
  }
}

/**
 * Check if undo is available
 */
export function canUndoCacheClear(): boolean {
  return undoData !== null;
}

/**
 * Auto-cleanup old cached data (older than 30 days)
 * This runs automatically in the background to prevent storage bloat
 */
export async function autoCleanupOldData(): Promise<{ cleaned: number; errors: number }> {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoffTime = Date.now() - THIRTY_DAYS_MS;
  let cleaned = 0;
  let errors = 0;

  try {
    // Clean localStorage entries with timestamps
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Skip auth, settings, and favorites
      if (
        key.includes('myK9Q_auth') ||
        key.includes('myK9Q_settings') ||
        key.includes('dog_favorites')
      ) {
        continue;
      }

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        // Try to parse as JSON and check for timestamp
        const data = JSON.parse(value);
        if (data && typeof data === 'object') {
          const timestamp =
            data.timestamp || data.lastUpdated || data.createdAt || data.updatedAt;

          if (timestamp && new Date(timestamp).getTime() < cutoffTime) {
            localStorage.removeItem(key);
            cleaned++;
            logger.log(`Auto-cleanup: Removed old data for key: ${key}`);
          }
        }
      } catch {
        // Not JSON or no timestamp - skip
      }
    }

    // Clean IndexedDB entries (if we can access them)
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          const dbName = db.name;
          if (!dbName) continue;

          // Skip auth and system databases
          if (
            dbName.includes('auth') ||
            dbName.includes('firebase') ||
            dbName.includes('workbox')
          ) {
            continue;
          }

          // Check database modification time if available
          // Note: Most browsers don't expose this, so this is best-effort
          // In practice, IndexedDB cleanup would need to be done per-database
          // with knowledge of the schema
        }
      } catch (error) {
        logger.warn('Could not auto-cleanup IndexedDB:', error);
        errors++;
      }
    }

    // Clean service worker caches older than 30 days
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          // Check if cache name has a timestamp
          const match = cacheName.match(/(\d{13})/); // Unix timestamp in ms
          if (match) {
            const cacheTime = parseInt(match[1], 10);
            if (cacheTime < cutoffTime) {
              await caches.delete(cacheName);
              cleaned++;
              logger.log(`Auto-cleanup: Deleted old cache: ${cacheName}`);
            }
          }
        }
      } catch (error) {
        logger.warn('Could not auto-cleanup caches:', error);
        errors++;
      }
    }

    if (cleaned > 0) {
      logger.log(`Auto-cleanup completed: ${cleaned} items removed`);
    }

    return { cleaned, errors };
  } catch (error) {
    logger.error('Auto-cleanup failed:', error);
    return { cleaned, errors: errors + 1 };
  }
}

/**
 * Schedule auto-cleanup to run periodically
 * Call this once during app initialization
 */
export function scheduleAutoCleanup(): void {
  // Run immediately on startup
  autoCleanupOldData();

  // Run daily
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    autoCleanupOldData();
  }, ONE_DAY_MS);

  logger.log('Auto-cleanup scheduled (runs daily)');
}
