/**
 * Enhanced Yesterday Highlights Component
 *
 * Replaces mock data with real AKC Nationals scoring data.
 * Shows actual statistics from completed scoring sessions.
 */

import React, { useState, useEffect } from 'react';
import { useNationalsScoring, useElementProgress } from '../../../hooks/useNationalsScoring';
import { supabase } from '../../../lib/supabase';
import './YesterdayHighlights.css';

interface TopPerformer {
  id: number;
  armband: string;
  call_name: string;
  breed: string;
  handler: string;
  handler_location: string;
  total_score: number;
  perfect_scores: number;
  fastest_search: string;
  element_name: string;
  day: number;
}

interface BreedStats {
  breed: string;
  count: number;
  average_score: number;
  top_score: number;
  perfect_count: number;
}

interface DayStats {
  total_dogs: number;
  completed_dogs: number;
  perfect_scores: number;
  average_score: number;
  fastest_search: string;
  fastest_dog: string;
  top_breeds: BreedStats[];
}

interface YesterdayHighlightsEnhancedProps {
  licenseKey: string;
  allowLiveScores?: boolean; // Override for testing or post-competition
}

export const YesterdayHighlightsEnhanced: React.FC<YesterdayHighlightsEnhancedProps> = ({
  licenseKey,
  allowLiveScores = false
}) => {
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<1 | 2 | 3>(1);
  const [dayCompletionStatus, setDayCompletionStatus] = useState<Record<number, boolean>>({});
  const [currentCompetitionDay, setCurrentCompetitionDay] = useState<number>(1);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(Date.now());

  // Use our Nationals scoring hooks
  const { leaderboard: _leaderboard, isLoading: scoresLoading, error: scoresError } = useNationalsScoring({
    licenseKey,
    enableRealtime: true
  });

  const { elementProgress: _elementProgress, isLoading: progressLoading } = useElementProgress(licenseKey);

  // Fetch detailed day statistics
  const fetchDayStatistics = async (day: number) => {
    try {
      setLoading(true);
      setError(null);

      // Get completed scores for the selected day
      const { data: dayScores, error: scoresError } = await supabase
        .from('nationals_scores')
        .select(`
          entry_id,
          armband,
          element_type,
          points,
          time_seconds,
          alerts_correct,
          alerts_incorrect,
          faults,
          finish_call_errors,
          excused
        `)
        .eq('mobile_app_lic_key', licenseKey)
        .eq('day', day)
        .not('points', 'is', null);

      if (scoresError) throw scoresError;

      if (!dayScores || dayScores.length === 0) {
        // No data for this day yet
        setStats({
          total_dogs: 0,
          completed_dogs: 0,
          perfect_scores: 0,
          average_score: 0,
          fastest_search: '0:00',
          fastest_dog: 'No times recorded',
          top_breeds: []
        });
        setTopPerformers([]);
        return;
      }

      // Get dog details for scoring data
      const entryIds = [...new Set(dayScores.map(score => score.entry_id))];
      const { data: entryDetails, error: entriesError } = await supabase
        .from('view_nationals_leaderboard')
        .select('*')
        .in('entry_id', entryIds)
        .eq('mobile_app_lic_key', licenseKey);

      if (entriesError) throw entriesError;

      // Process statistics
      const processedStats = processDayStatistics(dayScores, entryDetails || []);
      setStats(processedStats);

      // Process top performers
      const processedPerformers = processTopPerformers(dayScores, entryDetails || [], day);
      setTopPerformers(processedPerformers);

    } catch (error) {
      console.error('❌ Error fetching day statistics:', error);
      setError('Unable to load day statistics');
    } finally {
      setLoading(false);
    }
  };

  // Process day statistics from scoring data
  const processDayStatistics = (scores: any[], entries: any[]): DayStats => {
    const entryMap = new Map(entries.map(entry => [entry.entry_id, entry]));

    // Group scores by entry
    const scoresByEntry = new Map<number, any[]>();
    scores.forEach(score => {
      if (!scoresByEntry.has(score.entry_id)) {
        scoresByEntry.set(score.entry_id, []);
      }
      scoresByEntry.get(score.entry_id)!.push(score);
    });

    // Calculate statistics
    const totalDogs = entryMap.size;
    const completedDogs = scoresByEntry.size;
    let totalScore = 0;
    let perfectScores = 0;
    let fastestTime = Number.MAX_SAFE_INTEGER;
    let fastestDog = 'No times recorded';

    // Breed statistics
    const breedStats = new Map<string, { count: number; scores: number[]; perfectCount: number }>();

    scoresByEntry.forEach((entryScores, entryId) => {
      const entry = entryMap.get(entryId);
      if (!entry) return;

      const breed = entry.breed || 'Mixed Breed';

      // Initialize breed stats
      if (!breedStats.has(breed)) {
        breedStats.set(breed, { count: 0, scores: [], perfectCount: 0 });
      }

      const breedStat = breedStats.get(breed)!;
      breedStat.count++;

      // Calculate entry total for this day
      const entryTotal = entryScores.reduce((sum, score) => sum + (score.points || 0), 0);
      const entryTime = entryScores.reduce((sum, score) => sum + (score.time_seconds || 0), 0);

      totalScore += entryTotal;
      breedStat.scores.push(entryTotal);

      // Check for perfect scores (no incorrect alerts, no faults, no finish errors)
      const isPerfect = entryScores.every(score =>
        score.alerts_incorrect === 0 &&
        score.faults === 0 &&
        score.finish_call_errors === 0 &&
        score.alerts_correct > 0 &&
        !score.excused
      );

      if (isPerfect) {
        perfectScores++;
        breedStat.perfectCount++;
      }

      // Track fastest time
      if (entryTime > 0 && entryTime < fastestTime) {
        fastestTime = entryTime;
        fastestDog = entry.call_name || 'Unknown';
      }
    });

    // Process breed statistics
    const topBreeds: BreedStats[] = Array.from(breedStats.entries())
      .map(([breed, stats]) => ({
        breed,
        count: stats.count,
        average_score: stats.scores.length > 0 ?
          Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length) : 0,
        top_score: stats.scores.length > 0 ? Math.max(...stats.scores) : 0,
        perfect_count: stats.perfectCount
      }))
      .sort((a, b) => b.average_score - a.average_score)
      .slice(0, 5);

    return {
      total_dogs: totalDogs,
      completed_dogs: completedDogs,
      perfect_scores: perfectScores,
      average_score: completedDogs > 0 ? Math.round(totalScore / completedDogs) : 0,
      fastest_search: formatTime(fastestTime === Number.MAX_SAFE_INTEGER ? 0 : fastestTime),
      fastest_dog: fastestDog,
      top_breeds: topBreeds
    };
  };

  // Process top performers for the day
  const processTopPerformers = (scores: any[], entries: any[], day: number): TopPerformer[] => {
    const entryMap = new Map(entries.map(entry => [entry.entry_id, entry]));

    // Group scores by entry and element
    const performanceMap = new Map<string, any>();

    scores.forEach(score => {
      const key = `${score.entry_id}-${score.element_type}`;
      const entry = entryMap.get(score.entry_id);

      if (entry) {
        performanceMap.set(key, {
          id: score.entry_id,
          armband: score.armband,
          call_name: entry.call_name || 'Unknown',
          breed: entry.breed || 'Mixed Breed',
          handler: entry.handler_name || 'Unknown',
          handler_location: entry.handler_location || '',
          total_score: score.points || 0,
          perfect_scores: (score.alerts_incorrect === 0 && score.faults === 0 &&
                          score.finish_call_errors === 0 && score.alerts_correct > 0 &&
                          !score.excused) ? 1 : 0,
          fastest_search: formatTime(score.time_seconds || 0),
          element_name: getElementDisplayName(score.element_type),
          day: day
        });
      }
    });

    // Sort by total score and return top 10
    return Array.from(performanceMap.values())
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 10);
  };

  // Helper functions
  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElementDisplayName = (element: string): string => {
    switch (element) {
      case 'CONTAINER': return 'Container';
      case 'BURIED': return 'Buried';
      case 'INTERIOR': return 'Interior';
      case 'EXTERIOR': return 'Exterior';
      case 'HD_CHALLENGE': return 'Handler Discrimination';
      default: return element;
    }
  };

  const formatPoints = (points: number): string => {
    return points >= 0 ? `+${points}` : `${points}`;
  };

  // Check competition day completion status and auto-select day for TV display
  const checkDayCompletionStatus = async () => {
    try {
      // Get current competition day (based on schedule or manual setting)
      const currentDay = getCurrentCompetitionDay();
      setCurrentCompetitionDay(currentDay);

      // Check if each day is completed (all dogs finished their runs)
      const { data: completionData, error: _error } = await supabase
        .from('tbl_class_queue')
        .select('trial_date, element, release_mode, class_completed, auto_release_results, results_released')
        .eq('mobile_app_lic_key', licenseKey);

      if (completionData && completionData.length > 0) {
        // Check per-class results release status (new system)
        const statusMap: Record<number, boolean> = {};
        const isNationals = licenseKey === 'myK9Q1-d8609f3b-d3fd43aa-6323a604';

        [1, 2, 3].forEach(day => {
          // Check if any class for this day has results available
          const dayClasses = completionData.filter((_cls: any) => {
            // For now, all classes are considered for each day
            // This could be improved by mapping trial_date to day numbers
            return true;
          });

          if (dayClasses.length === 0) {
            statusMap[day] = false;
            return;
          }

          // Check if the new enum field exists (after migration)
          const hasEnumField = Object.prototype.hasOwnProperty.call(dayClasses[0], 'release_mode');

          if (hasEnumField) {
            // Use new enum-based logic
            const hasReleasedResults = dayClasses.some(cls => {
              switch (cls.release_mode) {
                case 'immediate':
                  return true; // Always show for immediate mode
                case 'auto':
                  return cls.class_completed; // Auto-release: show when complete
                case 'released':
                  return true; // Manually released
                case 'hidden':
                default:
                  return false; // Hidden
              }
            });
            statusMap[day] = hasReleasedResults;
          } else if (Object.prototype.hasOwnProperty.call(dayClasses[0], 'auto_release_results')) {
            // Fallback to legacy boolean fields
            const hasReleasedResults = dayClasses.some(cls => {
              if (cls.auto_release_results) {
                return cls.class_completed; // Auto-release: show when complete
              } else {
                return cls.results_released === true; // Manual: show when explicitly released
              }
            });
            statusMap[day] = hasReleasedResults;
          } else {
            // Fallback for current database structure
            if (isNationals) {
              statusMap[day] = false; // Default to embargo for Nationals
            } else {
              statusMap[day] = true; // Allow results for regular shows
            }
          }
        });

        setDayCompletionStatus(statusMap);

        // Auto-select day for TV display
        // Show the most recent completed day, or current day if in progress
        let dayToShow = 1;
        if (statusMap[3] === true) dayToShow = 3;
        else if (statusMap[2] === true) dayToShow = 2;
        else if (statusMap[1] === true) dayToShow = 1;
        else dayToShow = currentDay; // Show current day even if not completed (will show embargo)

        setSelectedDay(dayToShow as 1 | 2 | 3);
      } else {
        // No completion data exists yet, show current day
        setSelectedDay(currentDay as 1 | 2 | 3);
        setDayCompletionStatus({});
      }

      // Make sure loading stops after checking status
      if (!shouldShowScores(selectedDay)) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking day completion:', error);
      // On error, stop loading and assume embargo
      setLoading(false);
    }
  };

  // Helper to get current competition day
  const getCurrentCompetitionDay = (): number => {
    // This could be set manually by event organizers or calculated
    // For now, determine by date (Feb 13=Day 1, Feb 14=Day 2, Feb 15=Day 3)
    const today = new Date();
    const eventStart = new Date('2025-02-13');
    const daysSinceStart = Math.floor((today.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < 0) return 1; // Before event
    if (daysSinceStart > 2) return 3; // After event
    return daysSinceStart + 1;
  };

  // Determine if scores should be shown for selected day
  const shouldShowScores = (day: number): boolean => {
    if (allowLiveScores) return true; // Override for testing

    // For testing/development: if it's not the actual competition dates, show empty state
    const today = new Date();
    const eventStart = new Date('2025-02-13');
    const eventEnd = new Date('2025-02-15');

    if (today < eventStart || today > eventEnd) {
      // Outside competition dates - show clean empty state
      return false;
    }

    // Show scores only if:
    // 1. Day is completed, OR
    // 2. Day is before current competition day
    return dayCompletionStatus[day] === true || day < currentCompetitionDay;
  };

  // Auto-rotation through completed days for TV display
  useEffect(() => {
    if (!autoRotate) return;

    const getCompletedDays = (): number[] => {
      return [1, 2, 3].filter(day => shouldShowScores(day));
    };

    const completedDays = getCompletedDays();

    if (completedDays.length <= 1) return; // No need to rotate if only 0-1 days

    const rotationInterval = setInterval(() => {
      // Only auto-rotate if user hasn't interacted recently (last 30 seconds)
      const timeSinceInteraction = Date.now() - lastUserInteraction;
      const userInactivityThreshold = 30000; // 30 seconds

      if (timeSinceInteraction > userInactivityThreshold) {
        setSelectedDay(prev => {
          const currentIndex = completedDays.indexOf(prev);
          const nextIndex = (currentIndex + 1) % completedDays.length;
          return completedDays[nextIndex] as 1 | 2 | 3;
        });
      }
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(rotationInterval);
  }, [dayCompletionStatus, autoRotate, lastUserInteraction]);

  // Handle user clicking day buttons
  const handleDaySelection = (day: 1 | 2 | 3) => {
    setSelectedDay(day);
    setLastUserInteraction(Date.now());
    // Temporarily disable auto-rotation for 2 minutes after user interaction
    setAutoRotate(false);
    setTimeout(() => setAutoRotate(true), 120000); // Re-enable after 2 minutes
  };

  // Fetch data when day changes or completion status updates
  useEffect(() => {
    checkDayCompletionStatus();
  }, [licenseKey]);

  useEffect(() => {
    if (shouldShowScores(selectedDay)) {
      fetchDayStatistics(selectedDay);
    } else {
      // Clear stats for embargoed day and stop loading
      setStats(null);
      setTopPerformers([]);
      setLoading(false);
    }
  }, [selectedDay, licenseKey, dayCompletionStatus]);

  // Loading state
  if (loading || scoresLoading || progressLoading) {
    return (
      <div className="yesterday-highlights loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading day statistics...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || scoresError) {
    return (
      <div className="yesterday-highlights error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">Unable to load statistics</div>
          <div className="error-detail">{error || scoresError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="highlights-container">
      {/* Modern Header with Gradient */}
      <div className="highlights-modern-header">
        <div className="header-content">
          <div className="header-icon-title">
            <div className="title-icon">🏆</div>
            <div className="title-text">
              <h1>Competition Highlights</h1>
              <div className="subtitle">AKC Scent Work Master National 2025</div>
            </div>
          </div>
          <div className="day-selector-modern">
            {[1, 2, 3].map(day => (
              <button
                key={day}
                className={`day-tab ${selectedDay === day ? 'active' : ''}`}
                onClick={() => handleDaySelection(day as 1 | 2 | 3)}
              >
                <span className="day-number">{day}</span>
                <span className="day-label">Day {day}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Statistics Cards Grid - Only When Scores Released */}
      {shouldShowScores(selectedDay) && stats && (
        <div className="highlights-content-modern">
          <div className="stats-cards-grid">
            <div className="modern-stat-card dogs-scored">
              <div className="stat-card-header">
                <div className="stat-icon-large">🏆</div>
                <div className="stat-trend positive">+{stats.completed_dogs}</div>
              </div>
              <div className="stat-main-value">{stats.completed_dogs}</div>
              <div className="stat-card-label">Dogs Scored</div>
              <div className="stat-card-detail">of {stats.total_dogs} total entries</div>
              <div className="stat-progress-bar">
                <div
                  className="stat-progress-fill"
                  style={{ width: `${stats.total_dogs > 0 ? (stats.completed_dogs / stats.total_dogs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="modern-stat-card perfect-runs">
              <div className="stat-card-header">
                <div className="stat-icon-large">⭐</div>
                <div className="stat-badge">PERFECT</div>
              </div>
              <div className="stat-main-value">{stats.perfect_scores}</div>
              <div className="stat-card-label">Perfect Runs</div>
              <div className="stat-card-detail">No faults or errors</div>
              <div className="achievement-indicator">
                {stats.perfect_scores > 0 ? '🏅 Excellence' : '🎯 Ready to achieve'}
              </div>
            </div>

            <div className="modern-stat-card average-score">
              <div className="stat-card-header">
                <div className="stat-icon-large">📈</div>
                <div className="score-indicator">{formatPoints(stats.average_score)}</div>
              </div>
              <div className="stat-main-value">{Math.abs(stats.average_score)}</div>
              <div className="stat-card-label">Average Score</div>
              <div className="stat-card-detail">All elements combined</div>
              <div className="score-breakdown">
                <span className="breakdown-item">Per dog average</span>
              </div>
            </div>

            <div className="modern-stat-card fastest-time">
              <div className="stat-card-header">
                <div className="stat-icon-large">⚡</div>
                <div className="time-badge">FASTEST</div>
              </div>
              <div className="stat-main-value time-value">{stats.fastest_search}</div>
              <div className="stat-card-label">Fastest Search</div>
              <div className="stat-card-detail">{stats.fastest_dog}</div>
              <div className="speed-indicator">
                {stats.fastest_search !== '0:00' ? '🚀 Lightning fast' : '⏱️ Awaiting times'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="top-performers">
          <div className="section-header">
            <h3>🌟 Top Performances - Day {selectedDay}</h3>
            <div className="section-subtitle">Highest scoring runs by element</div>
          </div>
          <div className="performers-grid">
            {topPerformers.map((performer, index) => (
              <div key={`${performer.id}-${performer.element_name}`} className="performer-card">
                <div className="performer-rank">#{index + 1}</div>
                <div className="performer-info">
                  <div className="performer-primary">
                    <span className="performer-name">{performer.call_name}</span>
                    <span className="performer-armband">#{performer.armband}</span>
                  </div>
                  <div className="performer-secondary">
                    <span className="performer-breed">{performer.breed}</span>
                    <span className="performer-element">{performer.element_name}</span>
                  </div>
                  <div className="performer-handler">{performer.handler}</div>
                </div>
                <div className="performer-stats">
                  <div className="performer-score">
                    <span className="score-label">Score</span>
                    <span className="score-value">{formatPoints(performer.total_score)}</span>
                  </div>
                  <div className="performer-time">
                    <span className="time-label">Time</span>
                    <span className="time-value">{performer.fastest_search}</span>
                  </div>
                  {performer.perfect_scores > 0 && (
                    <div className="perfect-badge">⭐ PERFECT</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breed Statistics */}
      {stats && stats.top_breeds.length > 0 && (
        <div className="breed-stats">
          <div className="section-header">
            <h3>🐕 Top Performing Breeds</h3>
            <div className="section-subtitle">Day {selectedDay} breed averages</div>
          </div>
          <div className="breeds-grid">
            {stats.top_breeds.map((breed, index) => (
              <div key={breed.breed} className="breed-card">
                <div className="breed-rank">#{index + 1}</div>
                <div className="breed-info">
                  <div className="breed-name">{breed.breed}</div>
                  <div className="breed-count">{breed.count} dogs</div>
                </div>
                <div className="breed-stats-detail">
                  <div className="breed-stat">
                    <span className="stat-label">Avg</span>
                    <span className="stat-value">{formatPoints(breed.average_score)}</span>
                  </div>
                  <div className="breed-stat">
                    <span className="stat-label">Top</span>
                    <span className="stat-value">{formatPoints(breed.top_score)}</span>
                  </div>
                  <div className="breed-stat">
                    <span className="stat-label">Perfect</span>
                    <span className="stat-value">{breed.perfect_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competition Integrity Protection */}
      {!shouldShowScores(selectedDay) && (
        <div className="highlights-content-modern">
          <div className="embargo-state">
            <div className="embargo-icon">🔒</div>
            <div className="embargo-title">Competition in Progress</div>
            <div className="embargo-message">
              Results for Day {selectedDay} will be released after all dogs have competed
            </div>
          </div>
        </div>
      )}

      {/* Empty State - No Content When Day Completed But No Data */}
      {shouldShowScores(selectedDay) && (!stats || stats.completed_dogs === 0) && (
        <div className="highlights-content-modern">
          {/* Completely empty - just the clean header above */}
        </div>
      )}
    </div>
  );
};