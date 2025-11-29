import { supabase } from '@/lib/supabase';
import { shouldCheckCompletion } from '@/utils/validationUtils';
import { recalculatePlacementsForClass } from '../placementService';
import { getReplicationManager } from '../replication/ReplicationManager';
import type { Class } from '../replication/tables/ReplicatedClassesTable';

/** Nested show data from joined query */
interface NestedShow {
  license_key: string;
  show_type?: string;
}

/** Nested trial data with shows from joined query */
interface NestedTrial {
  show_id: number;
  shows: NestedShow;
}

/**
 * Class Completion Service
 *
 * Handles automatic class completion status updates based on scoring progress:
 * - Tracks how many entries are scored vs total entries
 * - Updates class status: not_started → in_progress → completed
 * - Triggers final placement calculations when class completes
 * - Handles paired Novice A & B classes (combined views)
 *
 * **Phase 2, Task 2.3** - Extracted from entryService.ts
 *
 * **Business Rules**:
 * - Class becomes "in_progress" when first dog is scored
 * - Class becomes "completed" when all dogs are scored
 * - Optimization: Only check completion on first and last dog
 * - Final placements recalculated automatically on completion
 */

/**
 * Check if all entries in a class are completed and update class status
 *
 * This is the main entry point, called after score submission or reset.
 * Optionally also checks paired Novice class (A/B) when in combined view.
 *
 * @param classId - The class ID to check completion for
 * @param pairedClassId - Optional paired class ID (only provided when scoring from combined Novice A & B view)
 * @param justScoredEntryId - Optional entry ID that was JUST scored (workaround for read replica lag)
 * @param justResetEntryId - Optional entry ID that was JUST reset/unscored (workaround for read replica lag)
 *
 * @example
 * // Single class
 * await checkAndUpdateClassCompletion(123);
 *
 * @example
 * // Combined Novice A & B view
 * await checkAndUpdateClassCompletion(123, 124);
 *
 * @example
 * // With just-scored entry hint (avoids read replica race condition)
 * await checkAndUpdateClassCompletion(123, undefined, 456);
 *
 * @example
 * // With just-reset entry hint (avoids read replica race condition on reset)
 * await checkAndUpdateClassCompletion(123, undefined, undefined, 789);
 */
export async function checkAndUpdateClassCompletion(
  classId: number,
  pairedClassId?: number,
  justScoredEntryId?: number,
  justResetEntryId?: number
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`🔍 [classCompletion] checkAndUpdateClassCompletion called:`, {
    classId,
    pairedClassId,
    justScoredEntryId,
    justResetEntryId
  });

// Update status for the primary class
  await updateSingleClassCompletion(classId, justScoredEntryId, justResetEntryId);

  // Only update paired class if explicitly provided (i.e., scoring from combined view)
  if (pairedClassId) {
await updateSingleClassCompletion(pairedClassId, justScoredEntryId, justResetEntryId);
  }
}

/**
 * Update completion status for a single class
 *
 * **Algorithm**:
 * 1. Count total entries in class
 * 2. Count how many are scored (is_scored = true)
 * 3. Adjust count for read replica lag (just-scored or just-reset entries)
 * 4. Update class status based on progress:
 *    - 0/N scored: mark as "not_started"
 *    - X/N scored: mark as "in_progress"
 *    - N/N scored: mark as "completed" + trigger placement calculations
 *
 * @param classId - The class ID to update
 * @param justScoredEntryId - Optional entry ID that was JUST scored (workaround for read replica lag)
 * @param justResetEntryId - Optional entry ID that was JUST reset/unscored (workaround for read replica lag)
 */
