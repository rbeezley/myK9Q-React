// src/pages/Results/hooks/useResultsData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { getVisibleResultFields } from '../../../services/resultVisibilityService';
import type { UserRole } from '../../../utils/auth';

export interface ResultsFilters {
  element: string | null;
  level: string | null;
}

export interface CompletedClassResult {
  classId: number;
  className: string;
  element: string;
  level: string;
  section?: string;
  placements: {
    placement: 1 | 2 | 3 | 4;
    handlerName: string;
    dogName: string;
    breed: string;
    armband: number;
  }[];
}

export interface UseResultsDataParams {
  trialId: number;
  licenseKey: string;
  userRole?: UserRole;
}

export interface UseResultsDataReturn {
  completedClasses: CompletedClassResult[];
  isLoading: boolean;
  error: Error | null;
  filters: ResultsFilters;
  setFilters: (filters: ResultsFilters) => void;
  refetch: () => void;
}

export function useResultsData({
  trialId,
  licenseKey,
  userRole = 'exhibitor',
}: UseResultsDataParams): UseResultsDataReturn {
  const [completedClasses, setCompletedClasses] = useState<CompletedClassResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ResultsFilters>({
    element: null,
    level: null,
  });

  const fetchResults = useCallback(async () => {
    if (!trialId || !licenseKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch completed classes for this trial
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select(`
          id,
          element,
          level,
          section,
          status,
          results_released_at
        `)
        .eq('trial_id', trialId)
        .eq('status', 'completed')
        .order('element')
        .order('level');

      if (classError) throw classError;
      if (!classes || classes.length === 0) {
        setCompletedClasses([]);
        setIsLoading(false);
        return;
      }

      // Check visibility and fetch placements for each class
      const visibleClasses: CompletedClassResult[] = [];

      for (const cls of classes) {
        const visibility = await getVisibleResultFields({
          classId: cls.id,
          trialId,
          licenseKey,
          userRole,
          isClassComplete: true,
          resultsReleasedAt: cls.results_released_at,
        });

        if (!visibility.showPlacement) continue;

        // Fetch top 4 placements for this class
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

        if (entryError) throw entryError;

        const className = cls.section
          ? `${cls.element} ${cls.level} ${cls.section}`
          : `${cls.element} ${cls.level}`;

        visibleClasses.push({
          classId: cls.id,
          className,
          element: cls.element,
          level: cls.level,
          section: cls.section,
          placements: (entries || []).map((e) => ({
            placement: e.final_placement as 1 | 2 | 3 | 4,
            handlerName: e.handler_name,
            dogName: e.call_name,
            breed: e.breed,
            armband: e.armband_number,
          })),
        });
      }

      setCompletedClasses(visibleClasses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch results'));
    } finally {
      setIsLoading(false);
    }
  }, [trialId, licenseKey, userRole]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Apply filters
  const filteredClasses = completedClasses.filter((cls) => {
    if (filters.element && cls.element !== filters.element) return false;
    if (filters.level && cls.level !== filters.level) return false;
    return true;
  });

  return {
    completedClasses: filteredClasses,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchResults,
  };
}
