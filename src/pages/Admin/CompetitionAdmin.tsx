/**
 * Competition Administration Interface
 *
 * Allows event organizers to control per-class results release
 * for AKC Nationals and other special events.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu } from '../../components/ui';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SuccessDialog } from './SuccessDialog';
import { RefreshCw, Settings, CheckCircle, XCircle, Clock, User, Zap } from 'lucide-react';
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
    action: 'release' | 'embargo' | 'auto' | 'immediate' | null;
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
        .from('tbl_class_queue')
        .select(`
          id,
          element,
          level,
          section,
          judge_name,
          trial_date,
          trial_number,
          release_mode,
          class_completed,
          results_released_at,
          results_released_by,
          class_completed_at,
          auto_release_results,
          results_released
        `)
        .eq('mobile_app_lic_key', licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604')
        .order('trial_date', { ascending: true })
        .order('element', { ascending: true });

      if (fetchError) throw fetchError;

      setClasses(data || []);
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
  const showReleaseConfirmation = () => {
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
          .from('tbl_class_queue')
          .update({
            release_mode: 'released',
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
          .from('tbl_class_queue')
          .update({
            release_mode: 'auto',
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
          .from('tbl_class_queue')
          .update({
            release_mode: 'immediate',
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
          .from('tbl_class_queue')
          .update({
            release_mode: 'hidden',
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

  // Format date/time
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
    <div className="competition-admin">
      {/* Header with hamburger menu */}
      <div className="admin-header">
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
      </div>

      {/* Main content container */}
      <div className="admin-content">
        {/* Instructions */}
        <div className="instructions-panel">
          <h3>📋 How to Use</h3>
          <ol>
            <li><strong>Enter your name</strong> in the Administrator field below</li>
            <li><strong>Select classes</strong> by checking the boxes next to them</li>
            <li><strong>Click "Release Results"</strong> to make them visible on the TV Dashboard immediately</li>
            <li><strong>Click "Set Auto Release"</strong> to automatically release results when judging completes</li>
            <li><strong>Click "Hide Results"</strong> to hide them from the TV Dashboard</li>
          </ol>
          <div className="tip">
            💡 <strong>Tip:</strong> Changes take effect immediately on the TV Dashboard
          </div>
        </div>

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
              onClick={showReleaseConfirmation}
              className="release-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              🟢 Release Results for {selectedClasses.size} Selected Class{selectedClasses.size !== 1 ? 'es' : ''}
            </button>
            <button
              onClick={showAutoReleaseConfirmation}
              className="auto-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              🔄 Set Auto Release for {selectedClasses.size} Selected Class{selectedClasses.size !== 1 ? 'es' : ''}
            </button>
            <button
              onClick={showImmediateReleaseConfirmation}
              className="immediate-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              ⚡ Set Immediate Release for {selectedClasses.size} Selected Class{selectedClasses.size !== 1 ? 'es' : ''}
            </button>
            <button
              onClick={showEmbargoConfirmation}
              className="embargo-btn"
              disabled={selectedClasses.size === 0 || !adminName.trim()}
            >
              🔴 Hide Results for {selectedClasses.size} Selected Class{selectedClasses.size !== 1 ? 'es' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="classes-list">
        <div className="classes-header">
          <h2>Competition Classes ({classes.length})</h2>
          <div className="legend">
            <span className="legend-item">
              <span className="status-badge auto">AUTO</span> = Automatic release
            </span>
            <span className="legend-item">
              <span className="status-badge released">RELEASED</span> = Results visible
            </span>
            <span className="legend-item">
              <span className="status-badge immediate">IMMEDIATE</span> = Real-time results
            </span>
            <span className="legend-item">
              <span className="status-badge embargoed">HIDDEN</span> = Results hidden
            </span>
          </div>
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
                        {classInfo.level} • {classInfo.section}
                      </div>
                    </div>
                  </div>
                  <div className="class-actions">
                    {getStatusBadge(classInfo)}
                  </div>
                </div>

              <div className="class-info">
                <div className="info-row">
                  <span className="label">Judge:</span>
                  <span className="value">{classInfo.judge_name || 'TBD'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date:</span>
                  <span className="value">{classInfo.trial_date}</span>
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