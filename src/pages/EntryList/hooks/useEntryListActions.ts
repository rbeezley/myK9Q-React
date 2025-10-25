import { useCallback } from 'react';
import { useOptimisticUpdate } from '../../../hooks/useOptimisticUpdate';
import { updateEntryCheckinStatus, resetEntryScore, markInRing, markEntryCompleted } from '../../../services/entryService';
import { Entry as _Entry } from '../../../stores/entryStore';

/**
 * Shared hook for entry list actions with optimistic updates.
 * Handles check-in status changes, reset score, and in-ring status.
 */
export const useEntryListActions = (_onRefresh: () => void) => {
  // Optimistic update hook for check-in status changes
  const { update, isSyncing, hasError } = useOptimisticUpdate();

  /**
   * Update entry check-in status with optimistic updates
   */
  const handleStatusChange = useCallback(
    async (entryId: number, newStatus: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate') => {
      await update({
        optimisticData: { entryId, status: newStatus },
        serverUpdate: async () => {
          await updateEntryCheckinStatus(entryId, newStatus);
          return { entryId, status: newStatus };
        },
        onSuccess: () => {}, // Real-time subscriptions will update the data
        onError: (error) => console.error('Status update failed:', error)
      });
    },
    [update]
  );

  /**
   * Reset entry score
   */
  const handleResetScore = useCallback(
    async (entryId: number) => {
      try {
        await resetEntryScore(entryId);
        // Real-time subscriptions will update the data
      } catch (error) {
        console.error('Error resetting score:', error);
        throw error; // Let caller handle refresh on error
      }
    },
    []
  );

  /**
   * Toggle in-ring status
   */
  const handleToggleInRing = useCallback(
    async (entryId: number, currentInRing: boolean) => {
      try {
        await markInRing(entryId, !currentInRing);
        // Real-time subscriptions will update the data
      } catch (error) {
        console.error('Error toggling in-ring status:', error);
        throw error; // Let caller handle refresh on error
      }
    },
    []
  );

  /**
   * Mark entry as in-ring (for manual ring management)
   */
  const handleMarkInRing = useCallback(
    async (entryId: number) => {
      try {
        await markInRing(entryId, true);
        // Real-time subscriptions will update the data
      } catch (error) {
        console.error('Error marking entry in-ring:', error);
        throw error; // Let caller handle refresh on error
      }
    },
    []
  );

  /**
   * Mark entry as completed without full score (for manual ring management)
   */
  const handleMarkCompleted = useCallback(
    async (entryId: number) => {
      try {
        await markEntryCompleted(entryId);
        // Real-time subscriptions will update the data
      } catch (error) {
        console.error('Error marking entry completed:', error);
        throw error; // Let caller handle refresh on error
      }
    },
    []
  );

  /**
   * Batch status update (for future use)
   */
  const handleBatchStatusUpdate = useCallback(
    async (entryIds: number[], newStatus: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate') => {
      try {
        await Promise.all(
          entryIds.map((id) => updateEntryCheckinStatus(id, newStatus))
        );
        // Real-time subscriptions will update the data
      } catch (error) {
        console.error('Error in batch update:', error);
        throw error; // Let caller handle refresh on error
      }
    },
    []
  );

  return {
    handleStatusChange,
    handleResetScore,
    handleToggleInRing,
    handleMarkInRing,
    handleMarkCompleted,
    handleBatchStatusUpdate,
    isSyncing,
    hasError
  };
};