async function updateSingleClassCompletion(
  classId: number,
  justScoredEntryId?: number,
  justResetEntryId?: number
): Promise<void> {
  // Get all entries for this class
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id')
    .eq('class_id', classId);

  if (entriesError || !entries || entries.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`🔍 [classCompletion] No entries found for class ${classId}:`, { entriesError });
return;
  }

  const entryIds = entries.map(e => e.id);

  // Check how many entries are scored (results merged into entries table)
  const { data: scoredEntries, error: resultsError } = await supabase
    .from('entries')
    .select('id, is_scored')
    .in('id', entryIds)
    .eq('is_scored', true);

  if (resultsError) {
    console.error('❌ Error fetching scored entries:', resultsError);
    return;
  }

  // CRITICAL FIX: Handle read replica lag for BOTH scoring and resetting
  const scoredIdsFromQuery = scoredEntries?.map(e => e.id) || [];
  let scoredCount = scoredIdsFromQuery.length;

  // Case 1: Just scored an entry - add to count if read replica missed it
  if (justScoredEntryId && !scoredIdsFromQuery.includes(justScoredEntryId)) {
    // eslint-disable-next-line no-console
    console.log(`⚠️ [classCompletion] Read replica lag (score): entry ${justScoredEntryId} not in scored list, adding to count`);
    scoredCount += 1;
  }

  // Case 2: Just reset an entry - remove from count if read replica still shows it as scored
  if (justResetEntryId && scoredIdsFromQuery.includes(justResetEntryId)) {
    // eslint-disable-next-line no-console
    console.log(`⚠️ [classCompletion] Read replica lag (reset): entry ${justResetEntryId} still in scored list, removing from count`);
    scoredCount -= 1;
  }

  const totalCount = entries.length;

  // eslint-disable-next-line no-console
  console.log(`🔍 [classCompletion] Class ${classId} status:`, {
    scoredCount,
    totalCount,
    scoredIdsFromQuery,
    justScoredEntryId,
    justResetEntryId,
    willUpdate: true // Always update after reset to ensure class moves to correct tab
  });

  // IMPORTANT: When resetting, we ALWAYS need to update the class status
  // Skip the optimization check if we're handling a reset
  const isResetOperation = justResetEntryId !== undefined;

// Check if we should skip this update (optimization: only check first and last dog)
  // BUT: Always run update after a reset to ensure class moves to correct tab
  if (!isResetOperation && !shouldCheckCompletion(scoredCount, totalCount)) {
    // eslint-disable-next-line no-console
    console.log(`⏭️ [classCompletion] Skipping update for class ${classId} (not first or last dog)`);
return;
  }

  // Handle different completion states
  if (scoredCount === totalCount && totalCount > 0) {
    // All entries scored - mark as completed
    // eslint-disable-next-line no-console
    console.log(`✅ [classCompletion] All entries scored for class ${classId}, marking completed`);
    await markClassCompleted(classId);
  } else if (scoredCount > 0 && scoredCount < totalCount) {
    // Some entries scored - mark as in_progress
    // eslint-disable-next-line no-console
    console.log(`🏃 [classCompletion] Class ${classId} in progress: ${scoredCount}/${totalCount}`);
    await markClassInProgress(classId, scoredCount, totalCount);
  } else {
    // No entries scored - mark as no-status
    // eslint-disable-next-line no-console
    console.log(`⏸️ [classCompletion] Class ${classId} has no scored entries, marking no-status`);
    await markClassNotStarted(classId);
}
}

/**
 * Mark a class as completed and trigger final placement calculations
 *
 * @param classId - The class ID to mark as completed
 */
async function markClassCompleted(classId: number): Promise<void> {
  const { error: updateError } = await supabase
    .from('classes')
    .update({
      is_completed: true,
      class_status: 'completed',
    })
    .eq('id', classId);

  if (updateError) {
    console.error('❌ Error updating class completion:', updateError);
    console.error('❌ Error message:', updateError.message);
    console.error('❌ Error details:', updateError.details);
    console.error('❌ Error hint:', updateError.hint);
    console.error('❌ Error code:', updateError.code);
    return;
  }

  // CRITICAL: Update local cache to reflect the change immediately
  await updateLocalClassCache(classId, { class_status: 'completed', is_completed: true });

// Recalculate placements now that class is complete
  await recalculateFinalPlacements(classId);
}

/**
 * Mark a class as in_progress
 *
 * @param classId - The class ID to mark as in_progress
 * @param scoredCount - Number of scored entries
 * @param totalCount - Total number of entries
 */
async function markClassInProgress(
  classId: number,
  _scoredCount: number,
  _totalCount: number
): Promise<void> {
const { error: updateError } = await supabase
    .from('classes')
    .update({
      is_completed: false,
      class_status: 'in_progress',
    })
    .eq('id', classId);

  if (updateError) {
    console.error('❌ Error updating class status to in_progress:', updateError);
    console.error('❌ Error message:', updateError.message);
    console.error('❌ Error details:', updateError.details);
    console.error('❌ Error hint:', updateError.hint);
    console.error('❌ Error code:', updateError.code);
    return;
  }

  // CRITICAL: Update local cache to reflect the change immediately
  await updateLocalClassCache(classId, { class_status: 'in_progress', is_completed: false });
}

