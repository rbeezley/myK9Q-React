import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { debounce, globalPerformanceMonitor, globalMemoryTracker } from '../utils/performanceOptimizer';

export interface ClassInfo {
  id: number;
  class_name: string;
  element_type: string;
  judge_name: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  current_entry_id?: number;
  start_time?: string;
  end_time?: string;
  entry_total_count?: number;
  entry_completed_count?: number;
  entry_pending_count?: number;
  level?: string;
  trial_date?: string;
  trial_number?: string;
  class_order?: number;
}

export interface EntryInfo {
  id: number;
  armband: string;
  dog_name: string;
  breed: string;
  handler_name: string;
  handler_location: string;
  class_id: number;
  status: 'waiting' | 'in_ring' | 'completed';
  score?: number;
  placement?: number;
  search_time?: string;
  element?: string;
  level?: string;
  trial_date?: string;
  trial_number?: string;
  sort_order?: string;
  checkin_status?: number;
  section?: string; // Preserve section for placement calculations
}

export interface ShowInfo {
  showname: string;
  clubname: string;
  startdate: string;
  enddate: string;
  org: string;
  showtype: string;
  sitename: string | null;
  siteaddress: string | null;
  sitecity: string | null;
  sitestate: string | null;
}

export interface TVDataState {
  classes: ClassInfo[];
  entries: EntryInfo[];
  inProgressClasses: ClassInfo[];
  currentClass: ClassInfo | null;
  currentEntry: EntryInfo | null;
  nextEntries: EntryInfo[];
  showInfo: ShowInfo | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
  entriesByClass?: { [key: string]: EntryInfo[] }; // Grouped entries for section-aware processing
}

interface UseTVDataOptions {
  licenseKey: string;
  enablePolling?: boolean;
  pollingInterval?: number;
}

const isDebugMode = import.meta.env.VITE_TV_DEBUG === 'true';
const defaultPollingInterval = Number(import.meta.env.VITE_TV_POLLING_INTERVAL) || 60000;
const isRealtimeEnabled = import.meta.env.VITE_TV_REALTIME_ENABLED !== 'false';

