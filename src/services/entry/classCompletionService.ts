import { supabase } from '@/lib/supabase';
import { shouldCheckCompletion } from '@/utils/validationUtils';
import { recalculatePlacementsForClass } from '../placementService';

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
 * This is the main entry point, called after score submission.
 * Optionally also checks paired Novice class (A/B) when in combined view.
 *
 * @param classId - The class ID to check completion for
 * @param pairedClassId - Optional paired class ID (only provided when scoring from combined Novice A & B view)
 *
 * @example
 * // Single class
 * await checkAndUpdateClassCompletion(123);
 *
 * @example
 * // Combined Novice A & B view
 * await checkAndUpdateClassCompletion(123, 124);
 */
export async function checkAndUpdateClassCompletion(
  classId: number,
  pairedClassId?: number
): Promise<void> {
// Update status for the primary class
  await updateSingleClassCompletion(classId);

  // Only update paired class if explicitly provided (i.e., scoring from combined view)
  if (pairedClassId) {
await updateSingleClassCompletion(pairedClassId);
  }
}

/**
 * Update completion status for a single class
 *
 * **Algorithm**:
 * 1. Count total entries in class
 * 2. Count how many are scored (is_scored = true)
 * 3. Optimization: Skip update if not first or last dog
 * 4. Update class status based on progress:
 *    - 0/N scored: no update (stays "not_started")
 *    - X/N scored: "in_progress"
 *    - N/N scored: "completed" + trigger placement calculations
 *
 * @param classId - The class ID to update
 */
async function updateSingleClassCompletion(classId: number): Promise<void> {
  // Get all entries for this class
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id')
    .eq('class_id', classId);

  if (entriesError || !entries || entries.length === 0) {
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

  const scoredCount = scoredEntries?.length || 0;
  const totalCount = entries.length;

// Check if we should skip this update (optimization: only check first and last dog)
  if (!shouldCheckCompletion(scoredCount, totalCount)) {
return;
  }

  // Handle different completion states
  if (scoredCount === totalCount && totalCount > 0) {
    // All entries scored - mark as completed
    await markClassCompleted(classId);
  } else if (scoredCount > 0 && scoredCount < totalCount) {
    // Some entries scored - mark as in_progress
    await markClassInProgress(classId, scoredCount, totalCount);
  } else {
    // No entries scored - no update needed
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
