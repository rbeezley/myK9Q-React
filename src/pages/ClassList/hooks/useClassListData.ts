/**
 * React Query hooks for ClassList page
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
import { getClassEntries } from '../../../services/entryService';
import { getLevelSortOrder } from '../../../lib/utils';
import { logger } from '../../../utils/logger';
import { cache as idbCache } from '@/utils/indexedDB';
import { getReplicationManager } from '@/services/replication';
import type { Class } from '@/services/replication/tables/ReplicatedClassesTable';
import type { Entry } from '@/services/replication/tables/ReplicatedEntriesTable';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ClassEntry {
  id: number;
  element: string;
  level: string;
  section: string;
  class_name: string;
  class_order: number;
  judge_name: string;
  entry_count: number;
  completed_count: number;
  class_status: 'no-status' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
  is_completed?: boolean;
  is_favorite: boolean;
  time_limit_seconds?: number;
  time_limit_area2_seconds?: number;
  time_limit_area3_seconds?: number;
  area_count?: number;
  start_time?: string;
  briefing_time?: string;
  break_until?: string;
  pairedClassId?: number; // For combined Novice A & B classes
  dogs: {
    id: number;
    armband: number;
    call_name: string;
    breed: string;
    handler: string;
    in_ring: boolean;
    checkin_status: number;
    is_scored: boolean;
  }[];
}

export interface TrialInfo {
  trial_name: string;
  trial_date: string;
  trial_number: number;
  total_classes: number;
  pending_classes: number;
  completed_classes: number;
}

export interface ClassListData {
  trialInfo: TrialInfo | null;
  classes: ClassEntry[];
}

// ============================================================
// QUERY KEYS (centralized for easy invalidation)
// ============================================================

export const classListKeys = {
  all: (trialId: string) => ['classList', trialId] as const,
  trialInfo: (trialId: string) => ['classList', trialId, 'trialInfo'] as const,
  classes: (trialId: string) => ['classList', trialId, 'classes'] as const,
};

// ============================================================
// FETCH FUNCTIONS
// ============================================================

/**
 * Fetch trial information
 */
async function fetchTrialInfo(
  trialId: string | undefined,
  showId: string | number | undefined,
  licenseKey?: string
): Promise<TrialInfo | null> {
  if (!trialId || !showId) {
    logger.log('⏸️ Skipping trial info fetch - trialId or showId not ready yet');
    return null;
  }

  logger.log('🔍 Fetching trial info for trial ID:', trialId);

  // Try IndexedDB cache first (for offline support)
  if (licenseKey) {
    const cached = await idbCache.get(`trial-info-${licenseKey}-${trialId}`);
    if (cached && cached.data) {
      logger.log('✅ Using cached trial info from IndexedDB');
      const trialData: any = cached.data;

      // Still need to load class data for counts
      const cachedClassData = await idbCache.get(`class-summary-${licenseKey}-${trialId}`);
      if (cachedClassData && cachedClassData.data) {
        const classData: any = cachedClassData.data;
        return {
          trial_name: trialData.trial_name,
          trial_date: trialData.trial_date,
          trial_number: trialData.trial_number || trialData.trialid,
          total_classes: classData.length || 0,
          pending_classes: classData.filter((c: any) => c.is_completed !== true).length || 0,
          completed_classes: classData.filter((c: any) => c.is_completed === true).length || 0
        };
      }
    }
  }

  // Load trial info using normalized table
  const { data: trialData, error: trialError } = await supabase
    .from('trials')
    .select('*')
    .eq('show_id', showId)
    .eq('id', parseInt(trialId))
    .single();

  if (trialError) {
    logger.error('❌ Error loading trial:', trialError);
    throw trialError;
  }

  if (!trialData) return null;

  logger.log('✅ Trial data loaded:', trialData);

  // Load classes to calculate trial info counts
  const { data: classData } = await supabase
    .from('view_class_summary')
    .select('*')
    .eq('trial_id', parseInt(trialId))
    .order('class_order');

  // Build trial info with counts
  const trialInfo: TrialInfo = {
    trial_name: trialData.trial_name,
    trial_date: trialData.trial_date,
    trial_number: trialData.trial_number || trialData.trialid,
    total_classes: classData?.length || 0,
    pending_classes: classData?.filter(c => c.is_completed !== true).length || 0,
    completed_classes: classData?.filter(c => c.is_completed === true).length || 0
  };

  return trialInfo;
}

