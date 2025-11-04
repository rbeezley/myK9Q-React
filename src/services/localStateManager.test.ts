import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localStateManager, PendingChange } from './localStateManager';
import { Entry } from '@/stores/entryStore';

// Mock IndexedDB utilities
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

describe('LocalStateManager', () => {
  const mockEntry: Entry = {
    id: 1,
    classId: 100,
    armband: 101,
    callName: 'Rex',
    breed: 'Golden Retriever',
    handler: 'John Doe',
    status: 'no-status',
    isScored: false,
    className: 'Test Class',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await localStateManager.clear();
    vi.mocked(db.get).mockResolvedValue(null);
    vi.mocked(db.set).mockResolvedValue(undefined);
    vi.mocked(db.delete).mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should load entries from IndexedDB', async () => {
      vi.mocked(db.get).mockImplementation(async (_store: string, key: string) => {
        if (key === 'local-state-entries') {
          return { value: [mockEntry], timestamp: Date.now() };
        }
        return null;
      });

      await localStateManager.initialize();

      const entry = localStateManager.getEntry(1);
      expect(entry).toEqual(mockEntry);
    });

    it('should load pending changes from IndexedDB', async () => {
      const pendingChange: PendingChange = {
        id: 'pending-1',
        entryId: 1,
        timestamp: Date.now(),
        type: 'score',
        changes: { isScored: true, status: 'completed' },
      };

      vi.mocked(db.get).mockImplementation(async (_store: string, key: string) => {
        if (key === 'local-state-entries') {
          return { value: [mockEntry], timestamp: Date.now() };
        }
        if (key === 'pending-changes') {
          return { value: [pendingChange], timestamp: Date.now() };
        }
        return null;
      });

      await localStateManager.initialize();

      expect(localStateManager.hasPendingChange(1)).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(db.get).mockRejectedValue(new Error('IndexedDB error'));

      await expect(localStateManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('getEntries', () => {
    it('should return entries for a specific class', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);

      const entries = localStateManager.getEntries(100);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(1);
    });

    it('should return empty array for non-existent class', () => {
      const entries = localStateManager.getEntries(999);
      expect(entries).toHaveLength(0);
    });

    it('should apply pending changes to returned entries', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true, status: 'completed' }, 'score');

      const entries = localStateManager.getEntries(100);
      expect(entries[0].isScored).toBe(true);
      expect(entries[0].status).toBe('completed');
    });
  });

  describe('getEntry', () => {
    it('should return entry with pending changes applied', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      const entry = localStateManager.getEntry(1);
      expect(entry?.isScored).toBe(true);
    });

    it('should return undefined for non-existent entry', () => {
      const entry = localStateManager.getEntry(999);
      expect(entry).toBeUndefined();
    });
  });

  describe('applyServerUpdate', () => {
    it('should update entries from server', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);

      const entry = localStateManager.getEntry(1);
      expect(entry).toEqual(mockEntry);
      expect(db.set).toHaveBeenCalled();
    });

    it('should not overwrite pending changes', async () => {
      // Add entry with pending change
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true, status: 'completed' }, 'score');

      // Server sends update with old data
      const serverUpdate = { ...mockEntry, handler: 'Jane Smith' };
      await localStateManager.applyServerUpdate([serverUpdate]);

      const entry = localStateManager.getEntry(1);
      expect(entry?.isScored).toBe(true); // Pending change preserved
      expect(entry?.status).toBe('completed'); // Pending change preserved
      expect(entry?.handler).toBe('Jane Smith'); // Server update applied
    });

    it('should handle multiple entries', async () => {
      const entry2 = { ...mockEntry, id: 2, armband: 102 };
      await localStateManager.applyServerUpdate([mockEntry, entry2]);

      const entries = localStateManager.getEntries(100);
      expect(entries).toHaveLength(2);
    });
  });

  describe('updateEntry', () => {
    beforeEach(async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
    });

    it('should update entry and create pending change', async () => {
      const updated = await localStateManager.updateEntry(1, { isScored: true }, 'score');

      expect(updated.isScored).toBe(true);
      expect(localStateManager.hasPendingChange(1)).toBe(true);
      expect(db.set).toHaveBeenCalled();
    });

    it('should throw error for non-existent entry', async () => {
      await expect(
        localStateManager.updateEntry(999, { isScored: true }, 'score')
      ).rejects.toThrow('Entry 999 not found');
    });

    it('should allow multiple updates to same entry', async () => {
      await localStateManager.updateEntry(1, { isScored: true }, 'score');
      await localStateManager.updateEntry(1, { status: 'completed' }, 'status');

      const entry = localStateManager.getEntry(1);
      expect(entry?.isScored).toBe(true);
      expect(entry?.status).toBe('completed');
    });
  });

  describe('getPendingChanges', () => {
    it('should return all pending changes', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      const pending = localStateManager.getPendingChanges();
      expect(pending).toHaveLength(1);
      expect(pending[0].entryId).toBe(1);
      expect(pending[0].type).toBe('score');
    });

    it('should return empty array when no pending changes', () => {
      const pending = localStateManager.getPendingChanges();
      expect(pending).toHaveLength(0);
    });
  });

  describe('getPendingChangesForClass', () => {
    it('should return pending changes for specific class', async () => {
      const entry2 = { ...mockEntry, id: 2, classId: 200 };
      await localStateManager.applyServerUpdate([mockEntry, entry2]);

      await localStateManager.updateEntry(1, { isScored: true }, 'score');
      await localStateManager.updateEntry(2, { isScored: true }, 'score');

      const pendingClass100 = localStateManager.getPendingChangesForClass(100);
      const pendingClass200 = localStateManager.getPendingChangesForClass(200);

      expect(pendingClass100).toHaveLength(1);
      expect(pendingClass100[0].entryId).toBe(1);
      expect(pendingClass200).toHaveLength(1);
      expect(pendingClass200[0].entryId).toBe(2);
    });
  });

  describe('clearPendingChange', () => {
    it('should remove pending change after sync', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      expect(localStateManager.hasPendingChange(1)).toBe(true);

      await localStateManager.clearPendingChange(1);

      expect(localStateManager.hasPendingChange(1)).toBe(false);
      expect(db.set).toHaveBeenCalled();
    });
  });

  describe('hasPendingChange', () => {
    it('should return true when entry has pending changes', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      expect(localStateManager.hasPendingChange(1)).toBe(true);
    });

    it('should return false when entry has no pending changes', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);

      expect(localStateManager.hasPendingChange(1)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all state', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      await localStateManager.clear();

      expect(localStateManager.getEntry(1)).toBeUndefined();
      expect(localStateManager.getPendingChanges()).toHaveLength(0);
      expect(db.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStats', () => {
    it('should return current state statistics', async () => {
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      const stats = localStateManager.getStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.pendingChanges).toBe(1);
      expect(stats.lastSync).toBeGreaterThan(0);
    });
  });

  describe('merge scenarios', () => {
    it('should handle score offline -> server update -> sync', async () => {
      // Initial server state
      await localStateManager.applyServerUpdate([mockEntry]);

      // Score offline
      await localStateManager.updateEntry(
        1,
        { isScored: true, status: 'completed', resultText: 'Q' },
        'score'
      );

      // Server sends update (old data)
      await localStateManager.applyServerUpdate([mockEntry]);

      // Verify pending changes preserved
      const entry = localStateManager.getEntry(1);
      expect(entry?.isScored).toBe(true);
      expect(entry?.status).toBe('completed');
      expect(entry?.resultText).toBe('Q');

      // Sync completes, clear pending
      await localStateManager.clearPendingChange(1);

      // Apply final server state
      const syncedEntry = {
        ...mockEntry,
        isScored: true,
        status: 'completed' as const,
        resultText: 'Q',
      };
      await localStateManager.applyServerUpdate([syncedEntry]);

      const finalEntry = localStateManager.getEntry(1);
      expect(finalEntry).toEqual(syncedEntry);
    });

    it('should handle concurrent real-time update from another device', async () => {
      // Initial state
      await localStateManager.applyServerUpdate([mockEntry]);

      // Local change: check-in
      await localStateManager.updateEntry(1, { status: 'checked-in' }, 'checkin');

      // Real-time update from another device: armband change
      const realtimeUpdate = { ...mockEntry, armband: 999 };
      await localStateManager.applyServerUpdate([realtimeUpdate]);

      // Both changes should be present
      const entry = localStateManager.getEntry(1);
      expect(entry?.status).toBe('checked-in'); // Local change preserved
      expect(entry?.armband).toBe(999); // Remote update applied
    });

    it('should handle page refresh with pending changes', async () => {
      // Setup initial state
      await localStateManager.applyServerUpdate([mockEntry]);
      await localStateManager.updateEntry(1, { isScored: true }, 'score');

      // Simulate page refresh by reinitializing
      vi.mocked(db.get).mockImplementation(async (_store: string, key: string) => {
        if (key === 'local-state-entries') {
          return { value: [{ ...mockEntry, isScored: true }], timestamp: Date.now() };
        }
        if (key === 'pending-changes') {
          return {
            value: [
              {
                id: 'pending-1',
                entryId: 1,
                timestamp: Date.now(),
                type: 'score',
                changes: { isScored: true },
              },
            ],
            timestamp: Date.now(),
          };
        }
        return null;
      });

      await localStateManager.initialize();

      const entry = localStateManager.getEntry(1);
      expect(entry?.isScored).toBe(true);
      expect(localStateManager.hasPendingChange(1)).toBe(true);
    });
  });
});
