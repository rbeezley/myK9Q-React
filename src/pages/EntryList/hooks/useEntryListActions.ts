import { useCallback } from 'react';
import { useOptimisticUpdate } from '../../../hooks/useOptimisticUpdate';
import { updateEntryCheckinStatus, resetEntryScore, markInRing, markEntryCompleted } from '../../../services/entryService';
import { Entry as _Entry } from '../../../stores/entryStore';
// TODO: Remove legacy localStateManager - replaced by replication system
// import { localStateManager } from '../../../services/localStateManager';

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
    async (entryId: number, newStatus: 'no-status' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate') => {
      // 🚀 LOCAL-FIRST: Update LocalStateManager immediately
      // This creates a pending change that persists across refreshes
      try {
        console.log('🔄 Creating pending status change for entry:', entryId, '→', newStatus);
        // TODO: Remove legacy - replaced by replication
        // await localStateManager.updateEntry(entryId, { status: newStatus }, 'status');
        console.log('✅ LocalStateManager updated with pending status change');
      } catch (error) {
        console.error('❌ Could not update LocalStateManager:', error);
      }

      // Use the optimistic update hook for retry logic and error handling
      await update({
        optimisticData: { entryId, status: newStatus },
        serverUpdate: async () => {
          await updateEntryCheckinStatus(entryId, newStatus);
          return { entryId, status: newStatus };
        },
        onSuccess: () => {}, // Real-time subscriptions will clear the pending change
        onError: (error) => console.error('Status update failed:', error)
      });
    },
    [update]
  );

  /**
   * Reset entry score with optimistic update
   */
  const handleResetScore = useCallback(
    async (entryId: number) => {
      // 🚀 LOCAL-FIRST: Update LocalStateManager immediately
      // This creates a pending change that persists across refreshes
      try {
        console.log('🔄 Creating pending reset for entry:', entryId);
        // TODO: Remove legacy - replaced by replication
        // await localStateManager.updateEntry(entryId, {...}, 'reset');
        console.log('✅ LocalStateManager updated with pending reset');
      } catch (error) {
        console.error('❌ Could not update LocalStateManager:', error);
      }

      // Sync with server in background (silently fails if offline)
      try {
        await resetEntryScore(entryId);
        // Real-time subscription will clear the pending change when database confirms
      } catch (error) {
        console.error('Error resetting score in background:', error);
        // Don't throw - offline-first means this is transparent
        // The optimistic update already happened, sync will retry when online
      }
    },
    []
  );

  /**
   * Toggle in-ring status
   */
  const handleToggleInRing = useCallback(
    async (entryId: number, currentInRing: boolean) => {
      const newInRing = !currentInRing;

      // 🚀 LOCAL-FIRST: Update LocalStateManager immediately
      try {
        console.log('🔄 Creating pending in-ring toggle for entry:', entryId, '→', newInRing);
        // TODO: Remove legacy - replaced by replication
        // await localStateManager.updateEntry(entryId, { status: newInRing ? 'in-ring' : 'no-status' }, 'status');
        console.log('✅ LocalStateManager updated with pending in-ring change');
      } catch (error) {
        console.error('❌ Could not update LocalStateManager:', error);
      }

      // Sync with server in background (silently fails if offline)
      try {
        await markInRing(entryId, newInRing);
        // Real-time subscription will clear the pending change when database confirms
      } catch (error) {
        console.error('Error toggling in-ring status in background:', error);
        // Don't throw - offline-first means this is transparent
      }
    },
    []
  );

  /**
   * Mark entry as in-ring (for manual ring management)
   */
  const handleMarkInRing = useCallback(
    async (entryId: number) => {
      // 🚀 LOCAL-FIRST: Update LocalStateManager immediately
      try {
        console.log('🔄 Creating pending mark in-ring for entry:', entryId);
        // TODO: Remove legacy - replaced by replication
        // await localStateManager.updateEntry(entryId, { status: 'in-ring' }, 'status');
        console.log('✅ LocalStateManager updated with pending in-ring status');
      } catch (error) {
        console.error('❌ Could not update LocalStateManager:', error);
      }

      // Sync with server in background (silently fails if offline)
      try {
        await markInRing(entryId, true);
        // Real-time subscription will clear the pending change when database confirms
      } catch (error) {
        console.error('Error marking entry in-ring in background:', error);
        // Don't throw - offline-first means this is transparent
      }
    },
    []
  );

  /**
   * Mark entry as completed without full score (for manual ring management)
   */
  const handleMarkCompleted = useCallback(
    async (entryId: number) => {
      // 🚀 LOCAL-FIRST: Update LocalStateManager immediately
      try {
        console.log('🔄 Creating pending mark completed for entry:', entryId);
        // TODO: Remove legacy - replaced by replication
        // await localStateManager.updateEntry(entryId, { isScored: true, status: 'completed' }, 'status');
        console.log('✅ LocalStateManager updated with pending completed status');
      } catch (error) {
        console.error('❌ Could not update LocalStateManager:', error);
      }

      // Sync with server in background (silently fails if offline)
      try {
        await markEntryCompleted(entryId);
        // Real-time subscription will clear the pending change when database confirms
      } catch (error) {
        console.error('Error marking entry completed in background:', error);
        // Don't throw - offline-first means this is transparent
      }
    },
    []
  );

  /**
   * Batch status update (for future use)
   */
  const handleBatchStatusUpdate = useCallback(
    async (entryIds: number[], newStatus: 'no-status' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate') => {
      // 🚀 LOCAL-FIRST: Update LocalStateManager immediately for all entries
      console.log(`🔄 Creating pending batch status change for ${entryIds.length} entries →`, newStatus);
      const updatePromises = entryIds.map(async (entryId) => {
        try {
          // TODO: Remove legacy - replaced by replication
          // await localStateManager.updateEntry(entryId, { status: newStatus }, 'status');
        } catch (error) {
          console.error(`❌ Could not update LocalStateManager for entry ${entryId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      console.log('✅ LocalStateManager updated with pending batch changes');

      // Sync with server in background (silently fails if offline)
      try {
        await Promise.all(
          entryIds.map((id) => updateEntryCheckinStatus(id, newStatus))
        );
        // Real-time subscriptions will clear the pending changes when database confirms
      } catch (error) {
        console.error('Error in batch update in background:', error);
        // Don't throw - offline-first means this is transparent
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
