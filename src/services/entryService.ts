import { supabase } from '../lib/supabase';
import { Entry, EntryStatus } from '../stores/entryStore';
import { QueuedScore } from '../stores/offlineQueueStore';
import { recalculatePlacementsForClass } from './placementService';
import { convertTimeToSeconds } from './entryTransformers';
import { initializeDebugFunctions } from './entryDebug';
import { syncManager } from './syncManager';
import { triggerImmediateEntrySync } from './entryReplication';
import {
  getClassEntries as getClassEntriesFromDataLayer,
  getTrialEntries as getTrialEntriesFromDataLayer,
  getEntriesByArmband as getEntriesByArmbandFromDataLayer,
  checkAndUpdateClassCompletion,
  markInRing as markInRingFromStatusModule,
  markEntryCompleted as markEntryCompletedFromStatusModule,
  updateEntryCheckinStatus as updateEntryCheckinStatusFromStatusModule,
  resetEntryScore as resetEntryScoreFromStatusModule,
  submitScore as submitScoreFromSubmissionModule,
  submitBatchScores as submitBatchScoresFromSubmissionModule,
} from './entry';
import { buildClassName } from '@/utils/stringUtils';
import { convertResultTextToStatus } from '@/utils/transformationUtils';
import { determineAreasForClass } from '@/utils/classUtils';
import { shouldCheckCompletion } from '@/utils/validationUtils';
import { calculateTotalAreaTime } from '@/utils/calculationUtils';

/**
 * Service for managing entries and scores
 */

// Initialize debug functions for browser console access
initializeDebugFunctions();

export interface ClassData {
  id: number;
  className: string;
  classType: string;
  trialId: number;
  judgeId?: string;
  totalEntries: number;
  scoredEntries: number;
  isCompleted: boolean;
}

/**
 * Result data for inserting/updating scores in the database
 */
export interface ResultData {
  entry_id: number;
  result_status: string;
  search_time_seconds: number;
  is_scored: boolean;
  is_in_ring: boolean;
  scoring_completed_at: string | null;
  total_faults?: number;
  disqualification_reason?: string;
  points_earned?: number;
  total_score?: number;
  total_correct_finds?: number;
  total_incorrect_finds?: number;
  no_finish_count?: number;
  area1_time_seconds?: number;
  area2_time_seconds?: number;
  area3_time_seconds?: number;
  area4_time_seconds?: number;
}

/**
 * Fetch all entries for a specific class or multiple classes
 *
 * **Phase 1 Complete**: Now uses unified entryDataLayer for cleaner abstraction
 *
 * @param classIds - Single class ID or array of class IDs (for combined Novice A & B view)
 * @param licenseKey - License key for tenant isolation
 */
export async function getClassEntries(
  classIds: number | number[],
  licenseKey: string
): Promise<Entry[]> {
  // Delegate to unified data layer (Phase 1, Task 1.3)
  return getClassEntriesFromDataLayer(classIds, licenseKey);
}

/**
 * Fetch entries for a specific trial
 *
 * **Phase 1 Complete**: Now uses unified entryDataLayer
 */
export async function getTrialEntries(
  trialId: number,
  licenseKey: string
): Promise<Entry[]> {
  // Delegate to unified data layer (Phase 1, Task 1.3)
  return getTrialEntriesFromDataLayer(trialId, licenseKey);
}

/**
 * Submit a score for an entry
 * @param pairedClassId - Optional paired class ID for combined Novice A & B view (updates both classes' status)
 * @param classId - Optional class ID to avoid database lookup (performance optimization)
 *
 * **Phase 2 Task 2.1**: Delegates to scoreSubmission module
 */
export async function submitScore(
  entryId: number,
  scoreData: {
    resultText: string;
    searchTime?: string;
    faultCount?: number;
    points?: number;
    nonQualifyingReason?: string;
    areas?: { [key: string]: string };
    healthCheckPassed?: boolean;
    mph?: number;
    score?: number;
    deductions?: number;
    // Nationals-specific fields
    correctCount?: number;
    incorrectCount?: number;
    finishCallErrors?: number;
    // Area time fields for AKC Scent Work
    areaTimes?: string[];
    element?: string;
    level?: string;
  },
  pairedClassId?: number,
  classId?: number
): Promise<boolean> {
  return submitScoreFromSubmissionModule(entryId, scoreData, pairedClassId, classId);
}

/**
 * Class completion checking moved to classCompletionService.ts (Phase 2, Task 2.3)
 * Import via: import { checkAndUpdateClassCompletion } from './entry';
 */

/**
 * Submit multiple scores from offline queue
 *
 * **Phase 2 Task 2.1**: Delegates to scoreSubmission module
 */
export async function submitBatchScores(
  scores: QueuedScore[]
): Promise<{ successful: string[]; failed: string[] }> {
  return submitBatchScoresFromSubmissionModule(scores);
}

/**
 * Mark an entry as being in the ring
 * IMPORTANT: Does not overwrite 'completed' status - only changes 'no-status' <-> 'in-ring'
 *
 * **Phase 2 Task 2.2**: Delegates to entryStatusManagement module
 */
export async function markInRing(
  entryId: number,
  inRing: boolean = true
): Promise<boolean> {
  return markInRingFromStatusModule(entryId, inRing);
}

/**
 * Mark an entry as completed without full scoring details
 * This is used for manual completion by gate stewards when not using ringside scoring
 *
 * **Phase 2 Task 2.2**: Delegates to entryStatusManagement module
 */
export async function markEntryCompleted(entryId: number): Promise<boolean> {
  return markEntryCompletedFromStatusModule(entryId);
}

/**
 * Get class information
 */
