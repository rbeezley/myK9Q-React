import { useCallback } from 'react';
import { useOptimisticUpdate } from '../../../hooks/useOptimisticUpdate';
import { updateEntryCheckinStatus, resetEntryScore, markInRing } from '../../../services/entryService';
import { Entry as _Entry } from '../../../stores/entryStore';

/**
 * Shared hook for entry list actions with optimistic updates.
 * Handles check-in status changes, reset score, and in-ring status.
 */
export const useEntryListActions = (onRefresh: () => void) => {
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
        onSuccess: () => onRefresh(),
        onError: (error) => console.error('Status update failed:', error)
      });
    },
    [update, onRefresh]
  );

  /**
   * Reset entry score
   */
  const handleResetScore = useCallback(
    async (entryId: number) => {
      try {
        await resetEntryScore(entryId);
        onRefresh();
      } catch (error) {
        console.error('Error resetting score:', error);
      }
    },
    [onRefresh]
  );

  /**
   * Toggle in-ring status
   */
  const handleToggleInRing = useCallback(
    async (entryId: number, currentInRing: boolean) => {
      try {
        await markInRing(entryId, !currentInRing);
        onRefresh();
      } catch (error) {
        console.error('Error toggling in-ring status:', error);
      }
    },
    [onRefresh]
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
        onRefresh();
      } catch (error) {
        console.error('Error in batch update:', error);
      }
    },
    [onRefresh]
  );

  return {
    handleStatusChange,
    handleResetScore,
    handleToggleInRing,
    handleBatchStatusUpdate,
    isSyncing,
    hasError
  };
};
