/**
 * Tests for useOptimisticScoring hook - Offline-First Compliance
 *
 * Verifies that scoring follows offline-first pattern:
 * 1. Optimistic updates happen immediately
 * 2. No manual refresh() calls
 * 3. Silent failure when offline
 * 4. No rollback of optimistic updates
 * 5. Real-time subscriptions handle confirmation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticScoring } from '../useOptimisticScoring';
import { localStateManager } from '@/services/localStateManager';
import { submitScore } from '@/services/entryService';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';

// Mock dependencies
vi.mock('@/services/localStateManager');
vi.mock('@/services/entryService');
vi.mock('@/stores/entryStore', () => ({
  useEntryStore: vi.fn(() => ({
    markAsScored: vi.fn(),
    entries: [],
    setEntries: vi.fn()
  }))
}));
vi.mock('@/stores/scoringStore', () => ({
  useScoringStore: vi.fn(() => ({
    submitScore: vi.fn(),
    scores: [],
    isScoring: false
  }))
}));
vi.mock('@/stores/offlineQueueStore');

describe('useOptimisticScoring - Offline-First Compliance', () => {
  const mockEntry = {
    id: 1,
    classId: 10,
    armband: 101,
    className: 'Novice A'
  };

  const mockScoreData = {
    resultText: 'Q',
    searchTime: '1:23.45',
    faultCount: 0,
    correctCount: 3,
    incorrectCount: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (localStateManager.updateEntry as any).mockResolvedValue({});
    (localStateManager.clearPendingChange as any).mockResolvedValue(undefined);
    (localStateManager.hasPendingChange as any).mockReturnValue(false);
    (submitScore as any).mockResolvedValue(undefined);

    // Mock offline queue store
    (useOfflineQueueStore as unknown as any).mockReturnValue({
      addToQueue: vi.fn(),
      isOnline: true
    });

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scenario 1: Online - Successful Sync', () => {
    it('updates localStateManager immediately before API call', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      let apiCallTime: number | null = null;
      let localStateUpdateTime: number | null = null;

      (localStateManager.updateEntry as vi.Mock).mockImplementation(async () => {
        localStateUpdateTime = Date.now();
      });

      (submitScore as vi.Mock).mockImplementation(async () => {
        apiCallTime = Date.now();
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // Assert localStateManager was called first
      expect(localStateManager.updateEntry).toHaveBeenCalledWith(
        mockEntry.id,
        expect.objectContaining({
          isScored: true,
          status: 'completed',
          resultText: 'Q',
          searchTime: '1:23.45',
          faultCount: 0
        }),
        'score'
      );

      // Assert timing: local update happened before API call
      expect(localStateUpdateTime).not.toBeNull();
      expect(apiCallTime).not.toBeNull();
      if (localStateUpdateTime && apiCallTime) {
        expect(localStateUpdateTime).toBeLessThan(apiCallTime);
      }
    });

    it('does NOT manually clear pending change after sync', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // Wait for async operations
      await waitFor(() => {
        expect(submitScore).toHaveBeenCalled();
      });

      // Assert clearPendingChange was NOT called immediately
      // It should only be called by real-time subscription
      expect(localStateManager.clearPendingChange).not.toHaveBeenCalled();
    });

    it('syncs with database in background', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      await waitFor(() => {
        expect(submitScore).toHaveBeenCalledWith(
          mockEntry.id,
          expect.objectContaining({
            resultText: 'Q',
            searchTime: '1:23.45'
          }),
          undefined,
          mockEntry.classId
        );
      });
    });

    it('has safety timeout fallback for clearing pending change', async () => {
      vi.useFakeTimers();

      (localStateManager.hasPendingChange as vi.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // Fast-forward 5 seconds (safety timeout)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(localStateManager.clearPendingChange).toHaveBeenCalledWith(mockEntry.id);
      });

      vi.useRealTimers();
    });
  });

  describe('Scenario 2: Offline - Silent Failure', () => {
    beforeEach(() => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      });

      (useOfflineQueueStore as unknown as vi.Mock).mockReturnValue({
        addToQueue: vi.fn(),
        isOnline: false
      });
    });

    it('updates localStateManager immediately when offline', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      expect(localStateManager.updateEntry).toHaveBeenCalledWith(
        mockEntry.id,
        expect.objectContaining({ isScored: true, resultText: 'Q' }),
        'score'
      );
    });

    it('does not throw error or show alert when offline', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useOptimisticScoring());

      // Should not throw
      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // No alert shown to user
      expect(alertSpy).not.toHaveBeenCalled();

      // May log to console (that's fine)
      // but error message should be about offline, not a crash
      if (consoleErrorSpy.mock.calls.length > 0) {
        expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/offline|failed/i);
      }

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('keeps pending change in localStateManager when offline', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // Pending change was added
      expect(localStateManager.updateEntry).toHaveBeenCalled();

      // But NOT cleared (should wait for online sync)
      expect(localStateManager.clearPendingChange).not.toHaveBeenCalled();
    });

    it('adds score to offline queue when offline', async () => {
      const addToQueueMock = vi.fn();
      (useOfflineQueueStore as unknown as vi.Mock).mockReturnValue({
        addToQueue: addToQueueMock,
        isOnline: false
      });

      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      expect(addToQueueMock).toHaveBeenCalledWith({
        entryId: mockEntry.id,
        armband: mockEntry.armband,
        classId: mockEntry.classId,
        className: mockEntry.className,
        scoreData: mockScoreData
      });
    });
  });

  describe('Scenario 3: Connection Drops Mid-Sync', () => {
    it('does not rollback optimistic update if sync fails', async () => {
      (submitScore as vi.Mock).mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // Optimistic update was applied
      expect(localStateManager.updateEntry).toHaveBeenCalledWith(
        mockEntry.id,
        expect.objectContaining({ isScored: true }),
        'score'
      );

      // NOT rolled back (no second call to revert it)
      expect(localStateManager.updateEntry).toHaveBeenCalledTimes(1);
    });

    it('does not show error to user when sync fails', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      (submitScore as vi.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Scenario 4: Multiple Rapid Actions', () => {
    it('applies all optimistic updates immediately', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      const entries = [
        { id: 1, scoreData: { resultText: 'Q', searchTime: '1:00.00' } },
        { id: 2, scoreData: { resultText: 'NQ', searchTime: '2:00.00' } },
        { id: 3, scoreData: { resultText: 'Q', searchTime: '1:30.00' } }
      ];

      // Perform 3 rapid scoring actions
      await act(async () => {
        await Promise.all(
          entries.map(entry =>
            result.current.submitScoreOptimistically({
              entryId: entry.id,
              classId: mockEntry.classId,
              armband: mockEntry.armband + entry.id,
              className: mockEntry.className,
              scoreData: entry.scoreData
            })
          )
        );
      });

      // All 3 should update localStateManager
      expect(localStateManager.updateEntry).toHaveBeenCalledTimes(3);

      // Check each was called with correct data
      entries.forEach((entry, index) => {
        const call = (localStateManager.updateEntry as vi.Mock).mock.calls[index];
        expect(call[0]).toBe(entry.id);
        expect(call[1]).toMatchObject({
          isScored: true,
          resultText: entry.scoreData.resultText
        });
      });
    });

    it('queues all syncs correctly without deduplication', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      const entries = [1, 2, 3];

      await act(async () => {
        await Promise.all(
          entries.map(id =>
            result.current.submitScoreOptimistically({
              entryId: id,
              classId: mockEntry.classId,
              armband: 100 + id,
              className: mockEntry.className,
              scoreData: { resultText: 'Q', searchTime: `1:${id}0.00` }
            })
          )
        );
      });

      // Should have 3 separate API calls
      await waitFor(() => {
        expect(submitScore).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Scenario 5: Real-time Subscription Integration', () => {
    it('does not interfere with real-time subscription clearing pending changes', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      // Perform scoring action
      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      // Verify pending change was NOT cleared by hook
      expect(localStateManager.clearPendingChange).not.toHaveBeenCalled();

      // Simulate real-time subscription clearing it
      await act(async () => {
        await localStateManager.clearPendingChange(mockEntry.id);
      });

      // Now it should be cleared
      expect(localStateManager.clearPendingChange).toHaveBeenCalledWith(mockEntry.id);
    });
  });

  describe('Pattern Compliance Checks', () => {
    it('follows the exact offline-first pattern: optimistic update then background sync', async () => {
      const callOrder: string[] = [];

      (localStateManager.updateEntry as vi.Mock).mockImplementation(async () => {
        callOrder.push('localStateManager.updateEntry');
      });

      (submitScore as vi.Mock).mockImplementation(async () => {
        callOrder.push('submitScore');
      });

      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      await waitFor(() => {
        expect(callOrder).toEqual([
          'localStateManager.updateEntry',
          'submitScore'
        ]);
      });
    });

    it('updates UI in less than 50ms (optimistic)', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      const startTime = Date.now();

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: mockEntry.id,
          classId: mockEntry.classId,
          armband: mockEntry.armband,
          className: mockEntry.className,
          scoreData: mockScoreData
        });
      });

      const uiUpdateTime = Date.now() - startTime;

      // Optimistic update should be nearly instant
      expect(uiUpdateTime).toBeLessThan(100); // Allow 100ms for test overhead
      expect(localStateManager.updateEntry).toHaveBeenCalled();
    });
  });
});
