import { useEffect, useRef } from 'react';
import { subscribeToEntryUpdates } from '../../../services/entryService';
// TODO: Remove legacy localStateManager - replaced by replication system
// import { localStateManager } from '../../../services/localStateManager';
import type { RealtimeChannel as _RealtimeChannel } from '@supabase/supabase-js';

interface UseEntryListSubscriptionsOptions {
  classIds: number[];
  licenseKey: string;
  onRefresh: (forceRefresh?: boolean) => void;
  onEntryUpdate?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Shared hook for real-time subscriptions to entry and result updates.
 * Automatically refreshes data when entries or results are updated.
 */
export const useEntryListSubscriptions = ({
  classIds,
  licenseKey,
  onRefresh,
  onEntryUpdate,
  enabled = true
}: UseEntryListSubscriptionsOptions) => {
  // Debounce timer for result updates
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track when entry updates fire to prevent redundant results refreshes
  const lastEntryUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || classIds.length === 0 || !licenseKey) return;

    // Subscribe to entry updates for all classes (single or combined)
    const entryCleanupFunctions: (() => void)[] = [];

    // Subscribe to each class's entry updates
    classIds.forEach(classId => {
      const cleanup = subscribeToEntryUpdates(classId, licenseKey, async (payload) => {
console.log('🔔 onEntryUpdate exists?', !!onEntryUpdate);
// 🚀 LOCAL-FIRST: DO NOT clear pending changes here!
        // Let applyServerUpdate() in localStateManager handle clearing when it confirms
        // the server data matches the pending changes. This prevents a race condition where
        // we clear the pending change before applyServerUpdate() can merge it.
        // TODO: Remove legacy - replaced by replication
        // const entryId = (payload.new as any)?.id || (payload.old as any)?.id;
        // if (entryId && localStateManager.hasPendingChange(entryId)) {
        //   console.log(`🎯 Real-time update for entry ${entryId} with pending change - letting applyServerUpdate() handle merge and clear`);
        // }

        // If we have an onEntryUpdate callback, use it to update local state directly
        // This provides instant UI updates from real-time changes
        if (onEntryUpdate) {
          lastEntryUpdateRef.current = Date.now(); // Track when entry updated
onEntryUpdate(payload);
} else {
// Fallback: refresh without forcing cache bypass
          onRefresh(false);
        }
      });
      if (cleanup) {
        entryCleanupFunctions.push(cleanup);
      }
    });

    // NOTE: After migration 039, results table was merged into entries.
    // The entry subscription above now handles all updates including scoring changes.
    // No separate results subscription needed.

    // Cleanup subscriptions on unmount
    return () => {
      entryCleanupFunctions.forEach(cleanup => cleanup());

      // Clear any pending refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [classIds, licenseKey, onRefresh, onEntryUpdate, enabled]);
};
