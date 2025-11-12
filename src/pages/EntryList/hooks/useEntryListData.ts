import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getClassEntries } from '../../../services/entryService';
import { Entry } from '../../../stores/entryStore';
import { supabase } from '../../../lib/supabase';
import { ensureReplicationManager } from '@/utils/replicationHelper';
import type { Class } from '@/services/replication/tables/ReplicatedClassesTable';
import type { Entry as ReplicatedEntry } from '@/services/replication/tables/ReplicatedEntriesTable';
import { logger } from '@/utils/logger';

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
    // Deprecated fields for backward compatibility
    inRing: entry.is_in_ring || false,
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
  };
}

/**
 * Shared hook for fetching and caching entry list data using stale-while-revalidate pattern.
 * Supports both single class and combined class views.
 */
export const useEntryListData = ({ classId, classIdA, classIdB }: UseEntryListDataOptions) => {
  const { showContext } = useAuth();

  const isCombinedView = !!(classIdA && classIdB);

  // Fetch function for single class view
  const fetchSingleClass = useCallback(async (): Promise<EntryListData> => {
    if (!classId || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    // Always use replication (no feature flags - development only, no existing users)
    const isReplicationEnabled = true;

    if (isReplicationEnabled) {
      console.log('🔄 [REPLICATION] Fetching entries from replicated cache...');
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
              const classEntries = cachedEntries
                .filter((entry) => String(entry.class_id) === classId)
                .map((entry) => transformReplicatedEntry(entry, classData));

              console.log(`✅ [REPLICATION] Loaded ${classEntries.length} entries from cache (class_id: ${classId})`);

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
    const classEntries = await getClassEntries(parseInt(classId), showContext.licenseKey);

    // Get class info from first entry and fetch additional class data
    let classInfoData: ClassInfo | null = null;
    if (classEntries.length > 0) {
      const firstEntry = classEntries[0];

      // Fetch additional class data
      const { data: classData } = await supabase
        .from('classes')
        .select('judge_name, self_checkin_enabled, class_status')
        .eq('id', parseInt(classId))
        .single();

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
  }, [showContext, classId]);

  // Fetch function for combined class view
  const fetchCombinedClasses = useCallback(async (): Promise<EntryListData> => {
    if (!classIdA || !classIdB || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

    // Always use replication (no feature flags - development only, no existing users)
    const isReplicationEnabled = true;

    if (isReplicationEnabled) {
      console.log('🔄 [REPLICATION] Fetching combined entries from replicated cache...');
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
              const entriesA = cachedEntries
                .filter((entry) => String(entry.class_id) === classIdA)
                .map((entry) => transformReplicatedEntry(entry, classDataA));
              const entriesB = cachedEntries
                .filter((entry) => String(entry.class_id) === classIdB)
                .map((entry) => transformReplicatedEntry(entry, classDataB));

              const combinedEntries = [...entriesA, ...entriesB];

              console.log(`✅ [REPLICATION] Loaded ${combinedEntries.length} combined entries from cache (A: ${entriesA.length}, B: ${entriesB.length})`);

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
    const combinedEntries = await getClassEntries(classIdsArray, showContext.licenseKey);

    // Get class info from both classes
    let classInfoData: ClassInfo | null = null;
    if (combinedEntries.length > 0) {
      const firstEntry = combinedEntries[0];

      // Fetch class data for both classes
      const { data: classDataA } = await supabase
        .from('classes')
        .select('judge_name, self_checkin_enabled, class_status')
        .eq('id', parseInt(classIdA))
        .single();

      const { data: classDataB } = await supabase
        .from('classes')
        .select('judge_name, class_status')
        .eq('id', parseInt(classIdB))
        .single();

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
  }, [showContext, classIdA, classIdB]);

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
          console.log('🔄 [REPLICATION] Entries changed, refreshing view');
          refresh();
        });

        unsubscribeClasses = classesTable.subscribe(() => {
          console.log('🔄 [REPLICATION] Classes changed, refreshing view');
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
        console.log('📱 Page became visible, refreshing');
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
