import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { setClassVisibility } from '../../services/resultVisibilityService';
import { PRESET_CONFIGS } from '../../types/visibility';
import type { VisibilityPreset } from '../../types/visibility';
import './shared-dialog.css';
import './ClassSettingsDialog.css';

interface ClassSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: number;
    element: string;
    level: string;
    class_name: string;
    self_checkin_enabled?: boolean;
  };
  onSettingsUpdate?: () => void;
}

export const ClassSettingsDialog: React.FC<ClassSettingsDialogProps> = ({
  isOpen,
  onClose,
  classData,
  onSettingsUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selfCheckinEnabled, setSelfCheckinEnabled] = useState(false);
  const [resultsVisibility, setResultsVisibility] = useState<VisibilityPreset>('standard');
  const [plannedStartTime, setPlannedStartTime] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load current settings when dialog opens
  useEffect(() => {
    if (isOpen && classData) {
      setSuccessMessage('');
      setErrorMessage('');
      loadSettings();
    }
  }, [isOpen, classData]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load self check-in setting and planned start time
      const { data, error } = await supabase
        .from('classes')
        .select('self_checkin_enabled, planned_start_time')
        .eq('id', classData.id)
        .single();

      if (error) {
        console.error('Error loading class settings:', error);
        setErrorMessage('Failed to load class settings');
        return;
      }

      if (data) {
        setSelfCheckinEnabled(data.self_checkin_enabled ?? true);

        // Extract just the time portion from ISO timestamp (HH:MM format)
        if (data.planned_start_time) {
          const date = new Date(data.planned_start_time);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          setPlannedStartTime(`${hours}:${minutes}`);
        } else {
          setPlannedStartTime('');
        }
      }

      // Load results visibility setting
      // Note: We need to pass trial_id and license_key but we don't have them in this dialog
      // For now, just fetch from the class visibility override table directly
      const { data: visibilityData } = await supabase
        .from('class_result_visibility_overrides')
        .select('preset_name')
        .eq('class_id', classData.id)
        .maybeSingle();

      if (visibilityData?.preset_name) {
        setResultsVisibility(visibilityData.preset_name);
      }
    } catch (error) {
      console.error('Exception loading class settings:', error);
      setErrorMessage('Failed to load class settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      // Update self check-in setting and planned start time
      let plannedTimestamp: string | null = null;
      if (plannedStartTime) {
        // Convert time (HH:MM) to ISO timestamp using today's date
        const [hours, minutes] = plannedStartTime.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        plannedTimestamp = date.toISOString();
      }

      const updateData: {
        self_checkin_enabled: boolean;
        planned_start_time: string | null;
      } = {
        self_checkin_enabled: selfCheckinEnabled,
        planned_start_time: plannedTimestamp
      };

      const { error: checkinError } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', classData.id);

      if (checkinError) {
        console.error('Error saving check-in settings:', checkinError);
        setErrorMessage('Failed to save settings. Please try again.');
        return;
      }

      // Update results visibility setting
      try {
        await setClassVisibility(classData.id, resultsVisibility, 'ClassSettingsDialog');
      } catch (visibilityError) {
        console.error('Error saving visibility settings:', visibilityError);
        setErrorMessage('Failed to save results visibility. Please try again.');
        return;
      }

      setSuccessMessage('Settings saved successfully!');

      // Close dialog after brief delay to show success message,
      // then refresh parent data AFTER dialog is closed to avoid visual glitches
      setTimeout(() => {
        onClose();
        // Small delay before refresh to ensure dialog is fully unmounted
        if (onSettingsUpdate) {
          setTimeout(onSettingsUpdate, 100);
        }
      }, 1500);
    } catch (error) {
      console.error('Exception saving class settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const dialogContent = (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-title">
            <Settings className="title-icon" />
            <span>Class Settings</span>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="dialog-content">
          {loading ? (
            <div className="settings-loading">
              <p>Loading settings...</p>
            </div>
          ) : (
            <div className="settings-form">
              {/* Class Info Header */}
              <div className="class-info-header">
                <h3 className="class-title">{classData.class_name}</h3>
              </div>

              {/* Planned Start Time - Compact */}
              <div className="settings-section settings-section--compact">
                <label className="settings-label" htmlFor="planned-start-time">
                  Planned Start Time <span className="settings-optional">(optional)</span>
                </label>
                <input
                  id="planned-start-time"
                  type="time"
                  className="settings-time-input"
                  value={plannedStartTime}
                  onChange={(e) => setPlannedStartTime(e.target.value)}
                />
              </div>

              {/* Check-in Mode Toggle */}
              <div className="settings-section">
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-label">Check-in Mode</label>
                    <p className="settings-description">
                      How exhibitors check in for this class
                    </p>
                  </div>
                  <div className="settings-toggle-container">
                    <button
                      className={`settings-toggle ${
                        selfCheckinEnabled ? 'settings-toggle--on' : ''
                      }`}
                      onClick={() => setSelfCheckinEnabled(!selfCheckinEnabled)}
                      aria-label="Toggle check-in mode"
                    >
                      <span className="settings-toggle-thumb" />
                    </button>
                    <span className="settings-toggle-label">
                      {selfCheckinEnabled ? 'App (Self)' : 'At Table'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Results Visibility Section */}
              <div className="settings-section">
                <div className="settings-visibility-header">
                  <label className="settings-label">Results Visibility</label>
                  <p className="settings-description">
                    Control when and what results are shown to exhibitors
                  </p>
                </div>

                <div className="settings-visibility-options">
                  {(['open', 'standard', 'review'] as const).map((preset) => {
                    const config = PRESET_CONFIGS[preset];
                    return (
                      <label key={preset} className="settings-visibility-option">
                        <input
                          type="radio"
                          name="results-visibility"
                          value={preset}
                          checked={resultsVisibility === preset}
                          onChange={() => setResultsVisibility(preset)}
                          className="settings-radio-input"
                        />
                        <div className="settings-visibility-content">
                          <div className="settings-visibility-title">
                            <span className="settings-visibility-icon">{config.icon}</span>
                            <span>{config.title}</span>
                          </div>
                          <p className="settings-visibility-description">
                            {config.description}
                          </p>
                          <p className="settings-visibility-details">
                            {config.details}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="settings-message settings-message--success">
                  <CheckCircle size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="settings-message settings-message--error">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button
            className="dialog-button dialog-button-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="dialog-button dialog-button-primary"
            onClick={handleSaveSettings}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};
