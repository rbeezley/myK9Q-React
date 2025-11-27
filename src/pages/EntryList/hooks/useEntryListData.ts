import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getClassEntries } from '../../../services/entryService';
import { Entry } from '../../../stores/entryStore';
import { supabase } from '../../../lib/supabase';
import { ensureReplicationManager } from '@/utils/replicationHelper';
import type { Class } from '@/services/replication/tables/ReplicatedClassesTable';
import type { Entry as ReplicatedEntry } from '@/services/replication/tables/ReplicatedEntriesTable';
import { logger } from '@/utils/logger';
import { getVisibleResultFields } from '@/services/resultVisibilityService';
import type { VisibleResultFields } from '@/types/visibility';
import type { UserRole } from '@/utils/auth';

export interface ClassInfo {
  className: string;
  element: string;
  level: string;
  section?: string;
  trialDate?: string;
  trialNumber?: string;
  judgeName?: string;
  judgeNameB?: string; // For combined view
  actualClassId?: number;
  actualClassIdA?: number; // For combined view
  actualClassIdB?: number; // For combined view
  selfCheckin?: boolean;
  classStatus?: string;
  totalEntries?: number;
  completedEntries?: number;
  timeLimit?: string;
  timeLimit2?: string;
  timeLimit3?: string;
  areas?: number;
}

export interface EntryListData {
  entries: Entry[];
  classInfo: ClassInfo | null;
}

interface UseEntryListDataOptions {
  classId?: string;
  classIdA?: string;
  classIdB?: string;
  /** Ref to check if drag operation is in progress - skips auto-refresh when true */
  isDraggingRef?: MutableRefObject<boolean>;
}

// =============================================================================
// HELPER FUNCTIONS - Extracted to reduce complexity and duplication
// =============================================================================

/** Default visibility flags - used when fetch fails (fail-open for better UX) */
const DEFAULT_VISIBILITY_FLAGS: VisibleResultFields = {
  showPlacement: true,
  showQualification: true,
  showTime: true,
  showFaults: true
};

/**
 * Apply visibility flags to an entry based on visibility settings
 */
function applyVisibilityFlags(entry: Entry, visibilityFlags: VisibleResultFields): Entry {
  return {
    ...entry,
    showPlacement: visibilityFlags.showPlacement,
    showQualification: visibilityFlags.showQualification,
    showTime: visibilityFlags.showTime,
    showFaults: visibilityFlags.showFaults
  };
}

/**
 * Fetch visibility flags with error handling - returns defaults on failure
 */
async function fetchVisibilityFlagsWithFallback(
  classId: number,
  trialId: number,
  licenseKey: string,
  role: UserRole,
  isClassComplete: boolean,
  resultsReleasedAt: string | null
): Promise<VisibleResultFields> {
  try {
    return await getVisibleResultFields(
      classId,
      trialId,
      licenseKey,
      role,
      isClassComplete,
      resultsReleasedAt
    );
  } catch (error) {
    logger.error('❌ Error fetching visibility settings, defaulting to show all:', error);
    return DEFAULT_VISIBILITY_FLAGS;
  }
}

/**
 * Apply visibility to entries - handles both single and combined class cases
 */
async function applyVisibilityToEntries(
  entries: Entry[],
  classData: Class,
  licenseKey: string,
  role: UserRole
): Promise<Entry[]> {
  const isClassComplete = classData.class_status === 'completed' || classData.is_completed === true;
  const visibilityFlags = await fetchVisibilityFlagsWithFallback(
    parseInt(String(classData.id)),
    classData.trial_id,
    licenseKey,
    role,
    isClassComplete,
    classData.results_released_at || null
  );
  return entries.map(entry => applyVisibilityFlags(entry, visibilityFlags));
}

/**
 * Build ClassInfo from class data - single class version
 */
