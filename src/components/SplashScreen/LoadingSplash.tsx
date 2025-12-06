import { Loader2, CheckCircle, Wifi, Database } from 'lucide-react';
import './LoadingSplash.css';

interface OfflinePreparationProgress {
  chunksLoaded: number;
  chunksTotal: number;
  dataTablesReady: number;
  dataTablesTotal: number;
  phase: 'chunks' | 'data';
  complete: boolean;
}

interface LoadingSplashProps {
  /** Progress data for offline preparation */
  progress: OfflinePreparationProgress | null;
  /** Rotating fun message to display */
  message: string;
  /** Whether the loading is complete */
  isComplete: boolean;
}

/**
 * LoadingSplash - Post-login loading screen with splash image background
 *
 * Shows the branded splash screen with a progress overlay during:
 * - Chunk loading (app components)
 * - Data syncing (show data)
 *
 * This replaces the generic offline-prep-overlay with a branded experience.
 */
export function LoadingSplash({ progress, message, isComplete }: LoadingSplashProps) {
  return (
    <div className="loading-splash-overlay">
      {/* Splash image as background */}
      <img
        src="/myK9Q-Splash.webp"
        alt="myK9Q"
        className="loading-splash-background"
        draggable={false}
        loading="eager"
        fetchPriority="high"
      />

      {/* Semi-transparent progress panel at bottom */}
      <div className="loading-splash-progress-panel">
        {/* Icon */}
        <div className="loading-splash-icon">
          {isComplete ? (
            <CheckCircle className="h-12 w-12 text-primary loading-splash-icon-complete" />
          ) : (
            <Loader2 className="h-12 w-12 text-primary loading-splash-icon-spinning" />
          )}
        </div>

        {/* Message */}
        <h2 className="loading-splash-message">
          {isComplete ? 'Ready!' : message}
        </h2>
        <p className="loading-splash-description">
          {isComplete
            ? 'You can now use the app without wifi'
            : 'Preparing for offline use'}
        </p>

        {/* Progress indicators */}
        <div className="loading-splash-progress-items">
          {/* App Components */}
          <div className="loading-splash-progress-item">
            <div className={`loading-splash-step-icon ${progress && progress.chunksLoaded > 0 ? 'complete' : ''}`}>
              <Wifi className="h-4 w-4" />
            </div>
            <span>App Components</span>
            {progress && (
              <span className="loading-splash-step-count">
                {progress.chunksLoaded}/{progress.chunksTotal}
              </span>
            )}
          </div>

          {/* Show Data */}
          <div className="loading-splash-progress-item">
            <div className={`loading-splash-step-icon ${progress?.phase === 'data' && progress.dataTablesReady > 0 ? 'complete' : ''}`}>
              <Database className="h-4 w-4" />
            </div>
            <span>Show Data</span>
            {progress && progress.phase === 'data' && (
              <span className="loading-splash-step-count">
                {progress.dataTablesReady}/{progress.dataTablesTotal}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
