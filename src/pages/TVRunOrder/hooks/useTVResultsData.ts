// src/pages/TVRunOrder/hooks/useTVResultsData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TVResultPlacement {
  placement: 1 | 2 | 3 | 4;
  handlerName: string;
  dogName: string;
  breed: string;
  armband: number;
}

export interface TVCompletedClass {
  id: number;
  className: string;
  element: string;
  level: string;
  section?: string;
  placements: TVResultPlacement[];
  completedAt?: string;
}

interface UseTVResultsDataOptions {
  licenseKey: string;
  enablePolling?: boolean;
  pollingInterval?: number;
  maxResults?: number;
}

interface UseTVResultsDataReturn {
  completedClasses: TVCompletedClass[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTVResultsData({
  licenseKey,
  enablePolling = true,
  pollingInterval = 60000,
  maxResults = 8,
}: UseTVResultsDataOptions): UseTVResultsDataReturn {
  const [completedClasses, setCompletedClasses] = useState<TVCompletedClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!licenseKey) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch recently completed classes (last 24 hours)
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select(`
          id,
          element,
          level,
          section,
          status,
          results_released_at,
          updated_at,
          trials!inner (
            license_key
          )
        `)
        .eq('trials.license_key', licenseKey)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(maxResults);

      if (classError) throw classError;
      if (!classes || classes.length === 0) {
        setCompletedClasses([]);
        setIsLoading(false);
        return;
      }

      // Fetch top 4 placements for each class
      const classResults: TVCompletedClass[] = [];

      for (const cls of classes) {
        const { data: entries, error: entryError } = await supabase
          .from('entries')
          .select(`
            id,
            armband_number,
            call_name,
            breed,
            handler_name,
            final_placement
          `)
          .eq('class_id', cls.id)
          .gte('final_placement', 1)
          .lte('final_placement', 4)
          .order('final_placement');

        if (entryError) continue;

        const className = cls.section
          ? `${cls.element} ${cls.level} ${cls.section}`
          : `${cls.element} ${cls.level}`;

        classResults.push({
          id: cls.id,
          className,
          element: cls.element,
          level: cls.level,
          section: cls.section,
          completedAt: cls.updated_at,
          placements: (entries || []).map((e) => ({
            placement: e.final_placement as 1 | 2 | 3 | 4,
            handlerName: e.handler_name,
            dogName: e.call_name,
            breed: e.breed,
            armband: e.armband_number,
          })),
        });
      }

      setCompletedClasses(classResults);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  }, [licenseKey, maxResults]);

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Polling
  useEffect(() => {
    if (!enablePolling || !licenseKey) return;

    const interval = setInterval(fetchResults, pollingInterval);
    return () => clearInterval(interval);
  }, [enablePolling, pollingInterval, fetchResults, licenseKey]);

  return {
    completedClasses,
    isLoading,
    error,
    refetch: fetchResults,
  };
}