export const useTVData = ({ 
  licenseKey, 
  enablePolling = true, 
  pollingInterval = defaultPollingInterval 
}: UseTVDataOptions) => {
  const [data, setData] = useState<TVDataState>({
    classes: [],
    entries: [],
    inProgressClasses: [],
    currentClass: null,
    currentEntry: null,
    nextEntries: [],
    showInfo: null,
    isConnected: false,
    lastUpdated: null,
    error: null,
    entriesByClass: {},
  });

  const [channels, setChannels] = useState<RealtimeChannel[]>([]);
  const isLoadingRef = useRef(false);
  const debouncedFetchRef = useRef<() => void>();

  // Data transformation utilities with section merging for Novice classes
  const transformClassData = useCallback((rawClasses: any[]): ClassInfo[] => {
    if (isDebugMode) console.log('📺 Transforming classes data with section merging:', rawClasses);

    // Group classes by key attributes, merging Novice A/B sections
    const classGroups = rawClasses.reduce((groups: { [key: string]: any[] }, cls) => {
      const level = cls.level || cls.class_level || 'Unknown';
      const element = cls.element || cls.element_type || cls.classtype || 'Unknown';
      const trialDate = cls.trial_date || '';
      const trialNumber = cls.trial_number || '';

      // For Novice level, ignore section in grouping key
      const isNovice = level.toLowerCase().includes('novice');
      const groupKey = isNovice
        ? `${trialDate}-${trialNumber}-${element}-${level}`
        : `${trialDate}-${trialNumber}-${element}-${level}-${cls.section || ''}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(cls);

      return groups;
    }, {});

    return Object.values(classGroups).map((groupClasses, index) => {
      // Merge data from all classes in the group (e.g., Novice A + B)
      const mergedCounts = groupClasses.reduce((totals, cls) => ({
        entry_total_count: totals.entry_total_count + (cls.entry_total_count || 0),
        entry_completed_count: totals.entry_completed_count + (cls.entry_completed_count || 0),
        entry_pending_count: totals.entry_pending_count + (cls.entry_pending_count || 0),
      }), { entry_total_count: 0, entry_completed_count: 0, entry_pending_count: 0 });

      const firstClass = groupClasses[0];
      const level = firstClass.level || firstClass.class_level || 'Unknown';
      const isNovice = level.toLowerCase().includes('novice');

      // Determine merged status based on combined counts and individual statuses
      const hasInProgress = groupClasses.some(cls =>
        (cls.class_status === 5 || cls.class_status === 'in_progress' || cls.in_progress === 1)
      );
      const allCompleted = groupClasses.every(cls =>
        cls.class_status === 6 || cls.class_status === 'completed' || cls.class_completed === true
      );
      const entriesCompleted = mergedCounts.entry_completed_count === mergedCounts.entry_total_count && mergedCounts.entry_total_count > 0;

      const status = (hasInProgress && mergedCounts.entry_pending_count > 0) ? 'in-progress' :
                    (allCompleted || entriesCompleted) ? 'completed' :
                    'scheduled';

      if (isDebugMode) {
        console.log(`📺 ${isNovice ? 'Merged Novice' : 'Regular'} Class "${firstClass.element}":`, {
          sectionsCount: groupClasses.length,
          sections: groupClasses.map(c => c.section).filter(Boolean),
          mergedCounts,
          calculated_status: status
        });
      }

      return {
        id: firstClass.id || index,
        class_name: `${firstClass.element || firstClass.class_name || firstClass.classname || 'Unknown Class'}${isNovice && groupClasses.length > 1 ? ' (Combined A & B)' : ''}`,
        element_type: firstClass.element || firstClass.element_type || firstClass.classtype || 'Unknown',
        judge_name: firstClass.judge_name || firstClass.judge || 'TBD',
        status,
        current_entry_id: firstClass.current_entry_id,
        start_time: firstClass.start_time,
        end_time: firstClass.end_time,
        entry_total_count: mergedCounts.entry_total_count,
        entry_completed_count: mergedCounts.entry_completed_count,
        entry_pending_count: mergedCounts.entry_pending_count,
        level,
        trial_date: firstClass.trial_date || '',
        trial_number: firstClass.trial_number || '',
        class_order: firstClass.class_order || 0,
      };
    });
  }, []);

  const transformEntryData = useCallback((rawEntries: any[]): EntryInfo[] => {
    if (isDebugMode) console.log('📺 Transforming entries data with section preservation:', rawEntries.slice(0, 3));
    return rawEntries.map(entry => ({
      id: entry.id,
      armband: String(entry.armband || entry.armband_number || 'N/A'),
      dog_name: entry.call_name || entry.dog_name || 'Unknown Dog',
      breed: entry.breed || 'Mixed Breed',
      handler_name: entry.handler || entry.handler_name || 'Unknown Handler',
      handler_location: entry.handler_location || entry.handler_city || '',
      class_id: entry.class_id || entry.classid_fk,
      status: entry.in_ring === true ? 'in_ring' : entry.is_scored === true ? 'completed' : 'waiting',
      score: entry.score,
      placement: entry.placement,
      search_time: entry.search_time,
      element: entry.element,
      level: entry.level,
      trial_date: entry.trial_date,
      trial_number: entry.trial_number,
      sort_order: entry.sort_order,
      checkin_status: entry.checkin_status,
      section: entry.section // Preserve section for placement calculations
    }));
  }, []);

  const transformViewEntryData = useCallback((viewEntries: any[]): EntryInfo[] => {
    if (isDebugMode) console.log('📺 Transforming view entries data sample:', viewEntries.slice(0, 3));
    return viewEntries.map((entry, _index) => ({
      id: entry.id || _index,
      armband: String(entry.armband || 'N/A'),
      dog_name: entry.call_name || 'Unknown Dog',
      breed: entry.breed || 'Mixed Breed',
      handler_name: entry.handler || 'Unknown Handler',
      handler_location: '', // View doesn't have location
      class_id: _index, // Use index as class_id for view data
      status: entry.in_ring === true ? 'in_ring' : entry.is_scored === true ? 'completed' : 'waiting',
      score: entry.score,
      placement: entry.placement,
      search_time: entry.search_time,
    }));
  }, []);

  // Helper function to create class matching key for entries
  const getClassMatchKey = useCallback((entry: EntryInfo) => {
    const level = entry.level || 'Unknown';
    const element = entry.element || 'Unknown';
    const trialDate = entry.trial_date || '';
    const trialNumber = entry.trial_number || '';

    // For Novice level, ignore section in matching key to group A & B together
    const isNovice = level.toLowerCase().includes('novice');
    return isNovice
      ? `${trialDate}-${trialNumber}-${element}-${level}`
      : `${trialDate}-${trialNumber}-${element}-${level}-${entry.section || ''}`;
  }, []);

  // Find current in-progress classes (can be multiple in a real dog show)
  const processData = useCallback((classes: ClassInfo[], entries: EntryInfo[]) => {
    if (isDebugMode) {
      console.log('📺 Processing data with section merging - All classes:', classes.map(cls => ({
        name: cls.class_name,
        status: cls.status,
        id: cls.id,
        level: cls.level
      })));
    }

    const inProgressClasses = classes
      .filter(cls => cls.status === 'in-progress')
      .sort((a, b) => {
        // First sort by trial_date
        if (a.trial_date !== b.trial_date) {
          return (a.trial_date || '').localeCompare(b.trial_date || '');
        }
        // Then sort by trial_number
        if (a.trial_number !== b.trial_number) {
          return (a.trial_number || '').localeCompare(b.trial_number || '');
        }
        // Finally sort by class_order
        return (a.class_order || 0) - (b.class_order || 0);
      });

    if (isDebugMode) {
      console.log('📺 In-progress classes found:', inProgressClasses.length,
        inProgressClasses.map(cls => ({
          name: cls.class_name,
          element: cls.element_type,
          level: cls.level,
          status: cls.status
        })));
    }

    // Group entries by their merged class keys for proper association
    const entriesByClass = entries.reduce((groups: { [key: string]: EntryInfo[] }, entry) => {
      const classKey = getClassMatchKey(entry);
      if (!groups[classKey]) {
        groups[classKey] = [];
      }
      groups[classKey].push(entry);
      return groups;
    }, {});

    if (isDebugMode) {
      console.log('📺 Entries grouped by class keys:', Object.keys(entriesByClass).length, 'groups');
      Object.entries(entriesByClass).forEach(([key, entryList]) => {
        const noviceEntries = entryList.filter(e => e.level?.toLowerCase().includes('novice'));
        if (noviceEntries.length > 0) {
          const sections = [...new Set(noviceEntries.map(e => e.section).filter(Boolean))];
          console.log(`📺 Novice class "${key}": ${entryList.length} entries, sections: [${sections.join(', ')}]`);
        }
      });
    }

    return {
      inProgressClasses, // Return all in-progress classes for rotation
      currentClass: inProgressClasses[0] || null, // Fallback for compatibility
      currentEntry: null, // Will be handled by rotation logic
      nextEntries: [], // Will be handled by rotation logic
      entriesByClass, // Expose grouped entries for components to use
    };
  }, [getClassMatchKey]);

  // Fetch initial data with performance monitoring
  const fetchData = useCallback(async () => {
    console.log('🚨 FETCHDATA CALLED at', new Date().toISOString());
    // Prevent overlapping requests
    if (isLoadingRef.current) {
      console.log('🔄 Skipping fetch - already loading');
      return;
    }

    try {
      isLoadingRef.current = true;
      setData(prev => ({ ...prev, error: null }));

      // Performance monitoring
      const startTime = performance.now();
      
      if (isDebugMode) console.log('📺 Fetching TV Dashboard data for license:', licenseKey);

      console.log('🔍 FORCE DEBUG: Starting fetchData for licenseKey:', licenseKey);
      
      // First, get the show by license key
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

      if (showError || !showData) {
        console.error('❌ Show query error:', showError);
        throw new Error(`No show found for license key: ${licenseKey}`);
      }

      // Get trials for this show
      const { data: trialsData, error: trialsError } = await supabase
        .from('trials')
        .select('*')
        .eq('show_id', showData.id)
        .order('trial_date', { ascending: true });

      if (trialsError) {
        console.error('❌ Trial query error:', trialsError);
        throw trialsError;
      }

      console.log('🔍 FORCE DEBUG: Trials found:', trialsData?.length || 0, trialsData);

      if (!trialsData || trialsData.length === 0) {
        throw new Error(`No trials found for license key: ${licenseKey}`);
      }

      // For now, get the first trial (you might want to add logic to find the "current" trial)
      const currentTrial = trialsData[0];
      if (isDebugMode) console.log('📺 Current trial:', currentTrial);

      // Map show data to expected interface format
      const showInfo: ShowInfo | null = showData ? {
        showname: showData.show_name,
        clubname: showData.club_name,
        startdate: showData.show_date,
        enddate: showData.show_date, // Using same date for end date
        org: showData.org || '',
        showtype: showData.competition_type || 'Regular',
        sitename: null,
        siteaddress: null,
        sitecity: null,
        sitestate: null
      } : null;
      if (isDebugMode) console.log('📺 Show info:', showInfo);

      // Use normalized view for data consistency
      console.log('🔍 DEBUG: Trying view_entry_class_join_normalized...');
      const { data: viewData, error: viewError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', licenseKey)
        .order('armband', { ascending: true });

      if (viewError) {
        console.error('❌ View query error:', viewError);
        console.log('🔍 DEBUG: View failed, using fallback to individual normalized tables...');

        // Get all trial IDs for this show
        const trialIds = trialsData?.map(trial => trial.id) || [];

        // Fallback to individual table queries with normalized structure
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .in('trial_id', trialIds)
          .order('class_order', { ascending: true });

        if (classesError) {
          console.error('❌ Class query error:', classesError);
          throw classesError;
        }

        console.log('🔍 DEBUG: Classes found (fallback):', classesData?.length || 0, 'First class:', classesData?.[0]);

        // Get all class IDs
        const classIds = classesData?.map(cls => cls.id) || [];

        // Fetch entries for all classes
        const { data: entriesData, error: entriesError } = await supabase
          .from('entries')
          .select('*')
          .in('class_id', classIds)
          .order('armband_number', { ascending: true });

        if (entriesError) {
          console.error('❌ Entry query error:', entriesError);
          throw entriesError;
        }

        console.log('🔍 FORCE DEBUG: Entries found (fallback):', entriesData?.length || 0, 'First entry:', entriesData?.[0]);

        const transformedClasses = transformClassData(classesData || []);
        const transformedEntries = transformEntryData(entriesData || []);
        const processedData = processData(transformedClasses, transformedEntries);

        setData(prev => {
          // Check if data actually changed before updating lastUpdated
          const dataChanged =
            JSON.stringify(prev.classes) !== JSON.stringify(transformedClasses) ||
            JSON.stringify(prev.entries) !== JSON.stringify(transformedEntries);

          if (isDebugMode && !dataChanged) {
            console.log('📺 Data fetch completed but no changes detected - keeping original timestamp');
          }

          return {
            ...prev,
            classes: transformedClasses,
            entries: transformedEntries,
            ...processedData,
            showInfo,
            // Only update lastUpdated if data actually changed
            lastUpdated: dataChanged ? new Date() : prev.lastUpdated,
            // Set connected on first successful fetch only if not already connected
            isConnected: prev.isConnected || true,
          };
        });
      } else {
        console.log('🔍 DEBUG: Normalized view data found:', viewData?.length || 0, 'First item:', viewData?.[0]);

        // Extract unique classes from normalized view data
        const uniqueClasses = viewData?.reduce((acc: any[], item: any) => {
          const classKey = `${item.element}-${item.level}-${item.section}`;
          const existing = acc.find(cls => cls.class_key === classKey);
          if (!existing) {
            acc.push({
              id: acc.length + 1,
              class_key: classKey,
              class_name: `${item.element} ${item.level} ${item.section}`.trim(),
              class_type: item.trial_type || 'Regular',
              element_type: item.element,
              element: item.element,
              level: item.level,
              section: item.section,
              judge_name: item.judge_name || 'TBD',
              status: item.is_completed ? 'completed' : (item.class_status === 5 ? 'in-progress' : 'scheduled'),
              trial_date: item.trial_date,
              trial_number: item.trial_number,
              class_order: item.class_order
            });
          }
          return acc;
        }, []) || [];

        const transformedClasses = transformClassData(uniqueClasses);
        const transformedEntries = transformViewEntryData(viewData || []);
        const processedData = processData(transformedClasses, transformedEntries);

        setData(prev => {
          // Check if data actually changed before updating lastUpdated
          const dataChanged =
            JSON.stringify(prev.classes) !== JSON.stringify(transformedClasses) ||
            JSON.stringify(prev.entries) !== JSON.stringify(transformedEntries);

          if (isDebugMode && !dataChanged) {
            console.log('📺 View data fetch completed but no changes detected - keeping original timestamp');
          }

          return {
            ...prev,
            classes: transformedClasses,
            entries: transformedEntries,
            ...processedData,
            showInfo,
            // Only update lastUpdated if data actually changed
            lastUpdated: dataChanged ? new Date() : prev.lastUpdated,
            // Set connected on first successful fetch only if not already connected
            isConnected: prev.isConnected || true,
          };
        });
      }

      if (isDebugMode) console.log('✅ TV Dashboard data loaded successfully');

      // Log performance
      const duration = performance.now() - startTime;
      globalPerformanceMonitor.measure('fetchTVData', () => duration);

      // Check memory pressure and optimize if needed - BUT DON'T TRUNCATE CRITICAL ENTRY DATA
      if (globalMemoryTracker.isMemoryPressure()) {
        console.warn('Memory pressure detected, but preserving entry data for TV dashboard accuracy');
        // Instead of truncating entries (which breaks waiting lists),
        // we could optimize other data structures if needed in the future
      }

    } catch (error) {
      console.error('❌ TV Dashboard data error:', error instanceof Error ? error.message : error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isConnected: false,
      }));
    } finally {
      // Always reset loading flag
      isLoadingRef.current = false;
      console.log('🔄 Fetch completed, loading flag reset');
    }
  }, [licenseKey, transformClassData, transformEntryData, processData]);

  // Debounced fetch for performance - using ref for stability
  // REDUCED DEBOUNCE for real-time testing
  useEffect(() => {
    debouncedFetchRef.current = debounce(fetchData, 100); // Reduced from 1000ms to 100ms
  }, [fetchData]);

  // Set up real-time subscriptions
  const setupSubscriptions = useCallback(() => {
    if (!isRealtimeEnabled) {
      console.log('📺 TV Dashboard: Realtime disabled, using polling only');
      return () => {};
    }

    // Clean up existing channels
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });

    const newChannels: RealtimeChannel[] = [];
    console.log('📺 TV Dashboard: Setting up realtime subscriptions...');

    // Subscribe to trial changes - we'll filter in the callback since we can't easily filter by show relationship
    const trialChannel = supabase
      .channel(`tv-trials-${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trials',
        },
        (payload) => {
          if (isDebugMode) console.log('📡 Trial queue change:', payload.eventType);
          debouncedFetchRef.current?.();
        }
      )
      .subscribe((status) => {
        if (isDebugMode) console.log('🔌 Trial channel status:', status);
      });

    newChannels.push(trialChannel);

    // Subscribe to class changes - we'll filter in the callback
    const classChannel = supabase
      .channel(`tv-classes-${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
        },
        (payload) => {
          console.log('📡 Class queue change detected:', payload.eventType, payload);
          if (isDebugMode) console.log('📡 Class payload details:', payload);
          debouncedFetchRef.current?.();
        }
      )
      .subscribe((status) => {
        if (isDebugMode) console.log('🔌 Class channel status:', status);
      });

    newChannels.push(classChannel);

    // Subscribe to entry changes - we'll filter in the callback
    console.log('🔧 SETTING UP ENTRY WEBSOCKET SUBSCRIPTION for license:', licenseKey);
    const entryChannel = supabase
      .channel(`tv-entries-${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
        },
        (payload) => {
          console.log('🚨 ENTRY QUEUE CHANGE DETECTED:', payload.eventType, payload);
          console.log('🚨 Entry payload NEW data:', payload.new);
          console.log('🚨 Entry payload OLD data:', payload.old);
          console.log('🚨 Triggering IMMEDIATE fetch...');
          if (payload.new && typeof payload.new === 'object' && 'in_ring' in payload.new) {
            console.log('🚨 DOG IN_RING STATUS CHANGE:', {
              armband: (payload.new as any).armband,
              dog_name: (payload.new as any).call_name,
              in_ring: (payload.new as any).in_ring,
              is_scored: (payload.new as any).is_scored
            });
          }

          // IMMEDIATE fetch for real-time testing
          console.log('🚨 Calling fetchData immediately...');
          fetchData();

          // Also call debounced version as backup
          debouncedFetchRef.current?.();
        }
      )
      .subscribe((status) => {
        console.log('🔌 ENTRY CHANNEL SUBSCRIPTION STATUS:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Entry channel successfully subscribed!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Entry channel subscription error!');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Entry channel subscription timed out!');
        } else if (status === 'CLOSED') {
          console.warn('🔒 Entry channel subscription closed!');
        }
      });

    newChannels.push(entryChannel);

    setChannels(newChannels);

    // Improved connection monitoring - connection vs data freshness
    const connectionStatus = () => {
      setData(prev => {
        // Consider connected if we've successfully fetched data at least once
        // Only show "Connecting..." if we've never gotten data or having actual connection issues
        const hasEverConnected = prev.lastUpdated !== null;
        const shouldBeConnected = hasEverConnected; // Stay "Live" once we've connected successfully

        if (isDebugMode && prev.isConnected !== shouldBeConnected) {
          console.log('🔗 Connection status update:', {
            hasEverConnected,
            lastUpdated: prev.lastUpdated,
            ageMinutes: prev.lastUpdated ? Math.floor((Date.now() - prev.lastUpdated.getTime()) / 60000) : 'never',
            newState: shouldBeConnected ? 'Live (monitoring)' : 'Connecting'
          });
        }

        return { ...prev, isConnected: shouldBeConnected };
      });
    };

    // Check connection status much less frequently
    const statusInterval = setInterval(connectionStatus, 30000); // Every 30 seconds

    return () => {
      clearInterval(statusInterval);
      newChannels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [licenseKey]); // Only depend on licenseKey to prevent subscription resets

  // Set up polling fallback - only when realtime fails
  useEffect(() => {
    if (!enablePolling) return;

    const pollingInterval_id = setInterval(() => {
      // Only poll if not connected via realtime and no recent data
      setData(prev => {
        const hasStaleData = !prev.lastUpdated || (Date.now() - prev.lastUpdated.getTime()) > 180000; // 3 minutes
        if (!prev.isConnected || hasStaleData) {
          fetchData();
        }
        return prev;
      });
    }, pollingInterval);

    return () => {
      clearInterval(pollingInterval_id);
    };
  }, [enablePolling, pollingInterval]); // Remove fetchData dependency

  // Initialize data and subscriptions on mount
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await fetchData();
        const cleanup = setupSubscriptions();
        
        return () => {
          mounted = false;
          cleanup?.();
        };
      }
    };
    
    const cleanup = init();
    
    return () => {
      mounted = false;
      cleanup?.then(fn => fn?.());
    };
  }, [licenseKey]); // Only depend on licenseKey to prevent loops

  return {
    ...data,
    refetch: fetchData,
    // Performance metrics
    getPerformanceMetrics: () => globalPerformanceMonitor.getAllMetrics(),
    getMemoryUsage: () => globalMemoryTracker.getCurrentUsage(),
  };
};