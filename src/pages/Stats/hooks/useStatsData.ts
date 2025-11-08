import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  StatsData,
  StatsContext,
  BreedStat,
  JudgeStat,
  CleanSweepDog,
  FastestTimeEntry,
  BreedStatsQueryResult,
  JudgeStatsQueryResult,
  CleanSweepQueryResult,
  FastestTimesQueryResult,
  StatsQueryResult
} from '../types/stats.types';

// Cache time for future implementation
// const _CACHE_TIME = 5 * 60 * 1000; // 5 minutes

interface UseStatsDataReturn {
  data: StatsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStatsData(context: StatsContext): UseStatsDataReturn {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Last fetch time for future caching implementation
  const [_lastFetch, _setLastFetch] = useState(0);

  // Build cache key
  const cacheKey = useMemo(() => {
    const parts = [
      context.level,
      context.showId || '',
      context.trialId || '',
      context.classId || '',
      context.filters.breed || '',
      context.filters.judge || '',
      context.filters.trialDate || '',
      context.filters.trialNumber?.toString() || '',
      context.filters.element || '',
      context.filters.level || ''
    ];
    return parts.join(':');
  }, [context]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get license key from auth
      const authData = localStorage.getItem('myK9Q_auth');
      if (!authData) throw new Error('Not authenticated');

      const parsedAuth = JSON.parse(authData);
      const license_key = parsedAuth.showContext?.licenseKey;
      if (!license_key) throw new Error('No license key found');

      // Build base query based on level
      let baseQuery = supabase
        .from('view_stats_summary')
        .select('*')
        .eq('license_key', license_key);

      // Apply level filters
      if (context.level === 'show' && context.showId) {
        baseQuery = baseQuery.eq('show_id', context.showId);
      } else if (context.level === 'trial' && context.trialId) {
        baseQuery = baseQuery.eq('trial_id', context.trialId);
      } else if (context.level === 'class' && context.classId) {
        baseQuery = baseQuery.eq('class_id', context.classId);
      }

      // Apply filters
      if (context.filters.breed) {
        console.log('[Stats] Filtering by breed:', context.filters.breed);
        baseQuery = baseQuery.eq('dog_breed', context.filters.breed);
      }
      if (context.filters.judge) {
        console.log('[Stats] Filtering by judge:', context.filters.judge);
        baseQuery = baseQuery.eq('judge_name', context.filters.judge);
      }
      if (context.filters.trialDate) {
        console.log('[Stats] Filtering by trial date:', context.filters.trialDate);
        baseQuery = baseQuery.eq('trial_date', context.filters.trialDate);
      }
      if (context.filters.element) {
        console.log('[Stats] Filtering by element:', context.filters.element);
        baseQuery = baseQuery.eq('element', context.filters.element);
      }
      if (context.filters.level) {
        console.log('[Stats] Filtering by level:', context.filters.level);
        baseQuery = baseQuery.eq('level', context.filters.level);
      }

      // Fetch main stats
      const { data: statsData, error: statsError } = await baseQuery;
      console.log('[Stats] Query returned', statsData?.length, 'entries');
      if (statsError) throw statsError;

      if (!statsData || statsData.length === 0) {
        setData({
          totalEntries: 0,
          scoredEntries: 0,
          qualifiedCount: 0,
          nqCount: 0,
          excusedCount: 0,
          absentCount: 0,
          withdrawnCount: 0,
          uniqueDogs: 0,
          qualificationRate: 0,
          nqRate: 0,
          excusedRate: 0,
          absentRate: 0,
          withdrawnRate: 0,
          fastestTime: null,
          averageTime: null,
          medianTime: null,
          breedStats: [],
          judgeStats: [],
          cleanSweepDogs: [],
          fastestTimes: []
        });
        return;
      }

      // Calculate basic stats
      const totalEntries = statsData.length;
      const scoredEntries = statsData.filter((e: StatsQueryResult) => e.is_scored).length;
      const qualifiedCount = statsData.filter((e: StatsQueryResult) => e.result_status === 'qualified').length;
      const nqCount = statsData.filter((e: StatsQueryResult) => e.result_status === 'nq').length;
      const excusedCount = statsData.filter((e: StatsQueryResult) => e.result_status === 'excused').length;
      const absentCount = statsData.filter((e: StatsQueryResult) => e.result_status === 'absent').length;
      const withdrawnCount = statsData.filter((e: StatsQueryResult) => e.result_status === 'withdrawn').length;

      // Calculate unique dogs (by armband number)
      const uniqueArmbands = new Set(
        statsData
          .filter((e: StatsQueryResult) => e.armband_number)
          .map((e: StatsQueryResult) => e.armband_number)
      );
      const uniqueDogs = uniqueArmbands.size;

      // Calculate rates
      const qualificationRate = scoredEntries > 0 ? (qualifiedCount / scoredEntries) * 100 : 0;
      const nqRate = scoredEntries > 0 ? (nqCount / scoredEntries) * 100 : 0;
      const excusedRate = scoredEntries > 0 ? (excusedCount / scoredEntries) * 100 : 0;
      const absentRate = scoredEntries > 0 ? (absentCount / scoredEntries) * 100 : 0;
      const withdrawnRate = scoredEntries > 0 ? (withdrawnCount / scoredEntries) * 100 : 0;

      // Calculate time stats (only for qualified entries with valid times)
      const validTimes = statsData
        .filter((e: StatsQueryResult) => e.result_status === 'qualified' && e.valid_time && e.valid_time > 0)
        .map((e: StatsQueryResult) => e.valid_time as number)
        .sort((a: number, b: number) => a - b);

      const averageTime = validTimes.length > 0
        ? validTimes.reduce((sum: number, time: number) => sum + time, 0) / validTimes.length
        : null;

      const medianTime = validTimes.length > 0
        ? validTimes.length % 2 === 0
          ? (validTimes[Math.floor(validTimes.length / 2) - 1] + validTimes[Math.floor(validTimes.length / 2)]) / 2
          : validTimes[Math.floor(validTimes.length / 2)]
        : null;

      // Fetch breed stats
      // When additional filters (trialDate, trialNumber, element, level) are active,
      // we need to query view_stats_summary directly because view_breed_stats pre-aggregates
      let breedStats: BreedStat[] = [];

      const hasBreedFilters = context.filters.trialDate || context.filters.trialNumber ||
                              context.filters.element || context.filters.level || context.filters.judge;

      if (hasBreedFilters) {
        // Use statsData (already filtered) and aggregate by breed in application
        const breedMap = new Map<string, {
          totalEntries: number;
          qualifiedCount: number;
          nqCount: number;
          qualifiedTimes: number[];
        }>();

        statsData.forEach((entry: StatsQueryResult) => {
          if (!entry.dog_breed) return;

          const existing = breedMap.get(entry.dog_breed) || {
            totalEntries: 0,
            qualifiedCount: 0,
            nqCount: 0,
            qualifiedTimes: []
          };

          existing.totalEntries++;
          if (entry.result_status === 'qualified') {
            existing.qualifiedCount++;
            if (entry.valid_time && entry.valid_time > 0) {
              existing.qualifiedTimes.push(entry.valid_time);
            }
          }
          if (entry.result_status === 'nq') {
            existing.nqCount++;
          }

          breedMap.set(entry.dog_breed, existing);
        });

        breedStats = Array.from(breedMap.entries()).map(([breed, stats]) => ({
          breed,
          totalEntries: stats.totalEntries,
          qualifiedCount: stats.qualifiedCount,
          nqCount: stats.nqCount,
          qualificationRate: stats.totalEntries > 0 ? (stats.qualifiedCount / stats.totalEntries) * 100 : 0,
          averageTime: stats.qualifiedTimes.length > 0
            ? stats.qualifiedTimes.reduce((sum, time) => sum + time, 0) / stats.qualifiedTimes.length
            : null,
          fastestTime: stats.qualifiedTimes.length > 0 ? Math.min(...stats.qualifiedTimes) : null
        })).sort((a, b) => b.totalEntries - a.totalEntries).slice(0, 10);
      } else {
        // Use pre-aggregated view_breed_stats for performance
        let breedQuery = supabase
          .from('view_breed_stats')
          .select('*')
          .eq('license_key', license_key);

        if (context.level === 'show' && context.showId) {
          breedQuery = breedQuery.eq('show_id', context.showId);
        } else if (context.level === 'trial' && context.trialId) {
          breedQuery = breedQuery.eq('trial_id', context.trialId);
        } else if (context.level === 'class' && context.classId) {
          breedQuery = breedQuery.eq('class_id', context.classId);
        }

        if (context.filters.breed) {
          breedQuery = breedQuery.eq('dog_breed', context.filters.breed);
        }

        const { data: breedData, error: breedError } = await breedQuery
          .order('total_entries', { ascending: false })
          .limit(10);

        if (breedError) throw breedError;

        breedStats = (breedData || []).map((breed: BreedStatsQueryResult) => ({
          breed: breed.dog_breed,
          totalEntries: breed.total_entries,
          qualifiedCount: breed.qualified_count,
          nqCount: breed.nq_count,
          qualificationRate: breed.qualification_rate,
          averageTime: breed.avg_time,
          fastestTime: breed.fastest_time
        }));
      }

      // Fetch judge stats
      // When breed or additional filters (trialDate, element, level) are active,
      // we need to query view_stats_summary directly because view_judge_stats pre-aggregates
      let judgeStats: JudgeStat[] = [];

      const hasAdditionalFilters = context.filters.breed || context.filters.trialDate ||
                                    context.filters.element || context.filters.level;

      if (hasAdditionalFilters) {
        // Query view_stats_summary and aggregate by judge in application
        let summaryQuery = supabase
          .from('view_stats_summary')
          .select('*')
          .eq('license_key', license_key);

        if (context.level === 'show' && context.showId) {
          summaryQuery = summaryQuery.eq('show_id', context.showId);
        } else if (context.level === 'trial' && context.trialId) {
          summaryQuery = summaryQuery.eq('trial_id', context.trialId);
        }

        // Apply all filters
        if (context.filters.breed) {
          summaryQuery = summaryQuery.eq('dog_breed', context.filters.breed);
        }
        if (context.filters.judge) {
          summaryQuery = summaryQuery.eq('judge_name', context.filters.judge);
        }
        if (context.filters.trialDate) {
          summaryQuery = summaryQuery.eq('trial_date', context.filters.trialDate);
        }
        if (context.filters.element) {
          summaryQuery = summaryQuery.eq('element', context.filters.element);
        }
        if (context.filters.level) {
          summaryQuery = summaryQuery.eq('level', context.filters.level);
        }

        const { data: summaryData, error: summaryError } = await summaryQuery;
        if (summaryError) throw summaryError;

        // Aggregate by judge
        const judgeMap = new Map<string, {
          classesJudged: Set<string>;
          totalEntries: number;
          qualifiedCount: number;
          qualifiedTimes: number[];
        }>();

        (summaryData || []).forEach((entry: StatsQueryResult) => {
          if (!entry.judge_name || !entry.class_id) return;

          const existing = judgeMap.get(entry.judge_name) || {
            classesJudged: new Set<string>(),
            totalEntries: 0,
            qualifiedCount: 0,
            qualifiedTimes: []
          };

          existing.classesJudged.add(entry.class_id);
          existing.totalEntries++;
          if (entry.result_status === 'qualified') {
            existing.qualifiedCount++;
            if (entry.search_time_seconds && entry.search_time_seconds > 0) {
              existing.qualifiedTimes.push(entry.search_time_seconds);
            }
          }

          judgeMap.set(entry.judge_name, existing);
        });

        // Convert to JudgeStat array
        judgeStats = Array.from(judgeMap.entries())
          .map(([judgeName, stats]) => ({
            judgeName,
            classesJudged: stats.classesJudged.size,
            totalEntries: stats.totalEntries,
            qualifiedCount: stats.qualifiedCount,
            qualificationRate: stats.totalEntries > 0
              ? (stats.qualifiedCount / stats.totalEntries) * 100
              : 0,
            averageQualifiedTime: stats.qualifiedTimes.length > 0
              ? stats.qualifiedTimes.reduce((sum, t) => sum + t, 0) / stats.qualifiedTimes.length
              : null
          }))
          .sort((a, b) => b.totalEntries - a.totalEntries)
          .slice(0, 10);
      } else {
        // Use pre-aggregated view when no breed filter
        let judgeQuery = supabase
          .from('view_judge_stats')
          .select('*')
          .eq('license_key', license_key);

        if (context.level === 'show' && context.showId) {
          judgeQuery = judgeQuery.eq('show_id', context.showId);
        } else if (context.level === 'trial' && context.trialId) {
          judgeQuery = judgeQuery.eq('trial_id', context.trialId);
        }

        if (context.filters.judge) {
          judgeQuery = judgeQuery.eq('judge_name', context.filters.judge);
        }

        const { data: judgeData, error: judgeError } = await judgeQuery
          .order('total_entries', { ascending: false })
          .limit(10);

        if (judgeError) throw judgeError;

        judgeStats = (judgeData || []).map((judge: JudgeStatsQueryResult) => ({
          judgeName: judge.judge_name,
          classesJudged: judge.classes_judged,
          totalEntries: judge.total_entries,
          qualifiedCount: judge.qualified_count,
          qualificationRate: judge.qualification_rate,
          averageQualifiedTime: judge.avg_qualified_time
        }));
      }

      // Fetch fastest times
      let timesQuery = supabase
        .from('view_fastest_times')
        .select('*')
        .eq('license_key', license_key);

      if (context.level === 'show' && context.showId) {
        timesQuery = timesQuery.eq('show_id', context.showId);
      } else if (context.level === 'trial' && context.trialId) {
        timesQuery = timesQuery.eq('trial_id', context.trialId);
      } else if (context.level === 'class' && context.classId) {
        timesQuery = timesQuery.eq('class_id', context.classId);
      }

      // Apply filters (view_fastest_times has breed, element, level)
      if (context.filters.breed) {
        timesQuery = timesQuery.eq('dog_breed', context.filters.breed);
      }
      if (context.filters.element) {
        timesQuery = timesQuery.eq('element', context.filters.element);
      }
      if (context.filters.level) {
        timesQuery = timesQuery.eq('level', context.filters.level);
      }
      // Note: view_fastest_times doesn't have trial_date or judge_name
      // If those filters are active, we'd need to query view_stats_summary instead

      const { data: timesData, error: timesError } = await timesQuery;

      if (timesError) throw timesError;

      // Filter to unique dogs (keep only fastest time per dog) and re-rank
      const dogMap = new Map<string, FastestTimesQueryResult>();
      (timesData || []).forEach((time: FastestTimesQueryResult) => {
        const existing = dogMap.get(time.armband_number);
        if (!existing || time.search_time_seconds < existing.search_time_seconds) {
          dogMap.set(time.armband_number, time);
        }
      });

      // Convert to array, sort by time, and assign new ranks
      const sortedUniqueTimes = Array.from(dogMap.values())
        .sort((a, b) => a.search_time_seconds - b.search_time_seconds)
        .slice(0, 20);  // Take top 20 dogs

      // Assign ranks with tie handling
      let currentRank = 1;
      const fastestTimes: FastestTimeEntry[] = sortedUniqueTimes.map((time, index) => {
        // Check if this time is tied with previous
        if (index > 0 && time.search_time_seconds !== sortedUniqueTimes[index - 1].search_time_seconds) {
          currentRank = index + 1;
        }

        return {
          entryId: time.entry_id,
          armbandNumber: time.armband_number,
          dogCallName: time.dog_call_name,
          handlerName: time.handler_name,
          dogBreed: time.dog_breed,
          searchTimeSeconds: time.search_time_seconds,
          timeRank: currentRank,
          element: time.element,
          level: time.level
        };
      });

      const fastestTime = fastestTimes.length > 0 ? fastestTimes[0] : null;

      // Fetch clean sweep dogs (show level only)
      let cleanSweepDogs: CleanSweepDog[] = [];
      if (context.level === 'show') {
        let cleanQuery = supabase
          .from('view_clean_sweep_dogs')
          .select('*')
          .eq('license_key', license_key)
          .eq('is_clean_sweep', true);

        if (context.showId) {
          cleanQuery = cleanQuery.eq('show_id', context.showId);
        }

        if (context.filters.breed) {
          cleanQuery = cleanQuery.eq('dog_breed', context.filters.breed);
        }

        const { data: cleanData, error: cleanError } = await cleanQuery
          .order('dog_call_name')
          .limit(50);

        if (cleanError) {
          console.error('[Stats] Clean sweep query error:', cleanError);
          throw cleanError;
        }

        console.log('[Stats] Clean sweep query returned:', cleanData?.length, 'dogs', cleanData);

        cleanSweepDogs = (cleanData || []).map((dog: CleanSweepQueryResult) => ({
          armbandNumber: dog.armband_number,
          dogCallName: dog.dog_call_name,
          handlerName: dog.handler_name,
          dogBreed: dog.dog_breed,
          elementsEntered: dog.elements_entered,
          elementsQualified: dog.elements_qualified,
          elementsList: dog.elements_list
        }));
      }

      // Set final data
      console.log('[Stats] Setting data:', { totalEntries, scoredEntries, qualifiedCount, uniqueDogs, breed: context.filters.breed });
      setData({
        totalEntries,
        scoredEntries,
        qualifiedCount,
        nqCount,
        excusedCount,
        absentCount,
        withdrawnCount,
        uniqueDogs,
        qualificationRate,
        nqRate,
        excusedRate,
        absentRate,
        withdrawnRate,
        fastestTime,
        averageTime,
        medianTime,
        breedStats,
        judgeStats,
        cleanSweepDogs,
        fastestTimes
      });

      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch function
  const refetch = () => {
    setLastFetch(0); // Force refetch
  };

  // Effect to fetch data
  useEffect(() => {
    // Always fetch when cache key changes (filters changed)
    fetchStats();
  }, [cacheKey]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}