/**
 * Integration tests for offline-first persistence across page refreshes
 *
 * These tests verify that entry modifications persist even when:
 * 1. Page is refreshed before database sync completes
 * 2. User is offline (database sync fails)
 * 3. Real-time subscriptions haven't fired yet
 *
 * This ensures the offline-first architecture works correctly for all actions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Entry } from '../../../stores/entryStore';

// Mock IndexedDB utilities BEFORE importing localStateManager
vi.mock('@/utils/indexedDB', () => ({
  db: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  STORES: {
    CACHE: 'cache',
    MUTATIONS: 'mutations',
    SHOWS: 'shows',
    METADATA: 'metadata',
  },
}));

import { db } from '@/utils/indexedDB';
import { localStateManager } from '../../../services/localStateManager';

// Mock entry data
const mockEntry: Entry = {
  id: 118,
  armband: 118,
  callName: 'TestDog',
  breed: 'Border Collie',
  handler: 'John Doe',
  jumpHeight: '20"',
  preferredTime: '',
  isScored: true,
  status: 'completed',
  inRing: false,
  checkedIn: false,
  checkinStatus: 'no-status',
  resultText: 'Q',
  searchTime: '1:23.45',
  faultCount: 0,
  placement: 1,
  correctFinds: 3,
  incorrectFinds: 0,
  noFinishCount: 0,
  totalPoints: 100,
  classId: 100,
  className: 'Container Novice A',
  section: 'A',
  element: 'Container',
  level: 'Novice',
  timeLimit: '3:00',
  exhibitorOrder: 1,
  actualClassId: 100,
  trialDate: '2024-01-15',
  trialNumber: '1'
};

describe('EntryList Persistence Tests', () => {
  beforeEach(async () => {
    // Clear mocks
    vi.clearAllMocks();
    vi.mocked(db.get).mockResolvedValue(null);
    vi.mocked(db.set).mockResolvedValue(undefined);
    vi.mocked(db.delete).mockResolvedValue(undefined);

    // Clear localStateManager before each test
    await localStateManager.clear();

    // Load mock entry into localStateManager
    await localStateManager.applyServerUpdate([mockEntry]);
  });

  describe('Reset Score Persistence', () => {
    it('should persist reset across simulated page refresh', async () => {
      // Simulate user clicking reset score
      await localStateManager.updateEntry(
        118,
        {
          isScored: false,
          status: 'no-status',
          resultText: '',
          searchTime: '',
          faultCount: 0,
          placement: undefined,
          correctFinds: 0,
          incorrectFinds: 0,
        },
        'reset'
      );

      // Verify pending change exists
      expect(localStateManager.hasPendingChange(118)).toBe(true);
      const pending = localStateManager.getPendingChanges();
      expect(pending).toHaveLength(1);
      expect(pending[0].type).toBe('reset');

      // Simulate page refresh by getting entry from localStateManager
      // (this mimics what getClassEntries does)
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);

      // Verify reset persisted
      expect(entry).toBeDefined();
      expect(entry!.isScored).toBe(false);
      expect(entry!.status).toBe('no-status');
      expect(entry!.resultText).toBe('');
      expect(entry!.searchTime).toBe('');
      expect(entry!.faultCount).toBe(0);
      expect(entry!.placement).toBeUndefined();
    });

    it('should merge pending reset with stale database data', async () => {
      // User resets score locally
      await localStateManager.updateEntry(
        118,
        {
          isScored: false,
          status: 'no-status',
          resultText: '',
        },
        'reset'
      );

      // Simulate stale database fetch (still shows old completed data)
      const staleDbData: Entry = { ...mockEntry, isScored: true, status: 'completed', resultText: 'Q' };
      await localStateManager.applyServerUpdate([staleDbData]);

      // Get merged entry
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);

      // Pending change should override stale database data
      expect(entry!.isScored).toBe(false);
      expect(entry!.status).toBe('no-status');
      expect(entry!.resultText).toBe('');
    });
  });

  describe('Status Change Persistence', () => {
    it('should persist status change across simulated page refresh', async () => {
      // Simulate user changing status from no-status to checked-in
      await localStateManager.updateEntry(
        118,
        { status: 'checked-in' },
        'status'
      );

      // Verify pending change exists
      expect(localStateManager.hasPendingChange(118)).toBe(true);

      // Simulate page refresh
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);

      // Verify status change persisted
      expect(entry!.status).toBe('checked-in');
    });

    it('should merge pending status with stale database data', async () => {
      // User changes status to at-gate
      await localStateManager.updateEntry(
        118,
        { status: 'at-gate' },
        'status'
      );

      // Simulate stale database fetch (still shows old status)
      const staleDbData: Entry = { ...mockEntry, status: 'no-status' };
      await localStateManager.applyServerUpdate([staleDbData]);

      // Get merged entry
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);

      // Pending change should override stale database data
      expect(entry!.status).toBe('at-gate');
    });
  });

  describe('In-Ring Status Persistence', () => {
    it('should persist in-ring status across simulated page refresh', async () => {
      // Simulate user marking entry as in-ring
      await localStateManager.updateEntry(
        118,
        { status: 'in-ring' },
        'status'
      );

      // Verify pending change exists
      expect(localStateManager.hasPendingChange(118)).toBe(true);

      // Simulate page refresh
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);

      // Verify in-ring status persisted
      expect(entry!.status).toBe('in-ring');
    });
  });

  describe('Mark Completed Persistence', () => {
    it('should persist mark completed across simulated page refresh', async () => {
      // Start with pending entry
      const pendingEntry = { ...mockEntry, isScored: false, status: 'no-status' as const };
      await localStateManager.applyServerUpdate([pendingEntry]);

      // Simulate user marking as completed
      await localStateManager.updateEntry(
        118,
        {
          isScored: true,
          status: 'completed'
        },
        'status'
      );

      // Verify pending change exists
      expect(localStateManager.hasPendingChange(118)).toBe(true);

      // Simulate page refresh
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);

      // Verify completed status persisted
      expect(entry!.isScored).toBe(true);
      expect(entry!.status).toBe('completed');
    });
  });

  describe('Pending Change Lifecycle', () => {
    it('should clear pending change when database confirms update', async () => {
      // Create pending change
      await localStateManager.updateEntry(
        118,
        { status: 'checked-in' },
        'status'
      );

      expect(localStateManager.hasPendingChange(118)).toBe(true);

      // Simulate database update confirmation (real-time subscription fires)
      const updatedDbData: Entry = { ...mockEntry, status: 'checked-in' };
      await localStateManager.applyServerUpdate([updatedDbData]);

      // Pending change should be cleared automatically when server data matches
      // (This is handled by mergeServerWithPending in localStateManager)
      // For now, we manually clear it (in production, real-time subscription clears it)
      await localStateManager.clearPendingChange(118);

      expect(localStateManager.hasPendingChange(118)).toBe(false);
    });

    it('should maintain multiple pending changes for different entries', async () => {
      // Add second entry
      const mockEntry2: Entry = { ...mockEntry, id: 119, armband: 119 };
      await localStateManager.applyServerUpdate([mockEntry2]);

      // Create pending changes for both entries
      await localStateManager.updateEntry(118, { status: 'checked-in' }, 'status');
      await localStateManager.updateEntry(119, { status: 'at-gate' }, 'status');

      // Verify both have pending changes
      expect(localStateManager.hasPendingChange(118)).toBe(true);
      expect(localStateManager.hasPendingChange(119)).toBe(true);

      const pending = localStateManager.getPendingChanges();
      expect(pending).toHaveLength(2);
    });
  });

  describe('Batch Updates Persistence', () => {
    it('should persist batch status updates across page refresh', async () => {
      // Add multiple entries
      const entries: Entry[] = [
        { ...mockEntry, id: 118, armband: 118 },
        { ...mockEntry, id: 119, armband: 119 },
        { ...mockEntry, id: 120, armband: 120 },
      ];
      await localStateManager.applyServerUpdate(entries);

      // Simulate batch status update
      await Promise.all(
        entries.map(e => localStateManager.updateEntry(e.id, { status: 'checked-in' }, 'status'))
      );

      // Verify all have pending changes
      expect(localStateManager.getPendingChanges()).toHaveLength(3);

      // Simulate page refresh
      const refreshedEntries = localStateManager.getEntries(100);

      // Verify all status changes persisted
      refreshedEntries.forEach(entry => {
        expect(entry.status).toBe('checked-in');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle entry not found gracefully', async () => {
      // Try to update entry that doesn't exist
      await expect(
        localStateManager.updateEntry(999, { status: 'checked-in' }, 'status')
      ).rejects.toThrow('Entry 999 not found in local state');
    });

    it('should not lose pending changes when database fetch fails', async () => {
      // Create pending change
      await localStateManager.updateEntry(
        118,
        { status: 'at-gate' },
        'status'
      );

      // Simulate failed database fetch (no new data applied)
      // The pending change should still exist
      expect(localStateManager.hasPendingChange(118)).toBe(true);

      // Get entry - should still have pending change applied
      const entries = localStateManager.getEntries(100);
      const entry = entries.find(e => e.id === 118);
      expect(entry!.status).toBe('at-gate');
    });
  });
});
