import { supabase } from '../lib/supabase';
import { Entry } from '../stores/entryStore';
import { QueuedScore } from '../stores/offlineQueueStore';
import { recalculatePlacementsForClass } from './placementService';

/**
 * Convert time string (MM:SS.ss or SS.ss) to decimal seconds
 */
function convertTimeToSeconds(timeString: string): number {
  if (!timeString || timeString.trim() === '') return 0;

  // Handle different time formats
  if (timeString.includes(':')) {
    // Format: MM:SS.ss or M:SS.ss
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
  } else {
    // Format: SS.ss (just seconds)
    return parseFloat(timeString) || 0;
  }

  return 0;
}

/**
 * Service for managing entries and scores
 */

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
 * Fetch all entries for a specific class
 */
export async function getClassEntries(
  classId: number,
  licenseKey: string
): Promise<Entry[]> {
  try {
    
    // Get class data to determine element, level, section for filtering
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('element, level, section, area_count')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      console.error('Error fetching class data:', classError);
      throw new Error('Could not find class');
    }

    // Query entries and results separately, then join in JavaScript
    const { data: viewData, error: viewError } = await supabase
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
        )
      `)
      .eq('class_id', classId)
      .eq('classes.trials.shows.license_key', licenseKey)
      .order('armband_number', { ascending: true });

    if (viewError) {
      console.error('Error fetching class entries from view:', viewError);
      throw viewError;
    }

    if (!viewData || viewData.length === 0) {
      return [];
    }

    // Get all results for entries in this class
    const entryIds = viewData.map(entry => entry.id);
    const { data: resultsData, error: resultsError } = await supabase
      .from('results')
      .select(`
        entry_id,
        is_scored,
        is_in_ring,
        result_status,
        search_time_seconds,
        total_faults,
        final_placement,
        total_correct_finds,
        total_incorrect_finds,
        no_finish_count,
        points_earned
      `)
      .in('entry_id', entryIds);

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
    }

    // Create a map of entry_id -> result for quick lookup
    const resultsMap = new Map();
    if (resultsData) {
      resultsData.forEach(result => {
        resultsMap.set(result.entry_id, result);
      });
    }


    // Helper function to normalize text-based status values
    const normalizeStatusText = (statusText: string | null | undefined): 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' => {
      if (!statusText) return 'none';

      const status = statusText.toLowerCase().trim();
      switch (status) {
        case 'none': return 'none';
        case 'checked-in': return 'checked-in';
        case 'at-gate': return 'at-gate';
        case 'conflict': return 'conflict';
        case 'pulled': return 'pulled';
        default: return 'none';
      }
    };

    // Map database fields to Entry interface using normalized table structure
    const mappedEntries = viewData.map(row => {
      const result = resultsMap.get(row.id); // Get result from our results map

      // Debug logging for specific entries
      if (row.id === 6714 || row.id === 6715) {
        console.log(`🐛 MAPPING ENTRY ${row.id} (${row.armband_number}):`, {
          result: result,
          resultIsScored: result?.is_scored,
          finalIsScored: result?.is_scored || false
        });
        // Debug mapping completed
      }

      return {
        id: row.id,
        armband: row.armband_number,
        callName: row.dog_call_name,
        breed: row.dog_breed,
        handler: row.handler_name,
        jumpHeight: '', // Not in normalized schema yet
        preferredTime: '', // Not in normalized schema yet
        isScored: result?.is_scored || false,
        inRing: result?.is_in_ring || false,
        resultText: result?.result_status || 'pending',
        searchTime: result?.search_time_seconds?.toString() || '0.00',
        faultCount: result?.total_faults || 0,
        placement: result?.final_placement ?? undefined,
        correctFinds: result?.total_correct_finds || 0,
        incorrectFinds: result?.total_incorrect_finds || 0,
        noFinishCount: result?.no_finish_count || 0,
        totalPoints: result?.points_earned || 0,
        classId: classId,
        className: `${row.classes.element} ${row.classes.level}` + (row.classes.section && row.classes.section !== '-' ? ` ${row.classes.section}` : ''),
        section: row.classes.section,
        element: row.classes.element,
        level: row.classes.level,
        checkedIn: row.check_in_status_text !== 'none' && row.check_in_status_text !== null,
        checkinStatus: normalizeStatusText(row.check_in_status_text),
        timeLimit: '', // Will need to get from class data
        timeLimit2: '', // Will need to get from class data
        timeLimit3: '', // Will need to get from class data
        areas: classData.area_count,
        exhibitorOrder: row.exhibitor_order,
        actualClassId: classId,
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

    return data.map(row => ({
      id: row.id,
      armband: row.armband,
      callName: row.call_name,
      breed: row.breed,
      handler: row.handler,
      jumpHeight: row.jump_height,
      preferredTime: row.preferred_time,
      isScored: row.is_scored || false,
      inRing: row.in_ring || false,
      resultText: row.result_text,
      searchTime: row.search_time,
      faultCount: row.fault_count,
      placement: row.placement,
      classId: row.class_id,
      className: `${row.element} ${row.level}` + (row.section ? ` ${row.section}` : ''),
      section: row.section,
      element: row.element,
      level: row.level
    }));
  } catch (error) {
    console.error('Error in getTrialEntries:', error);
    throw error;
  }
}

/**
 * Submit a score for an entry
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
  }
): Promise<boolean> {
  console.log('🎯 submitScore CALLED for entry:', entryId, 'with data:', scoreData);
  try {
    // Map the result text to the valid enum values
    let resultStatus = 'pending';
    if (scoreData.resultText === 'Qualified') {
      resultStatus = 'qualified';
    } else if (scoreData.resultText === 'Not Qualified') {
      resultStatus = 'nq';
    } else if (scoreData.resultText === 'Absent') {
      resultStatus = 'absent';
    } else if (scoreData.resultText === 'Excused') {
      resultStatus = 'excused';
    }

    // First, insert the score into the results table
    const resultData: any = {
      entry_id: entryId,
      result_status: resultStatus,
      search_time_seconds: scoreData.searchTime ? convertTimeToSeconds(scoreData.searchTime) : 0,
      is_scored: true,
      is_in_ring: false, // Mark as no longer in ring when score is submitted
      scoring_completed_at: new Date().toISOString()
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

      // Area 2 is only for Interior Excellent and Handler Discrimination Master
      const useArea2 = (element.toLowerCase() === 'interior' && level.toLowerCase() === 'excellent') ||
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

    // Use upsert to update existing or insert new
    const { error: resultError } = await supabase
      .from('results')
      .upsert(resultData, {
        onConflict: 'entry_id',
        ignoreDuplicates: false
      });

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
    // First check if a result record exists for this entry
    const { data: existingResult, error: checkError } = await supabase
      .from('results')
      .select('id, entry_id')
      .eq('entry_id', entryId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing result:', checkError);
      throw checkError;
    }

    let data;
    let error;

    if (existingResult) {
      // Update existing result record
      const updateResult = await supabase
        .from('results')
        .update({ is_in_ring: inRing })
        .eq('entry_id', entryId)
        .select('id, entry_id, is_in_ring');

      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Create new result record with just the in_ring status
      const insertResult = await supabase
        .from('results')
        .insert({
          entry_id: entryId,
          is_in_ring: inRing,
          is_scored: false,
          result_status: 'pending'
        })
        .select('id, entry_id, is_in_ring');

      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error('❌ markInRing database error:', error);
      throw error;
    }

    console.log('✅ markInRing database update successful:', data);
    console.log('🔍 Updated records count:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('📊 Updated result details:', {
        resultId: data[0].id,
        entryId: data[0].entry_id,
        inRing: data[0].is_in_ring
      });
    } else {
      console.warn('⚠️ No records were updated - entry might not exist');
    }

    return true;
  } catch (error) {
    console.error('Error in markInRing:', error);
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
 */
export function subscribeToEntryUpdates(
  actualClassId: number,
  licenseKey: string,
  onUpdate: (payload: any) => void
) {
  console.log('🔌 Creating subscription for class_id:', actualClassId);
  console.log('🔍 Using correct column name: class_id (matching the main query)');
  console.log('🚨 CRITICAL: actualClassId should be the REAL classid (275) not URL ID (340)');

  const subscription = supabase
    .channel(`entries:${actualClassId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries',
        filter: `class_id=eq.${actualClassId}` // Fixed: using class_id to match the main query
      },
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
    )
    .subscribe((status, err) => {
      console.log('📡 Subscription status:', status);
      if (err) {
        console.error('📡 Subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to real-time updates for class_id', actualClassId);
        console.log('🎯 Subscription will only receive updates for entries in this class');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error - subscription failed');
      } else if (status === 'TIMED_OUT') {
        console.error('⏰ Subscription timed out');
      } else {
        console.log('📡 Subscription status update:', status);
      }
    });

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from real-time updates for class_id', actualClassId);
    subscription.unsubscribe();
  };
}