export async function getClassInfo(
  classId: number,
  licenseKey: string
): Promise<ClassData | null> {
  try {
    // Get class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        trials!inner (
          shows!inner (
            license_key
          )
        )
      `)
      .eq('id', classId)
      .eq('trials.shows.license_key', licenseKey)
      .single();

    if (classError || !classData) {
      console.error('Error fetching class info:', classError);
      return null;
    }

    // Get entry counts
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, is_scored')
      .eq('class_id', classId)
      .eq('license_key', licenseKey);

    if (entriesError) {
      console.error('Error fetching entry counts:', entriesError);
    }

    const totalEntries = entries?.length || 0;
    const scoredEntries = entries?.filter(e => e.is_scored).length || 0;

    return {
      id: classData.id,
      className: buildClassName(classData.element, classData.level, classData.section),
      classType: classData.class_status,
      trialId: classData.trial_id,
      judgeId: classData.judge_name,
      totalEntries,
      scoredEntries,
      isCompleted: totalEntries > 0 && totalEntries === scoredEntries
    };
  } catch (error) {
    console.error('Error in getClassInfo:', error);
    return null;
  }
}

/**
 * Subscribe to real-time entry updates
 * Real-time sync is always enabled for multi-user trials
 */
export function subscribeToEntryUpdates(
  actualClassId: number,
  licenseKey: string,
  onUpdate: (payload: any) => void
) {
  // Use the syncManager imported at the top of this file (no dynamic import needed)
  const key = `entries:${actualClassId}`;

  console.log('🔌 Setting up subscription via syncManager for class_id:', actualClassId);
  console.log('🔍 Using correct column name: class_id (matching the main query)');

  syncManager.subscribeToUpdates(
    key,
    'entries',
    `class_id=eq.${actualClassId}`,
    (payload) => {
      console.log('🚨🚨🚨 REAL-TIME PAYLOAD RECEIVED 🚨🚨🚨');
      console.log('🔄 Event type:', payload.eventType);
      console.log('🔄 Table:', payload.table);
      console.log('🔄 Schema:', payload.schema);
      console.log('🔄 Timestamp:', new Date().toISOString());
      console.log('🔄 Full payload object:', JSON.stringify(payload, null, 2));

      if (payload.new) {
        console.log('📈 NEW record data:', JSON.stringify(payload.new, null, 2));
      }
      if (payload.old) {
        console.log('📉 OLD record data:', JSON.stringify(payload.old, null, 2));
      }

      // Log specific field changes for in_ring updates
      if (payload.new && payload.old) {
        console.log('📊 FIELD CHANGES DETECTED:');
        const oldData = payload.old as any;
        const newData = payload.new as any;
        console.log('  🎯 in_ring changed:', oldData.in_ring, '->', newData.in_ring);
        console.log('  🆔 entry_id:', newData.id);
        console.log('  🏷️ armband:', newData.armband);
        console.log('  📂 class_id:', newData.class_id);

        // Check if this is specifically an in_ring change
        if (oldData.in_ring !== newData.in_ring) {
          console.log('🎯 THIS IS AN IN_RING STATUS CHANGE!');
          console.log(`  Dog #${newData.armband} (ID: ${newData.id}) is now ${newData.in_ring ? 'IN RING' : 'NOT IN RING'}`);
        }
      }

      console.log('✅ About to call onUpdate callback...');
      onUpdate(payload);
      console.log('✅ onUpdate callback completed');
      console.log('🚨🚨🚨 END REAL-TIME PAYLOAD PROCESSING 🚨🚨🚨');
    }
  );

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from real-time updates for class_id', actualClassId);
    syncManager.unsubscribe(key);
  };
}

/**
 * Update check-in status for an entry
 *
 * **Phase 2 Task 2.2**: Delegates to entryStatusManagement module
 */
export async function updateEntryCheckinStatus(
  entryId: number,
  checkinStatus: EntryStatus
): Promise<boolean> {
  return updateEntryCheckinStatusFromStatusModule(entryId, checkinStatus);
}

/**
 * Reset a dog's score and return them to pending status
 *
 * **Phase 2 Task 2.2**: Delegates to entryStatusManagement module
 */
export async function resetEntryScore(entryId: number): Promise<boolean> {
  return resetEntryScoreFromStatusModule(entryId);
}

/**
 * Get entries by armband across all classes
 */
/**
 * Fetch entries by armband number
 *
 * **Phase 1 Complete**: Now uses unified entryDataLayer
 */
export async function getEntriesByArmband(
  armband: number,
  licenseKey: string
): Promise<Entry[]> {
  // Delegate to unified data layer (Phase 1, Task 1.3)
  return getEntriesByArmbandFromDataLayer(armband, licenseKey);
}

/**
 * Update exhibitor order for multiple entries (for drag and drop reordering)
 * This updates the database so all users see the new order
 */
export async function updateExhibitorOrder(
  reorderedEntries: Entry[]
): Promise<boolean> {
  try {
    // Update each entry with its new position (1-based indexing)
    const updates = reorderedEntries.map(async (entry, index) => {
      const newExhibitorOrder = index + 1;
      
      const { error } = await supabase
        .from('entries')
        .update({ exhibitor_order: newExhibitorOrder })
        .eq('id', entry.id);

      if (error) {
        console.error(`Failed to update entry ${entry.id}:`, error);
        throw error;
      }
      
      return { id: entry.id, newOrder: newExhibitorOrder };
    });

    // Execute all updates
    await Promise.all(updates);
    
    console.log(`✅ Successfully updated exhibitor_order for ${reorderedEntries.length} entries`);
    return true;
  } catch (error) {
    console.error('Error in updateExhibitorOrder:', error);
    throw error;
  }
}