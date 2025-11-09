/**
 * ReplicatedEntriesTable Tests
 *
 * Validates the first concrete implementation of ReplicatedTable:
 * - CRUD operations with IndexedDB persistence
 * - Query methods (getByClassId, getByArmband)
 * - Subscription pattern for real-time updates
 * - TTL expiration and cache invalidation
 * - Conflict resolution (client wins check-in, server wins scores)
 * - Sync with Supabase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReplicatedEntriesTable, type Entry } from '../ReplicatedEntriesTable';
import { deleteDB } from 'idb';
import './setup'; // Use custom setup with real IndexedDB

const TEST_DB_NAME = 'myK9Q';
const TEST_LICENSE_KEY = 'test-license-123';

describe('ReplicatedEntriesTable', () => {
  let table: ReplicatedEntriesTable;

  beforeEach(async () => {
    // Clean up any existing database
    await deleteDB(TEST_DB_NAME);

    // Create fresh instance
    table = new ReplicatedEntriesTable();
  });

  afterEach(async () => {
    // Clean up
    await deleteDB(TEST_DB_NAME);
  });

  describe('CRUD Operations', () => {
    it('should set and get a single entry', async () => {
      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        dog_breed: 'Golden Retriever',
        class_id: 'class-1',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      await table.set(entry.id, entry, false);
      const retrieved = await table.get(entry.id);

      expect(retrieved).toEqual(entry);
    });

    it('should return null for non-existent entry', async () => {
      const result = await table.get('non-existent');
      expect(result).toBeNull();
    });

    it('should update an existing entry', async () => {
      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      await table.set(entry.id, entry, false);

      // Update status
      const updated = { ...entry, entry_status: 'checked-in' };
      await table.set(entry.id, updated, false);

      const retrieved = await table.get(entry.id);
      expect(retrieved?.entry_status).toBe('checked-in');
    });

    it('should delete an entry', async () => {
      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      await table.set(entry.id, entry, false);
      await table.delete(entry.id);

      const retrieved = await table.get(entry.id);
      expect(retrieved).toBeNull();
    });

    it('should batch set multiple entries', async () => {
      const entries: Entry[] = [
        {
          id: '1',
          armband_number: 101,
          handler_name: 'John Doe',
          dog_call_name: 'Buddy',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
        {
          id: '2',
          armband_number: 102,
          handler_name: 'Jane Smith',
          dog_call_name: 'Max',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
      ];

      await table.batchSet(entries);

      const allEntries = await table.getAll(TEST_LICENSE_KEY);
      expect(allEntries).toHaveLength(2);
      expect(allEntries.map(e => e.id)).toEqual(['1', '2']);
    });

    it('should batch delete multiple entries', async () => {
      const entries: Entry[] = [
        {
          id: '1',
          armband_number: 101,
          handler_name: 'John Doe',
          dog_call_name: 'Buddy',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
        {
          id: '2',
          armband_number: 102,
          handler_name: 'Jane Smith',
          dog_call_name: 'Max',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
      ];

      await table.batchSet(entries);
      await table.batchDelete(['1', '2']);

      const allEntries = await table.getAll(TEST_LICENSE_KEY);
      expect(allEntries).toHaveLength(0);
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // Seed data
      const entries: Entry[] = [
        {
          id: '1',
          armband_number: 101,
          handler_name: 'John Doe',
          dog_call_name: 'Buddy',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
        {
          id: '2',
          armband_number: 102,
          handler_name: 'Jane Smith',
          dog_call_name: 'Max',
          class_id: 'class-1',
          entry_status: 'checked-in',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
        {
          id: '3',
          armband_number: 201,
          handler_name: 'Bob Johnson',
          dog_call_name: 'Charlie',
          class_id: 'class-2',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
      ];

      await table.batchSet(entries);
    });

    it('should get entries by class ID', async () => {
      const classEntries = await table.getByClassId('class-1');
      expect(classEntries).toHaveLength(2);
      expect(classEntries.every(e => e.class_id === 'class-1')).toBe(true);
    });

    it('should get entry by armband number', async () => {
      const entry = await table.getByArmband(101, 'class-1');
      expect(entry).not.toBeNull();
      expect(entry?.armband_number).toBe(101);
      expect(entry?.dog_call_name).toBe('Buddy');
    });

    it('should return null for non-existent armband', async () => {
      const entry = await table.getByArmband(999, 'class-1');
      expect(entry).toBeNull();
    });

    it('should filter by license key', async () => {
      // Add entry with different license key
      const otherEntry: Entry = {
        id: '4',
        armband_number: 301,
        handler_name: 'Other User',
        dog_call_name: 'Different',
        class_id: 'class-3',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: 'other-license',
      };

      await table.set(otherEntry.id, otherEntry, false);

      const filtered = await table.getAll(TEST_LICENSE_KEY);
      expect(filtered).toHaveLength(3); // Should not include 'other-license' entry
      expect(filtered.every(e => e.license_key === TEST_LICENSE_KEY)).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should update entry status optimistically', async () => {
      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      await table.set(entry.id, entry, false);
      await table.updateEntryStatus(entry.id, 'checked-in', false);

      const updated = await table.get(entry.id);
      expect(updated?.entry_status).toBe('checked-in');
    });

    it('should mark entry as scored', async () => {
      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'in-ring',
        is_scored: false,
        is_in_ring: true,
        license_key: TEST_LICENSE_KEY,
      };

      await table.set(entry.id, entry, false);
      await table.markAsScored(
        entry.id,
        {
          search_time_seconds: 120,
          total_faults: 2,
          result_status: 'qualified',
        },
        false
      );

      const updated = await table.get(entry.id);
      expect(updated?.is_scored).toBe(true);
      expect(updated?.entry_status).toBe('completed');
      expect(updated?.search_time_seconds).toBe(120);
      expect(updated?.total_faults).toBe(2);
      expect(updated?.result_status).toBe('qualified');
    });
  });

  describe('TTL Expiration', () => {
    it('should expire old entries based on TTL', async () => {
      // Create table with very short TTL (100ms)
      const shortTTLTable = new ReplicatedEntriesTable();
      // Access private property for testing (not ideal, but validates expiration)
      (shortTTLTable as any).ttl = 100; // 100ms TTL

      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      await shortTTLTable.set(entry.id, entry, false);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should return null due to expiration
      const expired = await shortTTLTable.get(entry.id);
      expect(expired).toBeNull();
    });

    it('should clean expired entries', async () => {
      const shortTTLTable = new ReplicatedEntriesTable();
      (shortTTLTable as any).ttl = 50; // 50ms TTL

      const entries: Entry[] = [
        {
          id: '1',
          armband_number: 101,
          handler_name: 'John Doe',
          dog_call_name: 'Buddy',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
        {
          id: '2',
          armband_number: 102,
          handler_name: 'Jane Smith',
          dog_call_name: 'Max',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
      ];

      await shortTTLTable.batchSet(entries);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const deletedCount = await shortTTLTable.cleanExpired();
      expect(deletedCount).toBe(2);

      const remaining = await shortTTLTable.getAll(TEST_LICENSE_KEY);
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Subscription Pattern', () => {
    it('should notify listeners on data changes', async () => {
      const mockListener = vi.fn();
      const unsubscribe = table.subscribe(mockListener);

      // Initial call with empty data
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith([]);

      // Add entry
      const entry: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status',
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      await table.set(entry.id, entry, false);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should be called again with new data
      expect(mockListener).toHaveBeenCalledTimes(2);
      expect(mockListener).toHaveBeenLastCalledWith([entry]);

      // Unsubscribe
      unsubscribe();

      // Add another entry
      await table.set('2', { ...entry, id: '2' }, false);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not be called again (unsubscribed)
      expect(mockListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Conflict Resolution', () => {
    it('should preserve client check-in status over server', async () => {
      const local: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'checked-in', // Client set this
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      const remote: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status', // Server has old status
        is_scored: false,
        is_in_ring: false,
        license_key: TEST_LICENSE_KEY,
      };

      // Access protected method for testing
      const resolved = (table as any).resolveConflict(local, remote);

      expect(resolved.entry_status).toBe('checked-in'); // Client wins
    });

    it('should preserve server scoring results over client', async () => {
      const local: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'completed',
        is_scored: true,
        is_in_ring: false,
        result_status: 'qualified',
        search_time_seconds: 100,
        total_faults: 0,
        final_placement: 1,
        license_key: TEST_LICENSE_KEY,
      };

      const remote: Entry = {
        id: '1',
        armband_number: 101,
        handler_name: 'John Doe',
        dog_call_name: 'Buddy',
        class_id: 'class-1',
        entry_status: 'no-status', // Will be overwritten by local
        is_scored: true,
        is_in_ring: false,
        result_status: 'nq', // Server's authoritative score
        search_time_seconds: 125,
        total_faults: 5,
        final_placement: 10,
        license_key: TEST_LICENSE_KEY,
      };

      const resolved = (table as any).resolveConflict(local, remote);

      // Client wins check-in status
      expect(resolved.entry_status).toBe('completed');

      // Server wins scoring results
      expect(resolved.result_status).toBe('nq');
      expect(resolved.search_time_seconds).toBe(125);
      expect(resolved.total_faults).toBe(5);
      expect(resolved.final_placement).toBe(10);
    });
  });

  describe('Sync Metadata', () => {
    it('should get sync metadata', async () => {
      const metadata = await table.getSyncMetadata();

      // First time should be null or default values
      expect(metadata).toBeDefined();
    });

    it('should update sync metadata after operations', async () => {
      // Trigger initialization
      await table.getAll();

      const metadata = await table.getSyncMetadata();
      expect(metadata?.tableName).toBe('entries');
    });
  });

  describe('Cache Operations', () => {
    it('should clear all cached entries', async () => {
      const entries: Entry[] = [
        {
          id: '1',
          armband_number: 101,
          handler_name: 'John Doe',
          dog_call_name: 'Buddy',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
        {
          id: '2',
          armband_number: 102,
          handler_name: 'Jane Smith',
          dog_call_name: 'Max',
          class_id: 'class-1',
          entry_status: 'no-status',
          is_scored: false,
          is_in_ring: false,
          license_key: TEST_LICENSE_KEY,
        },
      ];

      await table.batchSet(entries);
      await table.clearCache();

      const remaining = await table.getAll(TEST_LICENSE_KEY);
      expect(remaining).toHaveLength(0);
    });
  });
});
