import { supabase } from '@/lib/supabase';
import { EntryStatus } from '@/stores/entryStore';
import { triggerImmediateEntrySync } from '../entryReplication';
import { checkAndUpdateClassCompletion } from './classCompletionService';
import { getReplicationManager } from '../replication/ReplicationManager';
import type { Entry } from '../replication/tables/ReplicatedEntriesTable';

/**
 * Entry Status Management Module
 *
 * Handles all entry status transitions and updates:
 * - In-ring status management (markInRing)
 * - Manual completion (markEntryCompleted)
 * - Check-in status updates (updateEntryCheckinStatus)
 * - Score reset (resetEntryScore)
 *
 * **Phase 2, Task 2.2** - Extracted from entryService.ts
 *
 * **Status Transitions**:
 * ```
 * no-status → checked-in → in-ring → completed
 *      ↑                        ↓
 *      └────── reset ───────────┘
 * ```
 *
 * **Design Principles**:
 * - Never overwrite completed status with lower status
 * - Always trigger immediate sync for UI updates
 * - Check class completion after status changes
 * - Preserve scored entries when resetting in-ring status
 */

/**
 * Check if in-ring status update should be skipped (already in desired state)
 * Extracted to reduce nesting depth (DEBT-009)
 */
async function shouldSkipInRingUpdate(entryId: number, inRing: boolean): Promise<boolean> {
  const manager = getReplicationManager();
  if (!manager) return false;

  const entriesTable = manager.getTable('entries');
  if (!entriesTable) return false;

  const cachedEntry = await entriesTable.get(String(entryId)) as Entry | undefined;
  if (!cachedEntry) return false;

  const currentlyInRing = cachedEntry.entry_status === 'in-ring';
  if (currentlyInRing !== inRing) return false;

  // eslint-disable-next-line no-console
  console.log(`⏭️ [markInRing] Entry ${entryId} already ${inRing ? 'in-ring' : 'not in-ring'} - skipping DB call`);
  return true;
}

/**
 * Mark an entry as being in the ring (or remove from ring)
 *
 * **Business Rules**:
 * - When adding to ring: Changes 'no-status' → 'in-ring'
 * - When removing from ring:
 *   - If entry is scored: Keep as 'completed' (don't downgrade)
 *   - If entry not scored: Change 'in-ring' → 'no-status'
 *
 * **Use Cases**:
 * - Ring steward marks dog entering ring
 * - Ring steward marks dog exiting ring
 * - Automatic status management during scoring
 *
 * @param entryId - The entry ID to update
 * @param inRing - true = mark as in ring, false = remove from ring
 * @returns Promise<boolean> - true if successful
 *
 * @example
 * // Dog enters ring
 * await markInRing(123, true);
 *
 * @example
 * // Dog exits ring (preserves completed status if scored)
 * await markInRing(123, false);
 */
