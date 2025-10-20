import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { subscribeToEntryUpdates } from '../../../services/entryService';
import type { RealtimeChannel as _RealtimeChannel } from '@supabase/supabase-js';

interface UseEntryListSubscriptionsOptions {
  classIds: number[];
  licenseKey: string;
  onRefresh: (forceRefresh?: boolean) => void;
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
  enabled = true
}: UseEntryListSubscriptionsOptions) => {
  useEffect(() => {
    if (!enabled || classIds.length === 0 || !licenseKey) return;

    // Subscribe to entry updates for all classes (single or combined)
    const entryCleanupFunctions: (() => void)[] = [];

    // Subscribe to each class's entry updates
    classIds.forEach(classId => {
      const cleanup = subscribeToEntryUpdates(classId, licenseKey, () => {
        console.log(`Entry update detected for class ${classId}`);
        onRefresh(true); // Force refresh to bypass cache
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
            onRefresh(true); // Force refresh to bypass cache
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      entryCleanupFunctions.forEach(cleanup => cleanup());
      resultsChannel.unsubscribe();
    };
  }, [classIds, licenseKey, onRefresh, enabled]);
};