/**
 * Test function to manually update in_ring status for debugging subscriptions
 * This function can be called from browser console: window.debugMarkInRing(entryId, true/false)
 */
export async function debugMarkInRing(entryId: number, inRing: boolean = true): Promise<void> {
  console.log(`🧪 Debug: Manually updating entry ${entryId} is_in_ring to:`, inRing);

  try {
    // Use the same logic as the main markInRing function
    const { data: existingResult } = await supabase
      .from('results')
      .select('id')
      .eq('entry_id', entryId)
      .single();

    let data, error;
    if (existingResult) {
      const result = await supabase
        .from('results')
        .update({ is_in_ring: inRing })
        .eq('entry_id', entryId)
        .select('id, entry_id, is_in_ring');
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('results')
        .insert({
          entry_id: entryId,
          is_in_ring: inRing,
          is_scored: false,
          result_status: 'pending'
        })
        .select('id, entry_id, is_in_ring');
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('🧪 Debug update error:', error);
      throw error;
    }

    console.log('🧪 Debug update successful:', data);
    console.log('🧪 Updated result details:', {
      resultId: data?.[0]?.id,
      entryId: data?.[0]?.entry_id,
      inRing: data?.[0]?.is_in_ring
    });
    console.log('🧪 Now watch for real-time subscription payload in other tabs...');
    
    return;
  } catch (error) {
    console.error('🧪 Debug function failed:', error);
    throw error;
  }
}

