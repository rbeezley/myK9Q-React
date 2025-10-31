import { supabase } from '../lib/supabase';
import { Entry, EntryStatus } from '../stores/entryStore';
import { QueuedScore } from '../stores/offlineQueueStore';
import { recalculatePlacementsForClass } from './placementService';
import { convertTimeToSeconds } from './entryTransformers';
import { initializeDebugFunctions } from './entryDebug';
import { syncManager } from './syncManager';

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
 * @param classIds - Single class ID or array of class IDs (for combined Novice A & B view)
 * @param licenseKey - License key for tenant isolation
 */
export async function getClassEntries(
  classIds: number | number[],
  licenseKey: string
): Promise<Entry[]> {
  try {
    // Normalize to array for consistent handling
    const classIdArray = Array.isArray(classIds) ? classIds : [classIds];

    // For single class, use first ID for backward compatibility
    const primaryClassId = classIdArray[0];

    // Get class data to determine element, level, section for filtering
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('element, level, section, area_count, time_limit_seconds, time_limit_area2_seconds, time_limit_area3_seconds')
      .eq('id', primaryClassId)
      .single();

    if (classError || !classData) {
      console.error('Error fetching class data:', classError);
      throw new Error('Could not find class');
    }

    // Use view_entry_with_results for pre-joined data (entries + results in one query)
    const { data: viewData, error: viewError } = await supabase
      .from('view_entry_with_results')
      .select(`
        *,
        classes!inner (
          element,
          level,
          section,
          trials!inner (
            trial_date,
            trial_number,
            shows!inner (
              license_key
            )
          )
        )
      `)
      .in('class_id', classIdArray)
      .eq('classes.trials.shows.license_key', licenseKey)
      .order('armband_number', { ascending: true});

    if (viewError) {
      console.error('Error fetching class entries from view:', viewError);
      throw viewError;
    }

    if (!viewData || viewData.length === 0) {
      return [];
    }

    // Helper function to convert seconds to MM:SS format
    const secondsToTimeString = (seconds?: number | null): string => {
      if (!seconds || seconds === 0) return '';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Debug logging for Container Master time limit
      if (classData.element === 'Container' && classData.level === 'Master') {
        console.log(`🐛 Converting time limit for Container Master: ${seconds} seconds -> ${formatted}`);
      }

      return formatted;
    };

    // Map view columns to Entry interface (results already pre-joined in view)
    const mappedEntries = viewData.map(row => {
      // Debug logging for specific entries
      if (row.id === 6714 || row.id === 6715) {
        console.log(`🐛 MAPPING ENTRY ${row.id} (${row.armband_number}):`, {
          isScored: row.computed_is_scored,
          resultStatus: row.result_status
        });
      }

      // Determine unified status using computed_status from view
      const status = row.computed_status as EntryStatus;

      return {
        id: row.id,
        armband: row.armband_number,
        callName: row.dog_call_name,
        breed: row.dog_breed,
        handler: row.handler_name,
        jumpHeight: '', // Not in normalized schema yet
        preferredTime: '', // Not in normalized schema yet
        isScored: row.computed_is_scored,

        // New unified status field
        status,

        // Deprecated fields (backward compatibility)
        inRing: status === 'in-ring',
        checkedIn: status !== 'no-status',
        checkinStatus: status,

        resultText: row.result_status || 'pending',
        searchTime: row.search_time_seconds?.toString() || '0.00',
        faultCount: row.total_faults || 0,
        placement: row.final_placement ?? undefined,
        correctFinds: row.total_correct_finds || 0,
        incorrectFinds: row.total_incorrect_finds || 0,
        noFinishCount: row.no_finish_count || 0,
        totalPoints: row.points_earned || 0,
        nqReason: row.disqualification_reason || undefined,
        excusedReason: row.excuse_reason || undefined,
        withdrawnReason: row.withdrawal_reason || undefined,
        classId: row.class_id,
        className: `${row.classes.element} ${row.classes.level}` + (row.classes.section && row.classes.section !== '-' ? ` ${row.classes.section}` : ''),
        section: row.classes.section,
        element: row.classes.element,
        level: row.classes.level,
        timeLimit: secondsToTimeString(classData.time_limit_seconds),
        timeLimit2: secondsToTimeString(classData.time_limit_area2_seconds),
        timeLimit3: secondsToTimeString(classData.time_limit_area3_seconds),
        areas: classData.area_count,
        exhibitorOrder: row.exhibitor_order,
        actualClassId: row.class_id,
        trialDate: row.classes.trials.trial_date,
        trialNumber: row.classes.trials.trial_number.toString()
      };
    });

    return mappedEntries;
  } catch (error) {
    console.error('Error in getClassEntries:', error);
    throw error;
  }
}