/**
 * Process classes with entry data
 * Shared logic for both replicated cache and Supabase fallback
 */
async function processClassesWithEntries(
  classesData: Class[],
  entriesData: Entry[],
  _licenseKey: string
): Promise<ClassEntry[]> {
  // Build a map of classId -> entries
  const entriesByClass = new Map<string, Entry[]>();

  entriesData.forEach((entry) => {
    const classId = entry.class_id;
    if (!entriesByClass.has(classId)) {
      entriesByClass.set(classId, []);
    }
    entriesByClass.get(classId)!.push(entry);
  });

  // Process each class
  const processedClasses = classesData.map((cls) => {
    const classEntries = entriesByClass.get(cls.id) || [];

    // Process dog entries with custom status priority sorting
    const dogs = classEntries
      .map((entry) => ({
        id: parseInt(entry.id, 10),
        armband: entry.armband_number,
        call_name: entry.dog_call_name,
        breed: entry.dog_breed || '',
        handler: entry.handler_name,
        in_ring: entry.is_in_ring || false,
        checkin_status:
          entry.entry_status === 'checked-in'
            ? 1
            : entry.entry_status === 'conflict'
            ? 2
            : entry.entry_status === 'pulled'
            ? 3
            : entry.entry_status === 'at-gate'
            ? 4
            : 0,
        is_scored: entry.is_scored || false,
      }))
      .sort((a, b) => {
        // Custom sort order: in-ring, at gate, checked-in, conflict, not checked-in, pulled, completed
        const getStatusPriority = (dog: typeof a) => {
          if (dog.is_scored) return 7; // Completed (last)
          if (dog.in_ring) return 1; // In-ring (first)
          if (dog.checkin_status === 4) return 2; // At gate
          if (dog.checkin_status === 1) return 3; // Checked-in
          if (dog.checkin_status === 2) return 4; // Conflict
          if (dog.checkin_status === 0) return 5; // Not checked-in (pending)
          if (dog.checkin_status === 3) return 6; // Pulled
          return 8; // Unknown status
        };

        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Secondary sort by armband number
        return a.armband - b.armband;
      });

    // Count totals
    const entryCount = dogs.length;
    const completedCount = dogs.filter((dog) => dog.is_scored).length;

    // Construct class name from element, level, and section
    const sectionPart =
      cls.section && cls.section !== '-' ? ` ${cls.section}` : '';
    const className = `${cls.element} ${cls.level}${sectionPart}`.trim();

    return {
      id: parseInt(cls.id, 10),
      element: cls.element,
      level: cls.level,
      section: cls.section || '',
      class_name: className,
      class_order: cls.class_order || 999,
      judge_name: cls.judge_name || 'TBA',
      entry_count: entryCount,
      completed_count: completedCount,
      class_status: (cls.class_status?.trim() || 'no-status') as
        | 'no-status'
        | 'setup'
        | 'briefing'
        | 'break'
        | 'start_time'
        | 'in_progress'
        | 'completed',
      is_completed: cls.is_completed || false,
      is_favorite: false, // Will be updated by component with localStorage
      time_limit_seconds: cls.time_limit_seconds,
      time_limit_area2_seconds: cls.time_limit_area2_seconds,
      time_limit_area3_seconds: cls.time_limit_area3_seconds,
      area_count: cls.area_count,
      briefing_time: cls.briefing_time || undefined,
      break_until: cls.break_until || undefined,
      start_time: cls.start_time || undefined,
      dogs: dogs,
    };
  });

  // Sort classes by class_order first, then element, level, section
  const sortedClasses = processedClasses.sort((a, b) => {
    // Primary sort: class_order (ascending)
    if (a.class_order !== b.class_order) {
      return a.class_order - b.class_order;
    }

    // Secondary sort: element (alphabetical)
    if (a.element !== b.element) {
      return a.element.localeCompare(b.element);
    }

    // Tertiary sort: level (standard progression: Novice -> Advanced -> Excellent -> Master)
    const aLevelOrder = getLevelSortOrder(a.level);
    const bLevelOrder = getLevelSortOrder(b.level);

    if (aLevelOrder !== bLevelOrder) {
      return aLevelOrder - bLevelOrder;
    }

    // If same level order, sort alphabetically
    if (a.level !== b.level) {
      return a.level.localeCompare(b.level);
    }

    // Quaternary sort: section (alphabetical)
    return a.section.localeCompare(b.section);
  });

  return sortedClasses;
}

