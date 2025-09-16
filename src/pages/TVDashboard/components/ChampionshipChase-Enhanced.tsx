/**
 * Enhanced Championship Chase Component
 *
 * Replaces mock data with real AKC Nationals scoring data from nationals_rankings table.
 * Shows live leaderboard with real points, times, and qualification status.
 */

import React, { useState, useEffect } from 'react';
import { useNationalsScoring } from '../../../hooks/useNationalsScoring';
import './ChampionshipChase.css';

interface ChampionshipEntry {
  id: number;
  rank: number;
  armband: string;
  call_name: string;
  breed: string;
  handler: string;
  handler_location: string;
  combined_score: number;
  day1_score: number;
  day2_score: number;
  day3_score: number;
  total_time_seconds: number;
  status: 'qualified' | 'competing' | 'completed' | 'eliminated';
  elements_completed: number;
  total_elements: number;
  qualified_for_finals: boolean;
  completion_percentage: number;
}

interface ChampionshipChaseEnhancedProps {
  licenseKey: string;
  showCount?: number;
  allowLiveScores?: boolean; // Override for testing or post-competition
}

export const ChampionshipChaseEnhanced: React.FC<ChampionshipChaseEnhancedProps> = ({
  licenseKey,
  showCount = 20,
  allowLiveScores: _allowLiveScores = false
}) => {
  const [topQualifiers, setTopQualifiers] = useState<ChampionshipEntry[]>([]);
  const [currentLeader, setCurrentLeader] = useState<ChampionshipEntry | null>(null);
  const [totalQualified, setTotalQualified] = useState(0);
  const [viewMode, setViewMode] = useState<'leaderboard' | 'bracket' | 'progress'>('leaderboard');

  // Use our Nationals scoring hook
  const {
    leaderboard,
    qualifiers,
    advancementStatus,
    isLoading,
    isConnected,
    error,
    getCurrentLeader,
    getTopDogs: _getTopDogs
  } = useNationalsScoring({
    licenseKey,
    enableRealtime: true,
    autoRefreshInterval: 15000 // Refresh every 15 seconds
  });

  // Transform leaderboard data to ChampionshipEntry format
  const transformToChampionshipEntry = (entry: any): ChampionshipEntry => {
    // Determine status based on completion and qualification
    let status: ChampionshipEntry['status'] = 'qualified';

    if (entry.completion_percentage === 100) {
      status = 'completed';
    } else if (entry.completion_percentage > 0) {
      status = 'competing';
    } else if (entry.eliminated || entry.withdrawal) {
      status = 'eliminated';
    }

    // Calculate elements completed from completion percentage
    const elements_completed = Math.round((entry.completion_percentage / 100) * 5); // 5 total elements

    return {
      id: entry.entry_id,
      rank: entry.rank || 0,
      armband: entry.armband,
      call_name: entry.call_name || 'Unknown Dog',
      breed: entry.breed || 'Mixed Breed',
      handler: entry.handler_name || 'Unknown Handler',
      handler_location: entry.handler_location || '',
      combined_score: entry.total_points,
      day1_score: entry.day1_points,
      day2_score: entry.day2_points,
      day3_score: entry.day3_points,
      total_time_seconds: entry.total_time_seconds,
      status,
      elements_completed,
      total_elements: 5, // Container, Buried, Interior, Exterior, HD Challenge
      qualified_for_finals: entry.qualified_for_finals,
      completion_percentage: entry.completion_percentage
    };
  };

  // Update data when leaderboard changes
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      const transformedEntries = leaderboard
        .slice(0, showCount)
        .map(transformToChampionshipEntry);

      setTopQualifiers(transformedEntries);

      // Set current leader (rank 1)
      const leader = getCurrentLeader();
      if (leader) {
        setCurrentLeader(transformToChampionshipEntry(leader));
      }

      // Count qualified entries
      setTotalQualified(qualifiers.length);
    }
  }, [leaderboard, qualifiers, showCount, getCurrentLeader]);

  // Cycle through view modes every 20 seconds
  useEffect(() => {
    const modes: typeof viewMode[] = ['leaderboard', 'bracket', 'progress'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[currentIndex]);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ChampionshipEntry['status']): string => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'competing': return '#FF9500';
      case 'qualified': return '#007AFF';
      case 'eliminated': return '#FF3B30';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: ChampionshipEntry['status']): string => {
    switch (status) {
      case 'completed': return 'FINISHED';
      case 'competing': return 'RUNNING';
      case 'qualified': return 'READY';
      case 'eliminated': return 'OUT';
      default: return 'PENDING';
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPoints = (points: number): string => {
    return points >= 0 ? `+${points}` : `${points}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="championship-chase loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading Championship Data...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="championship-chase error">
        <div className="error-icon">⚠️</div>
        <div className="error-text">Unable to load championship data</div>
        <div className="error-detail">{error}</div>
      </div>
    );
  }

  // Show no data state
  if (!topQualifiers.length) {
    return (
      <div className="championship-chase no-data">
        <div className="no-data-icon">📊</div>
        <div className="no-data-text">No championship data available</div>
        <div className="no-data-detail">Championship rankings will be released as each class completes</div>
      </div>
    );
  }

  return (
    <div className="championship-chase">
      {/* Connection Status Indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}
      </div>

      <div className="championship-header">
        <div className="championship-title">
          <h2>🏆 CHAMPIONSHIP CHASE</h2>
          <div className="championship-subtitle">
            AKC Scent Work Master National 2025 • Live Results
          </div>
        </div>
        <div className="championship-stats">
          <div className="stat-item">
            <div className="stat-value">{totalQualified}</div>
            <div className="stat-label">Qualified</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{topQualifiers.filter(q => q.status === 'competing').length}</div>
            <div className="stat-label">Running</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{topQualifiers.filter(q => q.status === 'completed').length}</div>
            <div className="stat-label">Finished</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{advancementStatus.cutLinePoints}</div>
            <div className="stat-label">Cut Line</div>
          </div>
        </div>
      </div>

      {/* Current Leader Spotlight */}
      {currentLeader && (
        <div className="current-leader">
          <div className="leader-badge">👑 CURRENT LEADER</div>
          <div className="leader-info">
            <div className="leader-primary">
              <span className="leader-armband">#{currentLeader.armband}</span>
              <span className="leader-name">{currentLeader.call_name}</span>
              <span className="leader-breed">{currentLeader.breed}</span>
            </div>
            <div className="leader-secondary">
              <span className="leader-handler">
                {currentLeader.handler}
                {currentLeader.handler_location && `, ${currentLeader.handler_location}`}
              </span>
              <span className="leader-score">{formatPoints(currentLeader.combined_score)} pts</span>
              <span className="leader-time">{formatTime(currentLeader.total_time_seconds)}</span>
            </div>
          </div>
          <div className="leader-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${currentLeader.completion_percentage}%`,
                  backgroundColor: getStatusColor(currentLeader.status)
                }}
              />
            </div>
            <div className="progress-text">
              {currentLeader.elements_completed}/{currentLeader.total_elements} Elements • {getStatusText(currentLeader.status)}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content Based on View Mode */}
      <div className="championship-content">
        {viewMode === 'leaderboard' && (
          <div className="leaderboard-view">
            <div className="leaderboard-header">
              <h3>🥇 TOP {showCount} LEADERBOARD</h3>
              <div className="view-indicator">Live Rankings</div>
            </div>
            <div className="leaderboard-list">
              {topQualifiers.map((entry, _index) => (
                <div key={entry.id} className={`leaderboard-entry ${entry.status}`}>
                  <div className="entry-rank">
                    <span className="rank-number">#{entry.rank}</span>
                    {entry.rank <= 3 && (
                      <span className="rank-medal">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>

                  <div className="entry-info">
                    <div className="entry-primary">
                      <span className="entry-armband">#{entry.armband}</span>
                      <span className="entry-name">{entry.call_name}</span>
                      <span className="entry-breed">{entry.breed}</span>
                    </div>
                    <div className="entry-secondary">
                      <span className="entry-handler">{entry.handler}</span>
                    </div>
                  </div>

                  <div className="entry-scores">
                    <div className="total-score">
                      <span className="score-label">Total</span>
                      <span className="score-value">{formatPoints(entry.combined_score)}</span>
                    </div>
                    <div className="daily-scores">
                      <span className="daily-score">D1: {entry.day1_score}</span>
                      <span className="daily-score">D2: {entry.day2_score}</span>
                      {entry.day3_score > 0 && (
                        <span className="daily-score">D3: {entry.day3_score}</span>
                      )}
                    </div>
                    <div className="total-time">
                      <span className="time-value">{formatTime(entry.total_time_seconds)}</span>
                    </div>
                  </div>

                  <div className="entry-status">
                    <div
                      className={`status-badge ${entry.status}`}
                      style={{ backgroundColor: getStatusColor(entry.status) }}
                    >
                      {getStatusText(entry.status)}
                    </div>
                    <div className="progress-mini">
                      <div
                        className="progress-mini-fill"
                        style={{
                          width: `${entry.completion_percentage}%`,
                          backgroundColor: getStatusColor(entry.status)
                        }}
                      />
                    </div>
                    <div className="elements-count">
                      {entry.elements_completed}/{entry.total_elements}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'bracket' && (
          <div className="bracket-view">
            <div className="bracket-header">
              <h3>🏆 FINALS BRACKET</h3>
              <div className="view-indicator">Top 100 Advance</div>
            </div>
            <div className="qualification-status">
              <div className="cut-line-info">
                <div className="cut-line-label">QUALIFICATION CUT LINE</div>
                <div className="cut-line-value">
                  {formatPoints(advancementStatus.cutLinePoints)} pts
                </div>
                <div className="cut-line-time">
                  {formatTime(advancementStatus.cutLineTime)}
                </div>
              </div>
              <div className="qualified-count">
                <div className="qualified-number">{totalQualified}</div>
                <div className="qualified-label">QUALIFIED FOR FINALS</div>
              </div>
            </div>
            <div className="bracket-zones">
              <div className="bracket-zone safe">
                <div className="zone-header">🟢 SAFE ZONE (Top 50)</div>
                <div className="zone-entries">
                  {topQualifiers.slice(0, Math.min(5, topQualifiers.length)).map(entry => (
                    <div key={entry.id} className="bracket-entry safe">
                      <span className="bracket-rank">#{entry.rank}</span>
                      <span className="bracket-name">{entry.call_name}</span>
                      <span className="bracket-score">{formatPoints(entry.combined_score)}</span>
                    </div>
                  ))}
                  {topQualifiers.length > 5 && (
                    <div className="more-entries">+{Math.min(45, topQualifiers.length - 5)} more in safe zone</div>
                  )}
                </div>
              </div>

              <div className="bracket-zone bubble">
                <div className="zone-header">🟡 BUBBLE ZONE (51-100)</div>
                <div className="zone-entries">
                  {topQualifiers.slice(5, Math.min(10, topQualifiers.length)).map(entry => (
                    <div key={entry.id} className="bracket-entry bubble">
                      <span className="bracket-rank">#{entry.rank}</span>
                      <span className="bracket-name">{entry.call_name}</span>
                      <span className="bracket-score">{formatPoints(entry.combined_score)}</span>
                    </div>
                  ))}
                  {topQualifiers.length > 10 && (
                    <div className="more-entries">+{Math.min(40, topQualifiers.length - 10)} more in bubble</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'progress' && (
          <div className="progress-view">
            <div className="progress-header">
              <h3>📊 COMPETITION PROGRESS</h3>
              <div className="view-indicator">Element Completion</div>
            </div>
            <div className="progress-grid">
              {['Container', 'Buried', 'Interior', 'Exterior', 'HD Challenge'].map((element, index) => {
                const completed = topQualifiers.filter(entry => entry.elements_completed > index).length;
                const percentage = topQualifiers.length > 0 ? (completed / topQualifiers.length) * 100 : 0;

                return (
                  <div key={element} className="progress-element">
                    <div className="element-header">
                      <div className="element-name">{element}</div>
                      <div className="element-stats">{completed}/{topQualifiers.length}</div>
                    </div>
                    <div className="element-progress-bar">
                      <div
                        className="element-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="element-percentage">{Math.round(percentage)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Indicator */}
      <div className="view-mode-tabs">
        <div className={`mode-tab ${viewMode === 'leaderboard' ? 'active' : ''}`}>
          Leaderboard
        </div>
        <div className={`mode-tab ${viewMode === 'bracket' ? 'active' : ''}`}>
          Bracket
        </div>
        <div className={`mode-tab ${viewMode === 'progress' ? 'active' : ''}`}>
          Progress
        </div>
      </div>
    </div>
  );
};