/**
 * Mark a class as no-status (no entries scored)
 *
 * Used when resetting the last scored entry in a class.
 * Valid class_status values: 'no-status', 'setup', 'briefing', 'break', 'start_time', 'in_progress', 'completed'
 * Note: Uses hyphen to match entries.entry_status convention (migration 016)
 *
 * @param classId - The class ID to mark as no-status
 */
async function markClassNotStarted(classId: number): Promise<void> {
  const { error: updateError } = await supabase
    .from('classes')
    .update({
      is_completed: false,
      class_status: 'no-status',  // Matches entries.entry_status convention (migration 20251129)
    })
    .eq('id', classId);

  if (updateError) {
    console.error('❌ Error updating class status to no-status:', updateError);
    console.error('❌ Error message:', updateError.message);
    console.error('❌ Error details:', updateError.details);
    console.error('❌ Error hint:', updateError.hint);
    console.error('❌ Error code:', updateError.code);
    return;
  }

  // CRITICAL: Update local cache to reflect the change immediately
  await updateLocalClassCache(classId, { class_status: 'no-status', is_completed: false });

  // eslint-disable-next-line no-console
  console.log(`✅ [classCompletion] Class ${classId} marked as no-status`);
}

/**
 * Recalculate final placements for a completed class
 *
 * Fetches class details including show info to determine if it's a Nationals event,
 * then triggers placement recalculation with the appropriate rules.
 *
 * @param classId - The class ID to recalculate placements for
 */
async function recalculateFinalPlacements(classId: number): Promise<void> {
  try {
// Get show_id and license_key for this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        trial_id,
        trials!inner (
          show_id,
          shows!inner (
            license_key,
            show_type
          )
        )
      `)
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('❌ Error fetching class data:', classError);
      return;
    }

    if (classData && classData.trials) {
      const trial = classData.trials as unknown as NestedTrial;
      const show = trial.shows;
      const licenseKey = show.license_key;
      const isNationals = show.show_type?.toLowerCase().includes('national') || false;

await recalculatePlacementsForClass(classId, licenseKey, isNationals);
} else {
      console.error('⚠️ Could not find class or show data for class', classId);
    }
  } catch (placementError) {
    console.error('⚠️ Failed to calculate final placements:', placementError);
    // Non-critical error - class completion was already recorded
  }
}

/**
 * Manually trigger class completion check
 *
 * Useful for:
 * - Admin operations that update scores in bulk
 * - Recovery from failed completion checks
 * - Testing and debugging
 *
 * @param classId - The class ID to check
 *
 * @example
 * // After bulk score import
 * await manuallyCheckClassCompletion(123);
 */
export async function manuallyCheckClassCompletion(classId: number): Promise<void> {
await updateSingleClassCompletion(classId);
}

/**
 * Update the local IndexedDB cache for a class directly without syncing from server.
 * This prevents race conditions where stale data from read replicas overwrites
 * our correct local changes.
 *
 * @param classId - The class ID to update in cache
 * @param updates - The fields to update
 */
async function updateLocalClassCache(
  classId: number,
  updates: { class_status?: string; is_completed?: boolean }
): Promise<void> {
  try {
    const manager = getReplicationManager();
    if (!manager) {
      console.warn('⚠️ [updateLocalClassCache] No replication manager - skipping cache update');
      return;
    }

    const classesTable = manager.getTable('classes');
    if (!classesTable) {
      console.warn('⚠️ [updateLocalClassCache] Classes table not registered - skipping cache update');
      return;
    }

    // Get the current class from cache
    const currentClass = await classesTable.get(String(classId)) as Class | undefined;
    if (!currentClass) {
      console.warn(`⚠️ [updateLocalClassCache] Class ${classId} not found in cache - skipping cache update`);
      return;
    }

    // Update the class with new values
    const updatedClass: Class = {
      ...currentClass,
      class_status: updates.class_status ?? currentClass.class_status,
      is_completed: updates.is_completed ?? currentClass.is_completed,
      updated_at: new Date().toISOString()
    };

    // Write back to cache (not dirty - already synced to server)
    await classesTable.set(String(classId), updatedClass, false);

    // eslint-disable-next-line no-console
    console.log(`✅ [updateLocalClassCache] Updated class ${classId} in cache:`, {
      class_status: updatedClass.class_status,
      is_completed: updatedClass.is_completed
    });
  } catch (error) {
    console.error('❌ [updateLocalClassCache] Failed to update cache:', error);
    // Non-fatal - the DB write succeeded, cache will catch up on next sync
  }
}
