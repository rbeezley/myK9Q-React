import { useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStaleWhileRevalidate } from '../../../hooks/useStaleWhileRevalidate';
import { getClassEntries } from '../../../services/entryService';
import { Entry } from '../../../stores/entryStore';
import { supabase } from '../../../lib/supabase';
import { localStateManager } from '../../../services/localStateManager';

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
 * Shared hook for fetching and caching entry list data using stale-while-revalidate pattern.
 * Supports both single class and combined class views.
 */
export const useEntryListData = ({ classId, classIdA, classIdB }: UseEntryListDataOptions) => {
  const { showContext } = useAuth();

  const isCombinedView = !!(classIdA && classIdB);

  // Generate cache key based on view type
  const cacheKey = isCombinedView
    ? `combined-entries-${classIdA}-${classIdB}`
    : `entries-class-${classId}`;

  // Fetch function for single class view
  const fetchSingleClass = useCallback(async (): Promise<EntryListData> => {
    if (!classId || !showContext?.licenseKey) {
      return { entries: [], classInfo: null };
    }

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

  // Use stale-while-revalidate for instant loading from cache
  const {
    data: cachedData,
    isStale,
    isRefreshing,
    error: fetchError,
    refresh
  } = useStaleWhileRevalidate<EntryListData>(
    cacheKey,
    fetchFunction,
    {
      ttl: 60000, // 1 minute cache
      fetchOnMount: true,
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  // Subscribe to LocalStateManager changes
  // When scoring updates local state, this triggers a refresh to show the new data
  // We use refresh(true) to bypass cache because getClassEntries() needs to be called
  // to merge the new pending changes - they're not in the SWR cache
  useEffect(() => {
    const unsubscribe = localStateManager.subscribe(() => {
      console.log('🔄 LocalStateManager changed, bypassing cache to merge pending changes');
      refresh(true); // Force bypass cache to call getClassEntries() which merges pending changes
    });

    return () => unsubscribe();
  }, [refresh]);

  // Handle visibility change for navigation back to page
  // This ensures EntryList refreshes when you navigate back from scoresheet
  // We DON'T force refresh here - just trigger normal refresh which will use cache if valid
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Page became visible, refreshing (will use cache if recent)');
        refresh(); // Normal refresh - uses cache if < 1 minute old
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh]);

  return {
    entries: cachedData?.entries || [],
    classInfo: cachedData?.classInfo || null,
    isStale,
    isRefreshing,
    fetchError,
    refresh,
    isCombinedView
  };
};
