/**
 * Competition Administration Interface
 *
 * Allows event organizers to control per-class results release
 * for AKC Nationals and other special events.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu } from '../../components/ui';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SuccessDialog } from './SuccessDialog';
import {
  setShowVisibility,
  setTrialVisibility,
  removeTrialVisibilityOverride,
  bulkSetClassVisibility,
  setShowSelfCheckin,
  setTrialSelfCheckin,
  removeTrialSelfCheckinOverride,
  bulkSetClassSelfCheckin
} from '../../services/resultVisibilityService';
import { PRESET_CONFIGS } from '../../types/visibility';
import type { VisibilityPreset } from '../../types/visibility';
import { RefreshCw, Settings, User, UserCheck, UserX, Eye, History, MoreVertical, Calendar, Target, ArrowDown, RotateCcw, Zap, Clock, Lock, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompetitionAdminData } from './hooks/useCompetitionAdminData';
import './CompetitionAdmin.css';

export const CompetitionAdmin: React.FC = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const navigate = useNavigate();

  // ✨ React Query: Replace manual state management with automatic caching
  const { showInfo, classes, trials, isLoading, error: queryError, refetch } = useCompetitionAdminData(licenseKey);
  const [adminName, setAdminName] = useState<string>(() => {
    // Load saved admin name from localStorage
    return localStorage.getItem('myk9q_admin_name') || '';
  });
  const adminNameRef = useRef<string>(adminName); // Track current admin name
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Visibility control state
  const [showVisibilityPreset, setShowVisibilityPreset] = useState<VisibilityPreset>('standard');
  const [visibilitySectionExpanded, setVisibilitySectionExpanded] = useState(false);
  const [trialVisibilitySettings, setTrialVisibilitySettings] = useState<Map<number, VisibilityPreset>>(new Map());

  // Self check-in cascade state
  const [showSelfCheckinEnabled, setShowSelfCheckinEnabled] = useState<boolean>(true);
  const [trialSelfCheckinSettings, setTrialSelfCheckinSettings] = useState<Map<number, boolean>>(new Map());
  const [checkinSectionExpanded, setCheckinSectionExpanded] = useState(false);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger';
    action: 'release' | 'enable_checkin' | 'disable_checkin' | null;
    details: string[];
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: null,
    details: []
  });

  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details: string[];
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: []
  });

  const [adminNameDialog, setAdminNameDialog] = useState<{
    isOpen: boolean;
    pendingAction: (() => void) | null;
  }>({
    isOpen: false,
    pendingAction: null
  });

  const [tempAdminName, setTempAdminName] = useState<string>('');

  // Save admin name to localStorage whenever it changes
  useEffect(() => {
    if (adminName.trim()) {
      localStorage.setItem('myk9q_admin_name', adminName.trim());
    }
    // Keep ref in sync with state
    adminNameRef.current = adminName;
  }, [adminName]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowHeaderMenu(false);
      }
    };

    if (showHeaderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHeaderMenu]);

  /**
   * Helper function to check if admin name is provided
   * If not, shows dialog to prompt for name and queues the action
   * @returns true if admin name is available, false if dialog was shown
   */
  const requireAdminName = (action: () => void): boolean => {
    // Check the ref instead of state for synchronous access
    if (adminNameRef.current.trim()) {
      return true; // Name is available, proceed
    }

    // Show dialog to get admin name
    setTempAdminName(adminName); // Pre-fill with current value if any
    setAdminNameDialog({
      isOpen: true,
      pendingAction: action
    });
    return false; // Name not available, dialog shown
  };

  /**
   * Handle admin name dialog confirmation
   */
  const handleAdminNameConfirm = () => {
    const name = tempAdminName.trim();
    if (!name) {
      return; // Don't close if empty
    }

    // Update both ref (synchronous) and state (asynchronous)
    // This ensures requireAdminName will see the new value immediately
    adminNameRef.current = name;
    setAdminName(name);

    // Get and close the dialog
    const pendingAction = adminNameDialog.pendingAction;
    setAdminNameDialog({
      isOpen: false,
      pendingAction: null
    });

    // Execute the pending action
    // Now when it calls requireAdminName again, the ref will have the new value
    if (pendingAction) {
      pendingAction();
    }
  };

  // Show confirmation dialog for releasing results
  const _showReleaseConfirmation = () => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to release results for.',
        details: []
      });
      return;
    }

    if (!adminName.trim()) {
      setSuccessDialog({
        isOpen: true,
        title: 'Administrator Name Required',
        message: 'Please enter your name for the audit trail before proceeding.',
        details: []
      });
      return;
    }

    const selectedClassDetails = classes
      .filter(cls => selectedClasses.has(cls.id))
      .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

    setConfirmDialog({
      isOpen: true,
      title: 'Release Results',
      message: `Are you sure you want to release results for ${selectedClasses.size} class(es)? This will make them visible on the TV Dashboard immediately.`,
      type: 'success',
      action: 'release',
      details: selectedClassDetails
    });
  };

  // Release results for selected classes
  const releaseResults = async () => {
    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      const updates = Array.from(selectedClasses).map(classId =>
        supabase
          .from('classes')
          .update({
            results_released_by: adminName.trim(),
            results_released_at: new Date().toISOString()
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await refetch(); // ✨ React Query: automatic refetch with caching

      setSuccessDialog({
        isOpen: true,
        title: 'Results Released Successfully!',
        message: `Results for ${selectedClassDetails.length} class(es) are now visible on the TV Dashboard.`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error releasing results:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to release results. Please try again.',
        details: []
      });
    }
  };


  // Toggle class selection
  const toggleClassSelection = (classId: number) => {
    const newSelection = new Set(selectedClasses);
    if (newSelection.has(classId)) {
      newSelection.delete(classId);
    } else {
      newSelection.add(classId);
    }
    setSelectedClasses(newSelection);
  };

  // Select all classes
  const selectAllClasses = () => {
    setSelectedClasses(new Set(classes.map(c => c.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedClasses(new Set());
  };


  // Format date using same format as Home page trial cards
  const formatTrialDate = (dateString: string) => {
    try {
      // Parse date components manually to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const dayNumber = date.getDate();
      const yearNumber = date.getFullYear();

      return `${dayName}, ${monthName} ${dayNumber}, ${yearNumber}`;
    } catch {
      return dateString; // Fallback to original if parsing fails
    }
  };

  // Handle dialog confirmation
  const handleConfirmAction = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    if (confirmDialog.action === 'release') {
      releaseResults();
    } else if (confirmDialog.action === 'enable_checkin') {
      enableSelfCheckin();
    } else if (confirmDialog.action === 'disable_checkin') {
      disableSelfCheckin();
    }
  };

  // Handle dialog cancellation
  const handleCancelAction = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Close success dialog
  const closeSuccessDialog = () => {
    setSuccessDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Enable self check-in for selected classes
  const enableSelfCheckin = async () => {
    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      const updates = Array.from(selectedClasses).map(classId =>
        supabase
          .from('classes')
          .update({
            self_checkin_enabled: true
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await refetch(); // ✨ React Query: automatic refetch with caching

      setSuccessDialog({
        isOpen: true,
        title: 'Self Check-In Enabled!',
        message: `Self check-in has been enabled for ${selectedClassDetails.length} class(es). Exhibitors can now check themselves in using the app.`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error enabling self check-in:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to enable self check-in. Please try again.',
        details: []
      });
    }
  };

  // Disable self check-in for selected classes
  const disableSelfCheckin = async () => {
    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      const updates = Array.from(selectedClasses).map(classId =>
        supabase
          .from('classes')
          .update({
            self_checkin_enabled: false
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await refetch(); // ✨ React Query: automatic refetch with caching

      setSuccessDialog({
        isOpen: true,
        title: 'Self Check-In Disabled!',
        message: `Self check-in has been disabled for ${selectedClassDetails.length} class(es). Exhibitors must check in at the secretary table.`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error disabling self check-in:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to disable self check-in. Please try again.',
        details: []
      });
    }
  };

  // ============================================================
  // RESULT VISIBILITY HANDLERS
  // ============================================================

  /**
   * Set show-level visibility default (all classes inherit unless overridden)
   */
  const handleSetShowVisibility = async (preset: VisibilityPreset) => {
    if (!requireAdminName(() => handleSetShowVisibility(preset))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      await setShowVisibility(licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604', preset, adminName.trim());

      setShowVisibilityPreset(preset);

      setSuccessDialog({
        isOpen: true,
        title: 'Show Visibility Updated!',
        message: `Result visibility set to "${preset.toUpperCase()}" for all classes in this show. Individual class overrides still apply.`,
        details: []
      });
    } catch (err) {
      console.error('Error setting show visibility:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update show visibility. Please try again.',
        details: []
      });
    }
  };

  /**
   * Set trial-level visibility override
   */
  const handleSetTrialVisibility = async (trialId: number, preset: VisibilityPreset) => {
    if (!requireAdminName(() => handleSetTrialVisibility(trialId, preset))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      await setTrialVisibility(trialId, preset, adminName.trim());

      // Update local state
      setTrialVisibilitySettings(prev => new Map(prev).set(trialId, preset));

      const trial = trials.find(t => t.trial_id === trialId);
      const trialLabel = trial ? `Trial ${trial.trial_number} - ${formatTrialDate(trial.trial_date)}` : `Trial ${trialId}`;

      setSuccessDialog({
        isOpen: true,
        title: 'Trial Visibility Updated!',
        message: `Result visibility set to "${preset.toUpperCase()}" for ${trialLabel}. Classes in this trial will inherit this setting.`,
        details: []
      });
    } catch (err) {
      console.error('Error setting trial visibility:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update trial visibility. Please try again.',
        details: []
      });
    }
  };

  /**
   * Remove trial-level override (fall back to show default)
   */
  const handleRemoveTrialVisibility = async (trialId: number) => {
    if (!requireAdminName(() => handleRemoveTrialVisibility(trialId))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      await removeTrialVisibilityOverride(trialId);

      // Update local state
      setTrialVisibilitySettings(prev => {
        const newMap = new Map(prev);
        newMap.delete(trialId);
        return newMap;
      });

      const trial = trials.find(t => t.trial_id === trialId);
      const trialLabel = trial ? `Trial ${trial.trial_number} - ${formatTrialDate(trial.trial_date)}` : `Trial ${trialId}`;

      setSuccessDialog({
        isOpen: true,
        title: 'Trial Override Removed!',
        message: `${trialLabel} will now inherit the show default visibility setting.`,
        details: []
      });
    } catch (err) {
      console.error('Error removing trial visibility:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to remove trial override. Please try again.',
        details: []
      });
    }
  };

  /**
   * Bulk apply visibility preset to selected classes
   */
  const handleBulkSetClassVisibility = async (preset: VisibilityPreset) => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to apply visibility settings.',
        details: []
      });
      return;
    }

    if (!requireAdminName(() => handleBulkSetClassVisibility(preset))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      await bulkSetClassVisibility(
        Array.from(selectedClasses),
        preset,
        adminName.trim()
      );

      setSelectedClasses(new Set());
      await refetch(); // ✨ React Query: automatic refetch with caching // Refresh UI to show updated visibility badges

      setSuccessDialog({
        isOpen: true,
        title: 'Class Visibility Updated!',
        message: `Result visibility set to "${preset.toUpperCase()}" for ${selectedClassDetails.length} class(es).`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error bulk setting class visibility:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update class visibility. Please try again.',
        details: []
      });
    }
  };

  /**
   * ============================================================
   * SELF CHECK-IN CASCADE HANDLERS
   * ============================================================
   */

  /**
   * Set show-level self check-in default
   */
  const handleSetShowSelfCheckin = async (enabled: boolean) => {
    if (!requireAdminName(() => handleSetShowSelfCheckin(enabled))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      await setShowSelfCheckin(licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604', enabled);
      setShowSelfCheckinEnabled(enabled);

      setSuccessDialog({
        isOpen: true,
        title: 'Show Self Check-In Updated!',
        message: `Self check-in is now ${enabled ? 'ENABLED' : 'DISABLED'} by default for all trials/classes.`,
        details: []
      });
    } catch (err) {
      console.error('Error setting show self check-in:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update show self check-in setting. Please try again.',
        details: []
      });
    }
  };

  /**
   * Set trial-level self check-in override
   */
  const handleSetTrialSelfCheckin = async (trialId: number, enabled: boolean) => {
    if (!requireAdminName(() => handleSetTrialSelfCheckin(trialId, enabled))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      await setTrialSelfCheckin(trialId, enabled);

      setTrialSelfCheckinSettings(prev => {
        const newMap = new Map(prev);
        newMap.set(trialId, enabled);
        return newMap;
      });

      const trial = trials.find(t => t.trial_id === trialId);
      const trialLabel = trial ? `${formatTrialDate(trial.trial_date)} • Trial ${trial.trial_number}` : `Trial ${trialId}`;

      setSuccessDialog({
        isOpen: true,
        title: 'Trial Self Check-In Updated!',
        message: `${trialLabel} self check-in is now ${enabled ? 'ENABLED' : 'DISABLED'}.`,
        details: []
      });
    } catch (err) {
      console.error('Error setting trial self check-in:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update trial self check-in. Please try again.',
        details: []
      });
    }
  };

  /**
   * Remove trial-level self check-in override
   */
  const handleRemoveTrialSelfCheckin = async (trialId: number) => {
    if (!requireAdminName(() => handleRemoveTrialSelfCheckin(trialId))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      await removeTrialSelfCheckinOverride(trialId);

      setTrialSelfCheckinSettings(prev => {
        const newMap = new Map(prev);
        newMap.delete(trialId);
        return newMap;
      });

      const trial = trials.find(t => t.trial_id === trialId);
      const trialLabel = trial ? `${formatTrialDate(trial.trial_date)} • Trial ${trial.trial_number}` : `Trial ${trialId}`;

      setSuccessDialog({
        isOpen: true,
        title: 'Trial Override Removed!',
        message: `${trialLabel} will now inherit the show default self check-in setting.`,
        details: []
      });
    } catch (err) {
      console.error('Error removing trial self check-in:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to remove trial override. Please try again.',
        details: []
      });
    }
  };

  /**
   * Bulk set self check-in for selected classes
   */
  const handleBulkSetClassSelfCheckin = async (enabled: boolean) => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to apply self check-in settings.',
        details: []
      });
      return;
    }

    if (!requireAdminName(() => handleBulkSetClassSelfCheckin(enabled))) {
      return; // Dialog shown, will retry after name is entered
    }

    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      await bulkSetClassSelfCheckin(
        Array.from(selectedClasses),
        enabled
      );

      setSelectedClasses(new Set());

      // Refresh class data to show updated badges
      await refetch(); // ✨ React Query: automatic refetch with caching

      setSuccessDialog({
        isOpen: true,
        title: 'Class Self Check-In Updated!',
        message: `Self check-in ${enabled ? 'ENABLED' : 'DISABLED'} for ${selectedClassDetails.length} class(es).`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error bulk setting class self check-in:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update class self check-in. Please try again.',
        details: []
      });
    }
  };

  if (isLoading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div>Loading competition classes...</div>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div>Error: {(queryError as Error).message || 'Failed to load data'}</div>
          <button onClick={() => refetch()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="competition-admin page-container">
      {/* Header with hamburger menu */}
      <header className="page-header admin-header">
        <div className="header-content">
          <HamburgerMenu currentPage="admin" />
          <div className="header-info">
            <div className="header-title">
              <Settings className="header-icon" />
              <span>Results Control</span>
            </div>
            <div className="header-subtitle">
              {showInfo ? (
                <>
                  {showInfo.showName}
                  {showInfo.organization && ` • ${showInfo.organization}`}
                </>
              ) : (
                'Loading...'
              )}
            </div>
          </div>
          <div className="dropdown-container">
            <button
              className="icon-button"
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              aria-label="More options"
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showHeaderMenu && (
              <div className="dropdown-menu" style={{ right: 0, minWidth: '180px' }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    refetch(); // ✨ React Query: trigger refetch
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={`dropdown-icon ${isLoading ? 'rotating' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    navigate(`/admin/${licenseKey}/audit-log`);
                  }}
                >
                  <History className="dropdown-icon" />
                  <span>Audit Log</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content container */}
      <div className="admin-content">
      {/* Admin Controls */}
      <div className="admin-controls">
        <div className="admin-input-group">
          <label htmlFor="adminName">
            <User className="input-icon" />
            Administrator Name:
          </label>
          <input
            id="adminName"
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Enter your name (optional - will prompt if needed)"
            className="admin-input"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* RESULT VISIBILITY CONTROL SECTION */}
      {/* ============================================================ */}
      <div className="visibility-control-section">
        <div className="visibility-header" onClick={() => setVisibilitySectionExpanded(!visibilitySectionExpanded)}>
          <div className="visibility-title">
            <Eye className="section-icon" />
            <h3>Result Visibility Settings</h3>
          </div>
          <span className="expand-toggle">{visibilitySectionExpanded ? '▲ Collapse' : '▼ Expand'}</span>
        </div>

        {visibilitySectionExpanded && (
          <>
            {/* Show-level default */}
            <div className="show-default-card">
              <div className="show-default-header">
                <span className="show-badge"><ClipboardList size={16} /> Show Default</span>
                <span className="inheritance-note">
                  All classes inherit this unless overridden
                </span>
              </div>
              <div className="preset-selector">
                {(Object.keys(PRESET_CONFIGS) as VisibilityPreset[]).map((preset) => {
                  const config = PRESET_CONFIGS[preset];
                  const PresetIcon = preset === 'open' ? Zap : preset === 'review' ? Lock : Clock;
                  return (
                    <button
                      key={preset}
                      className={`preset-card ${showVisibilityPreset === preset ? 'selected' : ''}`}
                      onClick={() => handleSetShowVisibility(preset)}
                    >
                      <div className="preset-icon"><PresetIcon size={24} /></div>
                      <div className="preset-title">{config.title}</div>
                      <div className="preset-description">{config.description}</div>
                      <div className="preset-details">{config.details}</div>
                      {showVisibilityPreset === preset && (
                        <div className="selected-indicator"><UserCheck size={14} /> Selected</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trial-level overrides */}
            {trials.length > 0 && (
              <div className="trial-overrides-section">
                <h4><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Trial Overrides (Optional)</h4>
                <p className="section-description">
                  Override the show default for specific trials. Classes in these trials will inherit the trial setting unless individually overridden.
                </p>
                <div className="trial-rows-grid">
                {trials.map((trial) => {
                  const currentSetting = trialVisibilitySettings.get(trial.trial_id);
                  const isCustom = currentSetting !== undefined;
                  const effectiveSetting = currentSetting || showVisibilityPreset;

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
                        <div className="trial-visibility-selector">
                          <label className="trial-override-label-text">
                            {isCustom ? <><Target size={14} /> Custom:</> : <><ArrowDown size={14} /> Inherited:</>}
                          </label>
                          <select
                            className={`trial-preset-dropdown ${isCustom ? 'custom' : 'inherited'}`}
                            value={effectiveSetting}
                            onChange={(e) => {
                              const newPreset = e.target.value as VisibilityPreset;
                              if (newPreset === showVisibilityPreset) {
                                // If changing back to show default, remove override
                                handleRemoveTrialVisibility(trial.trial_id);
                              } else {
                                // Set custom override
                                handleSetTrialVisibility(trial.trial_id, newPreset);
                              }
                            }}
                          >
                            <option value="open">{PRESET_CONFIGS.open.title}</option>
                            <option value="standard">{PRESET_CONFIGS.standard.title}</option>
                            <option value="review">{PRESET_CONFIGS.review.title}</option>
                          </select>
                          {isCustom && (
                            <button
                              className="reset-btn"
                              onClick={() => handleRemoveTrialVisibility(trial.trial_id)}
                              title="Reset to show default"
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

            {/* Explanation card */}
            <div className="visibility-explanation">
              <h5>How It Works:</h5>
              <ul>
                <li><strong>Judges and Admins</strong> always see all results regardless of these settings</li>
                <li><strong>Stewards and Exhibitors</strong> see results based on these settings</li>
                <li><strong>Cascading Hierarchy:</strong> Show Default → Trial Override → Class Override</li>
                <li><strong>Show Default</strong> applies to all trials and classes (set once)</li>
                <li><strong>Trial Override</strong> applies to all classes in that trial (e.g., Trial 2 judge wants different rules)</li>
                <li><strong>Class Override</strong> applies to specific classes (use bulk operations for multiple classes)</li>
                <li><strong>Lowest level wins:</strong> Class override &gt; Trial override &gt; Show default</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Self Check-In Cascade Control */}
      <div className="visibility-control-section checkin-section">
        <div className="visibility-header" onClick={() => setCheckinSectionExpanded(!checkinSectionExpanded)}>
          <div className="visibility-title">
            <UserCheck className="section-icon" />
            <h3>Self Check-In Settings</h3>
          </div>
          <span className="expand-toggle">{checkinSectionExpanded ? '▲ Collapse' : '▼ Expand'}</span>
        </div>

        {checkinSectionExpanded && (
          <>
            {/* Show-level default */}
            <div className="show-default-card">
              <div className="show-default-header">
                <span className="show-badge"><ClipboardList size={16} /> Show Default</span>
                <span className="inheritance-note">
                  All trials/classes inherit this unless overridden
                </span>
              </div>
              <div className="checkin-toggle-container">
                <button
                  className={`checkin-toggle-btn ${showSelfCheckinEnabled ? 'enabled' : 'disabled'}`}
                  onClick={() => handleSetShowSelfCheckin(!showSelfCheckinEnabled)}
                >
                  {showSelfCheckinEnabled ? (
                    <>
                      <UserCheck className="btn-icon" />
                      <span className="btn-text">Self Check-In ENABLED</span>
                      <span className="btn-hint">Exhibitors can check in via app</span>
                    </>
                  ) : (
                    <>
                      <UserX className="btn-icon" />
                      <span className="btn-text">Self Check-In DISABLED</span>
                      <span className="btn-hint">Table check-in only</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trial-level overrides */}
            {trials.length > 0 && (
              <div className="trial-overrides-section">
                <h4><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Trial Overrides (Optional)</h4>
                <p className="section-description">
                  Override the show default for specific trials. Classes in these trials will inherit the trial setting.
                </p>
                <div className="trial-rows-grid">
                {trials.map((trial) => {
                  const currentSetting = trialSelfCheckinSettings.get(trial.trial_id);
                  const isCustom = currentSetting !== undefined;
                  const effectiveSetting = currentSetting ?? showSelfCheckinEnabled;

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
                            {isCustom ? <><Target size={14} /> Custom:</> : <><ArrowDown size={14} /> Inherited:</>}
                          </label>
                          <select
                            className={`trial-checkin-dropdown ${isCustom ? 'custom' : 'inherited'}`}
                            value={effectiveSetting ? 'enabled' : 'disabled'}
                            onChange={(e) => {
                              const newEnabled = e.target.value === 'enabled';
                              if (newEnabled === showSelfCheckinEnabled) {
                                // If changing back to show default, remove override
                                handleRemoveTrialSelfCheckin(trial.trial_id);
                              } else {
                                // Set custom override
                                handleSetTrialSelfCheckin(trial.trial_id, newEnabled);
                              }
                            }}
                          >
                            <option value="enabled">App (Self)</option>
                            <option value="disabled">At Table</option>
                          </select>
                          {isCustom && (
                            <button
                              className="reset-btn"
                              onClick={() => handleRemoveTrialSelfCheckin(trial.trial_id)}
                              title="Reset to show default"
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

            {/* Explanation card */}
            <div className="visibility-explanation">
              <h5>How It Works:</h5>
              <ul>
                <li><strong>Self Check-In Enabled:</strong> Exhibitors can check in via the mobile app</li>
                <li><strong>Self Check-In Disabled:</strong> Only stewards/admins can check in at the table</li>
                <li><strong>Cascading Hierarchy:</strong> Show Default → Trial Override → Class Override</li>
                <li><strong>Show Default</strong> applies to all trials and classes (set once)</li>
                <li><strong>Trial Override</strong> applies to all classes in that trial</li>
                <li><strong>Class Override</strong> applies to specific classes (use bulk operations for multiple classes)</li>
                <li><strong>Lowest level wins:</strong> Class override &gt; Trial override &gt; Show default</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Classes List */}
      <div className="classes-list">
        <div className="classes-header">
          <h2>Classes ({classes.length})</h2>
          <div className="selection-actions">
            {selectedClasses.size > 0 ? (
              <>
                <span className="selection-count-badge">
                  {selectedClasses.size} selected
                </span>
                <button onClick={clearSelection} className="clear-selection-btn">
                  Clear
                </button>
              </>
            ) : (
              <button onClick={selectAllClasses} className="select-all-btn">
                Select All
              </button>
            )}
          </div>
        </div>

        {/* Bulk Operations - appears when classes are selected */}
        {selectedClasses.size > 0 && (
          <div className="bulk-operations-container">
            {/* Result Visibility Card */}
            <div className="bulk-operations-card">
              <div className="toolbar-section">
                <h4>Result Visibility</h4>
                <div className="toolbar-buttons">
                  {(Object.keys(PRESET_CONFIGS) as VisibilityPreset[]).map((preset) => {
                    const config = PRESET_CONFIGS[preset];
                    return (
                      <button
                        key={preset}
                        className="toolbar-btn visibility-btn"
                        onClick={() => handleBulkSetClassVisibility(preset)}
                        title={config.description}
                      >
                        <span className="btn-icon">{config.icon}</span>
                        <span className="btn-text">{config.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Self Check-In Card */}
            <div className="bulk-operations-card">
              <div className="toolbar-section">
                <h4>Self Check-In</h4>
                <div className="toolbar-buttons">
                  <button
                    className="toolbar-btn checkin-enable-btn"
                    onClick={() => handleBulkSetClassSelfCheckin(true)}
                  >
                    <UserCheck className="btn-icon" />
                    <span className="btn-text">Enable</span>
                  </button>
                  <button
                    className="toolbar-btn checkin-disable-btn"
                    onClick={() => handleBulkSetClassSelfCheckin(false)}
                  >
                    <UserX className="btn-icon" />
                    <span className="btn-text">Disable</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="classes-grid">
          {classes.map((classInfo) => {
            // Get visibility preset for this class from the data
            const visibilityPreset = classInfo.visibility_preset || 'standard';
            const visibilityTitle = PRESET_CONFIGS[visibilityPreset]?.title || 'After Class';

            return (
              <div
                key={classInfo.id}
                className={`class-card-compact ${selectedClasses.has(classInfo.id) ? 'selected' : ''}`}
                onClick={() => toggleClassSelection(classInfo.id)}
              >
                <div className="card-left">
                  <input
                    type="checkbox"
                    checked={selectedClasses.has(classInfo.id)}
                    onChange={() => toggleClassSelection(classInfo.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="card-checkbox"
                  />
                  <div className="card-info">
                    {/* Row 1: Trial Date + Trial Number */}
                    <div className="info-row-1">
                      {formatTrialDate(classInfo.trial_date)} • Trial {classInfo.trial_number}
                    </div>
                    {/* Row 2: Element • Level • Section */}
                    <div className="info-row-2">
                      <span className="element-level">
                        {classInfo.element} • {classInfo.level}
                        {classInfo.section && classInfo.section !== '-' && ` • ${classInfo.section}`}
                      </span>
                    </div>
                    {/* Row 3: Judge */}
                    <div className="info-row-3">
                      Judge: {classInfo.judge_name || 'TBD'}
                    </div>
                  </div>
                </div>
                <div className="card-right">
                  <div className="badge-stack">
                    {/* Visibility Badge */}
                    <span className="visibility-badge" title={`Result visibility: ${visibilityTitle}`}>
                      <Eye className="badge-icon" />
                      {visibilityTitle}
                    </span>
                    {/* Self Check-In Badge */}
                    {classInfo.self_checkin ? (
                      <span className="checkin-badge enabled" title="Self check-in enabled">
                        <UserCheck className="badge-icon" />
                        SELF CHECK-IN
                      </span>
                    ) : (
                      <span className="checkin-badge disabled" title="Table check-in only">
                        <UserX className="badge-icon" />
                        TABLE CHECK-IN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {classes.length === 0 && (
          <div className="no-classes">
            <div className="no-classes-icon">📋</div>
            <div className="no-classes-text">No classes found for this competition</div>
          </div>
        )}
      </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={
          confirmDialog.action === 'release' ? 'Release Results' :
          confirmDialog.action === 'enable_checkin' ? 'Enable Self Check-In' :
          confirmDialog.action === 'disable_checkin' ? 'Disable Self Check-In' :
          'Confirm'
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        details={confirmDialog.details}
      />

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        title={successDialog.title}
        message={successDialog.message}
        onClose={closeSuccessDialog}
        details={successDialog.details}
      />

      {/* Admin Name Prompt Dialog */}
      {adminNameDialog.isOpen && (
        <div className="dialog-overlay" onClick={() => setAdminNameDialog({ isOpen: false, pendingAction: null })}>
          <div className="dialog-container dialog-warning" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-icon">
                <User className="dialog-icon-svg" />
              </div>
              <h3 className="dialog-title">Administrator Name Required</h3>
            </div>

            <div className="dialog-content">
              <p className="dialog-message">
                Please enter your name for the audit trail. This helps track who made changes to the competition settings.
              </p>

              <div className="admin-name-input-group">
                <label htmlFor="tempAdminName" className="admin-name-label">
                  Your Name:
                </label>
                <input
                  id="tempAdminName"
                  type="text"
                  value={tempAdminName}
                  onChange={(e) => setTempAdminName(e.target.value)}
                  placeholder="Enter your name"
                  className="admin-name-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempAdminName.trim()) {
                      handleAdminNameConfirm();
                    }
                  }}
                />
              </div>
            </div>

            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() => setAdminNameDialog({ isOpen: false, pendingAction: null })}
              >
                Cancel
              </button>
              <button
                className="dialog-btn dialog-btn-confirm dialog-btn-primary"
                onClick={handleAdminNameConfirm}
                disabled={!tempAdminName.trim()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};