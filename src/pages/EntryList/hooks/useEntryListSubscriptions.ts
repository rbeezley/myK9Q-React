import { useEffect } from 'react';
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
        (payload) => {
          // Check if the result belongs to any of our classes
          const resultClassId = (payload.new as any)?.class_id || (payload.old as any)?.class_id;
          if (classIds.includes(resultClassId)) {
            console.log(`Results change detected for class ${resultClassId}:`, payload);
            // Don't force refresh - let the store/state management handle updates
            // onRefresh(true); // REMOVED: This was causing unnecessary full page refreshes
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      entryCleanupFunctions.forEach(cleanup => cleanup());
      resultsChannel.unsubscribe();
    };
  }, [classIds, licenseKey, onRefresh, onEntryUpdate, enabled]);
};
