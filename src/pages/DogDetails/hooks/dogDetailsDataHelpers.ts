/**
 * Dog Details Data Helper Functions
 *
 * Extracted from useDogDetailsData.ts to reduce complexity.
 * Contains shared entry processing and mapping logic.
 */

import { getVisibleResultFields } from '../../../services/resultVisibilityService';
import type { UserRole } from '../../../utils/auth';
import type { CheckinStatus } from '../../../components/dialogs/CheckinStatusDialog';
import type { ClassEntry, DogInfo } from './useDogDetailsData';

// ============================================================================
// Types for raw entry data
// ============================================================================

export interface RawEntryData {
  id: number | string;
  class_id: number | string;
  armband_number: number;
  dog_call_name?: string | null;
  dog_breed?: string | null;
  handler_name?: string | null;
  entry_status?: string | null;
  search_time_seconds?: number | null;
  total_faults?: number | null;
  result_status?: string | null;
  is_scored?: boolean;
  final_placement?: number | null;
  // Optional fields from Supabase view
  element?: string | null;
  level?: string | null;
  section?: string | null;
  trial_id?: number | null;
  trial_number?: number | null;
  trial_date?: string | null;
  trial_element?: string | null;
  judge_name?: string | null;
  is_completed?: boolean;
  results_released_at?: string | null;
}

export interface ClassData {
  id: number | string;
  element?: string | null;
  level?: string | null;
  section?: string | null;
  trial_id?: number | null;
  judge_name?: string | null;
  is_completed?: boolean;
}

export interface TrialData {
  id: number | string;
  element?: string | null;
  trial_date?: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract dog info from the first entry
 */
export function extractDogInfo(entry: RawEntryData): DogInfo {
  return {
    armband: entry.armband_number,
    call_name: entry.dog_call_name || 'Unknown',
    breed: entry.dog_breed || 'Unknown',
    handler: entry.handler_name || 'Unknown'
  };
}

/**
 * Map entry status to CheckinStatus
 */
export function mapEntryStatus(statusText: string | null | undefined): CheckinStatus {
  const status = statusText || 'no-status';
  return status === 'in-ring' ? 'no-status' : status as CheckinStatus;
}

/**
 * Process a single entry into a ClassEntry with visibility settings
 */
export async function processEntryToClassEntry(
  entry: RawEntryData,
  licenseKey: string,
  currentRole: UserRole | null | undefined,
  classData?: ClassData,
  trialData?: TrialData
): Promise<ClassEntry> {
  const check_in_status = mapEntryStatus(entry.entry_status);

  // Determine values - prefer direct entry fields (Supabase), fall back to joined data (cache)
  const element = entry.element || classData?.element || 'Unknown';
  const level = entry.level || classData?.level || 'Class';
  const section = entry.section || classData?.section;
  const trialId = entry.trial_id || classData?.trial_id || 0;
  const isCompleted = entry.is_completed ?? classData?.is_completed ?? false;
  const resultsReleasedAt = entry.results_released_at ?? null;
  const judgeName = entry.judge_name || classData?.judge_name;
  const trialName = entry.trial_element || trialData?.element || 'Unknown Trial';
  const trialDate = entry.trial_date || trialData?.trial_date || '';

  // Fetch visibility settings for this class (role-based)
  const visibleFields = await getVisibleResultFields({
    classId: typeof entry.class_id === 'string' ? parseInt(entry.class_id) : entry.class_id,
    trialId,
    licenseKey,
    userRole: (currentRole || 'exhibitor') as UserRole,
    isClassComplete: isCompleted,
    resultsReleasedAt
  });

  return {
    id: typeof entry.id === 'string' ? parseInt(entry.id) : entry.id,
    class_id: typeof entry.class_id === 'string' ? parseInt(entry.class_id) : entry.class_id,
    class_name: element && level ? `${element} ${level}` : 'Unknown Class',
    class_type: element,
    trial_name: trialName,
    trial_date: trialDate,
    search_time: entry.search_time_seconds ? `${entry.search_time_seconds}s` : null,
    fault_count: entry.total_faults || null,
    result_text: entry.result_status || null,
    is_scored: entry.is_scored || false,
    checked_in: check_in_status !== 'no-status',
    check_in_status,
    position: entry.final_placement ?? undefined,
    element,
    level,
    section: section ?? undefined,
    trial_number: entry.trial_number ?? undefined,
    judge_name: judgeName ?? undefined,
    trial_id: trialId,
    is_completed: isCompleted,
    results_released_at: resultsReleasedAt,
    visibleFields
  };
}

/**
 * Process multiple entries into ClassEntries with visibility settings
 */
export async function processEntriesToClassEntries(
  entries: RawEntryData[],
  licenseKey: string,
  currentRole: UserRole | null | undefined,
  classMap?: Map<string, ClassData>,
  trialMap?: Map<string, TrialData>
): Promise<ClassEntry[]> {
  return Promise.all(
    entries.map(async (entry) => {
      const classData = classMap?.get(String(entry.class_id));
      const trialData = classData && trialMap ? trialMap.get(String(classData.trial_id)) : undefined;
      return processEntryToClassEntry(entry, licenseKey, currentRole, classData, trialData);
    })
  );
}
