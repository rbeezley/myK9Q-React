/**
 * React Query hooks for DogDetails page
 *
 * Replaces manual data fetching with React Query for automatic caching and background refetching.
 * Benefits:
 * - Automatic caching with configurable stale/cache times
 * - Deduplication (multiple components requesting same data = 1 network call)
 * - Background refetching
 * - Built-in loading/error states
 * - Query invalidation helpers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { getVisibleResultFields } from '../../../services/resultVisibilityService';
import type { VisibleResultFields, VisibilityTiming } from '../../../types/visibility';
import type { CheckinStatus } from '../../../components/dialogs/CheckinStatusDialog';
import type { UserRole } from '../../../utils/auth';
import { logger } from '../../../utils/logger';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ClassEntry {
  id: number; // Entry ID (for status updates)
  class_id: number; // Class ID (for navigation)
  class_name: string;
  class_type: string;
  trial_name: string;
  trial_date: string;
  search_time: string | null;
  fault_count: number | null;
  result_text: string | null;
  is_scored: boolean;
  checked_in: boolean;
  check_in_status?: CheckinStatus;
  position?: number;
  // Additional fields
  element?: string;
  level?: string;
  section?: string;
  trial_number?: number;
  judge_name?: string;
  // Visibility control fields
  trial_id?: number;
  is_completed?: boolean;
  results_released_at?: string | null;
  visibleFields?: VisibleResultFields;
  // For showing availability messages
  placementTiming?: VisibilityTiming;
  qualificationTiming?: VisibilityTiming;
  timeTiming?: VisibilityTiming;
  faultsTiming?: VisibilityTiming;
}

export interface DogInfo {
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
}

export interface DogDetailsData {
  dogInfo: DogInfo | null;
  classes: ClassEntry[];
}

// ============================================================
// QUERY KEYS (centralized for easy invalidation)
// ============================================================

export const dogDetailsKeys = {
  all: (armband: string) => ['dogDetails', armband] as const,
  details: (armband: string, licenseKey: string) => ['dogDetails', armband, licenseKey] as const,
};

// ============================================================
// FETCH FUNCTIONS
// ============================================================

/**
 * Fetch dog details with all class entries
 */
async function fetchDogDetails(
  armband: string | undefined,
  licenseKey: string | undefined,
  currentRole: UserRole | null | undefined
): Promise<DogDetailsData> {
  if (!armband || !licenseKey) {
    logger.log('⏸️ Skipping dog details fetch - armband or licenseKey not ready yet');
    return { dogInfo: null, classes: [] };
  }

  logger.log('🔍 Fetching dog details for armband:', armband);

  // Query the view which now includes entry_status field
  const { data, error } = await supabase
    .from('view_entry_class_join_normalized')
    .select('*')
    .eq('license_key', licenseKey)
    .eq('armband_number', parseInt(armband));

  if (error) {
    logger.error('❌ Error loading dog details:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    logger.log('📭 No dog found with armband:', armband);
    return { dogInfo: null, classes: [] };
  }

  logger.log('✅ Dog details loaded:', data.length, 'class entries');

  // Set dog info from first record
  const firstEntry = data[0];
  const dogInfo: DogInfo = {
    armband: firstEntry.armband_number,
    call_name: firstEntry.dog_call_name,
    breed: firstEntry.dog_breed,
    handler: firstEntry.handler_name
  };

  // Process all classes - map entry status and fetch visibility settings
  const classesWithVisibility = await Promise.all(
    data.map(async (entry) => {
      // Use unified entry_status field
      const statusText = entry.entry_status || 'no-status';
      const check_in_status: ClassEntry['check_in_status'] =
        statusText === 'in-ring' ? 'no-status' : statusText as CheckinStatus;

      // Fetch visibility settings for this class (role-based)
      const visibleFields = await getVisibleResultFields(
        entry.class_id,
        entry.trial_id,
        licenseKey,
        (currentRole || 'exhibitor') as UserRole,
        entry.is_completed || false,
        entry.results_released_at || null
      );

      return {
        id: entry.id, // Entry ID (used for status updates)
        class_id: entry.class_id, // Class ID (used for navigation)
        class_name: entry.element && entry.level ? `${entry.element} ${entry.level}` : 'Unknown Class',
        class_type: entry.element || 'Unknown',
        trial_name: `Trial ${entry.trial_number || ''}`,
        trial_date: entry.trial_date,
        search_time: entry.search_time_seconds ? `${entry.search_time_seconds}s` : null,
        fault_count: entry.total_faults || null,
        result_text: entry.result_status,
        is_scored: entry.is_scored || false,
        checked_in: check_in_status !== 'no-status',
        check_in_status,
        position: entry.final_placement || undefined,
        // Map additional fields
        element: entry.element,
        level: entry.level,
        section: entry.section,
        trial_number: entry.trial_number,
        judge_name: entry.judge_name,
        // Visibility fields
        trial_id: entry.trial_id,
        is_completed: entry.is_completed || false,
        results_released_at: entry.results_released_at || null,
        visibleFields
      };
    })
  );

  return {
    dogInfo,
    classes: classesWithVisibility
  };
}

// ============================================================
// CUSTOM HOOKS
// ============================================================

/**
 * Hook to fetch dog details with class entries
 */
export function useDogDetailsData(
  armband: string | undefined,
  licenseKey: string | undefined,
  currentRole: UserRole | null | undefined
) {
  return useQuery({
    queryKey: dogDetailsKeys.details(armband || '', licenseKey || ''),
    queryFn: () => fetchDogDetails(armband, licenseKey, currentRole),
    enabled: !!armband && !!licenseKey, // Only run if both are provided
    staleTime: 1 * 60 * 1000, // 1 minute (class results change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
