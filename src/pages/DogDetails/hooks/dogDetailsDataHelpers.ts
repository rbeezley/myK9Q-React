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
  is_scoring_finalized?: boolean;
  results_released_at?: string | null;
}

export interface ClassData {
  id: number | string;
  element?: string | null;
  level?: string | null;
  section?: string | null;
  trial_id?: number | null;
  judge_name?: string | null;
  is_scoring_finalized?: boolean;
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
 * Parse ID to number (handles string IDs from different sources)
 */
function parseId(id: number | string): number {
  return typeof id === 'string' ? parseInt(id) : id;
}

/**
 * Derived field values from entry, class, and trial data
 */
interface DerivedFields {
  element: string;
  level: string;
  section: string | null | undefined;
  trialId: number;
  isCompleted: boolean;
  resultsReleasedAt: string | null;
  judgeName: string | undefined;
  trialName: string;
  trialDate: string;
}

/**
 * Extract derived fields with fallbacks between entry, class, and trial data
 */
function extractDerivedFields(
  entry: RawEntryData,
  classData?: ClassData,
  trialData?: TrialData
): DerivedFields {
  return {
    element: entry.element || classData?.element || 'Unknown',
    level: entry.level || classData?.level || 'Class',
    section: entry.section || classData?.section,
    trialId: entry.trial_id || classData?.trial_id || 0,
    isCompleted: entry.is_scoring_finalized ?? classData?.is_scoring_finalized ?? false,
    resultsReleasedAt: entry.results_released_at ?? null,
    judgeName: entry.judge_name || classData?.judge_name || undefined,
    trialName: entry.trial_element || trialData?.element || 'Unknown Trial',
    trialDate: entry.trial_date || trialData?.trial_date || ''
  };
}

/**
 * Build ClassEntry object from entry data and derived fields
 */
function buildClassEntry(
  entry: RawEntryData,
  fields: DerivedFields,
  checkInStatus: CheckinStatus,
  visibleFields: ClassEntry['visibleFields']
): ClassEntry {
  return {
    id: parseId(entry.id),
    class_id: parseId(entry.class_id),
    class_name: fields.element && fields.level ? `${fields.element} ${fields.level}` : 'Unknown Class',
    class_type: fields.element,
    trial_name: fields.trialName,
    trial_date: fields.trialDate,
    search_time: entry.search_time_seconds ? `${entry.search_time_seconds}s` : null,
    fault_count: entry.total_faults || null,
    result_text: entry.result_status || null,
    is_scored: entry.is_scored || false,
    checked_in: checkInStatus !== 'no-status',
    check_in_status: checkInStatus,
    position: entry.final_placement ?? undefined,
    element: fields.element,
    level: fields.level,
    section: fields.section ?? undefined,
    trial_number: entry.trial_number ?? undefined,
    judge_name: fields.judgeName,
    trial_id: fields.trialId,
    is_scoring_finalized: fields.isCompleted,
    results_released_at: fields.resultsReleasedAt,
    visibleFields
  };
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
  const checkInStatus = mapEntryStatus(entry.entry_status);
  const fields = extractDerivedFields(entry, classData, trialData);

  // Fetch visibility settings for this class (role-based)
  const visibleFields = await getVisibleResultFields({
    classId: parseId(entry.class_id),
    trialId: fields.trialId,
    licenseKey,
    userRole: (currentRole || 'exhibitor') as UserRole,
    isClassComplete: fields.isCompleted,
    resultsReleasedAt: fields.resultsReleasedAt
  });

  return buildClassEntry(entry, fields, checkInStatus, visibleFields);
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
