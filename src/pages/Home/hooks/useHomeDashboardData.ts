/**
 * React Query hooks for Home dashboard page
 *
 * Replaces useStaleWhileRevalidate with React Query for automatic caching and background refetching.
 * Benefits:
 * - Automatic caching with configurable stale/cache times
 * - Deduplication (multiple components requesting same data = 1 network call)
 * - Background refetching
 * - Built-in loading/error states
 * - Query invalidation helpers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface EntryData {
  id: number;
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
  is_favorite?: boolean;
  class_name?: string;
  is_scored?: boolean;
}

export interface TrialData {
  id: number;
  show_id: number;
  trial_name: string;
  trial_date: string;
  trial_number: number;
  trial_type: string;
  classes_completed: number;
  classes_total: number;
  entries_completed: number;
  entries_total: number;
}

export interface DashboardData {
  entries: EntryData[];
  trials: TrialData[];
}

// ============================================================
// QUERY KEYS (centralized for easy invalidation)
// ============================================================

export const homeDashboardKeys = {
  all: (licenseKey: string) => ['homeDashboard', licenseKey] as const,
  entries: (licenseKey: string) => ['homeDashboard', licenseKey, 'entries'] as const,
  trials: (showId: number) => ['homeDashboard', showId, 'trials'] as const,
};

// ============================================================
// FETCH FUNCTIONS
// ============================================================

/**
 * Fetch trials with progress counts
 */
async function fetchTrials(showId: string | number | undefined): Promise<TrialData[]> {
  if (!showId) {
    logger.log('⏸️ Skipping trials fetch - showId not ready yet');
    return [];
  }

  // Convert showId to number if it's a string
  const numericShowId = typeof showId === 'string' ? parseInt(showId, 10) : showId;

  logger.log('🔍 Fetching trials for show ID:', numericShowId);

  // Load trials
  const { data: trialsData, error: trialsError } = await supabase
    .from('trials')
    .select('*')
    .eq('show_id', numericShowId);

  if (trialsError) {
    logger.error('❌ Error loading trials:', trialsError);
    throw trialsError;
  }

  logger.log('✅ Trials data loaded:', trialsData?.length || 0, 'trials');

  if (!trialsData || trialsData.length === 0) {
    return [];
  }

  // Process trials with counts - OPTIMIZED using view_class_summary
  const trialIds = trialsData.map(t => t.id);

  // Fetch pre-aggregated class data with entry counts in ONE query
  const { data: classSummaries } = await supabase
    .from('view_class_summary')
    .select('*')
    .in('trial_id', trialIds);

  // Group class summaries by trial_id
  const classesByTrial = new Map<number, typeof classSummaries>();
  classSummaries?.forEach(cls => {
    if (!classesByTrial.has(cls.trial_id)) {
      classesByTrial.set(cls.trial_id, []);
    }
    classesByTrial.get(cls.trial_id)!.push(cls);
  });

  // Process trials using pre-calculated counts from view
  const processedTrials: TrialData[] = trialsData.map(trial => {
    const trialClasses = classesByTrial.get(trial.id) || [];
    const totalClasses = trialClasses.length;
    const completedClasses = trialClasses.filter(c => c.is_completed).length;

    // Sum pre-calculated entry counts from view
    const totalEntries = trialClasses.reduce((sum, c) => sum + (c.total_entries || 0), 0);
    const completedEntries = trialClasses.reduce((sum, c) => sum + (c.scored_entries || 0), 0);

    return {
      ...trial,
      classes_completed: completedClasses,
      classes_total: totalClasses,
      entries_completed: completedEntries,
      entries_total: totalEntries
    };
  });

  return processedTrials;
}

/**
 * Fetch entries (unique dogs by armband)
 */
async function fetchEntries(licenseKey: string | undefined): Promise<EntryData[]> {
  if (!licenseKey) {
    logger.log('⏸️ Skipping entries fetch - licenseKey not ready yet');
    return [];
  }

  logger.log('🔍 Fetching entries for license key:', licenseKey);

  // Load entries from the normalized view
  const { data: entriesData, error: entriesError } = await supabase
    .from('view_entry_class_join_normalized')
    .select('*')
    .eq('license_key', licenseKey)
    .order('armband_number', { ascending: true });

  if (entriesError) {
    logger.error('❌ Error loading entries:', entriesError);
    throw entriesError;
  }

  logger.log('✅ Entries data loaded:', entriesData?.length || 0, 'entries');

  if (!entriesData) {
    return [];
  }

  // Process entries - get unique dogs by armband
  const uniqueDogs = new Map<number, EntryData>();

  entriesData.forEach(entry => {
    if (!uniqueDogs.has(entry.armband_number)) {
      uniqueDogs.set(entry.armband_number, {
        id: entry.id,
        armband: entry.armband_number,
        call_name: entry.dog_call_name,
        breed: entry.dog_breed,
        handler: entry.handler_name,
        is_favorite: false, // Will be updated by component after favorites load
        class_name: entry.element && entry.level ? `${entry.element} ${entry.level}` : undefined,
        is_scored: entry.is_scored
      });
    }
  });

  const processedEntries = Array.from(uniqueDogs.values());
  logger.log('🐕 Processed unique dogs by armband:', processedEntries.length);

  return processedEntries;
}

// ============================================================
// CUSTOM HOOKS
// ============================================================

/**
 * Hook to fetch trials with progress counts
 */
export function useTrials(showId: string | number | undefined) {
  // Convert showId to number for query key
  const numericShowId = typeof showId === 'string' ? parseInt(showId, 10) : showId;

  return useQuery({
    queryKey: homeDashboardKeys.trials(numericShowId || 0),
    queryFn: () => fetchTrials(showId),
    enabled: !!showId, // Only run if showId is provided
    staleTime: 1 * 60 * 1000, // 1 minute (trials change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook to fetch entries (unique dogs)
 */
export function useEntries(licenseKey: string | undefined) {
  return useQuery({
    queryKey: homeDashboardKeys.entries(licenseKey || ''),
    queryFn: () => fetchEntries(licenseKey),
    enabled: !!licenseKey, // Only run if licenseKey is provided
    staleTime: 1 * 60 * 1000, // 1 minute (entries change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Helper hook that combines all dashboard data fetching
 */
export function useHomeDashboardData(
  licenseKey: string | undefined,
  showId: string | number | undefined
) {
  const trialsQuery = useTrials(showId);
  const entriesQuery = useEntries(licenseKey);

  return {
    trials: trialsQuery.data || [],
    entries: entriesQuery.data || [],
    isLoading: trialsQuery.isLoading || entriesQuery.isLoading,
    isRefreshing: trialsQuery.isFetching || entriesQuery.isFetching,
    error: trialsQuery.error || entriesQuery.error,
    refetch: () => {
      trialsQuery.refetch();
      entriesQuery.refetch();
    },
  };
}
