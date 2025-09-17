import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface TrialData {
  trial_date: string;
  trial_number: string;
  class_total_count: number;
  entry_total_count: number;
  class_completed_count: number;
  entry_completed_count: number;
}

interface DailyResultsProps {
  licenseKey: string;
}

export const DailyResults: React.FC<DailyResultsProps> = ({ licenseKey }) => {
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrialData();
  }, [licenseKey]);

  const fetchTrialData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tbl_trial_queue')
        .select('trial_date, trial_number, class_total_count, entry_total_count, class_completed_count, entry_completed_count')
        .eq('mobile_app_lic_key', licenseKey)
        .order('trial_date', { ascending: true });

      if (error) throw error;
      setTrials(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trial data:', err);
      setError('Failed to load trial data');
    } finally {
      setLoading(false);
    }
  };

  const formatTrialDate = (dateString: string) => {
    // Handle both "Sunday, October 12, 2025" format and ISO dates
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If parsing fails, return the original string
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getDayNumber = (index: number) => {
    return `Day ${index + 1}`;
  };

  if (loading) {
    return (
      <div className="daily-results loading">
        <div className="daily-results-header">
          <h3>📅 Competition Days</h3>
        </div>
        <div className="loading-message">Loading trial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-results error">
        <div className="daily-results-header">
          <h3>📅 Competition Days</h3>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="daily-results">
      <div className="daily-results-header">
        <h3>📅 Competition Days</h3>
        <div className="results-subtitle">
          {trials.length === 1 ? '1 Day Loaded' : `${trials.length} Days Loaded`} • Live Results
        </div>
      </div>

      <div className="days-grid">
        {trials.map((trial, index) => {
          const entryProgress = getCompletionPercentage(trial.entry_completed_count, trial.entry_total_count);
          const classProgress = getCompletionPercentage(trial.class_completed_count, trial.class_total_count);

          return (
            <div key={`${trial.trial_date}-${index}`} className="day-card">
              <div className="day-header">
                <div className="day-number">{getDayNumber(index)}</div>
                <div className="day-status">
                  {trial.entry_completed_count === trial.entry_total_count ? '✅ Complete' : '🔄 In Progress'}
                </div>
              </div>

              <div className="day-date">
                {formatTrialDate(trial.trial_date)}
              </div>

              <div className="day-stats">
                <div className="stat-row">
                  <span className="stat-label">Dogs</span>
                  <span className="stat-value">
                    {trial.entry_completed_count}/{trial.entry_total_count}
                  </span>
                  <span className="stat-percentage">({entryProgress}%)</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">Classes</span>
                  <span className="stat-value">
                    {trial.class_completed_count}/{trial.class_total_count}
                  </span>
                  <span className="stat-percentage">({classProgress}%)</span>
                </div>
              </div>

              <div className="progress-bars">
                <div className="progress-bar">
                  <div className="progress-label">Dogs Progress</div>
                  <div className="progress-track">
                    <div
                      className="progress-fill dogs"
                      style={{ width: `${entryProgress}%` }}
                    />
                  </div>
                </div>

                <div className="progress-bar">
                  <div className="progress-label">Classes Progress</div>
                  <div className="progress-track">
                    <div
                      className="progress-fill classes"
                      style={{ width: `${classProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {trials.length === 0 && (
        <div className="no-trials">
          <div className="no-trials-icon">📋</div>
          <h4>No Competition Days</h4>
          <p>Trial data will appear here as days are added to the system.</p>
        </div>
      )}
    </div>
  );
};

export default DailyResults;