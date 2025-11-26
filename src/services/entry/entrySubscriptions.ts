import { syncManager } from '../syncManager';

/**
 * Entry Real-time Subscriptions Service
 *
 * Manages real-time subscriptions for entry updates using Supabase's
 * real-time functionality via the syncManager.
 *
 * **Phase 3, Task 3.1** - Extracted from entryService.ts
 *
 * **Key Features**:
 * - Real-time entry updates for multi-user trials
 * - Automatic subscription cleanup
 * - Comprehensive payload logging for debugging
 * - Field-level change detection (especially for in_ring status)
 *
 * **Use Cases**:
 * - Multi-user ringside scoring
 * - Live class roster updates
 * - In-ring status synchronization
 * - Real-time score updates across devices
 */

/**
 * Real-time payload structure from Supabase
 *
 * Contains both old and new record data for change detection
 */
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  new?: Record<string, any>;
  old?: Record<string, any>;
}

/**
 * Subscribe to real-time entry updates for a specific class
 *
 * Sets up a Supabase real-time subscription for all entry changes
 * in a given class. This enables multi-user trial scoring where
 * changes made by one device are immediately visible on all other devices.
 *
 * **Subscription Lifecycle**:
 * 1. Creates unique subscription key (`entries:{classId}`)
 * 2. Registers with syncManager
 * 3. Receives real-time updates via callback
 * 4. Cleanup via returned unsubscribe function
 *
 * **Performance**:
 * - Filters by class_id at database level (efficient)
 * - Only receives updates for specified class
 * - Minimal network overhead
 *
 * **Debugging**:
 * - Extensive console logging for troubleshooting
 * - Logs event types, timestamps, field changes
 * - Special detection for in_ring status changes
 *
 * @param actualClassId - Class ID to subscribe to
 * @param licenseKey - License key (currently unused, reserved for future multi-tenancy)
 * @param onUpdate - Callback function invoked when updates occur
 * @returns Unsubscribe function to cleanup subscription
 *
 * @example
 * // Basic usage in a React component
 * useEffect(() => {
 *   const unsubscribe = subscribeToEntryUpdates(
 *     classId,
 *     licenseKey,
 *     (payload) => {
 *       console.log('Entry updated:', payload);
 *       refetchEntries(); // Refresh local data
 *     }
 *   );
 *
 *   return () => unsubscribe(); // Cleanup on unmount
 * }, [classId]);
 *
 * @example
 * // Detecting specific field changes
 * subscribeToEntryUpdates(classId, licenseKey, (payload) => {
 *   if (payload.old && payload.new) {
 *     if (payload.old.in_ring !== payload.new.in_ring) {
 *       console.log('In-ring status changed!');
 *     }
 *   }
 * });
 */
export function subscribeToEntryUpdates(
  actualClassId: number,
  licenseKey: string,
  onUpdate: (payload: RealtimePayload) => void
): () => void {
  // Create unique subscription key for this class
  const key = `entries:${actualClassId}`;

console.log('🔍 Using correct column name: class_id (matching the main query)');

  // Register subscription with syncManager
  // Filter: class_id=eq.{actualClassId} ensures we only get updates for this class
  syncManager.subscribeToUpdates(
    key,
    'entries',
    `class_id=eq.${actualClassId}`,
    (payload) => {
      // Comprehensive logging for debugging real-time issues
console.log('🔄 Event type:', payload.eventType);
console.log('🔄 Schema:', payload.schema);
console.log('🔄 Full payload object:', JSON.stringify(payload, null, 2));

      // Log new record data (INSERT or UPDATE) - debug logging removed
      // Log old record data (UPDATE or DELETE) - debug logging removed

      // Detect and log specific field changes (UPDATE events)
      if (payload.new && payload.old) {
const oldData = payload.old as any;
        const newData = payload.new as any;

        // Log in_ring status changes (critical for ringside scoring)
console.log('  🆔 entry_id:', newData.id);
console.log('  📂 class_id:', newData.class_id);

        // Special logging for in_ring status changes
        if (oldData.in_ring !== newData.in_ring) {
console.log(
            `  Dog #${newData.armband} (ID: ${newData.id}) is now ${newData.in_ring ? 'IN RING' : 'NOT IN RING'}`
          );
        }
      }

      // Invoke user callback with payload
onUpdate(payload);
console.log('🚨🚨🚨 END REAL-TIME PAYLOAD PROCESSING 🚨🚨🚨');
    }
  );

  // Return unsubscribe function for cleanup
  return () => {
syncManager.unsubscribe(key);
  };
}

/**
 * Create subscription key for a class
 *
 * Generates the unique key used to identify subscriptions in syncManager.
 * Format: `entries:{classId}`
 *
 * @param classId - Class ID
 * @returns Subscription key string
 *
 * @private Internal helper - exposed for testing
 */
export function createSubscriptionKey(classId: number): string {
  return `entries:${classId}`;
}

/**
 * Format filter string for Supabase real-time subscriptions
 *
 * Creates PostgREST filter syntax for Supabase subscriptions.
 * Format: `class_id=eq.{classId}`
 *
 * @param classId - Class ID to filter by
 * @returns Filter string for Supabase subscription
 *
 * @private Internal helper - exposed for testing
 */
export function createClassFilter(classId: number): string {
  return `class_id=eq.${classId}`;
}
