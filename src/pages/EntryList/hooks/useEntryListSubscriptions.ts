import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { subscribeToEntryUpdates } from '../../../services/entryService';
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

  useEffect(() => {
    if (!enabled || classIds.length === 0 || !licenseKey) return;

    // Subscribe to entry updates for all classes (single or combined)
    const entryCleanupFunctions: (() => void)[] = [];

    // Subscribe to each class's entry updates
    classIds.forEach(classId => {
      const cleanup = subscribeToEntryUpdates(classId, licenseKey, (payload) => {
        console.log(`🔔 Entry update detected for class ${classId}`, payload);
        console.log('🔔 onEntryUpdate exists?', !!onEntryUpdate);
        console.log('🔔 typeof onEntryUpdate:', typeof onEntryUpdate);

        // If we have an onEntryUpdate callback, use it to update local state directly
        // This provides instant UI updates from real-time changes
        if (onEntryUpdate) {
          console.log('🔔 Calling onEntryUpdate with payload...');
          onEntryUpdate(payload);
          console.log('🔔 onEntryUpdate completed');
        } else {
          console.log('🔔 No onEntryUpdate callback, falling back to refresh');
          // Fallback: refresh without forcing cache bypass
          onRefresh(false);
        }
      });
      if (cleanup) {
        entryCleanupFunctions.push(cleanup);
      }
    });

    // Subscribe to results updates (for scoring changes)
    // Listen to all results changes and filter in callback for better reliability
    const resultsChannel = supabase
      .channel(`results-updates-${classIds.join('-')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'results'
        },
        async (payload) => {
          // Results table doesn't have class_id, need to look up via entry_id
          const entryId = (payload.new as any)?.entry_id || (payload.old as any)?.entry_id;

          if (!entryId) {
            console.warn('Results change detected but no entry_id found:', payload);
            return;
          }

          // Fetch the entry to get its class_id
          const { data: entry } = await supabase
            .from('entries')
            .select('class_id')
            .eq('id', entryId)
            .single();

          if (entry && classIds.includes(entry.class_id)) {
            console.log(`✅ Results change detected for entry ${entryId} in class ${entry.class_id}:`, payload.eventType);

            // Debounce refresh to avoid multiple rapid refreshes when placement recalculation
            // updates multiple results at once
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
            }

            refreshTimerRef.current = setTimeout(() => {
              console.log('🔄 Debounced refresh triggered');
              // Refresh to update entry status when scores are saved
              // IMPORTANT: Use true to force cache bypass so we get fresh data immediately
              // This ensures the UI updates right away instead of showing stale cached data
              onRefresh(true);
              refreshTimerRef.current = null;
            }, 300); // Wait 300ms after last update before refreshing
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      entryCleanupFunctions.forEach(cleanup => cleanup());
      resultsChannel.unsubscribe();

      // Clear any pending refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [classIds, licenseKey, onRefresh, onEntryUpdate, enabled]);
};
