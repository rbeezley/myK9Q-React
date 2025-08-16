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
    console.log('getClassEntries called with:', { classId, licenseKey });
    
    // First, get the class details to know what element, level, section to filter by
    const { data: classData, error: classError } = await supabase
      .from('tbl_class_queue')
      .select('element, level, section, trial_date, trial_number')
      .eq('id', classId)
      .single();
    
    if (classError || !classData) {
      console.error('Error fetching class data:', classError);
      throw new Error('Could not find class');
    }
    
    console.log('Class data:', classData);
    
    // Query the view for main entry data
    const { data: viewData, error: viewError } = await supabase
      .from('view_entry_class_join_distinct')
      .select('*')
      .eq('mobile_app_lic_key', licenseKey)
      .eq('element', classData.element)
      .eq('level', classData.level)
      .eq('section', classData.section)
      .eq('trial_date', classData.trial_date)
      .eq('trial_number', classData.trial_number)
      .order('armband', { ascending: true });
    
    console.log('View query result:', { 
      viewData: viewData?.length, 
      viewError,
      sampleRow: viewData?.[0],
      allFieldsInFirstRow: viewData?.[0] ? Object.keys(viewData[0]) : []
    });

    if (viewError) {
      console.error('Error fetching class entries from view:', viewError);
      throw viewError;
    }

    if (!viewData || viewData.length === 0) {
      return [];
    }

    // Get entry IDs to query check-in status from the base table
    const entryIds = viewData.map(row => row.id);
    
    // Query the base table for check-in status data
    console.log('Querying check-in status for entry IDs:', entryIds);
    const { data: checkinData, error: checkinError } = await supabase
      .from('tbl_entry_queue')
      .select('id, checked_in, check_in_status')
      .in('id', entryIds);
    
    console.log('Check-in query result:', { checkinData, checkinError });

    if (checkinError) {
      console.error('Error fetching check-in status:', checkinError);
      // Don't throw here, continue with default values
    }

    // Create a map of check-in data for quick lookup
    const checkinMap = new Map();
    if (checkinData) {
      checkinData.forEach(item => {
        checkinMap.set(item.id, {
          checkedIn: item.checked_in || false,
          checkinStatus: item.check_in_status || 'none'
        });
      });
    }

    console.log('Supabase query result:', { 
      viewData: viewData?.length, 
      checkinData: checkinData?.length,
      sampleViewRow: viewData?.[0],
      sampleCheckinRow: checkinData?.[0],
      checkinMap: Object.fromEntries(checkinMap)
    });

    // Map database fields to Entry interface, combining view data with check-in status
    return viewData.map(row => {
      const checkinInfo = checkinMap.get(row.id) || { checkedIn: false, checkinStatus: 'none' };
      
      return {
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
        classId: classId, // Use the passed classId since view doesn't have it
        className: `${row.element} ${row.level} ${row.section}`, // Construct class name
        section: row.section,
        element: row.element,
        level: row.level,
        checkedIn: checkinInfo.checkedIn,
        checkinStatus: checkinInfo.checkinStatus
      };
    });
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
      .from('view_entry_class_join_distinct')
      .select('*')
      .eq('mobile_app_lic_key', licenseKey)
      .eq('trial_id', trialId)
      .order('class_name', { ascending: true })
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
  }
): Promise<boolean> {
  try {
    const updateData: any = {
      is_scored: true,
      result_text: scoreData.resultText,
      scored_at: new Date().toISOString(),
      in_ring: false
    };

    // Add optional fields if provided
    if (scoreData.searchTime !== undefined) {
      updateData.search_time = scoreData.searchTime;
    }
    if (scoreData.faultCount !== undefined) {
      updateData.fault_count = scoreData.faultCount;
    }
    if (scoreData.points !== undefined) {
      updateData.score_points = scoreData.points;
    }
    if (scoreData.nonQualifyingReason) {
      updateData.non_qualifying_reason = scoreData.nonQualifyingReason;
    }

    const { error } = await supabase
      .from('tbl_entry_queue')
      .update(updateData)
      .eq('id', entryId);

    if (error) {
      console.error('Error submitting score:', error);
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
  try {
    const { error } = await supabase
      .from('tbl_entry_queue')
      .update({ in_ring: inRing })
      .eq('id', entryId);

    if (error) {
      console.error('Error marking entry in ring:', error);
      throw error;
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
      .from('tbl_class_queue')
      .select('*')
      .eq('id', classId)
      .eq('mobile_app_lic_key', licenseKey)
      .single();

    if (classError || !classData) {
      console.error('Error fetching class info:', classError);
      return null;
    }

    // Get entry counts
    const { data: entries, error: entriesError } = await supabase
      .from('tbl_entry_queue')
      .select('id, is_scored')
      .eq('class_id', classId)
      .eq('mobile_app_lic_key', licenseKey);

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
  classId: number,
  licenseKey: string,
  onUpdate: (payload: any) => void
) {
  const subscription = supabase
    .channel(`entries:${classId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tbl_entry_queue',
        filter: `class_id=eq.${classId}`
      },
      (payload) => {
        console.log('Entry update received:', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Update check-in status for an entry
 */
export async function updateEntryCheckinStatus(
  entryId: number,
  checkinStatus: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate'
): Promise<boolean> {
  try {
    const updateData: any = {
      checked_in: checkinStatus !== 'none',
      check_in_status: checkinStatus
    };

    console.log('Updating entry check-in status:', { entryId, updateData });

    const { error, data } = await supabase
      .from('tbl_entry_queue')
      .update(updateData)
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('Error updating check-in status:', error);
      throw error;
    }

    console.log('Successfully updated check-in status:', { entryId, checkinStatus, updatedRecord: data });
    
    // Verify the update by reading it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('tbl_entry_queue')
      .select('id, checked_in, check_in_status')
      .eq('id', entryId)
      .single();
    
    console.log('Verification read:', { verifyData, verifyError });
    
    return true;
  } catch (error) {
    console.error('Error in updateEntryCheckinStatus:', error);
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
      .from('view_entry_class_join_distinct')
      .select('*')
      .eq('mobile_app_lic_key', licenseKey)
      .eq('armband', armband)
      .order('class_name', { ascending: true });

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