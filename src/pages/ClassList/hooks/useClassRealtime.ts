/**
 * useClassRealtime Hook
 *
 * Manages Supabase real-time subscriptions for class updates.
 * Handles optimistic local updates for class status changes and full refreshes for other changes.
 *
 * Extracted from ClassList.tsx
 */

import { useEffect, useCallback } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { ClassEntry } from './useClassListData';

/**
 * Payload type for real-time updates
 */
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
}

/**
 * Custom hook for managing real-time class updates
 *
 * Provides real-time synchronization for:
 * - **Class Status Updates**: Optimistic local updates for status changes
 * - **Class Completion**: Updates is_completed flag in real-time
 * - **Other Changes**: Full refresh for INSERT/DELETE operations
 *
 * **Optimistic Updates**: For UPDATE events, updates local state directly without refetch
 * **Full Refresh**: For INSERT/DELETE events, triggers full data refetch
 * **Automatic Cleanup**: Unsubscribes when component unmounts or dependencies change
 *
 * **Subscription Channel**: `class-list-trial-{trialId}` - scoped to current trial
 * **Tables Watched**: `classes` and `entries` tables in public schema
 * **Events**: All events (* = INSERT, UPDATE, DELETE)
 *
 * @param trialId - Trial ID to subscribe to
 * @param licenseKey - License key for authorization
 * @param setClasses - State setter for local class updates
 * @param refetch - Refetch function for full data refresh
 * @param supabaseClient - Supabase client instance
 *
 * @example
 * ```tsx
 * function ClassList() {
 *   const [classes, setClasses] = useState<ClassEntry[]>([]);
 *   const { refetch } = useClassListData();
 *
 *   // Set up real-time subscription
 *   useClassRealtime(
 *     trialId,
 *     licenseKey,
 *     setClasses,
 *     refetch,
 *     supabase
 *   );
 *
 *   return (
 *     <div>
 *       {classes.map(cls => (
 *         <ClassCard key={cls.id} classEntry={cls} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClassRealtime(
  trialId: number | undefined,
  licenseKey: string | undefined,
  setClasses: React.Dispatch<React.SetStateAction<ClassEntry[]>>,
  refetch: () => Promise<void>,
  supabaseClient: SupabaseClient
): void {
  // Memoize the payload handler to avoid recreating on every render
  const handleRealtimeUpdate = useCallback((payload: RealtimePayload) => {
    console.log('🔄 Real-time: Class update received');
    console.log('🔄 Real-time payload:', payload);
    console.log('🔄 Real-time timestamp:', new Date().toISOString());

    // For UPDATE events, update local state directly (optimistic update)
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      console.log('🔄 Real-time: Updating class locally:', payload.new.id);
      setClasses(prev => prev.map(c =>
        c.id === payload.new.id
          ? {
              ...c,
              class_status: payload.new.class_status || 'none',
              is_completed: payload.new.is_completed || false
            }
          : c
      ));
    } else {
      // For INSERT/DELETE, do full refresh
      console.log('🔄 Real-time: Full refresh needed for:', payload.eventType);
      refetch();
    }
  }, [setClasses, refetch]);

  // Set up real-time subscription
  useEffect(() => {
    // Don't subscribe if missing required data
    if (!trialId || !licenseKey) {
      console.log('🔄 Real-time: Skipping subscription (missing trialId or licenseKey)');
      return;
    }

    console.log('🔄 Real-time: Setting up subscription for trial:', trialId);

    // Create subscription channel - watch both classes and entries tables
    const subscription: RealtimeChannel = supabaseClient
      .channel(`class-list-trial-${trialId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'classes'
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'entries'
        },
        (payload) => {
          console.log('🔄 Real-time: Entry update received:', payload.eventType);
          // For entry changes, always refetch to update dog counts and status
          refetch();
        }
      )
      .subscribe();

    console.log('🔄 Real-time: Subscription active for trial:', trialId, '(classes + entries)');

    // Cleanup function - unsubscribe on unmount or dependency change
    return () => {
      console.log('🔄 Real-time: Unsubscribing from trial:', trialId);
      subscription.unsubscribe();
    };
  }, [trialId, licenseKey, supabaseClient, handleRealtimeUpdate]);
}
