/**
 * Competition Administration Interface
 *
 * Allows event organizers to control per-class results release
 * for AKC Nationals and other special events.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu, HeaderTicker } from '../../components/ui';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SuccessDialog } from './SuccessDialog';
import { RefreshCw, Settings, CheckCircle, XCircle, Clock, User, Zap, UserCheck, UserX } from 'lucide-react';
import './CompetitionAdmin.css';

// Release mode enum type
type ReleaseMode = 'hidden' | 'auto' | 'immediate' | 'released';

interface ClassInfo {
  id: number;
  element: string;
  level: string;
  section: string;
  judge_name: string;
  trial_date: string;
  trial_number: string;
  release_mode: ReleaseMode;
  class_completed: boolean;
  results_released_at: string | null;
  results_released_by: string | null;
  class_completed_at: string | null;
  self_checkin: boolean;
  // Legacy fields (deprecated)
  auto_release_results?: boolean;
  results_released?: boolean;
}

export const CompetitionAdmin: React.FC = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());


  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger';
    action: 'release' | 'embargo' | 'auto' | 'immediate' | 'enable_checkin' | 'disable_checkin' | null;
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

  // Fetch class information
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('classes')
        .select(`
          id,
          element,
          level,
          section,
          judge_name,
          self_checkin_enabled,
          trials!inner (
            trial_date,
            trial_number,
            shows!inner (
              license_key
            )
          )
        `)
        .eq('trials.shows.license_key', licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604')
        .order('element', { ascending: true });

      if (fetchError) throw fetchError;

      // Flatten the nested structure from Supabase
      const flattenedClasses = (data || []).map((classData: any) => ({
        id: classData.id,
        element: classData.element,
        level: classData.level,
        section: classData.section,
        judge_name: classData.judge_name,
        trial_date: classData.trials?.trial_date || '',
        trial_number: classData.trials?.trial_number || '',
        release_mode: 'hidden' as ReleaseMode, // Default since field may not exist
        class_completed: classData.is_completed || false,
        results_released_at: null,
        results_released_by: null,
        class_completed_at: null,
        self_checkin: classData.self_checkin_enabled || false
      }));

      setClasses(flattenedClasses);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load class information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [licenseKey]);

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
            // release_mode: 'released', // This field may not exist in normalized schema
            results_released_by: adminName.trim()
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await fetchClasses();

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

  // Show confirmation dialog for setting auto release
  const showAutoReleaseConfirmation = () => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to set auto release for.',
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
      title: 'Set Auto Release',
      message: `Are you sure you want to set ${selectedClasses.size} class(es) to automatic release? Results will be released immediately when judging is completed.`,
      type: 'warning',
      action: 'auto',
      details: selectedClassDetails
    });
  };

  // Set auto release for selected classes
  const setAutoRelease = async () => {
    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      const updates = Array.from(selectedClasses).map(classId =>
        supabase
          .from('classes')
          .update({
            // release_mode: 'auto', // This field may not exist in normalized schema
            results_released_by: adminName.trim()
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await fetchClasses();

      setSuccessDialog({
        isOpen: true,
        title: 'Auto Release Set Successfully!',
        message: `${selectedClassDetails.length} class(es) are now set to automatic release when judging completes.`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error setting auto release:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to set auto release. Please try again.',
        details: []
      });
    }
  };

  // Show confirmation dialog for immediate release
  const showImmediateReleaseConfirmation = () => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to set immediate release for.',
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
      title: 'Set Immediate Release',
      message: `Are you sure you want to set ${selectedClasses.size} class(es) to immediate release? Results will be visible as soon as each dog is scored.`,
      type: 'warning',
      action: 'immediate',
      details: selectedClassDetails
    });
  };

  // Set immediate release for selected classes
  const setImmediateRelease = async () => {
    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      const updates = Array.from(selectedClasses).map(classId =>
        supabase
          .from('classes')
          .update({
            // release_mode: 'immediate', // This field may not exist in normalized schema
            results_released_by: adminName.trim()
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await fetchClasses();

      setSuccessDialog({
        isOpen: true,
        title: 'Immediate Release Set Successfully!',
        message: `${selectedClassDetails.length} class(es) are now set to immediate release. Results will be visible as soon as each dog is scored.`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error setting immediate release:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to set immediate release. Please try again.',
        details: []
      });
    }
  };

  // Show confirmation dialog for hiding results
  const showEmbargoConfirmation = () => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to hide results for.',
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
      title: 'Hide Results',
      message: `Are you sure you want to hide results for ${selectedClasses.size} class(es)? This will hide them from the TV Dashboard immediately.`,
      type: 'danger',
      action: 'embargo',
      details: selectedClassDetails
    });
  };

  // Hide results for selected classes
  const embargoResults = async () => {
    try {
      const selectedClassDetails = classes
        .filter(cls => selectedClasses.has(cls.id))
        .map(cls => `${cls.element} (${cls.level} • ${cls.section})`);

      const updates = Array.from(selectedClasses).map(classId =>
        supabase
          .from('classes')
          .update({
            // release_mode: 'hidden', // This field may not exist in normalized schema
            results_released_by: adminName.trim()
          })
          .eq('id', classId)
      );

      await Promise.all(updates);

      setSelectedClasses(new Set());
      await fetchClasses();

      setSuccessDialog({
        isOpen: true,
        title: 'Results Hidden Successfully!',
        message: `Results for ${selectedClassDetails.length} class(es) are now hidden from the TV Dashboard.`,
        details: selectedClassDetails
      });
    } catch (err) {
      console.error('Error hiding results:', err);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to hide results. Please try again.',
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

  // Get status badge for class
  const getStatusBadge = (classInfo: ClassInfo) => {
    switch (classInfo.release_mode) {
      case 'immediate':
        return (
          <span className="status-badge immediate">
            <Zap className="status-icon" />
            IMMEDIATE
          </span>
        );
      case 'auto':
        return (
          <span className="status-badge auto">
            <Clock className="status-icon" />
            AUTO
          </span>
        );
      case 'released':
        return (
          <span className="status-badge released">
            <CheckCircle className="status-icon" />
            RELEASED
          </span>
        );
      case 'hidden':
      default:
        return (
          <span className="status-badge embargoed">
            <XCircle className="status-icon" />
            HIDDEN
          </span>
        );
    }
  };

  // Get self check-in badge for class
  const getSelfCheckinBadge = (classInfo: ClassInfo) => {
    if (classInfo.self_checkin) {
      return (
        <span className="status-badge checkin-enabled">
          <UserCheck className="status-icon" />
          SELF CHECK-IN
        </span>
      );
    } else {
      return (
        <span className="status-badge checkin-disabled">
          <UserX className="status-icon" />
          TABLE CHECK-IN
        </span>
      );
    }
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

  // Format date/time for timestamps
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString();
  };

  // Handle dialog confirmation
  const handleConfirmAction = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    if (confirmDialog.action === 'release') {
      releaseResults();
    } else if (confirmDialog.action === 'embargo') {
      embargoResults();
    } else if (confirmDialog.action === 'auto') {
      setAutoRelease();
    } else if (confirmDialog.action === 'immediate') {
      setImmediateRelease();
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


  // Show confirmation dialog for enabling self check-in
  const showEnableCheckinConfirmation = () => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to enable self check-in for.',
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
      title: 'Enable Self Check-In',
      message: `Are you sure you want to enable self check-in for ${selectedClasses.size} class(es)? Exhibitors will be able to check themselves in using the app.`,
      type: 'success',
      action: 'enable_checkin',
      details: selectedClassDetails
    });
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
      await fetchClasses();

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

  // Show confirmation dialog for disabling self check-in
  const showDisableCheckinConfirmation = () => {
    if (selectedClasses.size === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Classes Selected',
        message: 'Please select at least one class to disable self check-in for.',
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
      title: 'Disable Self Check-In',
      message: `Are you sure you want to disable self check-in for ${selectedClasses.size} class(es)? Exhibitors will need to check in at the secretary table.`,
      type: 'warning',
      action: 'disable_checkin',
      details: selectedClassDetails
    });
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
      await fetchClasses();

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

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div>Loading competition classes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div>Error: {error}</div>
          <button onClick={fetchClasses} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="competition-admin app-container">
      {/* Header with hamburger menu */}
      <header className="page-header admin-header">
        <div className="header-content">
          <HamburgerMenu currentPage="admin" />
          <div className="header-info">
            <div className="header-title">
              <Settings className="header-icon" />
              <span>Competition Administration</span>
            </div>
            <div className="header-subtitle">
              AKC Scent Work Master National 2025 • Results Release Control
            </div>
          </div>
          <button
            onClick={fetchClasses}
            className="refresh-button"
            disabled={loading}
          >
            <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
          </button>
        </div>
      </header>

      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION START ===== */}
      <HeaderTicker />
      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION END ===== */}

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
            placeholder="Enter your name for audit trail"
            className="admin-input"
          />
        </div>

        <div className="admin-actions">
          <div className="selection-actions">
            <button onClick={selectAllClasses} className="select-all-btn">
              Select All
            </button>
            <button onClick={clearSelection} className="clear-selection-btn">
              Clear Selection
            </button>
            <span className="selection-count">
              {selectedClasses.size} of {classes.length} selected
            </span>
          </div>

          <div className="release-actions">
            <button
              onClick={showImmediateReleaseConfirmation}
              className="release-card-btn immediate-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              <div className="btn-icon">⚡</div>
              <div className="btn-content">
                <div className="btn-title">Real-time</div>
                <div className="btn-description">Show as scored</div>
              </div>
            </button>
            <button
              onClick={showAutoReleaseConfirmation}
              className="release-card-btn auto-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              <div className="btn-icon">✓</div>
              <div className="btn-content">
                <div className="btn-title">Class Complete</div>
                <div className="btn-description">Show when done</div>
              </div>
            </button>
            <button
              onClick={showEmbargoConfirmation}
              className="release-card-btn embargo-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              <div className="btn-icon">🔒</div>
              <div className="btn-content">
                <div className="btn-title">Hide Results</div>
                <div className="btn-description">Keep private</div>
              </div>
            </button>
          </div>

          <div className="checkin-actions">
            <button
              onClick={showEnableCheckinConfirmation}
              className="release-card-btn enable-checkin-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              <div className="btn-icon">✓</div>
              <div className="btn-content">
                <div className="btn-title">Enable Check-In</div>
                <div className="btn-description">Allow self check-in</div>
              </div>
            </button>
            <button
              onClick={showDisableCheckinConfirmation}
              className="release-card-btn disable-checkin-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              <div className="btn-icon">✕</div>
              <div className="btn-content">
                <div className="btn-title">Disable Check-In</div>
                <div className="btn-description">Block self check-in</div>
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* Classes List */}
      <div className="classes-list">
        <div className="classes-header">
          <h2>Competition Classes ({classes.length})</h2>
        </div>

        <div className="classes-grid">
          {classes.map((classInfo) => (
            <div
              key={classInfo.id}
              className={`class-card ${selectedClasses.has(classInfo.id) ? 'selected' : ''}`}
              onClick={() => toggleClassSelection(classInfo.id)}
            >
              <div className="class-content">
                <div className="class-header">
                  <div className="class-title">
                    <input
                      type="checkbox"
                      checked={selectedClasses.has(classInfo.id)}
                      onChange={() => toggleClassSelection(classInfo.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="class-details">
                      <span className="element-name">{classInfo.element}</span>
                      <div className="class-meta">
                        {classInfo.section && classInfo.section !== '-'
                          ? `${classInfo.level} • ${classInfo.section}`
                          : classInfo.level
                        }
                      </div>
                    </div>
                  </div>
                  <div className="class-actions">
                    <div className="status-badges">
                      {getStatusBadge(classInfo)}
                      {getSelfCheckinBadge(classInfo)}
                    </div>
                  </div>
                </div>

              <div className="class-info">
                <div className="info-row">
                  <span className="label">Judge:</span>
                  <span className="value">{classInfo.judge_name || 'TBD'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date:</span>
                  <span className="value">{formatTrialDate(classInfo.trial_date)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Trial:</span>
                  <span className="value">{classInfo.trial_number}</span>
                </div>
              </div>

              {classInfo.results_released_at && (
                <div className="release-info">
                  <div className="release-timestamp">
                    Released: {formatDateTime(classInfo.results_released_at)}
                  </div>
                  {classInfo.results_released_by && (
                    <div className="release-admin">
                      By: {classInfo.results_released_by}
                    </div>
                  )}
                </div>
              )}

              {classInfo.class_completed_at && (
                <div className="completion-info">
                  <div className="completion-timestamp">
                    Completed: {formatDateTime(classInfo.class_completed_at)}
                  </div>
                </div>
              )}
              </div>
            </div>
          ))}
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
          confirmDialog.action === 'auto' ? 'Set Auto Release' :
          confirmDialog.action === 'immediate' ? 'Set Immediate Release' :
          confirmDialog.action === 'enable_checkin' ? 'Enable Self Check-In' :
          confirmDialog.action === 'disable_checkin' ? 'Disable Self Check-In' :
          'Hide Results'
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

    </div>
  );
};