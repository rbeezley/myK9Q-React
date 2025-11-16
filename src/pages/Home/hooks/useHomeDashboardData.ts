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

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { subscriptionCleanup } from '../../../services/subscriptionCleanup';
import { debounce } from 'lodash';
import { ensureReplicationManager } from '@/utils/replicationHelper';
import type { Entry } from '@/services/replication';

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
 * Uses replicated cache when enabled, falls back to Supabase
 */
async function fetchEntries(licenseKey: string | undefined): Promise<EntryData[]> {
  console.log('🐕 fetchEntries called with licenseKey:', licenseKey);
  logger.log('🐕 fetchEntries called with licenseKey:', licenseKey);

  if (!licenseKey) {
    logger.log('⏸️ Skipping entries fetch - licenseKey not ready yet');
    return [];
  }

  // Replication enabled after fixing initialization race conditions
  const isReplicationEnabled = true;

  if (isReplicationEnabled) {
    console.log('🔄 [REPLICATION] Fetching entries from replicated cache...');
    logger.log('🔄 Fetching entries from replicated cache...');

    try {
      const manager = await ensureReplicationManager();
      const table = manager.getTable('entries');
      if (table) {
        try {
          // Don't pass licenseKey - entries are already filtered during sync
          // (entries don't have license_key field, they're linked via classes → trials → shows)
          const cachedEntries = await table.getAll() as Entry[];
          console.log(`✅ [REPLICATION] Loaded ${cachedEntries.length} entries from cache`);
          logger.log(`✅ Loaded ${cachedEntries.length} entries from cache`);

          // If cache is empty, fall back to Supabase (cache may still be syncing)
          if (cachedEntries.length === 0) {
            console.log('📭 [REPLICATION] Cache is empty, falling back to Supabase');
            logger.log('📭 Cache is empty, falling back to Supabase');
            // Fall through to Supabase query
          } else {
            // Transform replicated Entry to EntryData format
            const uniqueDogs = new Map<number, EntryData>();

            cachedEntries.forEach(entry => {
              if (!uniqueDogs.has(entry.armband_number)) {
                uniqueDogs.set(entry.armband_number, {
                  id: parseInt(entry.id, 10),
                  armband: entry.armband_number,
                  call_name: entry.dog_call_name,
                  breed: entry.dog_breed || '',
                  handler: entry.handler_name,
                  is_favorite: false, // Will be updated by component after favorites load
                  class_name: undefined, // No class info in replicated Entry yet
                  is_scored: entry.is_scored
                });
              }
            });

            const processedEntries = Array.from(uniqueDogs.values());
            console.log(`🐕 [REPLICATION] Processed unique dogs from cache: ${processedEntries.length}`);
            logger.log('🐕 Processed unique dogs from cache:', processedEntries.length);

            return processedEntries;
          }
        } catch (error) {
          logger.error('❌ Error loading from replicated cache, falling back to Supabase:', error);
          // Fall through to Supabase query
        }
      }
    } catch (managerError) {
      logger.error('❌ Error initializing replication manager, falling back to Supabase:', managerError);
      // Fall through to Supabase query
    }
  }

  // Fall back to original Supabase query
  logger.log('🔍 Fetching entries from Supabase (fallback or replication disabled)...');

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
    staleTime: 30 * 1000, // 30 seconds - entries can change frequently during scoring
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Helper hook that combines all dashboard data fetching with real-time updates
 */
export function useHomeDashboardData(
  licenseKey: string | undefined,
  showId: string | number | undefined
) {
  const queryClient = useQueryClient();
  const trialsQuery = useTrials(showId);
  const entriesQuery = useEntries(licenseKey);

  // Convert showId to number for consistent usage
  const numericShowId = typeof showId === 'string' ? parseInt(showId, 10) : showId;

  // Set up real-time subscription with debounced invalidation
  useEffect(() => {
    if (!licenseKey || !numericShowId) return;

    logger.log('📡 Setting up real-time subscription for Home dashboard');

    // Debounced invalidation (3 second delay after last change)
    // This batches rapid scoring events into a single refetch
    const invalidateTrialsDebounced = debounce(() => {
      logger.log('🔄 Refetching trial counts after entry changes...');
      queryClient.invalidateQueries({
        queryKey: homeDashboardKeys.trials(numericShowId)
      });
    }, 3000);

    // Subscribe to entries table changes
    const channel = supabase
      .channel(`home-entries-${licenseKey}`)
      .on('postgres_changes', {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'entries',
        filter: `license_key=eq.${licenseKey}`
      }, (payload) => {
        logger.log('📡 Entry changed:', payload.eventType);

        // Only invalidate if scoring-related fields changed
        if (payload.eventType === 'UPDATE') {
          const oldEntry = payload.old as any;
          const newEntry = payload.new as any;

          // Check if is_scored changed (this affects trial counts)
          if (oldEntry.is_scored !== newEntry.is_scored) {
            logger.log('📊 Score status changed, invalidating trials...');
            invalidateTrialsDebounced();
          }
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
          // INSERT or DELETE always affects counts
          logger.log('📊 Entry added/removed, invalidating trials...');
          invalidateTrialsDebounced();
        }
      })
      .subscribe();

    // Register subscription for monitoring
    subscriptionCleanup.register(
      `home-entries-${licenseKey}`,
      'entry',
      licenseKey
    );

    return () => {
      logger.log('🧹 Cleaning up Home dashboard subscription');
      invalidateTrialsDebounced.cancel(); // Cancel pending debounce
      supabase.removeChannel(channel);
      subscriptionCleanup.unregister(`home-entries-${licenseKey}`);
    };
  }, [licenseKey, numericShowId, queryClient]);

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
