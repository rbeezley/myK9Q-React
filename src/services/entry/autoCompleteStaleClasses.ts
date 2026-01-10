/**
 * Auto-Complete Stale Classes Service
 *
 * Automatically completes classes that have been abandoned (stale) when a judge
 * moves to scoring a different level. This prevents classes from being left
 * "in progress" with unscored dogs that are actually absent.
 *
 * Rule: Same judge + different level + stale 15+ minutes = auto-complete
 * Same judge + same level = do nothing (legitimate buried/containers workflow)
 */

import { supabase } from '@/lib/supabase';
import { markUnscoredEntriesAsAbsent } from '@/services/entryService';
import { replicatedClassesTable } from '@/services/replication/tables/ReplicatedClassesTable';
import { logger } from '@/utils/logger';

/** Minutes before a class is considered stale */
const STALE_THRESHOLD_MINUTES = 15;

/** Result of auto-completing a class */
export interface AutoCompletedClass {
  classId: number;
  className: string;
  absentCount: number;
}

/**
 * Check for and auto-complete stale classes when a judge scores in a different level.
 *
 * Called after each score submission. Finds other "in_progress" classes where:
 * - Same judge_name as the class just scored
 * - Different level (e.g., Novice vs Advanced)
 * - Stale (last_result_at is 15+ minutes ago)
 * - Has unscored entries
 * - Trial has auto_complete_stale_classes enabled (default true)
 *
 * @param currentClassId - The class ID that was just scored
 * @returns Array of classes that were auto-completed
 */
export async function autoCompleteStaleClasses(
  currentClassId: number
): Promise<AutoCompletedClass[]> {
  const autoCompleted: AutoCompletedClass[] = [];

  try {
    // Step 1: Get current class info (judge_name, level, trial_id)
    const { data: currentClass, error: currentClassError } = await supabase
      .from('classes')
      .select(`
        id,
        judge_name,
        level,
        element,
        trial_id,
        trials!inner (
          auto_complete_stale_classes
        )
      `)
      .eq('id', currentClassId)
      .single();

    if (currentClassError || !currentClass) {
      logger.warn('[autoCompleteStaleClasses] Could not fetch current class:', currentClassError);
      return [];
    }

    // Step 2: Check if feature is enabled for this trial
    // Handle the nested join result which could be an object or array depending on Supabase response
    const trials = currentClass.trials as unknown;
    const trialData = Array.isArray(trials) ? trials[0] : trials;
    const autoCompleteEnabled = (trialData as { auto_complete_stale_classes?: boolean | null } | undefined)?.auto_complete_stale_classes;

    if (autoCompleteEnabled === false) {
      logger.log('[autoCompleteStaleClasses] Feature disabled for this trial');
      return [];
    }

    // Step 3: Calculate stale threshold timestamp
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    // Step 4: Find stale classes with same judge, different level
    // Using view_class_summary for entry counts
    const { data: staleClasses, error: staleError } = await supabase
      .from('view_class_summary')
      .select(`
        class_id,
        element,
        level,
        section,
        judge_name,
        total_entries,
        scored_entries,
        trial_id
      `)
      .eq('judge_name', currentClass.judge_name)
      .neq('level', currentClass.level)
      .eq('trial_id', currentClass.trial_id);

    if (staleError) {
      logger.warn('[autoCompleteStaleClasses] Error fetching stale classes:', staleError);
      return [];
    }

    if (!staleClasses || staleClasses.length === 0) {
      return [];
    }

    // Step 5: For each potential stale class, check status and last_result_at
    for (const cls of staleClasses) {
      // Skip if no unscored entries
      const unscoredCount = (cls.total_entries || 0) - (cls.scored_entries || 0);
      if (unscoredCount <= 0) {
        continue;
      }

      // Get detailed class info including status and last_result_at
      const { data: classDetails, error: detailsError } = await supabase
        .from('classes')
        .select('id, class_status, last_result_at, element, level, section')
        .eq('id', cls.class_id)
        .single();

      if (detailsError || !classDetails) {
        continue;
      }

      // Skip if not in_progress
      if (classDetails.class_status !== 'in_progress') {
        continue;
      }

      // Skip if not stale (last_result_at is too recent or null)
      if (!classDetails.last_result_at || classDetails.last_result_at > staleThreshold) {
        continue;
      }

      // This class qualifies for auto-completion
      logger.log(`[autoCompleteStaleClasses] Auto-completing stale class ${cls.class_id}:`, {
        className: `${classDetails.element} ${classDetails.level} ${classDetails.section || ''}`.trim(),
        judgeName: cls.judge_name,
        lastResultAt: classDetails.last_result_at,
        unscoredCount,
      });

      try {
        // Mark all unscored entries as absent
        const absentCount = await markUnscoredEntriesAsAbsent(cls.class_id);

        // Update class status to completed
        await replicatedClassesTable.updateClassStatus(
          cls.class_id.toString(),
          'completed',
          { is_scoring_finalized: true }
        );

        // Also update in Supabase directly for immediate consistency
        await supabase
          .from('classes')
          .update({
            class_status: 'completed',
            is_scoring_finalized: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cls.class_id);

        const className = `${classDetails.element} ${classDetails.level} ${classDetails.section || ''}`.trim();
        autoCompleted.push({
          classId: cls.class_id,
          className,
          absentCount,
        });

        logger.log(`[autoCompleteStaleClasses] Successfully auto-completed class ${cls.class_id}`);
      } catch (completeError) {
        logger.error(`[autoCompleteStaleClasses] Failed to auto-complete class ${cls.class_id}:`, completeError);
      }
    }

    return autoCompleted;
  } catch (error) {
    logger.error('[autoCompleteStaleClasses] Unexpected error:', error);
    return [];
  }
}
