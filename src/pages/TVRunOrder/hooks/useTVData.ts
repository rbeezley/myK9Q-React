import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ClassInfo {
  id: string;
  trial_date: string;
  trial_number: number;
  element_type: string;
  level?: string;
  class_name?: string;
  judge_name?: string;
  entry_total_count?: number;
  entry_completed_count?: number;
  class_status?: string;
  start_time?: string | null;
}

export interface EntryInfo {
  id: string;
  armband: string;
  dog_name: string;
  breed?: string;
  handler_name: string;
  status: 'pending' | 'in_ring' | 'completed';
  result_status?: string;
  section?: string;
  sort_order?: string;
  checkin_status?: number;
}

interface UseTVDataOptions {
  licenseKey: string;
  enablePolling?: boolean;
  pollingInterval?: number;
}

interface UseTVDataReturn {
  inProgressClasses: ClassInfo[];
  entriesByClass: Record<string, EntryInfo[]>;
  isConnected: boolean;
  error: string | null;
}

export const useTVData = ({
  licenseKey,
  enablePolling = true,
  pollingInterval = 30000
}: UseTVDataOptions): UseTVDataReturn => {
  const [inProgressClasses, setInProgressClasses] = useState<ClassInfo[]>([]);
  const [entriesByClass, setEntriesByClass] = useState<Record<string, EntryInfo[]>>({});
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!licenseKey) {
      setError('No license key provided');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch classes with multiple statuses (in-progress and upcoming)
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select(`
            id,
            element,
            level,
            section,
            judge_name,
            total_entry_count,
            completed_entry_count,
            class_status,
            trials!inner (
              trial_date,
              trial_number,
              planned_start_time,
              shows!inner (
                license_key
              )
            )
          `)
          .eq('trials.shows.license_key', licenseKey)
          .in('class_status', ['in_progress', 'briefing', 'start_time', 'setup'])
          .order('trials(trial_date)')
          .order('trials(trial_number)');

        if (classError) throw classError;

        // Priority mapping for sorting
        const priorityMap: Record<string, number> = {
          'in_progress': 1,
          'briefing': 2,
          'start_time': 3,
          'setup': 4
        };

        // Transform and sort classes by priority, then by start time
        const transformedClasses: ClassInfo[] = (classes || [])
          .map((cls: any) => ({
            id: cls.id.toString(),
            trial_date: cls.trials.trial_date,
            trial_number: cls.trials.trial_number,
            element_type: cls.element,
            level: cls.level,
            class_name: `${cls.element} ${cls.level || ''}`.trim(),
            judge_name: cls.judge_name,
            entry_total_count: cls.total_entry_count,
            entry_completed_count: cls.completed_entry_count,
            class_status: cls.class_status,
            start_time: cls.trials.planned_start_time
          }))
          .sort((a, b) => {
            // First, sort by priority
            const priorityA = priorityMap[a.class_status || 'setup'] || 99;
            const priorityB = priorityMap[b.class_status || 'setup'] || 99;

            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }

            // Within same priority, sort by start time (if available)
            if (a.start_time && b.start_time) {
              return a.start_time.localeCompare(b.start_time);
            }

            // Fall back to element name
            return (a.element_type || '').localeCompare(b.element_type || '');
          });

        setInProgressClasses(transformedClasses);

        // Fetch entries for all in-progress classes
        if (transformedClasses.length > 0) {
          const { data: entries, error: entryError } = await supabase
            .from('view_entry_class_join_normalized')
            .select(`
              id,
              armband,
              call_name,
              breed,
              handler,
              is_scored,
              is_in_ring,
              result_status,
              section,
              exhibitor_order,
              trial_date,
              trial_number,
              element,
              level,
              entry_status
            `)
            .eq('license_key', licenseKey)
            .in('class_id', transformedClasses.map(c => parseInt(c.id)))
            .order('exhibitor_order');

          if (entryError) throw entryError;

          // Helper to map check-in status text to numeric codes
          const mapCheckinStatus = (statusText: string | null): number => {
            if (!statusText) return 0;
            const statusMap: Record<string, number> = {
              'none': 0,
              'checked-in': 1,
              'conflict': 2,
              'pulled': 3,
              'at-gate': 4
            };
            return statusMap[statusText.toLowerCase()] ?? 0;
          };

          // Group entries by class
          const grouped: Record<string, EntryInfo[]> = {};
          (entries || []).forEach((entry: any) => {
            const key = `${entry.trial_date}-${entry.trial_number}-${entry.element}-${entry.level}`;
            if (!grouped[key]) {
              grouped[key] = [];
            }
            grouped[key].push({
              id: entry.id.toString(),
              armband: entry.armband.toString(),
              dog_name: entry.call_name,
              breed: entry.breed || undefined,
              handler_name: entry.handler,
              status: entry.is_in_ring ? 'in_ring' :
                      entry.is_scored ? 'completed' : 'pending',
              result_status: entry.result_status || undefined,
              section: entry.section || undefined,
              sort_order: entry.exhibitor_order?.toString() || entry.armband.toString(),
              checkin_status: mapCheckinStatus(entry.entry_status)
            });
          });

          setEntriesByClass(grouped);
        } else {
          setEntriesByClass({});
        }

        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching TV data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling if enabled
    let interval: NodeJS.Timeout | undefined;
    if (enablePolling) {
      interval = setInterval(fetchData, pollingInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [licenseKey, enablePolling, pollingInterval]);

  return {
    inProgressClasses,
    entriesByClass,
    isConnected,
    error
  };
};
