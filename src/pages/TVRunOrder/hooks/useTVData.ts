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
        // NOTE: Removed total_entry_count and completed_entry_count - we calculate these from actual entry data
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select(`
            id,
            element,
            level,
            section,
            judge_name,
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

        // Transform classes (counts will be calculated from entry data below)
        const transformedClasses: ClassInfo[] = (classes || [])
          .map((cls: any) => ({
            id: cls.id.toString(),
            trial_date: cls.trials.trial_date,
            trial_number: cls.trials.trial_number,
            element_type: cls.element,
            level: cls.level,
            class_name: `${cls.element} ${cls.level || ''}`.trim(),
            judge_name: cls.judge_name,
            entry_total_count: 0,  // Will be calculated from actual entries
            entry_completed_count: 0,  // Will be calculated from actual entries
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
        // NOTE: Split into batches to avoid URL length limits with .in() clause
        let entries: any[] = [];
        if (transformedClasses.length > 0) {
          const classIds = transformedClasses.map(c => parseInt(c.id));
          const batchSize = 10; // Safe batch size for URL length

          // Process in batches
          for (let i = 0; i < classIds.length; i += batchSize) {
            const batchIds = classIds.slice(i, i + batchSize);

            const { data: batchEntries, error: entryError } = await supabase
              .from('view_entry_class_join_normalized')
              .select(`
                id,
                armband_number,
                dog_call_name,
                dog_breed,
                handler_name,
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
              .in('class_id', batchIds)
              .order('exhibitor_order');

            if (entryError) throw entryError;

            if (batchEntries) {
              entries = [...entries, ...batchEntries];
            }
          }

        }

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

        // Group entries by class AND calculate counts
        const grouped: Record<string, EntryInfo[]> = {};
        const countsPerClass = new Map<string, {total: number, completed: number}>();

        if (entries.length > 0) {
          entries.forEach((entry: any) => {
            const key = `${entry.trial_date}-${entry.trial_number}-${entry.element}-${entry.level}`;
            if (!grouped[key]) {
              grouped[key] = [];
              countsPerClass.set(key, {total: 0, completed: 0});
            }

            grouped[key].push({
              id: entry.id.toString(),
              armband: entry.armband_number.toString(),
              dog_name: entry.dog_call_name,
              breed: entry.dog_breed || undefined,
              handler_name: entry.handler_name,
              status: entry.is_in_ring ? 'in_ring' :
                      entry.is_scored ? 'completed' : 'pending',
              result_status: entry.result_status || undefined,
              section: entry.section || undefined,
              sort_order: entry.exhibitor_order?.toString() || entry.armband_number.toString(),
              checkin_status: mapCheckinStatus(entry.entry_status)
            });

            // Calculate counts from actual entry data
            const counts = countsPerClass.get(key)!;
            counts.total += 1;
            if (entry.is_scored) {
              counts.completed += 1;
            }
          });
        }

        // Update class counts with calculated values
        transformedClasses.forEach(cls => {
          const key = `${cls.trial_date}-${cls.trial_number}-${cls.element_type}-${cls.level}`;
          const counts = countsPerClass.get(key) || {total: 0, completed: 0};
          cls.entry_total_count = counts.total;
          cls.entry_completed_count = counts.completed;
        });

        setEntriesByClass(grouped);

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
