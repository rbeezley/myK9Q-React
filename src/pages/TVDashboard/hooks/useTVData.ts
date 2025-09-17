import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ClassInfo {
  id: number;
  class_name: string;
  element_type: string;
  judge_name: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  current_entry_id?: number;
  start_time?: string;
  end_time?: string;
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
  checkin_status?: number;
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
  });

  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  // Data transformation utilities
  const transformClassData = useCallback((rawClasses: any[]): ClassInfo[] => {
    if (isDebugMode) console.log('📺 Transforming classes data:', rawClasses);
    return rawClasses.map(cls => {
      const status = cls.class_status === 5 || cls.class_status === 'in_progress' || cls.in_progress === 1 ? 'in-progress' : 
                    cls.class_status === 6 || cls.class_status === 'completed' || cls.class_completed === true ? 'completed' : 
                    cls.entry_completed_count === cls.entry_total_count && cls.entry_total_count > 0 ? 'completed' :
                    'scheduled';
      
      if (isDebugMode) {
        console.log(`📺 Class "${cls.element || cls.class_name || cls.classname}":`, {
          class_status: cls.class_status,
          in_progress: cls.in_progress,
          class_completed: cls.class_completed,
          entry_completed_count: cls.entry_completed_count,
          entry_total_count: cls.entry_total_count,
          calculated_status: status
        });
      }
      
      return {
        id: cls.id,
        class_name: cls.element || cls.class_name || cls.classname || 'Unknown Class',
        element_type: cls.element || cls.element_type || cls.classtype || 'Unknown',
        judge_name: cls.judge_name || cls.judge || 'TBD',
        status,
        current_entry_id: cls.current_entry_id,
        start_time: cls.start_time,
        end_time: cls.end_time,
      };
    });
  }, []);

  const transformEntryData = useCallback((rawEntries: any[]): EntryInfo[] => {
    if (isDebugMode) console.log('📺 Transforming entries data sample:', rawEntries.slice(0, 3));
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
      element: entry.element, // Add element field
      checkin_status: entry.checkin_status, // Add checkin_status field
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

  // Find current in-progress classes (can be multiple in a real dog show)
  const processData = useCallback((classes: ClassInfo[], _entries: EntryInfo[]) => {
    if (isDebugMode) {
      console.log('📺 Processing data - All classes:', classes.map(cls => ({
        name: cls.class_name,
        status: cls.status,
        id: cls.id
      })));
    }
    
    const inProgressClasses = classes.filter(cls => cls.status === 'in-progress');
    
    if (isDebugMode) {
      console.log('📺 In-progress classes found:', inProgressClasses.length, 
        inProgressClasses.map(cls => ({
          name: cls.class_name,
          element: cls.element_type,
          status: cls.status
        })));
    }

    return {
      inProgressClasses, // Return all in-progress classes for rotation
      currentClass: inProgressClasses[0] || null, // Fallback for compatibility
      currentEntry: null, // Will be handled by rotation logic
      nextEntries: [], // Will be handled by rotation logic
    };
  }, []);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, error: null }));
      
      if (isDebugMode) console.log('📺 Fetching TV Dashboard data for license:', licenseKey);

      console.log('🔍 FORCE DEBUG: Starting fetchData for licenseKey:', licenseKey);
      
      // First, get trials for this license key
      const { data: trialsData, error: trialsError } = await supabase
        .from('tbl_trial_queue')
        .select('*')
        .eq('mobile_app_lic_key', licenseKey)
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

      // Fetch show information
      const { data: showData, error: showError } = await supabase
        .from('tbl_show_queue')
        .select('showname, clubname, startdate, enddate, org, showtype, sitename, siteaddress, sitecity, sitestate')
        .eq('mobile_app_lic_key', licenseKey)
        .order('id', { ascending: false })
        .limit(1);

      if (showError) {
        console.error('❌ Show query error:', showError);
        // Don't throw - show info is optional
      }

      const showInfo: ShowInfo | null = showData && showData.length > 0 ? showData[0] : null;
      if (isDebugMode) console.log('📺 Show info:', showInfo);

      // Use the Flutter view for better data consistency
      console.log('🔍 FORCE DEBUG: Trying view_entry_class_join_distinct...');
      const { data: viewData, error: viewError } = await supabase
        .from('view_entry_class_join_distinct')
        .select('*')
        .eq('mobile_app_lic_key', licenseKey)
        .order('armband', { ascending: true });

      // TEMPORARY: Force fallback to test direct table queries
      console.log('🔍 FORCE DEBUG: Forcing fallback to test table queries...');
      const forceViewError = true;
      
      if (viewError || forceViewError) {
        console.error('❌ View query error:', viewError);
        console.log('🔍 FORCE DEBUG: View failed, using fallback to individual tables...');
        // Fallback to individual table queries
        const { data: classesData, error: classesError } = await supabase
          .from('tbl_class_queue')
          .select('*')
          .eq('mobile_app_lic_key', licenseKey)
          .order('created_at', { ascending: true });

        if (classesError) {
          console.error('❌ Class query error:', classesError);
          throw classesError;
        }

        console.log('🔍 FORCE DEBUG: Classes found (fallback):', classesData?.length || 0, 'First class:', classesData?.[0]);

        // Fetch entries for all classes
        const { data: entriesData, error: entriesError } = await supabase
          .from('tbl_entry_queue')
          .select('*')
          .eq('mobile_app_lic_key', licenseKey)
          .order('armband', { ascending: true });

        if (entriesError) {
          console.error('❌ Entry query error:', entriesError);
          throw entriesError;
        }

        console.log('🔍 FORCE DEBUG: Entries found (fallback):', entriesData?.length || 0, 'First entry:', entriesData?.[0]);

        const transformedClasses = transformClassData(classesData || []);
        const transformedEntries = transformEntryData(entriesData || []);
        const processedData = processData(transformedClasses, transformedEntries);

        setData(prev => ({
          ...prev,
          classes: transformedClasses,
          entries: transformedEntries,
          ...processedData,
          showInfo,
          isConnected: true,
          lastUpdated: new Date(),
        }));
      } else {
        console.log('🔍 FORCE DEBUG: View data found:', viewData?.length || 0, 'First item:', viewData?.[0]);
        
        // Extract unique classes from view data
        const uniqueClasses = viewData?.reduce((acc: any[], item: any) => {
          const existing = acc.find(cls => cls.class_name === item.class_name);
          if (!existing) {
            acc.push({
              id: acc.length + 1,
              class_name: item.class_name,
              class_type: item.class_type,
              element_type: item.class_type,
              judge_name: 'TBD',
              status: 'scheduled'
            });
          }
          return acc;
        }, []) || [];

        const transformedClasses = transformClassData(uniqueClasses);
        const transformedEntries = transformViewEntryData(viewData || []);
        const processedData = processData(transformedClasses, transformedEntries);

        setData(prev => ({
          ...prev,
          classes: transformedClasses,
          entries: transformedEntries,
          ...processedData,
          showInfo,
          isConnected: true,
          lastUpdated: new Date(),
        }));
      }

      if (isDebugMode) console.log('✅ TV Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ TV Dashboard data error:', error instanceof Error ? error.message : error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isConnected: false,
      }));
    }
  }, [licenseKey, transformClassData, transformEntryData, processData]);

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

    // Subscribe to trial queue changes (in case trial data changes)
    const trialChannel = supabase
      .channel(`tv-trials-${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_trial_queue',
          filter: `mobile_app_lic_key=eq.${licenseKey}`,
        },
        (payload) => {
          if (isDebugMode) console.log('📡 Trial queue change:', payload.eventType);
          fetchData();
        }
      )
      .subscribe((status) => {
        if (isDebugMode) console.log('🔌 Trial channel status:', status);
      });

    newChannels.push(trialChannel);

    // Subscribe to class queue changes (for all trials with this license key)
    const classChannel = supabase
      .channel(`tv-classes-${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_class_queue',
        },
        (payload) => {
          if (isDebugMode) console.log('📡 Class queue change:', payload.eventType);
          fetchData();
        }
      )
      .subscribe((status) => {
        if (isDebugMode) console.log('🔌 Class channel status:', status);
      });

    newChannels.push(classChannel);

    // Subscribe to entry queue changes
    const entryChannel = supabase
      .channel(`tv-entries-${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_entry_queue',
        },
        (payload) => {
          if (isDebugMode) console.log('📡 Entry queue change:', payload.eventType);
          fetchData();
        }
      )
      .subscribe((status) => {
        if (isDebugMode) console.log('🔌 Entry channel status:', status);
      });

    newChannels.push(entryChannel);

    setChannels(newChannels);

    // Monitor connection status with debouncing
    let statusTimeout: NodeJS.Timeout;
    const connectionStatus = () => {
      clearTimeout(statusTimeout);
      statusTimeout = setTimeout(() => {
        const isConnected = newChannels.every(channel => 
          channel.state === 'joined'
        );
        
        setData(prev => {
          if (prev.isConnected !== isConnected) {
            if (isDebugMode) console.log('🔗 Connection status changed:', isConnected ? 'Connected' : 'Disconnected');
            return { ...prev, isConnected };
          }
          return prev;
        });
      }, 1000);
    };

    // Check connection status less frequently to reduce spam
    const statusInterval = setInterval(connectionStatus, 10000);

    return () => {
      clearTimeout(statusTimeout);
      clearInterval(statusInterval);
      newChannels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [licenseKey, fetchData]);

  // Set up polling fallback - only when realtime fails
  useEffect(() => {
    if (!enablePolling) return;

    const pollingInterval_id = setInterval(() => {
      // Only poll if not connected via realtime
      setData(prev => {
        if (!prev.isConnected) {
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
  };
};