/**
 * Fetch entries for a specific trial
 */
export async function getTrialEntries(
  trialId: number,
  licenseKey: string
): Promise<Entry[]> {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        classes!inner (
          element,
          level,
          section,
          trials!inner (
            trial_date,
            trial_number,
            shows!inner (
              license_key
            )
          )
        ),
        results (
          *
        )
      `)
      .eq('classes.trials.shows.license_key', licenseKey)
      .eq('classes.trials.id', trialId)
      .order('classes.element', { ascending: true })
      .order('armband', { ascending: true });

    if (error) {
      console.error('Error fetching trial entries:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(row => {
      // Get result if exists
      const result = row.results?.[0];

      // Determine status
      const status = (row.entry_status as EntryStatus | undefined) ||
                     (result?.is_in_ring ? 'in-ring' as EntryStatus : 'no-status' as EntryStatus);

      return {
        id: row.id,
        armband: row.armband,
        callName: row.call_name,
        breed: row.breed,
        handler: row.handler,
        jumpHeight: row.jump_height,
        preferredTime: row.preferred_time,
        isScored: row.is_scored || false,

        // New unified status
        status,

        // Deprecated fields (backward compatibility)
        inRing: status === 'in-ring',
        checkedIn: status !== 'no-status',
        checkinStatus: status,

        resultText: row.result_text,
        searchTime: row.search_time,
        faultCount: row.fault_count,
        placement: row.placement,
        classId: row.class_id,
        className: `${row.element} ${row.level}` + (row.section ? ` ${row.section}` : ''),
        section: row.section,
        element: row.element,
        level: row.level
      };
    });
  } catch (error) {
    console.error('Error in getTrialEntries:', error);
    throw error;
  }
}

/**
 * Submit a score for an entry
 * @param pairedClassId - Optional paired class ID for combined Novice A & B view (updates both classes' status)
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
  pairedClassId?: number  // Optional paired class ID for combined Novice A & B view
): Promise<boolean> {
  console.log('🎯 submitScore CALLED for entry:', entryId, 'with data:', scoreData);
  try {
    // Map the result text to the valid enum values
    let resultStatus = 'pending';
    if (scoreData.resultText === 'Qualified' || scoreData.resultText === 'Q') {
      resultStatus = 'qualified';
    } else if (scoreData.resultText === 'Not Qualified' || scoreData.resultText === 'NQ') {
      resultStatus = 'nq';
    } else if (scoreData.resultText === 'Absent' || scoreData.resultText === 'ABS') {
      resultStatus = 'absent';
    } else if (scoreData.resultText === 'Excused' || scoreData.resultText === 'EX') {
      resultStatus = 'excused';
    } else if (scoreData.resultText === 'Withdrawn' || scoreData.resultText === 'WD') {
      resultStatus = 'withdrawn';
    }

    // First, insert the score into the results table
    // Only mark as scored if we have a valid result status (not 'pending')
    const isActuallyScored = resultStatus !== 'pending';

    const resultData: Partial<ResultData> = {
      entry_id: entryId,
      result_status: resultStatus,
      search_time_seconds: scoreData.searchTime ? convertTimeToSeconds(scoreData.searchTime) : 0,
      is_scored: isActuallyScored,
      is_in_ring: false, // Mark as no longer in ring when score is submitted
      scoring_completed_at: isActuallyScored ? new Date().toISOString() : null
    };

    // Add optional fields if they exist
    if (scoreData.faultCount !== undefined) {
      resultData.total_faults = scoreData.faultCount;
    }
    if (scoreData.nonQualifyingReason) {
      resultData.disqualification_reason = scoreData.nonQualifyingReason;
    }
    if (scoreData.points !== undefined) {
      resultData.points_earned = scoreData.points;
    }
    if (scoreData.score !== undefined) {
      resultData.total_score = parseFloat(scoreData.score.toString());
    }
    if (scoreData.correctCount !== undefined) {
      resultData.total_correct_finds = scoreData.correctCount;
    }
    if (scoreData.incorrectCount !== undefined) {
      resultData.total_incorrect_finds = scoreData.incorrectCount;
    }
    if (scoreData.finishCallErrors !== undefined) {
      resultData.no_finish_count = scoreData.finishCallErrors;
    }

    // Handle AKC Scent Work area times
    if (scoreData.areaTimes && scoreData.areaTimes.length > 0) {
      const element = scoreData.element || '';
      const level = scoreData.level || '';

      // Convert area times to seconds
      const areaTimeSeconds = scoreData.areaTimes.map(time => convertTimeToSeconds(time));

      // Area 1 is always used
      if (areaTimeSeconds[0] !== undefined) {
        resultData.area1_time_seconds = areaTimeSeconds[0];
      }

      // Area 2 is for Interior Excellent, Interior Master, and Handler Discrimination Master
      const useArea2 = (element.toLowerCase() === 'interior' && (level.toLowerCase() === 'excellent' || level.toLowerCase() === 'master')) ||
                       (element.toLowerCase() === 'handler discrimination' && level.toLowerCase() === 'master');

      if (useArea2 && areaTimeSeconds[1] !== undefined) {
        resultData.area2_time_seconds = areaTimeSeconds[1];
      }

      // Area 3 is only for Interior Master
      const useArea3 = element.toLowerCase() === 'interior' && level.toLowerCase() === 'master';

      if (useArea3 && areaTimeSeconds[2] !== undefined) {
        resultData.area3_time_seconds = areaTimeSeconds[2];
      }

      // Calculate total search time as sum of all applicable areas
      let totalTime = 0;
      if (resultData.area1_time_seconds) totalTime += resultData.area1_time_seconds;
      if (resultData.area2_time_seconds) totalTime += resultData.area2_time_seconds;
      if (resultData.area3_time_seconds) totalTime += resultData.area3_time_seconds;

      // Update the total search time
      resultData.search_time_seconds = totalTime;
    }

    console.log('📝 Upserting result:', resultData);
    console.log('🔍 Result status being saved:', resultData.result_status);
    console.log('🔍 Entry ID:', entryId);

    // Use upsert to update existing or insert new
    const { error: resultError, data: upsertedData } = await supabase
      .from('results')
      .upsert(resultData, {
        onConflict: 'entry_id',
        ignoreDuplicates: false
      })
      .select();

    if (resultError) {
      console.error('❌ Results table error:', {
        error: resultError,
        errorMessage: resultError.message,
        errorCode: resultError.code,
        errorDetails: resultError.details,
        errorHint: resultError.hint,
        entryId,
        resultData
      });
      throw resultError;
    }

    console.log('✅ Result upserted successfully:', upsertedData);
    if (upsertedData && upsertedData[0]) {
      console.log('🔍 Saved result_status in database:', upsertedData[0].result_status);
    }

    // Entry scoring status is tracked in the results table via is_scored and is_in_ring columns
    // No need to update the entries table as it doesn't have these columns

    // Get the class_id and license_key to recalculate placements
    const { data: entryData } = await supabase
      .from('entries')
      .select(`
        class_id,
        classes!inner(
          trials!inner(
            shows!inner(
              license_key
            )
          )
        )
      `)
      .eq('id', entryId)
      .single();

    if (entryData) {
      const licenseKey = (entryData as any).classes.trials.shows.license_key;
      console.log('🔄 Starting placement recalculation for entry', entryId, 'in class', entryData.class_id);

      // Determine if this is a Nationals competition
      // Check show type via license key
      const { data: showData } = await supabase
        .from('shows')
        .select('show_type')
        .eq('license_key', licenseKey)
        .single();

      const isNationals = showData?.show_type?.toLowerCase().includes('national') || false;
      console.log('🏆 Competition type:', isNationals ? 'NATIONALS' : 'REGULAR');

      // Recalculate placements for the entire class
      try {
        await recalculatePlacementsForClass(
          entryData.class_id,
          licenseKey,
          isNationals
        );
        console.log('✅ Placements recalculated for class', entryData.class_id);
      } catch (placementError) {
        // Don't fail the score submission if placement calculation fails
        console.error('⚠️ Failed to recalculate placements:', placementError);
      }

      // Check if all entries in class are completed
      // Pass pairedClassId if provided (from combined Novice A & B view)
      try {
        await checkAndUpdateClassCompletion(entryData.class_id, pairedClassId);
      } catch (completionError) {
        console.error('⚠️ Failed to check class completion:', completionError);
      }
    } else {
      console.warn('⚠️ Could not fetch entry data for placement calculation');
    }

    console.log('✅ Score submitted successfully');
    return true;
  } catch (error) {
    console.error('Error in submitScore:', error);
    throw error;
  }
}

/**
 * Check if all entries in a class are completed and update class status
 * Optionally also checks paired Novice class (A/B) when in combined view
 *
 * @param classId - The class ID to check completion for
 * @param pairedClassId - Optional paired class ID (only provided when scoring from combined Novice A & B view)
 */
async function checkAndUpdateClassCompletion(
  classId: number,
  pairedClassId?: number
): Promise<void> {
  console.log('🔍 Checking class completion status for class', classId);

  // Update status for the primary class
  await updateSingleClassCompletion(classId);

  // Only update paired class if explicitly provided (i.e., scoring from combined view)
  if (pairedClassId) {
    console.log(`🔄 Also updating paired Novice class ${pairedClassId} (combined view context)`);
    await updateSingleClassCompletion(pairedClassId);
  }
}

/**
 * Update completion status for a single class
 */
async function updateSingleClassCompletion(classId: number): Promise<void> {
  // Get all entries for this class
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id')
    .eq('class_id', classId);

  if (entriesError || !entries || entries.length === 0) {
    console.log('⚠️ No entries found for class', classId);
    return;
  }

  const entryIds = entries.map(e => e.id);

  // Check how many entries have results
  const { data: results, error: resultsError } = await supabase
    .from('results')
    .select('entry_id, is_scored')
    .in('entry_id', entryIds)
    .eq('is_scored', true);

  if (resultsError) {
    console.error('Error fetching results:', resultsError);
    return;
  }

  const scoredCount = results?.length || 0;
  const totalCount = entries.length;

  console.log(`📊 Class ${classId}: ${scoredCount}/${totalCount} entries scored`);

  // If all entries are scored, mark class as completed
  if (scoredCount === totalCount && totalCount > 0) {
    const { error: updateError } = await supabase
      .from('classes')
      .update({
        is_completed: true,
        class_status: 'completed'
      })
      .eq('id', classId);

    if (updateError) {
      console.error('❌ Error updating class completion:', updateError);
      console.error('❌ Error message:', updateError.message);
      console.error('❌ Error details:', updateError.details);
      console.error('❌ Error hint:', updateError.hint);
      console.error('❌ Error code:', updateError.code);
    } else {
      console.log('✅ Class', classId, 'marked as completed');
    }
  } else if (scoredCount > 0 && scoredCount < totalCount) {
    // If some entries are scored (but not all), mark class as in_progress
    console.log(`🔄 Updating class ${classId} status to 'in_progress' (${scoredCount}/${totalCount} scored)`);

    const { error: updateError } = await supabase
      .from('classes')
      .update({
        is_completed: false,
        class_status: 'in_progress'
      })
      .eq('id', classId);

    if (updateError) {
      console.error('❌ Error updating class status to in_progress:', updateError);
      console.error('❌ Error message:', updateError.message);
      console.error('❌ Error details:', updateError.details);
      console.error('❌ Error hint:', updateError.hint);
      console.error('❌ Error code:', updateError.code);
    } else {
      console.log(`✅ Class ${classId} status updated to 'in_progress'`);
    }
  } else {
    console.log(`ℹ️ No status update needed for class ${classId} (${scoredCount}/${totalCount} scored)`);
  }
}

/**
 * Submit multiple scores from offline queue
 */
export async function submitBatchScores(
  scores: QueuedScore[]
): Promise<{ successful: string[]; failed: string[] }> {
  const successful: string[] = [];
  const failed: string[] = [];

  // Process scores sequentially to avoid overwhelming the server
  for (const score of scores) {
    try {
      await submitScore(score.entryId, score.scoreData);
      successful.push(score.id);
    } catch (error) {
      console.error(`Failed to submit score ${score.id}:`, error);
      failed.push(score.id);
    }
  }

  return { successful, failed };
}

/**
 * Mark an entry as being in the ring
 */
export async function markInRing(
  entryId: number,
  inRing: boolean = true
): Promise<boolean> {
  console.log(`🔄 markInRing called: entryId=${entryId}, inRing=${inRing}`);

  try {
    // Update the unified entry_status field
    const newStatus: EntryStatus = inRing ? 'in-ring' : 'no-status';

    const { error } = await supabase
      .from('entries')
      .update({ entry_status: newStatus })
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ markInRing database error:', error);
      throw error;
    }

    console.log(`✅ markInRing successful: entry ${entryId} set to ${newStatus}`);

    return true;
  } catch (error) {
    console.error('❌ markInRing error:', error);
    throw error;
  }
}

/**
 * Mark an entry as completed without full scoring details
 * This is used for manual completion by gate stewards when not using ringside scoring
 */
export async function markEntryCompleted(entryId: number): Promise<boolean> {
  console.log(`🔄 markEntryCompleted called: entryId=${entryId}`);

  try {
    // Check if entry is already scored with actual data
    const { data: existingResult, error: checkError } = await supabase
      .from('results')
      .select('id, entry_id, is_scored')
      .eq('entry_id', entryId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing result:', checkError);
      throw checkError;
    }

    if (existingResult && existingResult.is_scored) {
      console.warn('⚠️ Entry is already scored - skipping manual completion');
      return true; // Don't overwrite existing score
    }

    // Update the unified entry_status field to 'completed'
    const { error: statusError } = await supabase
      .from('entries')
      .update({ entry_status: 'completed' })
      .eq('id', entryId)
      .select();

    if (statusError) {
      console.error('❌ markEntryCompleted database error:', statusError);
      throw statusError;
    }

    // Also create/update result record for consistency
    if (existingResult) {
      await supabase
        .from('results')
        .update({
          is_scored: true,
          result_status: 'manual_complete',
          scoring_completed_at: new Date().toISOString()
        })
        .eq('entry_id', entryId);
    } else {
      await supabase
        .from('results')
        .insert({
          entry_id: entryId,
          is_scored: true,
          result_status: 'manual_complete',
          scoring_completed_at: new Date().toISOString()
        });
    }

    console.log(`✅ markEntryCompleted successful: entry ${entryId} set to completed`)

    return true;
  } catch (error) {
    console.error('Error in markEntryCompleted:', error);
    throw error;
  }
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
      className: `${classData.element} ${classData.level}` + (classData.section ? ` ${classData.section}` : ''),
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
 * Uses syncManager to respect user settings for realTimeSync
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
  console.log('🚨 CRITICAL: actualClassId should be the REAL classid (275) not URL ID (340)');

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
 */
export async function updateEntryCheckinStatus(
  entryId: number,
  checkinStatus: EntryStatus
): Promise<boolean> {
  try {
    // Update the unified entry_status field
    const updateData = {
      entry_status: checkinStatus
    };

    console.log('🔄 Updating entry status:', updateData);

    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ Database error updating entry status:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Update data that failed:', updateData);
      throw new Error(`Database update failed: ${error.message || error.code || 'Unknown database error'}`);
    }

    console.log('✅ Entry status updated successfully');

    // Verify the update by reading it back
    const { data: verifyData } = await supabase
      .from('entries')
      .select('id, entry_status')
      .eq('id', entryId)
      .single();

    console.log('🔍 Verified updated status:', verifyData);

    // Small delay to ensure write has propagated (fixes immediate refresh race condition)
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Write propagation complete - safe to refresh');

    return true;
  } catch (error) {
    console.error('Error in updateEntryCheckinStatus:', error);
    throw error;
  }
}

/**
 * Reset a dog's score and return them to pending status
 */
export async function resetEntryScore(entryId: number): Promise<boolean> {
  try {
    // Get the class_id before deleting the result
    const { data: entryData } = await supabase
      .from('entries')
      .select('class_id')
      .eq('id', entryId)
      .single();

    // Delete the result record to reset the score (scoring data lives in results table)
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('entry_id', entryId);

    if (error) {
      console.error('❌ Database error resetting score:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        entryId
      });
      throw new Error(`Database reset failed: ${error.message || error.code || 'Unknown database error'}`);
    }

    console.log('✅ Score reset successfully - deleted result record for entry', entryId);

    // Check if class should be marked as incomplete
    if (entryData?.class_id) {
      try {
        await checkAndUpdateClassCompletion(entryData.class_id);
      } catch (completionError) {
        console.error('⚠️ Failed to check class completion:', completionError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in resetEntryScore:', error);
    throw error;
  }
}

/**
 * Get entries by armband across all classes
 */
export async function getEntriesByArmband(
  armband: number,
  licenseKey: string
): Promise<Entry[]> {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        classes!inner (
          element,
          level,
          section,
          trials!inner (
            trial_date,
            trial_number,
            shows!inner (
              license_key
            )
          )
        ),
        results (
          *
        )
      `)
      .eq('classes.trials.shows.license_key', licenseKey)
      .eq('armband', armband)
      .order('classes.element', { ascending: true });

    if (error) {
      console.error('Error fetching entries by armband:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(row => {
      // Get result if exists
      const result = row.results?.[0];

      // Determine status
      const status = (row.entry_status as EntryStatus | undefined) ||
                     (result?.is_in_ring ? 'in-ring' as EntryStatus : 'no-status' as EntryStatus);

      return {
        id: row.id,
        armband: row.armband,
        callName: row.call_name,
        breed: row.breed,
        handler: row.handler,
        jumpHeight: row.jump_height,
        preferredTime: row.preferred_time,
        isScored: row.is_scored || false,

        // New unified status
        status,

        // Deprecated fields (backward compatibility)
        inRing: status === 'in-ring',
        checkedIn: status !== 'no-status',
        checkinStatus: status,

        resultText: row.result_text,
        searchTime: row.search_time,
        faultCount: row.fault_count,
        placement: row.placement,
        classId: row.class_id,
        className: `${row.element} ${row.level}` + (row.section ? ` ${row.section}` : ''),
        section: row.section,
        element: row.element,
        level: row.level
      };
    });
  } catch (error) {
    console.error('Error in getEntriesByArmband:', error);
    throw error;
  }
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