function buildSingleClassInfo(
  classData: Class,
  classId: string,
  entries: Entry[],
  judgeName: string
): ClassInfo {
  const sectionPart = classData.section && classData.section !== '-' ? ` ${classData.section}` : '';
  const completedEntries = entries.filter(e => e.isScored).length;

  return {
    className: `${classData.element} ${classData.level}${sectionPart}`.trim(),
    element: classData.element || '',
    level: classData.level || '',
    section: classData.section || '',
    trialDate: entries[0]?.trialDate || '',
    trialNumber: entries[0]?.trialNumber ? String(entries[0].trialNumber) : '',
    judgeName,
    actualClassId: parseInt(classId),
    selfCheckin: classData.self_checkin_enabled ?? true,
    classStatus: classData.class_status || 'pending',
    totalEntries: entries.length,
    completedEntries,
    timeLimit: classData.time_limit_seconds ? `${classData.time_limit_seconds}s` : undefined,
    timeLimit2: classData.time_limit_area2_seconds ? `${classData.time_limit_area2_seconds}s` : undefined,
    timeLimit3: classData.time_limit_area3_seconds ? `${classData.time_limit_area3_seconds}s` : undefined,
    areas: classData.area_count
  };
}

/**
 * Build ClassInfo from class data - combined A & B version
 */
function buildCombinedClassInfo(
  classDataA: Class,
  classDataB: Class,
  classIdA: string,
  classIdB: string,
  entries: Entry[]
): ClassInfo {
  return {
    className: `${classDataA.element} ${classDataA.level} A & B`,
    element: classDataA.element || '',
    level: classDataA.level || '',
    trialDate: entries[0]?.trialDate || '',
    trialNumber: entries[0]?.trialNumber ? String(entries[0].trialNumber) : '',
    judgeName: classDataA.judge_name || 'No Judge Assigned',
    judgeNameB: classDataB.judge_name || 'No Judge Assigned',
    actualClassIdA: parseInt(classIdA),
    actualClassIdB: parseInt(classIdB),
    selfCheckin: classDataA.self_checkin_enabled ?? true,
    classStatus: classDataA.class_status || classDataB.class_status || 'pending',
    timeLimit: classDataA.time_limit_seconds ? `${classDataA.time_limit_seconds}s` : undefined,
    timeLimit2: classDataA.time_limit_area2_seconds ? `${classDataA.time_limit_area2_seconds}s` : undefined,
    timeLimit3: classDataA.time_limit_area3_seconds ? `${classDataA.time_limit_area3_seconds}s` : undefined,
    areas: classDataA.area_count
  };
}

/**
 * Transform replicated entry to Entry format
 */
function transformReplicatedEntry(entry: ReplicatedEntry, classData?: Class): Entry {
  const status = entry.entry_status || 'pending';
  const sectionPart = classData?.section && classData.section !== '-' ? ` ${classData.section}` : '';

  return {
    id: parseInt(entry.id, 10),
    armband: entry.armband_number,
    callName: entry.dog_call_name,
    breed: entry.dog_breed || '',
    handler: entry.handler_name,
    isScored: entry.is_scored || false,
    status: status as Entry['status'],
    inRing: entry.entry_status === 'in-ring',
    classId: parseInt(entry.class_id, 10),
    className: classData?.element && classData?.level
      ? `${classData.element} ${classData.level}${sectionPart}`.trim()
      : '',
    element: classData?.element || '',
    level: classData?.level || '',
    section: classData?.section || '',
    timeLimit: classData?.time_limit_seconds ? `${classData.time_limit_seconds}s` : undefined,
    timeLimit2: classData?.time_limit_area2_seconds ? `${classData.time_limit_area2_seconds}s` : undefined,
    timeLimit3: classData?.time_limit_area3_seconds ? `${classData.time_limit_area3_seconds}s` : undefined,
    resultText: entry.result_status,
    placement: entry.final_placement,
    searchTime: entry.search_time_seconds?.toString(),
    faultCount: entry.total_faults,
    exhibitorOrder: entry.exhibitor_order,
  };
}

/**
 * Shared hook for fetching and caching entry list data using stale-while-revalidate pattern.
 * Supports both single class and combined class views.
 */
