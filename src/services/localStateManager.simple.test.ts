/**
 * Simple integration test for LocalStateManager
 * Tests the core functionality without complex mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IndexedDB module before importing
vi.mock('@/utils/indexedDB', () => ({
  db: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    init: vi.fn().mockResolvedValue({} as any),
  },
  STORES: {
    CACHE: 'cache',
    MUTATIONS: 'mutations',
    SHOWS: 'shows',
    METADATA: 'metadata',
  },
}));

import { LocalStateManager, PendingChange } from './localStateManager';
import { Entry } from '@/stores/entryStore';

describe('LocalStateManager - Basic Functionality', () => {
  let manager: InstanceType<typeof LocalStateManager>;

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

  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new (LocalStateManager as any)();
  });

  describe('Core Operations', () => {
    it('should store and retrieve entries', async () => {
      await manager.applyServerUpdate([mockEntry]);

      const entries = manager.getEntries(100);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(1);
    });

    it('should get single entry by ID', async () => {
      await manager.applyServerUpdate([mockEntry]);

      const entry = manager.getEntry(1);
      expect(entry).toBeDefined();
      expect(entry?.callName).toBe('Rex');
    });

    it('should return undefined for non-existent entry', () => {
      const entry = manager.getEntry(999);
      expect(entry).toBeUndefined();
    });

    it('should filter entries by classId', async () => {
      const entry2 = { ...mockEntry, id: 2, classId: 200 };
      await manager.applyServerUpdate([mockEntry, entry2]);

      const class100 = manager.getEntries(100);
      const class200 = manager.getEntries(200);

      expect(class100).toHaveLength(1);
      expect(class100[0].id).toBe(1);
      expect(class200).toHaveLength(1);
      expect(class200[0].id).toBe(2);
    });
  });

  describe('Pending Changes', () => {
    it('should create pending change on update', async () => {
      await manager.applyServerUpdate([mockEntry]);
      await manager.updateEntry(1, { isScored: true }, 'score');

      expect(manager.hasPendingChange(1)).toBe(true);
    });

    it('should apply pending changes to entries', async () => {
      await manager.applyServerUpdate([mockEntry]);
      await manager.updateEntry(1, { isScored: true, status: 'completed' }, 'score');

      const entry = manager.getEntry(1);
      expect(entry?.isScored).toBe(true);
      expect(entry?.status).toBe('completed');
    });

    it('should get all pending changes', async () => {
      await manager.applyServerUpdate([mockEntry]);
      await manager.updateEntry(1, { isScored: true }, 'score');

      const pending = manager.getPendingChanges();
      expect(pending).toHaveLength(1);
      expect(pending[0].entryId).toBe(1);
      expect(pending[0].type).toBe('score');
    });

    it('should clear pending changes', async () => {
      await manager.applyServerUpdate([mockEntry]);
      await manager.updateEntry(1, { isScored: true }, 'score');

      await manager.clearPendingChange(1);

      expect(manager.hasPendingChange(1)).toBe(false);
    });

    it('should throw error when updating non-existent entry', async () => {
      await expect(
        manager.updateEntry(999, { isScored: true }, 'score')
      ).rejects.toThrow('Entry 999 not found');
    });
  });

  describe('Merge Logic', () => {
    it('should preserve pending changes when server updates', async () => {
      // Initial state
      await manager.applyServerUpdate([mockEntry]);

      // Local change
      await manager.updateEntry(1, { isScored: true, status: 'completed' }, 'score');

      // Server sends old data
      await manager.applyServerUpdate([mockEntry]);

      // Pending changes should be preserved
      const entry = manager.getEntry(1);
      expect(entry?.isScored).toBe(true);
      expect(entry?.status).toBe('completed');
    });

    it('should allow server to update non-modified fields', async () => {
      await manager.applyServerUpdate([mockEntry]);

      // Local change to score
      await manager.updateEntry(1, { isScored: true }, 'score');

      // Server updates handler name
      const serverUpdate = { ...mockEntry, handler: 'Jane Smith' };
      await manager.applyServerUpdate([serverUpdate]);

      const entry = manager.getEntry(1);
      expect(entry?.isScored).toBe(true); // Pending change preserved
      expect(entry?.handler).toBe('Jane Smith'); // Server update applied
    });

    it('should handle multiple pending changes', async () => {
      await manager.applyServerUpdate([mockEntry]);

      await manager.updateEntry(1, { isScored: true }, 'score');
      await manager.updateEntry(1, { status: 'completed' }, 'status');

      const entry = manager.getEntry(1);
      expect(entry?.isScored).toBe(true);
      expect(entry?.status).toBe('completed');

      // Should have only one pending change (last one overwrites)
      expect(manager.hasPendingChange(1)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return accurate stats', async () => {
      await manager.applyServerUpdate([mockEntry]);
      await manager.updateEntry(1, { isScored: true }, 'score');

      const stats = manager.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.pendingChanges).toBe(1);
    });
  });
});
