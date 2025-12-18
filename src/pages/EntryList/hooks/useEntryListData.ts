/**
 * useEntryListData - Entry list data fetching hook
 *
 * Refactored (DEBT-008) to use extracted helper functions from useEntryListDataHelpers.ts
 * Complexity reduced from 59 to ~15 by moving fetch logic to helper module.
 */

import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ensureReplicationManager } from '@/utils/replicationHelper';
import { logger } from '@/utils/logger';
import type { UserRole } from '@/utils/auth';

// Import types and helper functions from extracted module
import type { ClassInfo, EntryListData } from './useEntryListDataHelpers';
import {
  fetchFromReplicationCache,
  fetchFromSupabase,
  fetchCombinedFromReplicationCache,
  fetchCombinedFromSupabase
} from './useEntryListDataHelpers';

// Re-export types for consumers
export type { ClassInfo, EntryListData };

interface UseEntryListDataOptions {
  classId?: string;
  classIdA?: string;
  classIdB?: string;
  /** Ref to check if drag operation is in progress - skips auto-refresh when true */
  isDraggingRef?: MutableRefObject<boolean>;
}

/**
 * Shared hook for fetching and caching entry list data using stale-while-revalidate pattern.
 * Supports both single class and combined class views.
 */
export const useEntryListData = ({ classId, classIdA, classIdB, isDraggingRef }: UseEntryListDataOptions) => {
  const { showContext, role } = useAuth();

  const isCombinedView = !!(classIdA && classIdB);

  // Fetch function for single class view
  const fetchSingleClass = useCallback(async (): Promise<EntryListData> => {
    if (!classId || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    const licenseKey = showContext.licenseKey;
    const userRole: UserRole = (role as UserRole) || 'exhibitor';

    // Try replication cache first
    logger.log('🔄 Fetching entries from replicated cache...');
    const cacheResult = await fetchFromReplicationCache(classId, licenseKey, userRole);
    if (cacheResult) {
      return cacheResult;
    }

    // Fall back to Supabase
    return fetchFromSupabase(classId, licenseKey, userRole);
  }, [showContext, role, classId]);

  // Fetch function for combined class view
  const fetchCombinedClasses = useCallback(async (): Promise<EntryListData> => {
    if (!classIdA || !classIdB || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    const licenseKey = showContext.licenseKey;
    const userRole: UserRole = (role as UserRole) || 'exhibitor';

    // Try replication cache first
    logger.log('🔄 Fetching combined entries from replicated cache...');
    const cacheResult = await fetchCombinedFromReplicationCache(classIdA, classIdB, licenseKey, userRole);
    if (cacheResult) {
      return cacheResult;
    }

    // Fall back to Supabase
    return fetchCombinedFromSupabase(classIdA, classIdB, licenseKey, userRole);
  }, [showContext, role, classIdA, classIdB]);

  // Use the appropriate fetch function
  const fetchFunction = isCombinedView ? fetchCombinedClasses : fetchSingleClass;

  // Direct state management (replication handles caching)
  const [data, setData] = useState<EntryListData>({ entries: [], classInfo: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Guard against re-entrant refresh calls that cause infinite loops
  const isRefreshingRef = useRef(false);
  // Track if a refresh was requested while another was in progress
  const pendingRefreshRef = useRef(false);

  // Fetch data function
  // forceSync: if true, syncs with server before reading cache (for user-initiated refresh)
  const refresh = useCallback(async (forceSync: boolean = false) => {
    // If already refreshing, mark that we need another refresh after this one completes
    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    isRefreshingRef.current = true;
    pendingRefreshRef.current = false; // Clear any pending flag
    setIsRefreshing(true);
    setFetchError(null);
    try {
      // If forceSync requested, sync with server first to get fresh data
      // Wrapped in try-catch so offline users still get cached data
      if (forceSync && showContext?.licenseKey) {
        try {
          logger.log('🔄 Force sync requested - syncing entries and classes from server...');
          const manager = await ensureReplicationManager();
          // Sync entries and classes tables to get latest data
          await Promise.all([
            manager.syncTable('entries', { licenseKey: showContext.licenseKey }),
            manager.syncTable('classes', { licenseKey: showContext.licenseKey }),
          ]);
          logger.log('✅ Force sync complete');
        } catch (syncError) {
          // Sync failed (likely offline) - continue with cached data
          logger.warn('⚠️ Sync failed (offline?), using cached data:', syncError);
        }
      }

      const result = await fetchFunction();
      setData(result);
    } catch (error) {
      setFetchError(error as Error);
      logger.error('Failed to fetch entry list data:', error);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;

      // If a refresh was requested while we were busy, do it now
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        // Use setTimeout to break the call stack and allow React to process
        setTimeout(() => refresh(), 0);
      }
    }
  }, [fetchFunction, showContext?.licenseKey]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to replication changes
  // When entries/classes are updated via replication, refresh the view
  useEffect(() => {
    let unsubscribeEntries: (() => void) | undefined;
    let unsubscribeClasses: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        const manager = await ensureReplicationManager();

        const entriesTable = manager.getTable('entries');
        const classesTable = manager.getTable('classes');

        if (!entriesTable || !classesTable) return;

        // Subscribe to table changes
        unsubscribeEntries = entriesTable.subscribe(() => {
          // Skip refresh during drag operations to prevent snap-back
          if (isDraggingRef?.current) {
            return;
          }
          refresh();
        });

        unsubscribeClasses = classesTable.subscribe(() => {
          // Skip refresh during drag operations to prevent snap-back
          if (isDraggingRef?.current) {
            return;
          }
          refresh();
        });
      } catch (error) {
        logger.error('❌ Error setting up replication subscriptions:', error);
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeEntries) unsubscribeEntries();
      if (unsubscribeClasses) unsubscribeClasses();
    };
  }, [refresh]);

  // Handle visibility change for navigation back to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh]);

  // NOTE: data.entries is stable (from useState) - no need for additional memoization.
  // The duplicate record issue was fixed at the storage layer in ReplicatedTableBatch.ts
  // by normalizing all IDs to strings. See cleanupDuplicateRecords() in DatabaseManager.ts.

  return {
    entries: data.entries,
    classInfo: data.classInfo,
    isStale: false, // Replication handles staleness
    isRefreshing,
    fetchError,
    refresh,
    isCombinedView
  };
};
