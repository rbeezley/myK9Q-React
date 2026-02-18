import { RefreshCw, CheckCircle } from 'lucide-react';
import './UpdateToast.css';

interface UpdateToastProps {
  /** Called when user taps "Update Now" */
  onUpdate: () => void;
  /** Called when user taps "Later" */
  onLater: () => void;
  /** Whether the update is currently being applied */
  isUpdating?: boolean;
}

/**
 * PWA Update Toast
 *
 * Displays a styled notification when a new app version is available.
 * Replaces the browser's native confirm() dialog with a branded experience.
 */
export function UpdateToast({ onUpdate, onLater, isUpdating }: UpdateToastProps) {
  return (
    <div
      className="update-toast-overlay"
      role="alertdialog"
      aria-labelledby="update-toast-message"
      aria-describedby="update-toast-message"
    >
      <div className="update-toast">
        <div className={`update-toast-icon ${isUpdating ? 'updating' : ''}`}>
          {isUpdating ? <CheckCircle size={24} /> : <RefreshCw size={24} />}
        </div>

        <div className="update-toast-content">
          <p id="update-toast-message" className="update-toast-message">
            {isUpdating
              ? 'Updating... reloading shortly.'
              : 'myK9Q has been updated! Tap to load new features.'}
          </p>
        </div>

        {!isUpdating && (
          <div className="update-toast-actions">
            <button
              className="update-toast-btn update-toast-btn-primary"
              onClick={onUpdate}
            >
              Update Now
            </button>
            <button
              className="update-toast-btn update-toast-btn-secondary"
              onClick={onLater}
              autoFocus
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateToast;