export const useEntryListData = ({ classId, classIdA, classIdB, isDraggingRef }: UseEntryListDataOptions) => {
  const { showContext, role } = useAuth();

  const isCombinedView = !!(classIdA && classIdB);

  // Fetch function for single class view - refactored to use helper functions
  const fetchSingleClass = useCallback(async (): Promise<EntryListData> => {
    if (!classId || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    const licenseKey = showContext.licenseKey;
    const userRole: UserRole = (role as UserRole) || 'exhibitor';

    // Try replication cache first
    logger.log('🔄 Fetching entries from replicated cache...');
    const cacheResult = await fetchFromReplicationCache(classId, licenseKey, userRole);
    if (cacheResult) {
      return cacheResult;
    }

    // Fall back to Supabase
    return fetchFromSupabase(classId, licenseKey, userRole);
  }, [showContext, role, classId]);

  // Helper: Fetch from replication cache
  async function fetchFromReplicationCache(
    classId: string,
    licenseKey: string,
    userRole: UserRole
  ): Promise<EntryListData | null> {
    try {
      const manager = await ensureReplicationManager();
      const classesTable = manager.getTable<Class>('classes');
      const entriesTable = manager.getTable<ReplicatedEntry>('entries');

      if (!classesTable || !entriesTable) return null;

      const classData = await classesTable.get(classId);
      if (!classData) return null;

      const cachedEntries = await entriesTable.getAll();

      const relevantEntries = cachedEntries.filter((entry) => String(entry.class_id) === classId);

      let classEntries = relevantEntries
        .map((entry) => transformReplicatedEntry(entry, classData));

      if (classEntries.length === 0) {
        logger.log('📭 Cache is empty, falling back to Supabase');
        return null;
      }

      // Apply visibility and build class info using helpers
      classEntries = await applyVisibilityToEntries(classEntries, classData, licenseKey, userRole);
      const classInfo = buildSingleClassInfo(
        classData,
        classId,
        classEntries,
        classData.judge_name || 'No Judge Assigned'
      );

      return { entries: classEntries, classInfo };
    } catch (error) {
      logger.error('❌ Error loading from replicated cache, falling back to Supabase:', error);
      return null;
    }
  }

  // Helper: Fetch from Supabase (fallback)
  async function fetchFromSupabase(
    classId: string,
    licenseKey: string,
    userRole: UserRole
  ): Promise<EntryListData> {
    let classEntries = await getClassEntries(parseInt(classId), licenseKey);

    if (classEntries.length === 0) {
      return { entries: [], classInfo: null };
    }

    const firstEntry = classEntries[0];

    // Fetch class data for visibility
    const { data: classData } = await supabase
      .from('classes')
      .select('judge_name, self_checkin_enabled, class_status, trial_id, is_completed, results_released_at')
      .eq('id', parseInt(classId))
      .single();

    // Apply visibility flags
    if (classData) {
      const visibilityFlags = await fetchVisibilityFlagsWithFallback(
        parseInt(classId),
        classData.trial_id,
        licenseKey,
        userRole,
        classData.class_status === 'completed' || classData.is_completed === true,
        classData.results_released_at || null
      );
      classEntries = classEntries.map(entry => applyVisibilityFlags(entry, visibilityFlags));
    }

    // Build class info from first entry (Supabase doesn't return full Class type)
    const completedEntries = classEntries.filter(e => e.isScored).length;
    const sectionPart = firstEntry.section && firstEntry.section !== '-' ? ` ${firstEntry.section}` : '';

    const classInfo: ClassInfo = {
      className: `${firstEntry.element} ${firstEntry.level}${sectionPart}`,
      element: firstEntry.element || '',
      level: firstEntry.level || '',
      section: firstEntry.section || '',
      trialDate: firstEntry.trialDate || '',
      trialNumber: firstEntry.trialNumber ? String(firstEntry.trialNumber) : '',
      judgeName: classData?.judge_name || 'No Judge Assigned',
      actualClassId: parseInt(classId),
      selfCheckin: classData?.self_checkin_enabled ?? true,
      classStatus: classData?.class_status || 'pending',
      totalEntries: classEntries.length,
      completedEntries,
      timeLimit: firstEntry.timeLimit,
      timeLimit2: firstEntry.timeLimit2,
      timeLimit3: firstEntry.timeLimit3,
      areas: firstEntry.areas
    };

    return { entries: classEntries, classInfo };
  }

  // Fetch function for combined class view - refactored to use helper functions
  const fetchCombinedClasses = useCallback(async (): Promise<EntryListData> => {
    if (!classIdA || !classIdB || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    const licenseKey = showContext.licenseKey;
    const userRole: UserRole = (role as UserRole) || 'exhibitor';

    // Try replication cache first
    logger.log('🔄 Fetching combined entries from replicated cache...');
    const cacheResult = await fetchCombinedFromReplicationCache(classIdA, classIdB, licenseKey, userRole);
    if (cacheResult) {
      return cacheResult;
    }

    // Fall back to Supabase
    return fetchCombinedFromSupabase(classIdA, classIdB, licenseKey, userRole);
  }, [showContext, role, classIdA, classIdB]);

  // Helper: Fetch combined classes from replication cache
  async function fetchCombinedFromReplicationCache(
    classIdA: string,
    classIdB: string,
    licenseKey: string,
    userRole: UserRole
  ): Promise<EntryListData | null> {
    try {
      const manager = await ensureReplicationManager();
      const classesTable = manager.getTable<Class>('classes');
      const entriesTable = manager.getTable<ReplicatedEntry>('entries');

      if (!classesTable || !entriesTable) return null;

      const classDataA = await classesTable.get(classIdA);
      const classDataB = await classesTable.get(classIdB);

      if (!classDataA || !classDataB) return null;

      const cachedEntries = await entriesTable.getAll();
      let entriesA = cachedEntries
        .filter((entry) => String(entry.class_id) === classIdA)
        .map((entry) => transformReplicatedEntry(entry, classDataA));
      let entriesB = cachedEntries
        .filter((entry) => String(entry.class_id) === classIdB)
        .map((entry) => transformReplicatedEntry(entry, classDataB));

      if (entriesA.length === 0 && entriesB.length === 0) {
        logger.log('📭 Cache is empty, falling back to Supabase');
        return null;
      }

      // Apply visibility to each class's entries using helpers
      entriesA = await applyVisibilityToEntries(entriesA, classDataA, licenseKey, userRole);
      entriesB = await applyVisibilityToEntries(entriesB, classDataB, licenseKey, userRole);

      const combinedEntries = [...entriesA, ...entriesB];
      const classInfo = buildCombinedClassInfo(classDataA, classDataB, classIdA, classIdB, combinedEntries);

      return { entries: combinedEntries, classInfo };
    } catch (error) {
      logger.error('❌ Error loading from replicated cache, falling back to Supabase:', error);
      return null;
    }
  }

  // Helper: Fetch combined classes from Supabase (fallback)
  async function fetchCombinedFromSupabase(
    classIdA: string,
    classIdB: string,
    licenseKey: string,
    userRole: UserRole
  ): Promise<EntryListData> {
    const classIdsArray = [parseInt(classIdA), parseInt(classIdB)];
    let combinedEntries = await getClassEntries(classIdsArray, licenseKey);

    if (combinedEntries.length === 0) {
      return { entries: [], classInfo: null };
    }

    const firstEntry = combinedEntries[0];

    // Fetch class data for both classes
    const [{ data: classDataA }, { data: classDataB }] = await Promise.all([
      supabase.from('classes')
        .select('judge_name, self_checkin_enabled, class_status, trial_id, is_completed, results_released_at')
        .eq('id', parseInt(classIdA))
        .single(),
      supabase.from('classes')
        .select('judge_name, class_status, trial_id, is_completed, results_released_at')
        .eq('id', parseInt(classIdB))
        .single()
    ]);

    // Apply visibility flags to each class's entries
    if (classDataA && classDataB) {
      const entriesA = combinedEntries.filter(e => e.classId === parseInt(classIdA));
      const entriesB = combinedEntries.filter(e => e.classId === parseInt(classIdB));

      const [visibilityFlagsA, visibilityFlagsB] = await Promise.all([
        fetchVisibilityFlagsWithFallback(
          parseInt(classIdA),
          classDataA.trial_id,
          licenseKey,
          userRole,
          classDataA.class_status === 'completed' || classDataA.is_completed === true,
          classDataA.results_released_at || null
        ),
        fetchVisibilityFlagsWithFallback(
          parseInt(classIdB),
          classDataB.trial_id,
          licenseKey,
          userRole,
          classDataB.class_status === 'completed' || classDataB.is_completed === true,
          classDataB.results_released_at || null
        )
      ]);

      const processedA = entriesA.map(entry => applyVisibilityFlags(entry, visibilityFlagsA));
      const processedB = entriesB.map(entry => applyVisibilityFlags(entry, visibilityFlagsB));
      combinedEntries = [...processedA, ...processedB];
    }

    // Build class info from first entry
    const classInfo: ClassInfo = {
      className: `${firstEntry.element} ${firstEntry.level} A & B`,
      element: firstEntry.element || '',
      level: firstEntry.level || '',
      trialDate: firstEntry.trialDate || '',
      trialNumber: firstEntry.trialNumber ? String(firstEntry.trialNumber) : '',
      judgeName: classDataA?.judge_name || 'No Judge Assigned',
      judgeNameB: classDataB?.judge_name || 'No Judge Assigned',
      actualClassIdA: parseInt(classIdA),
      actualClassIdB: parseInt(classIdB),
      selfCheckin: classDataA?.self_checkin_enabled ?? true,
      classStatus: classDataA?.class_status || classDataB?.class_status || 'pending',
      timeLimit: firstEntry.timeLimit,
      timeLimit2: firstEntry.timeLimit2,
      timeLimit3: firstEntry.timeLimit3,
      areas: firstEntry.areas
    };

    return { entries: combinedEntries, classInfo };
  }

  // Use the appropriate fetch function
  const fetchFunction = isCombinedView ? fetchCombinedClasses : fetchSingleClass;

  // Direct state management (replication handles caching)
  const [data, setData] = useState<EntryListData>({ entries: [], classInfo: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // 🔧 FIX: Guard against re-entrant refresh calls that cause infinite loops
  const isRefreshingRef = useRef(false);

  // Fetch data function
  const refresh = useCallback(async () => {
    // 🔧 FIX: Prevent re-entrant calls that cause infinite loops
    if (isRefreshingRef.current) {
      return;
    }
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setFetchError(null);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (error) {
      setFetchError(error as Error);
      logger.error('Failed to fetch entry list data:', error);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [fetchFunction]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to replication changes
  // When entries/classes are updated via replication, refresh the view
  useEffect(() => {
    let unsubscribeEntries: (() => void) | undefined;
    let unsubscribeClasses: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        const manager = await ensureReplicationManager();

        const entriesTable = manager.getTable('entries');
        const classesTable = manager.getTable('classes');

        if (!entriesTable || !classesTable) return;

        // Subscribe to table changes
        unsubscribeEntries = entriesTable.subscribe(() => {
          // Skip refresh during drag operations to prevent snap-back
          if (isDraggingRef?.current) {
            return;
          }
          refresh();
        });

        unsubscribeClasses = classesTable.subscribe(() => {
          // Skip refresh during drag operations to prevent snap-back
          if (isDraggingRef?.current) {
return;
          }
refresh();
        });
      } catch (error) {
        logger.error('❌ Error setting up replication subscriptions:', error);
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeEntries) unsubscribeEntries();
      if (unsubscribeClasses) unsubscribeClasses();
    };
  }, [refresh]);

  // Handle visibility change for navigation back to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh]);

  // NOTE: data.entries is stable (from useState) - no need for additional memoization.
  // The duplicate record issue was fixed at the storage layer in ReplicatedTableBatch.ts
  // by normalizing all IDs to strings. See cleanupDuplicateRecords() in DatabaseManager.ts.

  return {
    entries: data.entries,
    classInfo: data.classInfo,
    isStale: false, // Replication handles staleness
    isRefreshing,
    fetchError,
    refresh,
    isCombinedView
  };
};
