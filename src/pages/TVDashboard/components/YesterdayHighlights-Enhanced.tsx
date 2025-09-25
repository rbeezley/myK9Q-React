/**
 * Enhanced Competition Highlights Component
 *
 * Trial-based organization supporting both National and Regular shows.
 * Includes High in Trial calculations for regular shows.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import './YesterdayHighlights.css';

interface Trial {
  trial_date: string;
  trial_number: string;
  trial_type?: string;
}

interface ShowInfo {
  showtype: string;
  showname: string;
}

interface HighInTrialWinner {
  armband: string;
  call_name: string;
  breed: string;
  handler: string;
  level: string;
  total_faults: number;
  total_time: number;
  elements_completed: string[];
}

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
  trial_date: string;
  trial_number: string;
}

interface BreedStats {
  breed: string;
  count: number;
  average_score: number;
  top_score: number;
  perfect_count: number;
}

interface TrialStats {
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
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [highInTrialWinners, setHighInTrialWinners] = useState<HighInTrialWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(Date.now());

  // Fetch available trials from database
  const fetchAvailableTrials = async () => {
    try {
      // First get the show by license key
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select('id')
        .eq('license_key', licenseKey)
        .single();

      if (showError) throw showError;

      // Then get trials for this show
      const { data, error } = await supabase
        .from('trials')
        .select('trial_date, trial_number, trial_type')
        .eq('show_id', showData.id)
        .order('trial_date', { ascending: true });

      if (error) throw error;

      const trialsData = data?.map(trial => ({
        trial_date: trial.trial_date,
        trial_number: trial.trial_number,
        trial_type: trial.trial_type
      })) || [];

      setTrials(trialsData);

      // Set first available trial as selected
      if (trialsData.length > 0 && !selectedTrial) {
        setSelectedTrial(trialsData[0]);
      }
    } catch (err) {
      console.error('Error fetching available trials:', err);
      setTrials([]);
    }
  };

  // Fetch show information to determine if High in Trial should be shown
  const fetchShowInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('competition_type, show_name')
        .eq('license_key', licenseKey)
        .single();

      if (error) throw error;
      setShowInfo({
        showtype: data.competition_type || 'Regular',
        showname: data.show_name || 'Unknown Show'
      });
    } catch (err) {
      console.error('Error fetching show info:', err);
      setShowInfo({ showtype: 'Regular', showname: 'Unknown Show' });
    }
  };

  // Calculate High in Trial winners for regular shows
  const calculateHighInTrial = async (trial: Trial): Promise<HighInTrialWinner[]> => {
    if (!showInfo || showInfo.showtype !== 'Regular') {
      return [];
    }

    try {
      // Get all elements and levels offered in this trial using normalized view
      const { data: elementsData, error: elementsError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('element, level')
        .eq('license_key', licenseKey)
        .eq('trial_date', trial.trial_date)
        .eq('trial_number', trial.trial_number)
        .neq('element', 'HD'); // Exclude Handler Discrimination

      if (elementsError) throw elementsError;

      // Group by level
      const levelElements = new Map<string, string[]>();
      elementsData?.forEach(item => {
        if (!levelElements.has(item.level)) {
          levelElements.set(item.level, []);
        }
        levelElements.get(item.level)!.push(item.element);
      });

      const winners: HighInTrialWinner[] = [];

      // Calculate HIT for each level that has multiple elements
      for (const [level, elements] of levelElements.entries()) {
        if (elements.length < 2) continue; // Need multiple elements for HIT

        // Get qualifying dogs for this level using normalized view
        const { data: qualifyingDogs, error: dogsError } = await supabase
          .from('view_entry_class_join_normalized')
          .select('armband, call_name, breed, handler, element, fault_count, search_time')
          .eq('license_key', licenseKey)
          .eq('trial_date', trial.trial_date)
          .eq('trial_number', trial.trial_number)
          .eq('level', level)
          .eq('result_text', 'Q')
          .in('element', elements);

        if (dogsError) throw dogsError;

        // Group by armband and check if they qualified in ALL elements
        const dogStats = new Map<string, {
          armband: string;
          call_name: string;
          breed: string;
          handler: string;
          total_faults: number;
          total_time: number;
          elements_completed: string[];
        }>();

        qualifyingDogs?.forEach(dog => {
          const key = dog.armband.toString();
          if (!dogStats.has(key)) {
            dogStats.set(key, {
              armband: dog.armband.toString(),
              call_name: dog.call_name,
              breed: dog.breed,
              handler: dog.handler,
              total_faults: 0,
              total_time: 0,
              elements_completed: []
            });
          }

          const stats = dogStats.get(key)!;
          stats.total_faults += dog.fault_count || 0;
          stats.total_time += parseFloat(dog.search_time || '0');
          stats.elements_completed.push(dog.element);
        });

        // Filter dogs who completed ALL offered elements
        const eligibleDogs = Array.from(dogStats.values())
          .filter(dog => dog.elements_completed.length === elements.length);

        if (eligibleDogs.length > 0) {
          // Sort by faults (ascending), then by time (ascending)
          eligibleDogs.sort((a, b) => {
            if (a.total_faults !== b.total_faults) {
              return a.total_faults - b.total_faults;
            }
            return a.total_time - b.total_time;
          });

          // Winner is the first dog
          const winner = eligibleDogs[0];
          winners.push({
            ...winner,
            level
          });
        }
      }

      return winners;
    } catch (err) {
      console.error('Error calculating High in Trial:', err);
      return [];
    }
  };

  // Fetch detailed trial statistics
  const fetchTrialStatistics = async (trial: Trial) => {
    try {
      setLoading(true);
      setError(null);

      // Get entry data for the selected trial using normalized view
      const { data: trialEntries, error: entriesError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('trial_date', trial.trial_date)
        .eq('trial_number', trial.trial_number)
        .eq('is_scored', true);

      if (entriesError) throw entriesError;

      if (!trialEntries || trialEntries.length === 0) {
        // No data for this trial yet
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

      // Process statistics
      const processedStats = processTrialStatistics(trialEntries);
      setStats(processedStats);

      // Process top performers
      const processedPerformers = processTopPerformers(trialEntries, trial);
      setTopPerformers(processedPerformers);

      // Calculate High in Trial winners if applicable
      const hitWinners = await calculateHighInTrial(trial);
      setHighInTrialWinners(hitWinners);
      setTopPerformers(processedPerformers);

    } catch (error) {
      console.error('❌ Error fetching trial statistics:', error);
      setError('Unable to load trial statistics');
    } finally {
      setLoading(false);
    }
  };

  // Process trial statistics from entry data
  const processTrialStatistics = (entries: any[]): TrialStats => {
    // Group entries by armband to get unique dogs
    const dogMap = new Map<string, any[]>();
    entries.forEach(entry => {
      const key = entry.armband.toString();
      if (!dogMap.has(key)) {
        dogMap.set(key, []);
      }
      dogMap.get(key)!.push(entry);
    });

    // Calculate statistics
    const totalDogs = dogMap.size;
    const completedDogs = dogMap.size;
    let perfectScores = 0;
    let fastestTime = Number.MAX_SAFE_INTEGER;
    let fastestDog = 'No times recorded';

    // Breed statistics
    const breedStats = new Map<string, { count: number; perfectCount: number }>();

    dogMap.forEach((dogEntries) => {
      if (dogEntries.length === 0) return;

      const firstEntry = dogEntries[0];
      const breed = firstEntry.breed || 'Mixed Breed';

      // Initialize breed stats
      if (!breedStats.has(breed)) {
        breedStats.set(breed, { count: 0, perfectCount: 0 });
      }

      const breedStat = breedStats.get(breed)!;
      breedStat.count++;

      // Calculate total time for this dog across all elements
      const totalTime = dogEntries.reduce((sum, entry) => {
        const time = parseFloat(entry.search_time || '0');
        return sum + time;
      }, 0);

      // Check for perfect scores (all qualifying runs with no faults)
      const isPerfect = dogEntries.every(entry =>
        entry.result_text === 'Q' &&
        (entry.fault_count || 0) === 0
      );

      if (isPerfect && dogEntries.length > 1) { // Only count if multiple elements
        perfectScores++;
        breedStat.perfectCount++;
      }

      // Track fastest time
      if (totalTime > 0 && totalTime < fastestTime) {
        fastestTime = totalTime;
        fastestDog = firstEntry.call_name || 'Unknown';
      }
    });

    // Process breed statistics
    const topBreeds: BreedStats[] = Array.from(breedStats.entries())
      .map(([breed, stats]) => ({
        breed,
        count: stats.count,
        average_score: 0, // Not applicable for scent work
        top_score: 0, // Not applicable for scent work
        perfect_count: stats.perfectCount
      }))
      .sort((a, b) => b.perfect_count - a.perfect_count || b.count - a.count)
      .slice(0, 5);

    return {
      total_dogs: totalDogs,
      completed_dogs: completedDogs,
      perfect_scores: perfectScores,
      average_score: 0, // Not applicable for scent work scoring
      fastest_search: formatTime(fastestTime === Number.MAX_SAFE_INTEGER ? 0 : fastestTime),
      fastest_dog: fastestDog,
      top_breeds: topBreeds
    };
  };

  // Process top performers for the trial
  const processTopPerformers = (entries: any[], trial: Trial): TopPerformer[] => {
    // Group by armband and element to get best performance per dog per element
    const performanceMap = new Map<string, TopPerformer>();

    entries.forEach(entry => {
      const key = `${entry.armband}-${entry.element}`;
      const isQualifying = entry.result_text === 'Q';
      const faultCount = entry.fault_count || 0;
      const searchTime = parseFloat(entry.search_time || '0');

      // Only include qualifying runs with good times
      if (isQualifying && searchTime > 0) {
        performanceMap.set(key, {
          id: entry.id,
          armband: entry.armband.toString(),
          call_name: entry.call_name || 'Unknown',
          breed: entry.breed || 'Mixed Breed',
          handler: entry.handler || 'Unknown',
          handler_location: entry.handler_location || '',
          total_score: faultCount === 0 ? 100 : Math.max(0, 100 - (faultCount * 10)), // Simple scoring
          perfect_scores: faultCount === 0 ? 1 : 0,
          fastest_search: formatTime(searchTime),
          element_name: getElementDisplayName(entry.element),
          trial_date: trial.trial_date,
          trial_number: trial.trial_number
        });
      }
    });

    // Sort by perfect scores first, then by time (fastest)
    return Array.from(performanceMap.values())
      .sort((a, b) => {
        if (a.perfect_scores !== b.perfect_scores) {
          return b.perfect_scores - a.perfect_scores; // Perfect scores first
        }
        // Then by fastest time
        const timeA = parseFloat(a.fastest_search.replace(':', '.').replace('0.', '0'));
        const timeB = parseFloat(b.fastest_search.replace(':', '.').replace('0.', '0'));
        return timeA - timeB;
      })
      .slice(0, 10);
  };

  // Helper functions (formatTime defined below)

  const getElementDisplayName = (element: string): string => {
    switch (element?.toUpperCase()) {
      case 'CONTAINER': return 'Container';
      case 'BURIED': return 'Buried';
      case 'INTERIOR': return 'Interior';
      case 'EXTERIOR': return 'Exterior';
      case 'HD': return 'Handler Discrimination';
      default: return element || 'Unknown';
    }
  };

  const formatTrialDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatFaults = (faults: number): string => {
    return faults === 0 ? 'Perfect' : `${faults} fault${faults !== 1 ? 's' : ''}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check trial completion status and auto-select trial for TV display
  const checkTrialCompletionStatus = async () => {
    try {
      // For now, just show all trials as available
      // In the future, this could implement embargo logic per trial
      setLoading(false);
    } catch (error) {
      console.error('Error checking trial completion:', error);
      setLoading(false);
    }
  };

  // Handle trial selection
  const handleTrialSelection = (trial: Trial) => {
    setSelectedTrial(trial);
    setLastUserInteraction(Date.now());
    setAutoRotate(false);
    setTimeout(() => setAutoRotate(true), 120000); // Re-enable after 2 minutes
  };

  // Determine if scores should be shown for selected trial
  const shouldShowScores = (): boolean => {
    return allowLiveScores || selectedTrial !== null;
  };

  // Auto-rotation through available trials for TV display
  useEffect(() => {
    if (!autoRotate || trials.length <= 1) return;

    const rotationInterval = setInterval(() => {
      // Only auto-rotate if user hasn't interacted recently (last 30 seconds)
      const timeSinceInteraction = Date.now() - lastUserInteraction;
      const userInactivityThreshold = 30000; // 30 seconds

      if (timeSinceInteraction > userInactivityThreshold) {
        setSelectedTrial(prev => {
          if (!prev) return trials[0];
          const currentIndex = trials.findIndex(t =>
            t.trial_date === prev.trial_date && t.trial_number === prev.trial_number
          );
          const nextIndex = (currentIndex + 1) % trials.length;
          return trials[nextIndex];
        });
      }
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(rotationInterval);
  }, [trials, autoRotate, lastUserInteraction]);


  // Fetch data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchShowInfo();
      await fetchAvailableTrials();
      await checkTrialCompletionStatus();
    };
    initializeData();
  }, [licenseKey]);

  // Fetch trial data when selected trial changes
  useEffect(() => {
    if (selectedTrial && shouldShowScores()) {
      fetchTrialStatistics(selectedTrial);
    } else {
      // Clear stats and stop loading
      setStats(null);
      setTopPerformers([]);
      setHighInTrialWinners([]);
      setLoading(false);
    }
  }, [selectedTrial, licenseKey]);

  // Loading state
  if (loading) {
    return (
      <div className="yesterday-highlights loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading trial statistics...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="yesterday-highlights error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">Unable to load statistics</div>
          <div className="error-detail">{error}</div>
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
              <div className="subtitle">{showInfo?.showname || 'Competition Results'}</div>
            </div>
          </div>
          <div className="trial-selector-modern">
            {trials.map(trial => (
              <button
                key={`${trial.trial_date}-${trial.trial_number}`}
                className={`trial-tab ${
                  selectedTrial?.trial_date === trial.trial_date &&
                  selectedTrial?.trial_number === trial.trial_number
                    ? 'active' : ''
                }`}
                onClick={() => handleTrialSelection(trial)}
              >
                <span className="trial-number">{trial.trial_number}</span>
                <span className="trial-date">{formatTrialDate(trial.trial_date)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High in Trial Section - Regular Shows Only */}
      {shouldShowScores() && showInfo?.showtype === 'Regular' && highInTrialWinners.length > 0 && (
        <div className="highlights-content-modern">
          <div className="high-in-trial-section">
            <div className="section-header">
              <h3>🏆 High in Trial Awards</h3>
              <div className="section-subtitle">
                {selectedTrial ? `${selectedTrial.trial_number} - ${formatTrialDate(selectedTrial.trial_date)}` : ''}
              </div>
            </div>
            <div className="hit-winners-grid">
              {highInTrialWinners.map((winner) => (
                <div key={`${winner.armband}-${winner.level}`} className="hit-winner-card">
                  <div className="hit-level-badge">{winner.level} HIT</div>
                  <div className="hit-winner-info">
                    <div className="hit-primary">
                      <span className="hit-name">{winner.call_name}</span>
                      <span className="hit-armband">#{winner.armband}</span>
                    </div>
                    <div className="hit-secondary">
                      <span className="hit-breed">{winner.breed}</span>
                      <span className="hit-handler">{winner.handler}</span>
                    </div>
                  </div>
                  <div className="hit-performance">
                    <div className="hit-stat">
                      <span className="hit-stat-label">Faults</span>
                      <span className="hit-stat-value">{formatFaults(winner.total_faults)}</span>
                    </div>
                    <div className="hit-stat">
                      <span className="hit-stat-label">Time</span>
                      <span className="hit-stat-value">{formatTime(winner.total_time)}</span>
                    </div>
                  </div>
                  <div className="hit-elements">
                    <span className="elements-label">Elements:</span>
                    <span className="elements-list">{winner.elements_completed.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modern Statistics Cards Grid - Only When Scores Released */}
      {shouldShowScores() && stats && (
        <div className="highlights-content-modern">
          <div className="stats-cards-grid">
            <div className="modern-stat-card dogs-scored">
              <div className="stat-card-header">
                <div className="stat-icon-large">🏆</div>
                <div className="stat-trend positive">+{stats.completed_dogs}</div>
              </div>
              <div className="stat-main-value">{stats.completed_dogs}</div>
              <div className="stat-card-label">Dogs Scored</div>
              <div className="stat-card-detail">in {selectedTrial ? selectedTrial.trial_number : 'this trial'}</div>
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
              <div className="stat-card-detail">No faults across elements</div>
              <div className="achievement-indicator">
                {stats.perfect_scores > 0 ? '🏅 Excellence' : '🎯 Ready to achieve'}
              </div>
            </div>

            {stats.completed_dogs >= 5 && stats.fastest_search !== '0:00' ? (
              <div className="modern-stat-card fastest-time">
                <div className="stat-card-header">
                  <div className="stat-icon-large">⚡</div>
                  <div className="time-badge">FASTEST</div>
                </div>
                <div className="stat-main-value time-value">{stats.fastest_search}</div>
                <div className="stat-card-label">Fastest Search</div>
                <div className="stat-card-detail">{stats.fastest_dog}</div>
                <div className="speed-indicator">🚀 Lightning fast</div>
              </div>
            ) : (
              <div className="modern-stat-card progress-card">
                <div className="stat-card-header">
                  <div className="stat-icon-large">📊</div>
                  <div className="progress-badge">PROGRESS</div>
                </div>
                <div className="stat-main-value">{Math.round((stats.completed_dogs / stats.total_dogs) * 100)}%</div>
                <div className="stat-card-label">Competition Progress</div>
                <div className="stat-card-detail">{stats.completed_dogs} of {stats.total_dogs} scored</div>
                <div className="progress-indicator">📈 In progress</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="top-performers">
          <div className="section-header">
            <h3>🌟 Top Performances</h3>
            <div className="section-subtitle">
              {selectedTrial ? `${selectedTrial.trial_number} - ${formatTrialDate(selectedTrial.trial_date)}` : 'Best qualifying runs by element'}
            </div>
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


      {/* Empty State */}
      {trials.length === 0 && (
        <div className="highlights-content-modern">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No Trials Available</div>
            <div className="empty-message">
              Trial data will appear here when trials are uploaded to the system.
            </div>
          </div>
        </div>
      )}

      {/* No Trial Selected State */}
      {trials.length > 0 && !selectedTrial && (
        <div className="highlights-content-modern">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Select a Trial</div>
            <div className="empty-message">
              Choose a trial above to view competition highlights and statistics.
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {shouldShowScores() && selectedTrial && (!stats || stats.completed_dogs === 0) && (
        <div className="highlights-content-modern">
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-title">No Results Yet</div>
            <div className="empty-message">
              Results for {selectedTrial.trial_number} will appear as dogs compete.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YesterdayHighlightsEnhanced;