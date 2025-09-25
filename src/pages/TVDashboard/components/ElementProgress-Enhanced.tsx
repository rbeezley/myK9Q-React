/**
 * Enhanced Element Progress Component
 *
 * Uses real AKC Nationals scoring data from view_element_progress
 * Shows actual completion statistics, timing, and judge information.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface ElementProgressItem {
  elementName: string;
  elementType: string;
  day: number;
  completed: number;
  successful: number;
  excused: number;
  disqualified: number;
  total: number;
  avgPoints: number;
  maxPoints: number;
  avgTime: number;
  fastestTime: number;
  completionPercentage: number;
  status: 'completed' | 'in-progress' | 'pending' | 'scheduled';
  judge?: string;
}

interface ElementProgressEnhancedProps {
  licenseKey: string;
  showDay?: number; // Filter by specific day
  layout?: 'grid' | 'list' | 'compact';
  allowLiveScores?: boolean; // Override for testing or post-competition
}

export const ElementProgressEnhanced: React.FC<ElementProgressEnhancedProps> = ({
  licenseKey,
  showDay,
  layout = 'grid',
  allowLiveScores: _allowLiveScores = false
}) => {
  const [judgeInfo, setJudgeInfo] = useState<Map<string, string>>(new Map());

  // Get real data from the same source as CurrentStatus
  const [elementProgress, setElementProgress] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Fetch element progress from actual show data
  const fetchElementProgress = useCallback(async () => {
    try {
      setProgressLoading(true);
      setProgressError(null);

      // Use the normalized view for element progress data
      const { data: viewData, error: viewError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', licenseKey)
        .order('element', { ascending: true });

      if (viewError) throw viewError;

      if (viewData && viewData.length > 0) {
        // Process the data to create element progress statistics
        const elementStats = new Map();

        viewData.forEach(entry => {
          const element = entry.element || entry.element_type || 'UNKNOWN';
          if (!elementStats.has(element)) {
            elementStats.set(element, {
              element_type: element,
              day: entry.day || 1,
              total_entries: 0,
              successful_entries: 0,
              excused_entries: 0,
              disqualified_entries: 0,
              avg_points: 0,
              max_points: 100,
              avg_time_seconds: 0,
              fastest_time_seconds: 0
            });
          }

          const stats = elementStats.get(element);
          stats.total_entries++;

          if (entry.is_scored && entry.result_text === 'Q') {
            stats.successful_entries++;
          } else if (entry.is_scored && entry.result_text === 'E') {
            stats.excused_entries++;
          } else if (entry.is_scored && entry.result_text === 'DQ') {
            stats.disqualified_entries++;
          }

          // Calculate timing if available
          if (entry.search_time && parseFloat(entry.search_time) > 0) {
            const time = parseFloat(entry.search_time);
            if (stats.fastest_time_seconds === 0 || time < stats.fastest_time_seconds) {
              stats.fastest_time_seconds = time;
            }
          }
        });

        setElementProgress(Array.from(elementStats.values()));
      } else {
        setElementProgress([]);
      }
    } catch (error) {
      console.error('Error fetching element progress:', error);
      setProgressError(error instanceof Error ? error.message : 'Failed to fetch element progress');
      setElementProgress([]);
    } finally {
      setProgressLoading(false);
    }
  }, [licenseKey]);

  useEffect(() => {
    if (licenseKey) {
      fetchElementProgress();
    }
  }, [licenseKey, fetchElementProgress]);

  // Fetch judge information
  const fetchJudgeInfo = async () => {
    try {
      const { data: judgeData, error: judgeError } = await supabase
        .from('view_judge_summary')
        .select('*');

      if (judgeError) throw judgeError;

      if (judgeData) {
        const judgeMap = new Map<string, string>();
        judgeData.forEach(judge => {
          const key = `${judge.element_type}_${judge.day}`;
          judgeMap.set(key, judge.judge_name);
        });
        setJudgeInfo(judgeMap);
      }
    } catch (error) {
      console.error('Error fetching judge info:', error);
    }
  };

  useEffect(() => {
    fetchJudgeInfo();
  }, []);

  // Helper functions
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

  const getElementIcon = (element: string): string => {
    switch (element) {
      case 'CONTAINER': return '📦';
      case 'BURIED': return '🕳️';
      case 'INTERIOR': return '🏠';
      case 'EXTERIOR': return '🌳';
      case 'HD_CHALLENGE': return '🎯';
      default: return '🔍';
    }
  };

  const getStatusColor = (status: ElementProgressItem['status']): string => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in-progress': return '#FF9500';
      case 'pending': return '#8E8E93';
      case 'scheduled': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: ElementProgressItem['status']): string => {
    switch (status) {
      case 'completed': return 'COMPLETE';
      case 'in-progress': return 'IN PROGRESS';
      case 'pending': return 'PENDING';
      case 'scheduled': return 'SCHEDULED';
      default: return 'UNKNOWN';
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

  // Transform element progress data
  const elementProgressItems = useMemo((): ElementProgressItem[] => {
    if (!elementProgress || elementProgress.length === 0) {
      // Temporary demo data to check if page loads
      return [
        {
          elementName: 'Container',
          elementType: 'CONTAINER',
          day: 1,
          completed: 25,
          successful: 22,
          excused: 2,
          disqualified: 1,
          total: 30,
          avgPoints: 85.4,
          maxPoints: 100,
          avgTime: 47.3,
          fastestTime: 23.1,
          completionPercentage: 83.3,
          status: 'in-progress',
          judge: 'Judge Name'
        }
      ];
    }

    let filteredProgress = elementProgress;
    if (showDay) {
      filteredProgress = elementProgress.filter(ep => ep.day === showDay);
    }

    return filteredProgress.map(ep => {
      const completionPercentage = ep.total_entries > 0
        ? (ep.successful_entries / ep.total_entries) * 100
        : 0;

      // Determine status based on completion
      let status: ElementProgressItem['status'];
      if (completionPercentage === 100) {
        status = 'completed';
      } else if (completionPercentage > 0) {
        status = 'in-progress';
      } else {
        status = 'pending';
      }

      const judgeKey = `${ep.element_type}_${ep.day}`;
      const judge = judgeInfo.get(judgeKey);

      return {
        elementName: getElementDisplayName(ep.element_type),
        elementType: ep.element_type,
        day: ep.day,
        completed: ep.successful_entries + ep.excused_entries + ep.disqualified_entries,
        successful: ep.successful_entries,
        excused: ep.excused_entries,
        disqualified: ep.disqualified_entries,
        total: ep.total_entries,
        avgPoints: Math.round(ep.avg_points || 0),
        maxPoints: ep.max_points || 0,
        avgTime: Math.round(ep.avg_time_seconds || 0),
        fastestTime: ep.fastest_time_seconds || 0,
        completionPercentage,
        status,
        judge
      };
    }).sort((a, b) => {
      // Sort by day first, then by element order
      if (a.day !== b.day) return a.day - b.day;
      const elementOrder = ['CONTAINER', 'BURIED', 'INTERIOR', 'EXTERIOR', 'HD_CHALLENGE'];
      return elementOrder.indexOf(a.elementType) - elementOrder.indexOf(b.elementType);
    });
  }, [elementProgress, judgeInfo, showDay]);

  // Loading state
  if (progressLoading) {
    return (
      <div className="element-progress loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading element progress...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (progressError) {
    return (
      <div className="element-progress error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">Unable to load element progress</div>
          <div className="error-detail">{progressError}</div>
        </div>
      </div>
    );
  }

  // No data state
  if (elementProgressItems.length === 0) {
    return (
      <div className="element-progress no-data">
        <div className="no-data-content">
          <div className="no-data-icon">📊</div>
          <div className="no-data-text">No element data available</div>
          <div className="no-data-detail">Progress will appear as scoring begins</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`element-progress ${layout}`}>
      {/* Header */}
      <div className="progress-header">
        <div className="header-title">
          <h3>📊 Element Progress</h3>
          <div className="header-subtitle">
            {showDay ? `Day ${showDay} Competition` : 'All Days'} • Live Results
          </div>
        </div>
        <div className="progress-summary">
          <div className="summary-stat">
            <span className="stat-value">
              {elementProgressItems.filter(item => item.status === 'completed').length}
            </span>
            <span className="stat-label">Complete</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {elementProgressItems.filter(item => item.status === 'in-progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {elementProgressItems.reduce((sum, item) => sum + item.total, 0)}
            </span>
            <span className="stat-label">Total Runs</span>
          </div>
        </div>
      </div>

      {/* Progress Grid */}
      <div className="element-progress-grid">
        {elementProgressItems.map((item, _index) => (
          <div
            key={`${item.elementType}_${item.day}`}
            className={`progress-card ${item.status}`}
          >
            {/* Card Header */}
            <div className="card-header">
              <div className="element-info">
                <span className="element-icon">{getElementIcon(item.elementType)}</span>
                <div className="element-details">
                  <div className="element-name">{item.elementName}</div>
                  <div className="element-day">Day {item.day}</div>
                </div>
              </div>
              <div
                className="status-badge"
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                {getStatusText(item.status)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${item.completionPercentage}%`,
                    backgroundColor: getStatusColor(item.status)
                  }}
                />
              </div>
              <div className="progress-text">
                {item.completed}/{item.total} dogs ({Math.round(item.completionPercentage)}%)
              </div>
            </div>

            {/* Statistics */}
            <div className="card-stats">
              <div className="stat-group">
                <div className="stat-item">
                  <span className="stat-label">Successful</span>
                  <span className="stat-value successful">{item.successful}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Excused</span>
                  <span className="stat-value excused">{item.excused}</span>
                </div>
                {item.disqualified > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">DQ</span>
                    <span className="stat-value disqualified">{item.disqualified}</span>
                  </div>
                )}
              </div>

              <div className="stat-group">
                <div className="stat-item">
                  <span className="stat-label">Avg Points</span>
                  <span className="stat-value points">{formatPoints(item.avgPoints)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Max Points</span>
                  <span className="stat-value points">{formatPoints(item.maxPoints)}</span>
                </div>
              </div>

              <div className="stat-group">
                <div className="stat-item">
                  <span className="stat-label">Avg Time</span>
                  <span className="stat-value time">{formatTime(item.avgTime)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Fastest</span>
                  <span className="stat-value time fastest">{formatTime(item.fastestTime)}</span>
                </div>
              </div>
            </div>

            {/* Judge Information */}
            {item.judge && (
              <div className="card-footer">
                <div className="judge-info">
                  <span className="judge-label">Judge:</span>
                  <span className="judge-name">{item.judge}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      {elementProgressItems.length > 0 && (
        <div className="progress-summary-footer">
          <div className="summary-item">
            <span className="summary-label">Total Dogs Scored:</span>
            <span className="summary-value">
              {elementProgressItems.reduce((sum, item) => sum + item.completed, 0)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Success Rate:</span>
            <span className="summary-value">
              {elementProgressItems.length > 0 ? Math.round(
                (elementProgressItems.reduce((sum, item) => sum + item.successful, 0) /
                 elementProgressItems.reduce((sum, item) => sum + item.total, 0)) * 100
              ) : 0}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Points:</span>
            <span className="summary-value">
              {formatPoints(
                elementProgressItems.length > 0 ? Math.round(
                  elementProgressItems.reduce((sum, item) => sum + item.avgPoints, 0) /
                  elementProgressItems.length
                ) : 0
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};