/**
 * Fetch classes with entries and sorting
 */
async function fetchClasses(
  trialId: string | undefined,
  licenseKey: string | undefined
): Promise<ClassEntry[]> {
  if (!trialId || !licenseKey) {
    logger.log('⏸️ Skipping classes fetch - trialId or licenseKey not ready yet');
    return [];
  }

  // Always use replication (no feature flags - development only, no existing users)
  const isReplicationEnabled = true;

  if (isReplicationEnabled) {
    console.log('🔄 [REPLICATION] Fetching classes from replicated cache...');
    logger.log('🔄 Fetching classes from replicated cache...');

    const manager = getReplicationManager();
    if (manager) {
      const classesTable = manager.getTable<Class>('classes');
      const entriesTable = manager.getTable<Entry>('entries');

      if (classesTable && entriesTable) {
        try {
          // Get classes for this trial from cache
          const cachedClasses = await classesTable.getAll();

          // Convert trialId to number for comparison (route params are strings, DB trial_id is number)
          const trialIdNum = parseInt(trialId, 10);
          const trialClasses = cachedClasses.filter(
            (cls) => cls.trial_id === trialIdNum
          );

          console.log(`✅ [REPLICATION] Loaded ${trialClasses.length} classes from cache (trial_id: ${trialIdNum})`);

          // Get entries for this trial from cache
          const cachedEntries = await entriesTable.getAll();

          // Process classes with entry data (same logic as before)
          const processedClasses = await processClassesWithEntries(
            trialClasses,
            cachedEntries,
            licenseKey
          );

          console.log(`📊 [REPLICATION] Processed ${processedClasses.length} classes`);
          return processedClasses;

        } catch (error) {
          logger.error('❌ Error loading from replicated cache, falling back to Supabase:', error);
          // Fall through to Supabase query
        }
      }
    }
  }

  // Fall back to original Supabase implementation
  logger.log('🔍 Fetching classes for trial ID:', trialId);

  // Try IndexedDB cache first (for offline support)
  const cached = await idbCache.get(`class-summary-${licenseKey}-${trialId}`);
  let classData: any = null;

  if (cached && cached.data) {
    logger.log('✅ Using cached class summary from IndexedDB');
    classData = cached.data;
  } else {
    // Load classes with pre-calculated entry counts using view_class_summary
    const { data, error: classError } = await supabase
      .from('view_class_summary')
      .select('*')
      .eq('trial_id', parseInt(trialId))
      .order('class_order');

    if (classError) {
      logger.error('❌ Error loading classes:', classError);
      throw classError;
    }

    classData = data;
  }

  if (!classData) return [];

  logger.log('✅ Class data loaded:', classData.length, 'classes');

  // Load ALL entries for this trial using getClassEntries from entryService
  // This properly queries the results table separately and joins in JavaScript
  const classIds = classData.map((c: any) => c.class_id);
  const allTrialEntries = await getClassEntries(classIds, licenseKey);

  // Process classes with entry data
  const processedClasses = classData.map((cls: any) => {
    // Filter entries for this specific class using class_id
    const entryData = allTrialEntries.filter(entry =>
      entry.classId === cls.class_id
    );

    // Process dog entries with custom status priority sorting
    const dogs = entryData.map(entry => ({
      id: entry.id,
      armband: entry.armband,
      call_name: entry.callName,
      breed: entry.breed,
      handler: entry.handler,
      in_ring: entry.status === 'in-ring',
      checkin_status: entry.status === 'checked-in' ? 1 : entry.status === 'conflict' ? 2 : entry.status === 'pulled' ? 3 : entry.status === 'at-gate' ? 4 : 0,
      is_scored: entry.isScored
    })).sort((a, b) => {
      // Custom sort order: in-ring, at gate, checked-in, conflict, not checked-in, pulled, completed
      const getStatusPriority = (dog: typeof a) => {
        if (dog.is_scored) return 7; // Completed (last)
        if (dog.in_ring) return 1; // In-ring (first)
        if (dog.checkin_status === 4) return 2; // At gate
        if (dog.checkin_status === 1) return 3; // Checked-in
        if (dog.checkin_status === 2) return 4; // Conflict
        if (dog.checkin_status === 0) return 5; // Not checked-in (pending)
        if (dog.checkin_status === 3) return 6; // Pulled
        return 8; // Unknown status
      };

      const priorityA = getStatusPriority(a);
      const priorityB = getStatusPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Secondary sort by armband number
      return a.armband - b.armband;
    });

    // Count totals
    const entryCount = dogs.length;
    const completedCount = dogs.filter(dog => dog.is_scored).length;

    // Construct class name from element, level, and section (hide section if it's a dash)
    const sectionPart = cls.section && cls.section !== '-' ? ` ${cls.section}` : '';
    const className = `${cls.element} ${cls.level}${sectionPart}`.trim();

    return {
      id: cls.class_id,
      element: cls.element,
      level: cls.level,
      section: cls.section,
      class_name: className,
      class_order: cls.class_order || 999, // Default high value for classes without order
      class_type: cls.class_type,
      judge_name: cls.judge_name || 'TBA',
      entry_count: entryCount,
      completed_count: completedCount,
      class_status: (cls.class_status?.trim() || 'no-status') as 'no-status' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed',
      is_completed: cls.is_completed || false,
      is_favorite: false, // Will be updated by component with localStorage
      time_limit_seconds: cls.time_limit_seconds,
      time_limit_area2_seconds: cls.time_limit_area2_seconds,
      time_limit_area3_seconds: cls.time_limit_area3_seconds,
      area_count: cls.area_count,
      // Get time values from their respective columns
      briefing_time: cls.briefing_time || undefined,
      break_until: cls.break_until || undefined,
      start_time: cls.start_time || undefined,
      dogs: dogs
    };
  });

  // Sort classes by class_order first, then element, level, section
  const sortedClasses = processedClasses.sort((a: any, b: any) => {
    // Primary sort: class_order (ascending)
    if (a.class_order !== b.class_order) {
      return a.class_order - b.class_order;
    }

    // Secondary sort: element (alphabetical)
    if (a.element !== b.element) {
      return a.element.localeCompare(b.element);
    }

    // Tertiary sort: level (standard progression: Novice -> Advanced -> Excellent -> Master)
    const aLevelOrder = getLevelSortOrder(a.level);
    const bLevelOrder = getLevelSortOrder(b.level);

    if (aLevelOrder !== bLevelOrder) {
      return aLevelOrder - bLevelOrder;
    }

    // If same level order, sort alphabetically
    if (a.level !== b.level) {
      return a.level.localeCompare(b.level);
    }

    // Quaternary sort: section (alphabetical)
    return a.section.localeCompare(b.section);
  });

  return sortedClasses;
}