/**
 * Test Supabase connection and real-time setup
 */
export async function testSupabaseConnection(): Promise<void> {
  console.log('🧪 Testing Supabase connection and real-time setup...');
  
  try {
    // Test 1: Basic connection
    const { data, error: connectionError } = await supabase
      .from('entries')
      .select('count', { count: 'exact', head: true });
      
    if (connectionError) {
      console.error('❌ Basic connection failed:', connectionError);
      return;
    }
    
    console.log('✅ Basic connection successful, total entries:', data);
    
    // Test 2: Real-time setup
    console.log('🧪 Testing real-time subscription setup...');
    
    const testChannel = supabase
      .channel('connection_test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'entries' },
        (payload) => {
          console.log('🧪 Test subscription received payload:', payload);
        }
      )
      .subscribe((status) => {
        console.log('🧪 Test subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription test successful!');
          setTimeout(() => {
            console.log('🧪 Cleaning up test subscription...');
            testChannel.unsubscribe();
          }, 2000);
        }
      });
      
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
  }
}

/**
 * Test real-time events by making a harmless database change
 */
export async function testRealTimeEvents(classId: number): Promise<void> {
  console.log('🧪 Testing real-time events for class:', classId);
  
  try {
    // Get a random entry from the class to test with
    const { data: entries, error } = await supabase
      .from('entries')
      .select('id, armband, in_ring, class_id')
      .eq('class_id', classId)
      .limit(1);

    if (error || !entries || entries.length === 0) {
      console.error('❌ No entries found for class', classId);
      return;
    }

    const testEntry = entries[0];
    console.log('🧪 Using test entry:', testEntry);
    
    // Toggle the in_ring status and toggle it back
    console.log('🧪 Step 1: Setting in_ring to TRUE...');
    await debugMarkInRing(testEntry.id, true);
    
    setTimeout(async () => {
      console.log('🧪 Step 2: Setting in_ring to FALSE...');
      await debugMarkInRing(testEntry.id, false);
    }, 2000);
    
    console.log('🧪 Real-time test initiated. Watch for subscription payloads in other tabs!');
    
  } catch (error) {
    console.error('❌ Real-time test failed:', error);
  }
}

/**
 * Test unfiltered real-time subscription to see if the issue is with our filter
 */
