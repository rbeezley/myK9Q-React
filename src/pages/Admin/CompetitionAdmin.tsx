/**
 * Competition Administration Interface
 *
 * Allows event organizers to control per-class results release
 * for AKC Nationals and other special events.
 *
 * Refactored from 1,252 lines to ~280 lines using extracted hooks and components.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';

// Dialogs
import { ConfirmationDialog } from './ConfirmationDialog';
import { SuccessDialog } from './SuccessDialog';

// Extracted hooks
import {
  useAdminName,
  useBulkOperations,
  useCompetitionAdminData,
  useDialogs,
  useSelfCheckinSettings,
  useVisibilitySettings,
} from './hooks';

// Extracted components
import {
  AdminHeader,
  AdminNameDialog,
  ClassesList,
  ResultVisibilitySection,
  SelfCheckinSection,
} from './components';

// Utils
import { formatTrialDate } from '../../utils/dateUtils';
import type { VisibilityPreset } from '../../types/visibility';

import './CompetitionAdmin.css';

export const CompetitionAdmin: React.FC = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();

  // Data fetching
  const { showInfo, classes, trials, isLoading, error: queryError, refetch } = useCompetitionAdminData(licenseKey);

  // Admin name management
  const { adminName, setAdminName, requireAdminName } = useAdminName();

  // Class selection and bulk operations
  const {
    selectedClasses,
    toggleClassSelection,
    selectAllClasses,
    clearSelection,
    handleBulkSetClassVisibility,
    handleBulkSetClassSelfCheckin,
  } = useBulkOperations();

  // Visibility settings
  const {
    showVisibilityPreset,
    trialVisibilitySettings,
    visibilitySectionExpanded,
    setVisibilitySectionExpanded,
    handleSetShowVisibility,
    handleSetTrialVisibility,
    handleRemoveTrialVisibility,
  } = useVisibilitySettings();

  // Self check-in settings
  const {
    showSelfCheckinEnabled,
    trialSelfCheckinSettings,
    checkinSectionExpanded,
    setCheckinSectionExpanded,
    handleSetShowSelfCheckin,
    handleSetTrialSelfCheckin,
    handleRemoveTrialSelfCheckin,
  } = useSelfCheckinSettings();

  // Dialog management
  const {
    confirmDialog,
    handleConfirmAction,
    handleCancelAction,
    successDialog,
    setSuccessDialog,
    closeSuccessDialog,
    adminNameDialog,
    tempAdminName,
    setTempAdminName,
    openAdminNameDialog,
    handleAdminNameSubmit,
    handleAdminNameCancel,
  } = useDialogs();

  // Helper to get trial label for messages
  const getTrialLabel = (trialId: number) => {
    const trial = trials.find(t => t.trial_id === trialId);
    return trial ? `${formatTrialDate(trial.trial_date)} • Trial ${trial.trial_number}` : `Trial ${trialId}`;
  };

  // Wrapped handlers that check admin name and show dialogs
  const onSetShowVisibility = async (preset: VisibilityPreset) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onSetShowVisibility(preset)))) return;
    const result = await handleSetShowVisibility(preset, adminName, licenseKey || '');
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Show Visibility Updated!' : 'Error',
      message: result.success
        ? `Result visibility set to "${preset.toUpperCase()}" for all classes in this show.`
        : result.error || 'Failed to update show visibility.',
      details: []
    });
  };

  const onSetTrialVisibility = async (trialId: number, preset: VisibilityPreset) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onSetTrialVisibility(trialId, preset)))) return;
    const result = await handleSetTrialVisibility(trialId, preset, adminName, getTrialLabel(trialId));
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Trial Visibility Updated!' : 'Error',
      message: result.success
        ? `Result visibility set to "${preset.toUpperCase()}" for ${getTrialLabel(trialId)}.`
        : result.error || 'Failed to update trial visibility.',
      details: []
    });
  };

  const onRemoveTrialVisibility = async (trialId: number) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onRemoveTrialVisibility(trialId)))) return;
    const result = await handleRemoveTrialVisibility(trialId, getTrialLabel(trialId));
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Trial Override Removed!' : 'Error',
      message: result.success
        ? `${getTrialLabel(trialId)} will now inherit the show default visibility setting.`
        : result.error || 'Failed to remove trial override.',
      details: []
    });
  };

  const onSetShowSelfCheckin = async (enabled: boolean) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onSetShowSelfCheckin(enabled)))) return;
    const result = await handleSetShowSelfCheckin(enabled, licenseKey || '');
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Show Self Check-In Updated!' : 'Error',
      message: result.success
        ? `Self check-in is now ${enabled ? 'ENABLED' : 'DISABLED'} by default for all trials/classes.`
        : result.error || 'Failed to update show self check-in.',
      details: []
    });
  };

  const onSetTrialSelfCheckin = async (trialId: number, enabled: boolean) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onSetTrialSelfCheckin(trialId, enabled)))) return;
    const result = await handleSetTrialSelfCheckin(trialId, enabled, getTrialLabel(trialId));
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Trial Self Check-In Updated!' : 'Error',
      message: result.success
        ? `${getTrialLabel(trialId)} self check-in is now ${enabled ? 'ENABLED' : 'DISABLED'}.`
        : result.error || 'Failed to update trial self check-in.',
      details: []
    });
  };

  const onRemoveTrialSelfCheckin = async (trialId: number) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onRemoveTrialSelfCheckin(trialId)))) return;
    const result = await handleRemoveTrialSelfCheckin(trialId, getTrialLabel(trialId));
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Trial Override Removed!' : 'Error',
      message: result.success
        ? `${getTrialLabel(trialId)} will now inherit the show default self check-in setting.`
        : result.error || 'Failed to remove trial override.',
      details: []
    });
  };

  const onBulkSetVisibility = async (preset: VisibilityPreset) => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onBulkSetVisibility(preset)))) return;
    const result = await handleBulkSetClassVisibility(preset, classes, adminName);
    if (!result.success && result.error?.includes('select at least one')) {
      setSuccessDialog({ isOpen: true, title: 'No Classes Selected', message: result.error, details: [] });
      return;
    }
    await refetch();
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Class Visibility Updated!' : 'Error',
      message: result.success
        ? `Result visibility set to "${preset.toUpperCase()}" for ${result.affectedClasses?.length} class(es).`
        : result.error || 'Failed to update class visibility.',
      details: result.affectedClasses || []
    });
  };

  const onBulkEnableCheckin = async () => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onBulkEnableCheckin()))) return;
    const result = await handleBulkSetClassSelfCheckin(true, classes, adminName);
    if (!result.success && result.error?.includes('select at least one')) {
      setSuccessDialog({ isOpen: true, title: 'No Classes Selected', message: result.error, details: [] });
      return;
    }
    await refetch();
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Class Self Check-In Updated!' : 'Error',
      message: result.success
        ? `Self check-in ENABLED for ${result.affectedClasses?.length} class(es).`
        : result.error || 'Failed to update class self check-in.',
      details: result.affectedClasses || []
    });
  };

  const onBulkDisableCheckin = async () => {
    if (!requireAdminName(() => openAdminNameDialog(adminName, () => onBulkDisableCheckin()))) return;
    const result = await handleBulkSetClassSelfCheckin(false, classes, adminName);
    if (!result.success && result.error?.includes('select at least one')) {
      setSuccessDialog({ isOpen: true, title: 'No Classes Selected', message: result.error, details: [] });
      return;
    }
    await refetch();
    setSuccessDialog({
      isOpen: true,
      title: result.success ? 'Class Self Check-In Updated!' : 'Error',
      message: result.success
        ? `Self check-in DISABLED for ${result.affectedClasses?.length} class(es).`
        : result.error || 'Failed to update class self check-in.',
      details: result.affectedClasses || []
    });
  };

  // Loading state
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

  // Error state
  if (queryError) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div>Error: {(queryError as Error).message || 'Failed to load data'}</div>
          <button onClick={() => refetch()} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="competition-admin page-container">
      <AdminHeader
        showInfo={showInfo}
        licenseKey={licenseKey}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      <div className="admin-content">
        {/* Admin Name Input */}
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

        <ResultVisibilitySection
          isExpanded={visibilitySectionExpanded}
          onToggleExpanded={() => setVisibilitySectionExpanded(!visibilitySectionExpanded)}
          showVisibilityPreset={showVisibilityPreset}
          trialVisibilitySettings={trialVisibilitySettings}
          trials={trials}
          onSetShowVisibility={onSetShowVisibility}
          onSetTrialVisibility={onSetTrialVisibility}
          onRemoveTrialVisibility={onRemoveTrialVisibility}
        />

        <SelfCheckinSection
          isExpanded={checkinSectionExpanded}
          onToggleExpanded={() => setCheckinSectionExpanded(!checkinSectionExpanded)}
          showSelfCheckinEnabled={showSelfCheckinEnabled}
          trialSelfCheckinSettings={trialSelfCheckinSettings}
          trials={trials}
          onSetShowSelfCheckin={onSetShowSelfCheckin}
          onSetTrialSelfCheckin={onSetTrialSelfCheckin}
          onRemoveTrialSelfCheckin={onRemoveTrialSelfCheckin}
        />

        <ClassesList
          classes={classes}
          selectedClasses={selectedClasses}
          onToggleClassSelection={toggleClassSelection}
          onSelectAllClasses={() => selectAllClasses(classes)}
          onClearSelection={clearSelection}
          onBulkSetVisibility={onBulkSetVisibility}
          onBulkEnableCheckin={onBulkEnableCheckin}
          onBulkDisableCheckin={onBulkDisableCheckin}
        />
      </div>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Confirm"
        onConfirm={() => handleConfirmAction(() => {})}
        onCancel={handleCancelAction}
        details={confirmDialog.details}
      />

      <SuccessDialog
        isOpen={successDialog.isOpen}
        title={successDialog.title}
        message={successDialog.message}
        onClose={closeSuccessDialog}
        details={successDialog.details}
      />

      <AdminNameDialog
        isOpen={adminNameDialog.isOpen}
        tempAdminName={tempAdminName}
        onAdminNameChange={setTempAdminName}
        onConfirm={() => handleAdminNameSubmit(tempAdminName, setAdminName)}
        onCancel={handleAdminNameCancel}
      />
    </div>
  );
};
