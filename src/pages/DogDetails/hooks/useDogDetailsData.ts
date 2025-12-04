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
import type { VisibleResultFields, VisibilityTiming } from '../../../types/visibility';
import type { CheckinStatus } from '../../../components/dialogs/CheckinStatusDialog';
import type { UserRole } from '../../../utils/auth';
import { logger } from '../../../utils/logger';
import { ensureReplicationManager } from '../../../utils/replicationHelper';
import type { Entry } from '../../../services/replication/tables/ReplicatedEntriesTable';
import type { Class } from '../../../services/replication/tables/ReplicatedClassesTable';
import type { Trial } from '../../../services/replication/tables/ReplicatedTrialsTable';
import {
  extractDogInfo,
  processEntriesToClassEntries,
  type ClassData,
  type TrialData
} from './dogDetailsDataHelpers';

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
  is_scoring_finalized?: boolean;
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
 * Uses replicated cache (direct replacement, no feature flags)
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

  logger.log('[REPLICATION] 🔍 Fetching dog details for armband:', armband);

  try {
    // Load from replicated cache - ensure it's initialized
    const manager = await ensureReplicationManager();

    const entriesTable = manager.getTable('entries');
    const classesTable = manager.getTable('classes');
    const trialsTable = manager.getTable('trials');

    if (!entriesTable || !classesTable || !trialsTable) {
      throw new Error('Required tables not registered');
    }

    // Get all entries for this show and filter by armband
    // CRITICAL: Pass license_key to filter entries to current show only (multi-tenant isolation)
    const allEntries = await entriesTable.getAll(licenseKey) as Entry[];
    const dogEntries = allEntries.filter(
      entry => entry.armband_number === parseInt(armband)
    );

    // If cache is empty, fall back to Supabase (cache may still be syncing)
    if (dogEntries.length === 0) {
      logger.log('[REPLICATION] 📭 No dog found with armband in cache, falling back to Supabase');
      // Fall through to Supabase query below
    } else {

    logger.log(`[REPLICATION] ✅ Found ${dogEntries.length} entries for armband ${armband}`);

    // Get all classes and trials for joins
    // CRITICAL: Pass license_key to filter to current show only (multi-tenant isolation)
    const allClasses = await classesTable.getAll(licenseKey) as Class[];
    const allTrials = await trialsTable.getAll(licenseKey) as Trial[];

    // Create lookup maps for performance
    const classMap = new Map<string, ClassData>(allClasses.map(c => [String(c.id), c as ClassData]));
    const trialMap = new Map<string, TrialData>(allTrials.map(t => [String(t.id), t as TrialData]));

    // Debug: Log if no classes found
    if (allClasses.length === 0) {
      logger.warn('[DogDetails] ⚠️ No classes found in cache - class info will be missing');
    }

    // Extract dog info and process entries using helpers
    const dogInfo = extractDogInfo(dogEntries[0]);
    const classesWithVisibility = await processEntriesToClassEntries(
      dogEntries,
      licenseKey,
      currentRole,
      classMap,
      trialMap
    );

    return { dogInfo, classes: classesWithVisibility };
    }

  } catch (error) {
    logger.error('[REPLICATION] ❌ Error loading dog details from cache, falling back to Supabase:', error);
  }

  // Fall back to original Supabase implementation
  logger.log('[REPLICATION] 📡 Fetching dog details from Supabase...');

  try {
    // Import supabase for fallback
    const { supabase } = await import('../../../lib/supabase');

    // Query view_entry_class_join_normalized for this armband
    const { data: entries, error } = await supabase
      .from('view_entry_class_join_normalized')
      .select('*')
      .eq('armband_number', parseInt(armband))
      .eq('license_key', licenseKey);

    if (error) throw error;

    if (!entries || entries.length === 0) {
      logger.log('[REPLICATION] 📭 No dog found with armband in Supabase:', armband);
      return { dogInfo: null, classes: [] };
    }

    logger.log(`[REPLICATION] ✅ Loaded ${entries.length} entries from Supabase for armband ${armband}`);

    // Extract dog info and process entries using helpers
    const dogInfo = extractDogInfo(entries[0]);
    const classesWithVisibility = await processEntriesToClassEntries(
      entries,
      licenseKey,
      currentRole
    );

    return { dogInfo, classes: classesWithVisibility };

  } catch (error) {
    logger.error('[REPLICATION] ❌ Error loading dog details from Supabase:', error);
    throw error;
  }
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