export async function testUnfilteredRealTime(): Promise<void> {
  console.log('🧪 Testing UNFILTERED real-time subscription...');
  
  const testSub = supabase
    .channel('unfiltered_test')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'entries' },
      (payload) => {
        console.log('🚨🚨🚨 UNFILTERED REAL-TIME PAYLOAD RECEIVED 🚨🚨🚨');
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      }
    )
    .subscribe((status) => {
      console.log('📡 Unfiltered subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Unfiltered subscription active. Now try updating any entry...');
      }
    });
  
  // Return unsubscribe function
  (window as any).unsubscribeUnfiltered = () => {
    console.log('🔌 Unsubscribing from unfiltered test...');
    testSub.unsubscribe();
  };
  
  console.log('🧪 Unfiltered subscription created. Use window.unsubscribeUnfiltered() to stop.');
}

/**
 * Debug function to monitor database changes and find what's setting in_ring to false
 */
export async function debugMonitorEntry(entryId: number): Promise<void> {
  console.log(`🥰 MONITORING ENTRY ${entryId} FOR DATABASE CHANGES...`);
  
  // First, get current state
  const { data: currentState, error } = await supabase
    .from('entries')
    .select('id, armband, in_ring, is_scored, result_text')
    .eq('id', entryId)
    .single();
    
  if (error) {
    console.error('❌ Failed to get current state:', error);
    return;
  }
  
  console.log('🔍 CURRENT STATE:', currentState);
  
  // Set up real-time monitoring for JUST this entry
  const monitor = supabase
    .channel(`monitor_entry_${entryId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries',
        filter: `id=eq.${entryId}`
      },
      (payload) => {
        console.log('🚨🚨🚨 ENTRY DATABASE CHANGE DETECTED 🚨🚨🚨');
        console.log('Entry ID:', entryId);
        console.log('Event type:', payload.eventType);
        console.log('Timestamp:', new Date().toISOString());
        
        const oldData = payload.old as any;
        const newData = payload.new as any;
        
        if (oldData && newData) {
          console.log('🔄 FIELD CHANGES:');
          Object.keys(newData).forEach(key => {
            if (oldData[key] !== newData[key]) {
              console.log(`  ${key}: ${oldData[key]} -> ${newData[key]}`);
              
              if (key === 'in_ring' && newData[key] === false) {
                console.log('🚨🚨 FOUND THE CULPRIT! in_ring was set to FALSE 🚨🚨');
                console.log('Stack trace:');
                console.trace('in_ring set to false');
              }
            }
          });
        }
        
        console.log('Full payload:', JSON.stringify(payload, null, 2));
        console.log('🚨🚨🚨 END DATABASE CHANGE 🚨🚨🚨');
      }
    )
    .subscribe((status) => {
      console.log(`📍 Monitor status for entry ${entryId}:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Now monitoring entry ${entryId} for database changes`);
        console.log('To stop monitoring, call window.stopMonitoring()');
      }
    });
    
  // Store unsubscribe function globally
  (window as any).stopMonitoring = () => {
    console.log(`🔌 Stopping monitor for entry ${entryId}`);
    monitor.unsubscribe();
  };
}

/**
 * STOPWATCH ISSUE DEBUGGING - Track exactly when in_ring gets set to false
 */
export function debugStopwatchIssue(entryId: number): void {
  console.log(`🚨 DEBUGGING STOPWATCH ISSUE FOR ENTRY ${entryId} 🚨`);
  console.log('📋 SETUP INSTRUCTIONS:');
  console.log('1. Open your entry list page (Tab 2)');
  console.log('2. Open browser console (F12) in Tab 2');
  console.log('3. Run this function in Tab 2 console');
  console.log('4. Go to Tab 1 and start the stopwatch');
  console.log('5. Watch Tab 2 console for the exact moment in_ring changes');
  console.log('');
  
  // Monitor this specific entry
  debugMonitorEntry(entryId);
  
  console.log('🎯 SPECIFIC THINGS TO WATCH FOR:');
  console.log('- submitScore() calls (sets in_ring to false)');
  console.log('- updateEntryCheckinStatus() calls (sets in_ring to false)');
  console.log('- resetEntryScore() calls (sets in_ring to false)');
  console.log('- Any other database updates to this entry');
  console.log('');
  console.log('✅ Monitoring is now active. Start your stopwatch in the other tab!');
}

/**
 * Debug function to test check-in status updates
 */
async function debugTestCheckinUpdate(entryId: number, status: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate') {
  console.log('🧪 Testing check-in update for entry:', entryId, 'to status:', status);

  try {
    const result = await updateEntryCheckinStatus(entryId, status);
    console.log('✅ Check-in status update successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Check-in status update failed:', error);
    throw error;
  }
}

/**
 * Simple test to verify Supabase real-time is working
 */
async function testSupabaseRealTime() {
  console.log('🧪 Testing basic Supabase real-time functionality...');

  // Create a simple subscription to the entries table
  const testSubscription = supabase
    .channel('test-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries'
      },
      (payload) => {
        console.log('🎉 REAL-TIME EVENT RECEIVED!', payload);
        console.log('Event:', payload.eventType);
        console.log('Table:', payload.table);
        console.log('New data:', payload.new);
        console.log('Old data:', payload.old);
      }
    )
    .subscribe((status, err) => {
      console.log('📡 Test subscription status:', status);
      if (err) {
        console.error('📡 Test subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time test subscription is active');
        console.log('Now try changing a check-in status in another tab...');
      }
    });

  // Return unsubscribe function
  return () => {
    console.log('🧪 Unsubscribing test real-time...');
    testSubscription.unsubscribe();
  };
}

// Make debugging functions globally available
if (typeof window !== 'undefined') {
  (window as any).debugMarkInRing = debugMarkInRing;
  (window as any).testSupabaseConnection = testSupabaseConnection;
  (window as any).testRealTimeEvents = testRealTimeEvents;
  (window as any).testUnfilteredRealTime = testUnfilteredRealTime;
  (window as any).debugMonitorEntry = debugMonitorEntry;
  (window as any).debugStopwatchIssue = debugStopwatchIssue;
  (window as any).debugTestCheckinUpdate = debugTestCheckinUpdate;
  (window as any).testSupabaseRealTime = testSupabaseRealTime;
  console.log('🧪 Debug functions available:');
  console.log('  - window.debugMarkInRing(entryId, true/false)');
  console.log('  - window.testSupabaseConnection()');
  console.log('  - window.testRealTimeEvents(classId)');
  console.log('  - window.testUnfilteredRealTime()');
  console.log('  - window.debugMonitorEntry(entryId) // Monitor specific entry for changes');
  console.log('  - window.debugStopwatchIssue(entryId) // 🚨 NEW: Debug stopwatch issue');
  console.log('  - window.debugTestCheckinUpdate(entryId, "checked-in") // Test check-in status updates');
  console.log('  - window.testSupabaseRealTime() // Test basic real-time functionality');
  console.log('  - window.stopMonitoring() // Stop monitoring');
}

/**
 * Update check-in status for an entry
 */
export async function updateEntryCheckinStatus(
  entryId: number,
  checkinStatus: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate'
): Promise<boolean> {
  try {
    // Use text-based status directly (no more numeric conversion)
    const updateData: any = {
      check_in_status_text: checkinStatus   // Use new text-based field
    };

    console.log('🔄 Updating check-in status with text field:', updateData);

    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ Database error updating check-in status:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Update data that failed:', updateData);
      throw new Error(`Database update failed: ${error.message || error.code || 'Unknown database error'}`);
    }

    console.log('✅ Check-in status updated successfully using text field');

    // Verify the update by reading it back
    const { data: verifyData } = await supabase
      .from('entries')
      .select('id, check_in_status_text')
      .eq('id', entryId)
      .single();

    console.log('🔍 Verified updated status:', verifyData);

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

    return data.map(row => ({
      id: row.id,
      armband: row.armband,
      callName: row.call_name,
      breed: row.breed,
      handler: row.handler,
      jumpHeight: row.jump_height,
      preferredTime: row.preferred_time,
      isScored: row.is_scored || false,
      inRing: row.in_ring || false,
      resultText: row.result_text,
      searchTime: row.search_time,
      faultCount: row.fault_count,
      placement: row.placement,
      classId: row.class_id,
      className: `${row.element} ${row.level}` + (row.section ? ` ${row.section}` : ''),
      section: row.section,
      element: row.element,
      level: row.level
    }));
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