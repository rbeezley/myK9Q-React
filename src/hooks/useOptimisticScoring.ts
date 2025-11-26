import { useCallback } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { submitScore } from '../services/entryService';
import { useEntryStore } from '../stores/entryStore';
import { useScoringStore } from '../stores/scoringStore';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';

/**
 * Specialized hook for optimistic score submissions
 *
 * Flow:
 * 1. Judge clicks "Save Score" → Score appears saved INSTANTLY
 * 2. Judge can navigate to next dog immediately
 * 3. Score syncs with server in background
 * 4. If sync fails, show error indicator and queue for retry
 * 5. Automatic retry with exponential backoff (3 attempts)
 *
 * @example
 * const { submitScoreOptimistically, isSyncing, hasError } = useOptimisticScoring();
 *
 * const handleSave = async () => {
 *   await submitScoreOptimistically({
 *     entryId: currentEntry.id,
 *     scoreData: { resultText: 'Q', searchTime: '1:23.45', ... },
 *     onSuccess: () => navigate('/entries'),
 *   });
 * };
 */

export interface ScoreSubmissionData {
  entryId: number;
  classId: number;
  armband: number;
  className: string;
  scoreData: {
    resultText: string;
    searchTime?: string;
    faultCount?: number;
    points?: number;
    nonQualifyingReason?: string;
    areas?: { [key: string]: string };
    healthCheckPassed?: boolean;
    mph?: number;
    score?: number;
    deductions?: number;
    correctCount?: number;
    incorrectCount?: number;
    finishCallErrors?: number;
    areaTimes?: string[];
    element?: string;
    level?: string;
  };
}

export interface OptimisticScoringOptions {
  /** Entry ID to score */
  entryId: number;
  /** Score data to submit */
  scoreData: ScoreSubmissionData['scoreData'];
  /** Class ID for offline queue */
  classId?: number;
  /** Armband for offline queue */
  armband?: number;
  /** Class name for offline queue */
  className?: string;
  /** Called when score successfully syncs */
  onSuccess?: () => void;
  /** Called when score fails to sync after all retries */
  onError?: (error: Error) => void;
  /** Paired class ID for combined Novice A & B view */
  pairedClassId?: number;
}

export function useOptimisticScoring() {
  const { update, isSyncing, hasError, error, retryCount, clearError } = useOptimisticUpdate();
  const { markAsScored } = useEntryStore();
  const { submitScore: addScoreToSession } = useScoringStore();
  const { addToQueue, isOnline } = useOfflineQueueStore();

  const submitScoreOptimistically = useCallback(async (options: OptimisticScoringOptions) => {
    const {
      entryId,
      scoreData,
      classId,
      armband,
      className,
      onSuccess,
      onError,
      pairedClassId,
    } = options;

    console.log('🚀 Optimistic score submission started for entry:', entryId);

    // Step 1: Update local state IMMEDIATELY (< 50ms)
    // This makes the UI feel instant
    const optimisticResult = scoreData.resultText as any; // Type assertion for flexible result text

    // Mark as scored in local store (legacy)
    markAsScored(entryId, optimisticResult);

    // Add to scoring session for local tracking
    addScoreToSession({
      entryId,
      armband: armband || 0,
      time: scoreData.searchTime || '0:00.00',
      qualifying: optimisticResult,
      areas: scoreData.areas || {},
      nonQualifyingReason: scoreData.nonQualifyingReason,
      correctCount: scoreData.correctCount,
      incorrectCount: scoreData.incorrectCount,
      faults: scoreData.faultCount, // Map faultCount to faults for Score interface
      finishCallErrors: scoreData.finishCallErrors,
    });

    console.log('✅ Local state updated optimistically');

    // Step 2: Sync with server in background
    await update({
      optimisticData: { entryId, scoreData },
      serverUpdate: async () => {
        // Check if online
        if (!isOnline) {
          console.log('📴 Offline - adding to queue for later sync');

          // Add to offline queue if we have the required data
          if (classId && armband && className) {
            addToQueue({
              entryId,
              armband,
              classId,
              className,
              scoreData,
            });
          }

          // Throw error to trigger retry when back online
          throw new Error('Offline - queued for sync');
        }

        // Submit to server
        console.log('📡 Submitting score to server...');
        await submitScore(entryId, scoreData, pairedClassId, classId);
        console.log('✅ Score successfully synced with server');

        // Real-time subscription will confirm the database update
        // Placement calculation is handled inside submitScore() in the background

        return { entryId, scoreData };
      },
      onSuccess: () => {
        console.log('✅ Score submission completed successfully');
        onSuccess?.();
      },
      onError: (err) => {
        console.error('❌ Score submission failed:', err);

        // If offline, we already queued it, so don't show error
        if (!isOnline) {
          console.log('📴 Score queued for sync when online');
          onSuccess?.(); // Still allow navigation
          return;
        }

        // Real error - notify user
        onError?.(err);
      },
      onRollback: () => {
        console.log('🔄 Rolling back optimistic update');
        // The markAsScored already happened, could add undo logic here if needed
      },
      maxRetries: 3,
      retryDelay: 1000, // 1 second, exponential backoff in hook
    });

  }, [update, markAsScored, addScoreToSession, addToQueue, isOnline]);

  return {
    /** Submit score with optimistic update */
    submitScoreOptimistically,
    /** Whether currently syncing with server */
    isSyncing,
    /** Whether last sync failed */
    hasError,
    /** Error details if sync failed */
    error,
    /** Number of retry attempts made */
    retryCount,
    /** Clear error state */
    clearError,
  };
}