export async function markInRing(
  entryId: number,
  inRing: boolean = true
): Promise<boolean> {
  // eslint-disable-next-line no-console
  console.log(`🏟️ [markInRing] Called with entryId=${entryId}, inRing=${inRing}`);

  try {
    // OPTIMIZATION: Check local cache first to avoid redundant DB calls
    // This makes the function idempotent - multiple calls with same state are no-ops
    const skipUpdate = await shouldSkipInRingUpdate(entryId, inRing);
    if (skipUpdate) return true;

    // When removing from ring (inRing=false), check if entry is already scored
    // If scored, don't change status back to 'no-status' - keep it as 'completed'
    if (!inRing) {
      // Check if entry has a score (results merged into entries table)
      const { data: entry } = await supabase
        .from('entries')
        .select('is_scored')
        .eq('id', entryId)
        .maybeSingle();

      if (entry?.is_scored) {
        // Update to completed status instead of no-status
        // Also update is_in_ring for backward compatibility with deprecated field
        const { error } = await supabase
          .from('entries')
          .update({
            entry_status: 'completed',
            is_in_ring: false,  // CRITICAL: Also update deprecated field
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId)
          .select();

        if (error) {
          console.error('❌ markInRing database error:', error);
          throw error;
        }

        // eslint-disable-next-line no-console
        console.log(`✅ [markInRing] Entry ${entryId} (scored) -> entry_status='completed', is_in_ring=false`);

        // CRITICAL FIX: Update local cache directly instead of syncing from server.
        // Syncing was causing race conditions where stale data from read replicas
        // would overwrite our correct local changes.
        await updateLocalCacheEntry(entryId, { entry_status: 'completed', is_in_ring: false });

        return true;
      }
    }

    // Normal behavior: toggle between 'no-status' and 'in-ring'
    const newStatus: EntryStatus = inRing ? 'in-ring' : 'no-status';

    // Also update is_in_ring for backward compatibility with deprecated field
    const { error } = await supabase
      .from('entries')
      .update({
        entry_status: newStatus,
        is_in_ring: inRing,  // CRITICAL: Also update deprecated field
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ markInRing database error:', error);
      throw error;
    }

// eslint-disable-next-line no-console
    console.log(`✅ [markInRing] Entry ${entryId} -> entry_status='${newStatus}', is_in_ring=${inRing}`);

    // CRITICAL FIX: Update local cache directly instead of syncing from server.
    // Syncing was causing race conditions where stale data from read replicas
    // would overwrite our correct local changes.
    await updateLocalCacheEntry(entryId, { entry_status: newStatus, is_in_ring: inRing });

    return true;
  } catch (error) {
    console.error('❌ markInRing error:', error);
    throw error;
  }
}

/**
 * Helper to update the local IndexedDB cache directly without syncing from server.
 * This prevents race conditions where stale data from read replicas overwrites
 * our correct local changes.
 */
async function updateLocalCacheEntry(
  entryId: number,
  updates: { entry_status?: string; is_in_ring?: boolean }
): Promise<void> {
  try {
    const manager = getReplicationManager();
    if (!manager) {
      console.warn('⚠️ [updateLocalCacheEntry] No replication manager - skipping cache update');
      return;
    }

    const entriesTable = manager.getTable('entries');
    if (!entriesTable) {
      console.warn('⚠️ [updateLocalCacheEntry] Entries table not registered - skipping cache update');
      return;
    }

    // Get the current entry from cache
    const currentEntry = await entriesTable.get(String(entryId)) as Entry | undefined;
    if (!currentEntry) {
      console.warn(`⚠️ [updateLocalCacheEntry] Entry ${entryId} not found in cache - skipping cache update`);
      return;
    }

    // Update the entry with new values
    const updatedEntry: Entry = {
      ...currentEntry,
      entry_status: updates.entry_status ?? currentEntry.entry_status,
      is_in_ring: updates.is_in_ring ?? currentEntry.is_in_ring,
      updated_at: new Date().toISOString()
    };

    // Write back to cache (not dirty - already synced to server)
    await entriesTable.set(String(entryId), updatedEntry, false);

    // eslint-disable-next-line no-console
    console.log(`✅ [updateLocalCacheEntry] Updated entry ${entryId} in cache:`, {
      entry_status: updatedEntry.entry_status,
      is_in_ring: updatedEntry.is_in_ring
    });
  } catch (error) {
    console.error('❌ [updateLocalCacheEntry] Failed to update cache:', error);
    // Non-fatal - the DB write succeeded, cache will catch up on next sync
  }
}

/**
 * Mark an entry as completed without full scoring details
 *
 * **Use Case**: Manual completion by gate stewards when not using ringside scoring
 *
 * **Business Rules**:
 * - Only allows manual completion if entry is NOT already scored
 * - If entry has actual score data, this operation is skipped
 * - Sets result_status to 'manual_complete' to distinguish from scored entries
 *
 * **Status Changes**:
 * - entry_status: → 'completed'
 * - is_scored: → true
 * - result_status: → 'manual_complete'
 * - scoring_completed_at: → current timestamp
 *
 * @param entryId - The entry ID to mark as completed
 * @returns Promise<boolean> - true if successful
 *
 * @example
 * // Gate steward manually marks dog as complete
 * await markEntryCompleted(123);
 */
export async function markEntryCompleted(entryId: number): Promise<boolean> {
try {
    // Check if entry is already scored with actual data (results merged into entries table)
    const { data: existingEntry, error: checkError } = await supabase
      .from('entries')
      .select('id, is_scored')
      .eq('id', entryId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('❌ Error checking existing entry:', checkError);
      throw checkError;
    }

    if (existingEntry && existingEntry.is_scored) {
      console.warn('⚠️ Entry is already scored - skipping manual completion');
      return true; // Don't overwrite existing score
    }

    // Update the entry with completed status and score flag
    const { error: statusError } = await supabase
      .from('entries')
      .update({
        entry_status: 'completed',
        is_scored: true,
        result_status: 'manual_complete',
        scoring_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select();

    if (statusError) {
      console.error('❌ markEntryCompleted database error:', statusError);
      throw statusError;
    }

return true;
  } catch (error) {
    console.error('Error in markEntryCompleted:', error);
    throw error;
  }
}

/**
 * Update check-in status for an entry
 *
 * **Use Case**: Check-in desk operations
 *
 * **Status Values**:
 * - 'checked-in': Dog is present and ready
 * - 'absent': Dog did not show up
 * - 'withdrawn': Dog was withdrawn from class
 * - 'no-status': Initial state (not yet checked in)
 *
 * **Features**:
 * - Updates entry_status field
 * - Triggers immediate replication sync
 * - Includes write propagation delay (100ms) to prevent race conditions
 * - Verifies update by reading back
 *
 * @param entryId - The entry ID to update
 * @param checkinStatus - The new check-in status
 * @returns Promise<boolean> - true if successful
 *
 * @example
 * // Check in a dog
 * await updateEntryCheckinStatus(123, 'checked-in');
 *
 * @example
 * // Mark dog as absent
 * await updateEntryCheckinStatus(123, 'absent');
 */
export async function updateEntryCheckinStatus(
  entryId: number,
  checkinStatus: EntryStatus
): Promise<boolean> {
  try {
    // Update the unified entry_status field
    // CRITICAL: Include updated_at to trigger replication sync
    const updateData = {
      entry_status: checkinStatus,
      updated_at: new Date().toISOString(),
    };

const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ Database error updating entry status:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Update data that failed:', updateData);
      throw new Error(
        `Database update failed: ${error.message || error.code || 'Unknown database error'}`
      );
    }

    // CRITICAL: Trigger immediate sync to update UI without refresh
    // This ensures the status change reflects in the replication cache immediately
    await triggerImmediateEntrySync('updateEntryCheckinStatus');

    // Small delay to ensure write has propagated (fixes immediate refresh race condition)
    await new Promise((resolve) => setTimeout(resolve, 100));
return true;
  } catch (error) {
    console.error('Error in updateEntryCheckinStatus:', error);
    throw error;
  }
}

/**
 * Reset a dog's score and return them to pending status
 *
 * **Use Case**:
 * - Judge needs to rescore an entry
 * - Incorrect score was entered
 * - Entry was scored in wrong class
 *
 * **What Gets Reset**:
 * - is_scored → false
 * - result_status → 'pending'
 * - entry_status → 'no-status'
 * - All score fields (time, faults, placement, points) → 0/null
 * - Timestamps (scoring_completed_at, ring times) → null
 *
 * **Side Effects**:
 * - Triggers immediate replication sync
 * - Checks class completion status (class may become incomplete)
 *
 * @param entryId - The entry ID to reset
 * @returns Promise<boolean> - true if successful
 *
 * @example
 * // Reset entry to allow re-scoring
 * await resetEntryScore(123);
 */
export async function resetEntryScore(entryId: number): Promise<boolean> {
  try {
    // Get the class_id before resetting the score
    const { data: entryData } = await supabase
      .from('entries')
      .select('class_id')
      .eq('id', entryId)
      .single();

    // Reset score fields in the entries table (results merged into entries)
    // CRITICAL: Include updated_at to trigger replication sync
    const { error } = await supabase
      .from('entries')
      .update({
        is_scored: false,
        result_status: 'pending',
        entry_status: 'no-status', // Reset entry status when score is cleared
        search_time_seconds: 0,
        total_correct_finds: 0,
        total_incorrect_finds: 0,
        total_faults: 0,
        final_placement: 0,
        total_score: 0,
        points_earned: 0,
        scoring_completed_at: null,
        ring_entry_time: null,
        ring_exit_time: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    if (error) {
      console.error('❌ Database error resetting score:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        entryId,
      });
      throw new Error(
        `Database reset failed: ${error.message || error.code || 'Unknown database error'}`
      );
    }

// CRITICAL FIX: Update local cache directly instead of relying on sync.
    // The sync fetches from read replicas which may have stale 'completed' status
    // due to replication lag, overwriting our correct local changes.
    // eslint-disable-next-line no-console
    console.log(`🔄 [resetEntryScore] Updating local cache for entry ${entryId} -> entry_status='no-status'`);
    await updateLocalCacheEntry(entryId, { entry_status: 'no-status', is_in_ring: false });

    // Fire-and-forget sync for eventual consistency (other clients, background refresh)
    // Don't await - local cache already updated, sync runs in background
    triggerImmediateEntrySync('resetEntryScore').catch(err =>
      console.warn('⚠️ [resetEntryScore] Background sync failed:', err)
    );

    // Fire-and-forget class completion check (non-blocking)
    if (entryData?.class_id) {
      checkAndUpdateClassCompletion(entryData.class_id).catch(completionError =>
        console.error('⚠️ Failed to check class completion:', completionError)
      );
    }

    return true;
  } catch (error) {
    console.error('Error in resetEntryScore:', error);
    throw error;
  }
}

/**
 * Re-export types for convenience
 */
export type { EntryStatus } from '@/stores/entryStore';
