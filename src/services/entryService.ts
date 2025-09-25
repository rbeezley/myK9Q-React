import { supabase } from '../lib/supabase';
import { Entry } from '../stores/entryStore';
import { QueuedScore } from '../stores/offlineQueueStore';

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

    // Query the normalized entries table directly
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
        ),
        results (
          *
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

    // Helper function to convert database integer codes back to string status
    const convertStatusCodeToString = (statusCode: number | null | undefined): 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' => {
      switch (statusCode) {
        case 0: return 'none';
        case 1: return 'checked-in';
        case 2: return 'at-gate';
        case 3: return 'conflict'; // Could also be 'pulled' - DB constraint limits us
        default: return 'none';
      }
    };

    // Map database fields to Entry interface using normalized table structure
    const mappedEntries = viewData.map(row => {
      const result = row.results?.[0]; // Get first result if any

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
        placement: result?.final_placement || 0,
        classId: classId,
        className: `${row.classes.element} ${row.classes.level} ${row.classes.section}`,
        section: row.classes.section,
        element: row.classes.element,
        level: row.classes.level,
        checkedIn: row.check_in_status > 0,
        checkinStatus: convertStatusCodeToString(row.check_in_status),
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
      className: row.class_name,
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
  }
): Promise<boolean> {
  try {
    const updateData: any = {
      is_scored: true,
      result_text: scoreData.resultText,
      in_ring: false // Only set false when dog is completely finished scoring
    };

    // Add optional fields if provided - using correct database field names
    if (scoreData.searchTime !== undefined) {
      updateData.search_time = scoreData.searchTime;
    }
    if (scoreData.faultCount !== undefined) {
      updateData.fault_count = scoreData.faultCount;
    }
    if (scoreData.score !== undefined) {
      updateData.score = scoreData.score?.toString() || '0'; // score is text field in DB
    }
    if (scoreData.nonQualifyingReason) {
      updateData.reason = scoreData.nonQualifyingReason;
    }


    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ Database error:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        entryId,
        updateData
      });
      throw error;
    }


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
    const { data, error } = await supabase
      .from('entries')
      .update({ in_ring: inRing })
      .eq('id', entryId)
      .select('id, armband, in_ring, classid_fk'); // Add select to see what was actually updated

    if (error) {
      console.error('❌ markInRing database error:', error);
      throw error;
    }

    console.log('✅ markInRing database update successful:', data);
    console.log('🔍 Updated records count:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('📊 Updated entry details:', {
        entryId: data[0].id,
        armband: data[0].armband,
        inRing: data[0].in_ring,
        classId: data[0].classid_fk
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
      .select('*')
      .eq('id', classId)
      .eq('license_key', licenseKey)
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
      className: classData.class_name,
      classType: classData.class_type,
      trialId: classData.trial_id,
      judgeId: classData.judge_id,
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
  console.log('🔌 Creating subscription for classid_fk:', actualClassId);
  console.log('🔍 Using correct column name: classid_fk (not class_id)');
  console.log('🚨 CRITICAL: actualClassId should be the REAL classid (275) not URL ID (340)');
  
  const subscription = supabase
    .channel(`entries:${actualClassId}`) 
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries',
        filter: `classid_fk=eq.${actualClassId}` // Fixed: using correct column name and actual classid
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
          console.log('  📂 classid_fk:', newData.classid_fk);
          
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
        console.log('✅ Successfully subscribed to real-time updates for classid_fk', actualClassId);
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
    console.log('🔌 Unsubscribing from real-time updates for classid_fk', actualClassId);
    subscription.unsubscribe();
  };
}

/**
 * Test function to manually update in_ring status for debugging subscriptions
 * This function can be called from browser console: window.debugMarkInRing(entryId, true/false)
 */
export async function debugMarkInRing(entryId: number, inRing: boolean = true): Promise<void> {
  console.log(`🧪 Debug: Manually updating entry ${entryId} in_ring to:`, inRing);
  
  try {
    const { data, error } = await supabase
      .from('entries')
      .update({ in_ring: inRing })
      .eq('id', entryId)
      .select('id, armband, in_ring, classid_fk');

    if (error) {
      console.error('🧪 Debug update error:', error);
      throw error;
    }

    console.log('🧪 Debug update successful:', data);
    console.log('🧪 Updated entry details:', {
      entryId: data[0]?.id,
      armband: data[0]?.armband,
      inRing: data[0]?.in_ring,
      classId: data[0]?.classid_fk
    });
    console.log('🧪 Now watch for real-time subscription payload in other tabs...');
    console.log('🧪 Real-time filter should match classid_fk:', data[0]?.classid_fk);
    
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
      .select('id, armband, in_ring, classid_fk')
      .eq('classid_fk', classId)
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

// Make debugging functions globally available
if (typeof window !== 'undefined') {
  (window as any).debugMarkInRing = debugMarkInRing;
  (window as any).testSupabaseConnection = testSupabaseConnection;
  (window as any).testRealTimeEvents = testRealTimeEvents;
  (window as any).testUnfilteredRealTime = testUnfilteredRealTime;
  (window as any).debugMonitorEntry = debugMonitorEntry;
  (window as any).debugStopwatchIssue = debugStopwatchIssue;
  console.log('🧪 Debug functions available:');
  console.log('  - window.debugMarkInRing(entryId, true/false)');
  console.log('  - window.testSupabaseConnection()');
  console.log('  - window.testRealTimeEvents(classId)');
  console.log('  - window.testUnfilteredRealTime()');
  console.log('  - window.debugMonitorEntry(entryId) // Monitor specific entry for changes');
  console.log('  - window.debugStopwatchIssue(entryId) // 🚨 NEW: Debug stopwatch issue');
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
    // Convert string status to integer code matching database schema (0-3 only)
    let statusCode = 0;
    switch (checkinStatus) {
      case 'none':
        statusCode = 0;
        break;
      case 'checked-in':
        statusCode = 1;
        break;
      case 'at-gate':
        statusCode = 2;
        break;
      case 'conflict':
      case 'pulled':
        statusCode = 3; // Both map to same code due to DB constraint
        break;
    }

    const updateData: any = {
      check_in_status: statusCode   // Use correct database field name
    };
    

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

    
    // Verify the update by reading it back
    await supabase
      .from('entries')
      .select('id, check_in_status')
      .eq('id', entryId)
      .single();
    
    
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
    // Reset to default values based on actual table schema
    const updateData: any = {
      is_scored: false,
      result_text: 'None',           // Default from schema
      search_time: '00:00.00',       // Default from schema  
      fault_count: 0,                // Default from schema
      placement: 0,                  // Default from schema (bigint)
      in_ring: false,
      reason: 'None',                // Default from schema
      score: '0'                     // Default from schema (text field, not score_points)
    };

    // Reset area times to defaults
    updateData.areatime1 = '00:00.00';
    updateData.areatime2 = '00:00.00'; 
    updateData.areatime3 = '00:00.00';
    
    // Reset count fields to defaults
    updateData.correct_count = 0;
    updateData.incorrect_count = 0;
    updateData.no_finish = 0;


    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ Database error resetting score:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        entryId,
        updateData
      });
      throw new Error(`Database reset failed: ${error.message || error.code || 'Unknown database error'}`);
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
      className: row.class_name,
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