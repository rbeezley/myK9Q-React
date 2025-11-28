import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, TrendingUp, Award, Clock, RefreshCw } from 'lucide-react';
import { PageLoader } from '../../components/LoadingSpinner';
import { HamburgerMenu } from '../../components/ui/HamburgerMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useStatsData } from './hooks/useStatsData';
import { supabase } from '../../lib/supabase';
import { getLevelSortOrder } from '../../lib/utils';
import type { StatsLevel, StatsFilters } from './types/stats.types';
import './Stats.css';

// Lazy load heavy chart components
const QualificationChart = lazy(() => import('./components/QualificationChart'));
const BreedPerformanceChart = lazy(() => import('./components/BreedPerformanceChart'));
const JudgePerformanceChart = lazy(() => import('./components/JudgePerformanceChart'));
const FastestTimesTable = lazy(() => import('./components/FastestTimesTable'));
const CleanSweepSection = lazy(() => import('./components/CleanSweepSection'));
const StatsFiltersComponent = lazy(() => import('./components/StatsFilters'));

export const Stats: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { trialId } = useParams<{ trialId?: string }>();

  // State for filter options
  const [filterOptions, setFilterOptions] = useState<{
    trialDates: string[];
    trialNumbers: number[];
    elements: string[];
    levels: string[];
    classes: Array<{ id: number; name: string; trialDate?: string; trialNumber?: number }>;
  }>({
    trialDates: [],
    trialNumbers: [],
    elements: [],
    levels: [],
    classes: []
  });

  // Stats is now filter-based only (no route-based drill-down)
  const level: StatsLevel = 'show';

  // Parse all filters from URL params
  const filters: StatsFilters = useMemo(() => ({
    breed: searchParams.get('breed'),
    judge: searchParams.get('judge'),
    trialDate: searchParams.get('trialDate'),
    trialNumber: searchParams.get('trialNumber') ? parseInt(searchParams.get('trialNumber')!) : null,
    element: searchParams.get('element'),
    level: searchParams.get('level'),
    classId: searchParams.get('classId') ? parseInt(searchParams.get('classId')!) : null
  }), [searchParams]);

  // Fetch stats data
  const { data, isLoading, error, refetch } = useStatsData({
    level,
    showId: showContext?.showId,
    filters
  });

  // Fetch filter options from view_stats_summary
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!showContext?.licenseKey) return;

      try {
        const { data: statsData } = await supabase
          .from('view_stats_summary')
          .select('trial_date, trial_id, element, level, class_id')
          .eq('license_key', showContext.licenseKey)
          .eq('show_id', showContext.showId);

        // Also fetch trials to get trial numbers
        const { data: trialsForNumber } = await supabase
          .from('trials')
          .select('id, trial_number')
          .eq('show_id', showContext.showId);

        if (statsData) {
          // Extract unique trial dates
          const uniqueDates = [...new Set(statsData.map(d => d.trial_date).filter(Boolean))].sort();

          // Extract unique elements
          const uniqueElements = [...new Set(statsData.map(d => d.element).filter(Boolean))].sort();

          // Extract unique levels and sort by competition order (Novice, Advanced, Excellent, Master)
          const uniqueLevels = [...new Set(statsData.map(d => d.level).filter(Boolean))]
            .sort((a, b) => getLevelSortOrder(a) - getLevelSortOrder(b));

          setFilterOptions({
            trialDates: uniqueDates,
            trialNumbers: [], // Will fetch from trials table separately
            elements: uniqueElements,
            levels: uniqueLevels,
            classes: []  // Will populate after extracting classes
          });
        }

        // Fetch trial numbers from trials table
        const { data: trialsData } = await supabase
          .from('trials')
          .select('trial_number')
          .eq('show_id', showContext.showId)
          .order('trial_number');

        if (trialsData) {
          const uniqueTrialNumbers = [...new Set(trialsData.map(t => t.trial_number).filter(Boolean))].sort((a, b) => a - b);
          setFilterOptions(prev => ({
            ...prev,
            trialNumbers: uniqueTrialNumbers
          }));
        }

        // Fetch classes from view_stats_summary
        // If viewing trial-specific stats, filter to only classes from that trial
        if (statsData) {
          let classesData = statsData;
          if (trialId) {
            // Filter to only classes from the current trial (convert trialId to number for comparison)
            const trialIdNum = parseInt(trialId);
            classesData = statsData.filter(d => d.trial_id === trialIdNum);
          }

          // Create a map of trial IDs to trial numbers for easy lookup
          // CRITICAL: Use string keys for consistency (prevents number/string type mismatch bugs)
          const trialNumberMap = new Map<string, number>();
          if (trialsForNumber) {
            trialsForNumber.forEach(t => {
              trialNumberMap.set(String(t.id), t.trial_number);
            });
          }

          const uniqueClasses = [...new Set(classesData.map(d => JSON.stringify({
            id: d.class_id,
            name: `${d.element} - ${d.level}`,
            trialDate: d.trial_date,
            trialNumber: d.trial_id ? trialNumberMap.get(String(d.trial_id)) : undefined
          })).filter(Boolean))]
            .map(c => JSON.parse(c) as { id: number; name: string; trialDate: string; trialNumber?: number })
            .sort((a, b) => a.name.localeCompare(b.name));

          setFilterOptions(prev => ({
            ...prev,
            classes: uniqueClasses
          }));
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, [showContext?.licenseKey, showContext?.showId, trialId]);

  // Handle filter changes - persist to URL
  const handleFilterChange = (newFilters: Partial<StatsFilters>) => {
    const params = new URLSearchParams(searchParams);

    // Update breed filter
    if (newFilters.breed !== undefined) {
      if (newFilters.breed) {
        params.set('breed', newFilters.breed);
      } else {
        params.delete('breed');
      }
    }

    // Update judge filter
    if (newFilters.judge !== undefined) {
      if (newFilters.judge) {
        params.set('judge', newFilters.judge);
      } else {
        params.delete('judge');
      }
    }

    // Update trial date filter
    if (newFilters.trialDate !== undefined) {
      if (newFilters.trialDate) {
        params.set('trialDate', newFilters.trialDate);
      } else {
        params.delete('trialDate');
      }
    }

    // Update trial number filter
    if (newFilters.trialNumber !== undefined) {
      if (newFilters.trialNumber) {
        params.set('trialNumber', newFilters.trialNumber.toString());
      } else {
        params.delete('trialNumber');
      }
    }

    // Update element filter
    if (newFilters.element !== undefined) {
      if (newFilters.element) {
        params.set('element', newFilters.element);
      } else {
        params.delete('element');
      }
    }

    // Update level filter (using 'filterLevel' to avoid confusion with page level)
    if (newFilters.level !== undefined) {
      if (newFilters.level) {
        params.set('level', newFilters.level);
      } else {
        params.delete('level');
      }
    }

    // Update class ID filter
    if (newFilters.classId !== undefined) {
      if (newFilters.classId) {
        params.set('classId', newFilters.classId.toString());
      } else {
        params.delete('classId');
      }
    }

    setSearchParams(params);
  };

  // Loading state
  if (isLoading) {
    return <PageLoader message="Loading statistics..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="stats-error">
        <div className="error-icon">
          <BarChart3 className="h-12 w-12" />
        </div>
        <h2>Unable to Load Statistics</h2>
        <p>{error.message}</p>
        <button onClick={() => navigate(-1)} className="error-button">
          Go Back
        </button>
      </div>
    );
  }

  // No data state
  if (!data || data.totalEntries === 0) {
    return (
      <div className="stats-empty">
        <div className="empty-icon">
          <BarChart3 className="h-12 w-12" />
        </div>
        <h2>No Statistics Available</h2>
        <p>No completed classes with scored entries match your filters.</p>
        <button onClick={() => navigate(-1)} className="empty-button">
          Go Back
        </button>
      </div>
    );
  }

  // Get current class information for display
  const currentClass = filters.classId
    ? filterOptions.classes.find(c => c.id === filters.classId)
    : null;

  // Format class subtitle with trial info
  const formatClassSubtitle = () => {
    if (!currentClass) return '';
    const parts: string[] = [];
    if (currentClass.trialDate) {
      // Parse ISO date string without timezone conversion
      // This prevents JavaScript from converting UTC to local timezone incorrectly
      const [year, month, day] = currentClass.trialDate.split('T')[0].split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
      });
      parts.push(formattedDate);
    }
    if (currentClass.trialNumber !== undefined) {
      parts.push(`Trial ${currentClass.trialNumber}`);
    }
    parts.push(currentClass.name);
    return parts.join(' • ');
  };

  return (
    <div className="stats-container">
      {/* Header - consistent with other pages */}
      <header className="page-header stats-page-header">
        <HamburgerMenu />
        <div className="header-content">
          <h1>
            <BarChart3 className="title-icon" />
            Statistics
          </h1>
          {currentClass && (
            <p className="stats-class-subtitle">{formatClassSubtitle()}</p>
          )}
        </div>
        <button
          className="icon-button"
          onClick={() => refetch()}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Filters Bar */}
      <div className="filters-bar">
        <Suspense fallback={<div className="filters-skeleton" />}>
          <StatsFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            availableBreeds={[...new Set(data.breedStats.map(b => b.breed))]}
            availableJudges={[...new Set(data.judgeStats.map(j => j.judgeName).filter(Boolean) as string[])]}
            availableTrialDates={filterOptions.trialDates}
            availableTrialNumbers={filterOptions.trialNumbers}
            availableElements={filterOptions.elements}
            availableLevels={filterOptions.levels}
          />
        </Suspense>
      </div>

      {/* Summary Cards */}
      <div className="stats-cards">
        <div className="stats-card">
          <div className="card-icon total">
            <BarChart3 />
          </div>
          <div className="card-content">
            <h3>Total Entries</h3>
            <p className="card-value">{data.totalEntries}</p>
            <p className="card-subtitle">
              {filters.breed
                ? `${data.uniqueDogs} ${data.uniqueDogs === 1 ? 'dog' : 'dogs'} • ${data.scoredEntries} scored`
                : `${data.scoredEntries} scored`}
            </p>
          </div>
        </div>

        <div className="stats-card">
          <div className="card-icon qualified">
            <Award />
          </div>
          <div className="card-content">
            <h3>Qualification Rate</h3>
            <p className="card-value">{data.qualificationRate.toFixed(1)}%</p>
            <p className="card-subtitle">{data.qualifiedCount} qualified</p>
          </div>
        </div>

        <div className="stats-card">
          <div className="card-icon fastest">
            <Clock />
          </div>
          <div className="card-content">
            <h3>Fastest Time</h3>
            {data.fastestTime ? (
              <>
                <p className="card-value">{data.fastestTime.searchTimeSeconds.toFixed(2)}s</p>
                <p className="card-subtitle">{data.fastestTime.dogCallName}</p>
              </>
            ) : (
              <p className="card-value">N/A</p>
            )}
          </div>
        </div>

        <div className="stats-card">
          <div className="card-icon average">
            <TrendingUp />
          </div>
          <div className="card-content">
            <h3>Average Time</h3>
            <p className="card-value">
              {data.averageTime ? `${data.averageTime.toFixed(2)}s` : 'N/A'}
            </p>
            <p className="card-subtitle">
              {data.medianTime ? `Median: ${data.medianTime.toFixed(2)}s` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="stats-charts">
        {/* Qualification Distribution */}
        <div className="chart-container">
          <h2 className="chart-title">
            Result Distribution
            <span className="chart-hint-mobile">Tap segments for details</span>
          </h2>
          <Suspense fallback={<div className="chart-skeleton" />}>
            <QualificationChart data={data} onSegmentClick={handleFilterChange} />
          </Suspense>
        </div>

        {/* Judge Performance */}
        {data.judgeStats.length > 0 && (
          <div className="chart-container">
            <h2 className="chart-title">
              Performance by Judge
              <span className="chart-hint-mobile">Tap bars for details</span>
            </h2>
            <Suspense fallback={<div className="chart-skeleton" />}>
              <JudgePerformanceChart
                data={data.judgeStats}
                onBarClick={(judge) => handleFilterChange({ judge })}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Breed Performance - Full Width */}
      {/* Only show breed chart when NOT filtering by breed */}
      {data.breedStats.length > 0 && !filters.breed && (
        <div className="stats-section breed-performance-section">
          <h2 className="chart-title">
            Performance by Breed
            <span className="chart-hint-mobile">Tap bars for details</span>
          </h2>
          <div className="breed-chart-container">
            <Suspense fallback={<div className="chart-skeleton" />}>
              <BreedPerformanceChart
                data={data.breedStats}
                onBarClick={(breed) => handleFilterChange({ breed })}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Fastest Times Leaderboard */}
      {data.fastestTimes.length > 0 && (
        <div className="stats-section">
          <h2 className="section-title">Fastest Dogs</h2>
          <p className="section-subtitle">Top 20 dogs by their fastest qualifying time</p>
          <Suspense fallback={<div className="table-skeleton" />}>
            <FastestTimesTable
              data={data.fastestTimes}
              onDogClick={(armbandNumber) => navigate(`/dog/${armbandNumber}`)}
            />
          </Suspense>
        </div>
      )}

      {/* Clean Sweep Section (Show level only) */}
      {level === 'show' && data.cleanSweepDogs.length > 0 && (
        <div className="stats-section">
          <h2 className="section-title">Clean Sweep Dogs</h2>
          <p className="section-subtitle">100% qualification across all scored classes</p>
          <Suspense fallback={<div className="cards-skeleton" />}>
            <CleanSweepSection
              dogs={data.cleanSweepDogs}
              onDogClick={(armbandNumber) => navigate(`/dog/${armbandNumber}`)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};