// ============================================================
// CUSTOM HOOKS
// ============================================================

/**
 * Hook to fetch trial information
 */
export function useTrialInfo(
  trialId: string | undefined,
  showId: string | number | undefined,
  licenseKey: string | undefined
) {
  return useQuery({
    queryKey: classListKeys.trialInfo(trialId || ''),
    queryFn: () => fetchTrialInfo(trialId, showId, licenseKey),
    enabled: !!trialId && !!showId, // Only run if both IDs are provided
    staleTime: 5 * 60 * 1000, // 5 minutes (trial info rarely changes)
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    networkMode: 'always', // Run query even offline, will use cached data
    retry: false, // Don't retry when offline
  });
}

/**
 * Hook to fetch classes with entries
 */
export function useClasses(trialId: string | undefined, licenseKey: string | undefined) {
  return useQuery({
    queryKey: classListKeys.classes(trialId || ''),
    queryFn: () => fetchClasses(trialId, licenseKey),
    enabled: !!trialId && !!licenseKey, // Only run if both are provided
    staleTime: 0, // FORCE REFETCH EVERY TIME (for testing replication)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    networkMode: 'always', // Run query even offline, will use cached data
    retry: false, // Don't retry when offline
  });
}

/**
 * Helper hook that combines all class list data fetching
 */
export function useClassListData(
  trialId: string | undefined,
  showId: string | number | undefined,
  licenseKey: string | undefined
) {
  const trialInfoQuery = useTrialInfo(trialId, showId, licenseKey);
  const classesQuery = useClasses(trialId, licenseKey);

  return {
    trialInfo: trialInfoQuery.data || null,
    classes: classesQuery.data || [],
    isLoading: trialInfoQuery.isLoading || classesQuery.isLoading,
    isRefreshing: trialInfoQuery.isFetching || classesQuery.isFetching,
    error: trialInfoQuery.error || classesQuery.error,
    refetch: () => {
      trialInfoQuery.refetch();
      classesQuery.refetch();
    },
  };
}
