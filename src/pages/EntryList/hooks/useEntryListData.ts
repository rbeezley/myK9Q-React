import { useState, useEffect, useCallback, MutableRefObject } from 'react';
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
 * Transform replicated entry to Entry format
 */
function transformReplicatedEntry(entry: ReplicatedEntry, classData?: Class): Entry {
  // Map entry_status to the status field
  const status = entry.entry_status || 'pending';

  return {
    id: parseInt(entry.id, 10),
    armband: entry.armband_number,
    callName: entry.dog_call_name,
    breed: entry.dog_breed || '',
    handler: entry.handler_name,
    isScored: entry.is_scored || false,
    status: status as any, // New unified status field
    // Derive inRing from entry_status (not the deprecated is_in_ring field)
    inRing: entry.entry_status === 'in-ring',
    classId: parseInt(entry.class_id, 10),
    className: classData?.element && classData?.level
      ? `${classData.element} ${classData.level}${classData.section && classData.section !== '-' ? ` ${classData.section}` : ''}`.trim()
      : '',
    element: classData?.element || '',
    level: classData?.level || '',
    section: classData?.section || '',
    timeLimit: classData?.time_limit_seconds ? `${classData.time_limit_seconds}s` : undefined,
    timeLimit2: classData?.time_limit_area2_seconds ? `${classData.time_limit_area2_seconds}s` : undefined,
    timeLimit3: classData?.time_limit_area3_seconds ? `${classData.time_limit_area3_seconds}s` : undefined,
    // Map result fields from replicated format to UI format
    resultText: entry.result_status,
    placement: entry.final_placement,
    searchTime: entry.search_time_seconds?.toString(),
    faultCount: entry.total_faults,
    // Run order for custom sorting
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

  // Fetch function for single class view
  const fetchSingleClass = useCallback(async (): Promise<EntryListData> => {
    if (!classId || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    // Always use replication (no feature flags - development only, no existing users)
    const isReplicationEnabled = true;

    if (isReplicationEnabled) {
logger.log('🔄 Fetching entries from replicated cache...');

      try {
        const manager = await ensureReplicationManager();
        const classesTable = manager.getTable<Class>('classes');
        const entriesTable = manager.getTable<ReplicatedEntry>('entries');

        if (classesTable && entriesTable) {
          try {
            // Get class data from cache
            const classData = await classesTable.get(classId);

            if (classData) {
              // Get entries for this class from cache
              const cachedEntries = await entriesTable.getAll();
              let classEntries = cachedEntries
                .filter((entry) => String(entry.class_id) === classId)
                .map((entry) => transformReplicatedEntry(entry, classData));

// If cache is empty, fall back to Supabase (cache may still be syncing)
              if (classEntries.length === 0) {
logger.log('📭 Cache is empty, falling back to Supabase');
                // Fall through to Supabase query below
              } else {
                // Fetch visibility settings and apply to entries
                try {
                  const isClassComplete = classData.class_status === 'completed' || classData.is_completed === true;
                  const visibilityFlags = await getVisibleResultFields(
                    parseInt(classId),
                    classData.trial_id,
                    showContext.licenseKey,
                    role || 'exhibitor',
                    isClassComplete,
                    classData.results_released_at || null
                  );

                  // Apply visibility flags to all entries
                  classEntries = classEntries.map(entry => applyVisibilityFlags(entry, visibilityFlags));
                } catch (visError) {
                  logger.error('❌ Error fetching visibility settings, defaulting to show all:', visError);
                  // On error, default to showing everything (fail open for better UX)
                  const defaultFlags: VisibleResultFields = {
                    showPlacement: true,
                    showQualification: true,
                    showTime: true,
                    showFaults: true
                  };
                  classEntries = classEntries.map(entry => applyVisibilityFlags(entry, defaultFlags));
                }
                // Build class info
                const completedEntries = classEntries.filter((e) => e.isScored).length;
                const sectionPart = classData.section && classData.section !== '-' ? ` ${classData.section}` : '';

                const classInfoData: ClassInfo = {
                  className: `${classData.element} ${classData.level}${sectionPart}`.trim(),
                  element: classData.element || '',
                  level: classData.level || '',
                  section: classData.section || '',
                  trialDate: classEntries[0]?.trialDate || '',
                  trialNumber: classEntries[0]?.trialNumber ? String(classEntries[0].trialNumber) : '',
                  judgeName: classData.judge_name || 'No Judge Assigned',
                  actualClassId: parseInt(classId),
                  selfCheckin: classData.self_checkin_enabled ?? true,
                  classStatus: classData.class_status || 'pending',
                  totalEntries: classEntries.length,
                  completedEntries,
                  timeLimit: classData.time_limit_seconds ? `${classData.time_limit_seconds}s` : undefined,
                  timeLimit2: classData.time_limit_area2_seconds ? `${classData.time_limit_area2_seconds}s` : undefined,
                  timeLimit3: classData.time_limit_area3_seconds ? `${classData.time_limit_area3_seconds}s` : undefined,
                  areas: classData.area_count
                };

                return { entries: classEntries, classInfo: classInfoData };
              }
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

    // Fall back to original Supabase implementation
    let classEntries = await getClassEntries(parseInt(classId), showContext.licenseKey);

    // Get class info from first entry and fetch additional class data
    let classInfoData: ClassInfo | null = null;
    if (classEntries.length > 0) {
      const firstEntry = classEntries[0];

      // Fetch additional class data including fields needed for visibility
      const { data: classData } = await supabase
        .from('classes')
        .select('judge_name, self_checkin_enabled, class_status, trial_id, is_completed, results_released_at')
        .eq('id', parseInt(classId))
        .single();

      // Apply visibility flags to entries
      if (classData) {
        try {
          const isClassComplete = classData.class_status === 'completed' || classData.is_completed === true;
          const visibilityFlags = await getVisibleResultFields(
            parseInt(classId),
            classData.trial_id,
            showContext.licenseKey,
            role || 'exhibitor',
            isClassComplete,
            classData.results_released_at || null
          );

          classEntries = classEntries.map(entry => applyVisibilityFlags(entry, visibilityFlags));
} catch (visError) {
          logger.error('❌ Error fetching visibility settings, defaulting to show all:', visError);
          const defaultFlags: VisibleResultFields = {
            showPlacement: true,
            showQualification: true,
            showTime: true,
            showFaults: true
          };
          classEntries = classEntries.map(entry => applyVisibilityFlags(entry, defaultFlags));
        }
      }

      const completedEntries = classEntries.filter(
        (e) => e.isScored
      ).length;

      classInfoData = {
        className: `${firstEntry.element} ${firstEntry.level}${firstEntry.section && firstEntry.section !== '-' ? ` ${firstEntry.section}` : ''}`,
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
    }

    return { entries: classEntries, classInfo: classInfoData };
  }, [showContext, role, classId]);

  // Fetch function for combined class view
  const fetchCombinedClasses = useCallback(async (): Promise<EntryListData> => {
    if (!classIdA || !classIdB || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    // Always use replication (no feature flags - development only, no existing users)
    const isReplicationEnabled = true;

    if (isReplicationEnabled) {
logger.log('🔄 Fetching combined entries from replicated cache...');

      try {
        const manager = await ensureReplicationManager();
        const classesTable = manager.getTable<Class>('classes');
        const entriesTable = manager.getTable<ReplicatedEntry>('entries');

        if (classesTable && entriesTable) {
          try {
            // Get class data for both sections from cache
            const classDataA = await classesTable.get(classIdA);
            const classDataB = await classesTable.get(classIdB);

            if (classDataA && classDataB) {
              // Get entries for both classes from cache
              const cachedEntries = await entriesTable.getAll();
              let entriesA = cachedEntries
                .filter((entry) => String(entry.class_id) === classIdA)
                .map((entry) => transformReplicatedEntry(entry, classDataA));
              let entriesB = cachedEntries
                .filter((entry) => String(entry.class_id) === classIdB)
                .map((entry) => transformReplicatedEntry(entry, classDataB));

// If cache is empty, fall back to Supabase (cache may still be syncing)
              if (entriesA.length === 0 && entriesB.length === 0) {
logger.log('📭 Cache is empty, falling back to Supabase');
                // Fall through to Supabase query below
              } else {
                // Apply visibility flags to entries from both classes
                try {
                  const isClassAComplete = classDataA.class_status === 'completed' || classDataA.is_completed === true;
                  const visibilityFlagsA = await getVisibleResultFields(
                    parseInt(classIdA),
                    classDataA.trial_id,
                    showContext.licenseKey,
                    role || 'exhibitor',
                    isClassAComplete,
                    classDataA.results_released_at || null
                  );
                  entriesA = entriesA.map(entry => applyVisibilityFlags(entry, visibilityFlagsA));

                  const isClassBComplete = classDataB.class_status === 'completed' || classDataB.is_completed === true;
                  const visibilityFlagsB = await getVisibleResultFields(
                    parseInt(classIdB),
                    classDataB.trial_id,
                    showContext.licenseKey,
                    role || 'exhibitor',
                    isClassBComplete,
                    classDataB.results_released_at || null
                  );
                  entriesB = entriesB.map(entry => applyVisibilityFlags(entry, visibilityFlagsB));

} catch (visError) {
                  logger.error('❌ Error fetching visibility settings, defaulting to show all:', visError);
                  const defaultFlags: VisibleResultFields = {
                    showPlacement: true,
                    showQualification: true,
                    showTime: true,
                    showFaults: true
                  };
                  entriesA = entriesA.map(entry => applyVisibilityFlags(entry, defaultFlags));
                  entriesB = entriesB.map(entry => applyVisibilityFlags(entry, defaultFlags));
                }

                const combinedEntries = [...entriesA, ...entriesB];
                // Build class info
                const judgeNameA = classDataA.judge_name || 'No Judge Assigned';
                const judgeNameB = classDataB.judge_name || 'No Judge Assigned';

                const classInfoData: ClassInfo = {
                  className: `${classDataA.element} ${classDataA.level} A & B`,
                  element: classDataA.element || '',
                  level: classDataA.level || '',
                  trialDate: combinedEntries[0]?.trialDate || '',
                  trialNumber: combinedEntries[0]?.trialNumber ? String(combinedEntries[0].trialNumber) : '',
                  judgeName: judgeNameA,
                  judgeNameB: judgeNameB,
                  actualClassIdA: parseInt(classIdA),
                  actualClassIdB: parseInt(classIdB),
                  selfCheckin: classDataA.self_checkin_enabled ?? true,
                  classStatus: classDataA.class_status || classDataB.class_status || 'pending',
                  timeLimit: classDataA.time_limit_seconds ? `${classDataA.time_limit_seconds}s` : undefined,
                  timeLimit2: classDataA.time_limit_area2_seconds ? `${classDataA.time_limit_area2_seconds}s` : undefined,
                  timeLimit3: classDataA.time_limit_area3_seconds ? `${classDataA.time_limit_area3_seconds}s` : undefined,
                  areas: classDataA.area_count
                };

                return { entries: combinedEntries, classInfo: classInfoData };
              }
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

    // Fall back to original Supabase implementation
    // Load entries from both classes
    const classIdsArray = [parseInt(classIdA), parseInt(classIdB)];
    let combinedEntries = await getClassEntries(classIdsArray, showContext.licenseKey);

    // Get class info from both classes
    let classInfoData: ClassInfo | null = null;
    if (combinedEntries.length > 0) {
      const firstEntry = combinedEntries[0];

      // Fetch class data for both classes including visibility fields
      const { data: classDataA } = await supabase
        .from('classes')
        .select('judge_name, self_checkin_enabled, class_status, trial_id, is_completed, results_released_at')
        .eq('id', parseInt(classIdA))
        .single();

      const { data: classDataB } = await supabase
        .from('classes')
        .select('judge_name, class_status, trial_id, is_completed, results_released_at')
        .eq('id', parseInt(classIdB))
        .single();

      // Apply visibility flags to entries from both classes
      if (classDataA && classDataB) {
        try {
          // Split entries by class, apply visibility, then recombine
          const entriesA = combinedEntries.filter(e => e.actualClassId === parseInt(classIdA));
          const entriesB = combinedEntries.filter(e => e.actualClassId === parseInt(classIdB));

          const isClassAComplete = classDataA.class_status === 'completed' || classDataA.is_completed === true;
          const visibilityFlagsA = await getVisibleResultFields(
            parseInt(classIdA),
            classDataA.trial_id,
            showContext.licenseKey,
            role || 'exhibitor',
            isClassAComplete,
            classDataA.results_released_at || null
          );

          const isClassBComplete = classDataB.class_status === 'completed' || classDataB.is_completed === true;
          const visibilityFlagsB = await getVisibleResultFields(
            parseInt(classIdB),
            classDataB.trial_id,
            showContext.licenseKey,
            role || 'exhibitor',
            isClassBComplete,
            classDataB.results_released_at || null
          );

          const processedEntriesA = entriesA.map(entry => applyVisibilityFlags(entry, visibilityFlagsA));
          const processedEntriesB = entriesB.map(entry => applyVisibilityFlags(entry, visibilityFlagsB));

          combinedEntries = [...processedEntriesA, ...processedEntriesB];
} catch (visError) {
          logger.error('❌ Error fetching visibility settings, defaulting to show all:', visError);
          const defaultFlags: VisibleResultFields = {
            showPlacement: true,
            showQualification: true,
            showTime: true,
            showFaults: true
          };
          combinedEntries = combinedEntries.map(entry => applyVisibilityFlags(entry, defaultFlags));
        }
      }

      const judgeNameA = classDataA?.judge_name || 'No Judge Assigned';
      const judgeNameB = classDataB?.judge_name || 'No Judge Assigned';

      classInfoData = {
        className: `${firstEntry.element} ${firstEntry.level} A & B`,
        element: firstEntry.element || '',
        level: firstEntry.level || '',
        trialDate: firstEntry.trialDate || '',
        trialNumber: firstEntry.trialNumber ? String(firstEntry.trialNumber) : '',
        judgeName: judgeNameA,
        judgeNameB: judgeNameB,
        actualClassIdA: parseInt(classIdA),
        actualClassIdB: parseInt(classIdB),
        selfCheckin: classDataA?.self_checkin_enabled ?? true,
        classStatus: classDataA?.class_status || classDataB?.class_status || 'pending',  // Use Section A status, fallback to B, then default
        timeLimit: firstEntry.timeLimit,
        timeLimit2: firstEntry.timeLimit2,
        timeLimit3: firstEntry.timeLimit3,
        areas: firstEntry.areas
      };
    }

    return { entries: combinedEntries, classInfo: classInfoData };
  }, [showContext, role, classIdA, classIdB]);

  // Use the appropriate fetch function
  const fetchFunction = isCombinedView ? fetchCombinedClasses : fetchSingleClass;

  // Direct state management (replication handles caching)
  const [data, setData] = useState<EntryListData>({ entries: [], classInfo: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Fetch data function
  const refresh = useCallback(async () => {
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
