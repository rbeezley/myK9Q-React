/**
 * AutoCompleteSection Component
 *
 * Collapsible section for managing auto-complete stale classes settings.
 * When enabled (default), the system automatically completes stale in-progress
 * classes when a judge starts scoring a different level.
 */

import React from 'react';
import { Clock, Calendar, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import type { TrialInfo } from '../hooks/useCompetitionAdminData';
import { formatTrialDate } from '../../../utils/dateUtils';

export interface AutoCompleteSectionProps {
  /** Whether the section is expanded */
  isExpanded: boolean;
  /** Toggle section expansion */
  onToggleExpanded: () => void;
  /** Map of trial_id to auto_complete_stale_classes setting */
  trialAutoCompleteSettings: Map<number, boolean>;
  /** List of trials */
  trials: TrialInfo[];
  /** Handler for setting trial auto-complete */
  onSetTrialAutoComplete: (trialId: number, enabled: boolean) => void;
  /** Handler for resetting trial to default */
  onResetTrialAutoComplete: (trialId: number) => void;
}

export function AutoCompleteSection({
  isExpanded,
  onToggleExpanded,
  trialAutoCompleteSettings,
  trials,
  onSetTrialAutoComplete,
  onResetTrialAutoComplete,
}: AutoCompleteSectionProps): React.ReactElement {
  return (
    <div className="visibility-control-section autocomplete-section">
      <div className="visibility-header" onClick={onToggleExpanded}>
        <div className="visibility-title">
          <Clock className="section-icon" />
          <h3>Auto-Complete Stale Classes</h3>
        </div>
        <span className="expand-toggle">{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
      </div>

      {isExpanded && (
        <>
          {/* Explanation card */}
          <div className="visibility-explanation" style={{ marginBottom: '16px' }}>
            <h5>How It Works:</h5>
            <ul>
              <li><strong>When enabled (default):</strong> If a judge moves to scoring a different level while leaving a class stale for 15+ minutes, the system automatically marks remaining dogs as absent and completes the class.</li>
              <li><strong>Same level exception:</strong> Classes at the same level (e.g., Novice Buried + Novice Containers) are never auto-completed, allowing judges to alternate between them.</li>
              <li><strong>When disabled:</strong> Classes stay open until manually completed, which may leave unscored dogs.</li>
            </ul>
          </div>

          {/* Trial-level settings */}
          {trials.length > 0 && (
            <div className="trial-overrides-section">
              <h4><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Trial Settings</h4>
              <p className="section-description">
                Auto-complete is enabled by default. Disable for specific trials if judges need to work multiple levels simultaneously.
              </p>
              <div className="trial-rows-grid">
                {trials.map((trial) => {
                  const currentSetting = trialAutoCompleteSettings.get(trial.trial_id);
                  const isCustom = currentSetting !== undefined;
                  // Default is enabled (true) when not explicitly set
                  const effectiveSetting = currentSetting ?? true;

                  return (
                    <div key={trial.trial_id} className="trial-override-card">
                      <div className="trial-override-info">
                        <span className="trial-override-label">
                          {formatTrialDate(trial.trial_date)} • Trial {trial.trial_number}
                        </span>
                        <span className="trial-override-meta">
                          Judge{trial.judges.length > 1 ? 's' : ''}: {trial.judges.join(', ')}
                        </span>
                        <span className="trial-override-meta">
                          {trial.class_count} {trial.class_count === 1 ? 'class' : 'classes'}
                        </span>
                      </div>
                      <div className="trial-override-controls">
                        <div className="trial-checkin-selector">
                          <label className="trial-override-label-text">
                            {effectiveSetting ? (
                              <><CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> Enabled</>
                            ) : (
                              <><XCircle size={14} style={{ color: 'var(--color-warning)' }} /> Disabled</>
                            )}
                          </label>
                          <select
                            className={`trial-checkin-dropdown ${isCustom ? 'custom' : 'inherited'}`}
                            value={effectiveSetting ? 'enabled' : 'disabled'}
                            onChange={(e) => {
                              const newEnabled = e.target.value === 'enabled';
                              // If setting to default (enabled) and currently custom, reset instead
                              if (newEnabled && isCustom) {
                                onResetTrialAutoComplete(trial.trial_id);
                              } else {
                                onSetTrialAutoComplete(trial.trial_id, newEnabled);
                              }
                            }}
                          >
                            <option value="enabled">Enabled (default)</option>
                            <option value="disabled">Disabled</option>
                          </select>
                          {isCustom && !effectiveSetting && (
                            <button
                              className="reset-btn"
                              onClick={() => onResetTrialAutoComplete(trial.trial_id)}
                              title="Reset to default (enabled)"
                            >
                              <RotateCcw size={14} /> Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
