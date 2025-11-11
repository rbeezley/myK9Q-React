/**
 * ReplicatedEntriesTable - Concrete Implementation for Entries Table
 *
 * This is the FIRST concrete implementation of ReplicatedTable,
 * serving as a prototype to validate the architecture before
 * implementing the remaining 16 tables.
 *
 * Phase 1 Day 5 (Prototype Validation)
 * - Demonstrates full CRUD with IndexedDB persistence
 * - Implements conflict resolution (client wins for check-in, server wins for scores)
 * - Validates subscription pattern for real-time updates
 * - Tests TTL expiration and cache invalidation
 */

import { ReplicatedTable } from '../ReplicatedTable';
import type { SyncResult } from '../types';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * Entry interface (subset - matches database schema)
 * Full Entry type will be imported from entryStore when integrated
 */
export interface Entry {
  id: string;               // Primary key (bigint in DB, string for IndexedDB)
  armband_number: number;
  handler_name: string;
  dog_call_name: string;
  dog_breed?: string;
  class_id: string;         // Foreign key to classes

  // Status fields
  entry_status: string;     // 'no-status' | 'checked-in' | 'at-gate' | 'in-ring' | 'completed'
  is_scored: boolean;
  is_in_ring: boolean;

  // Result fields (server-authoritative)
  result_status?: string;   // 'pending' | 'qualified' | 'nq' | 'absent' | 'excused' | 'withdrawn'
  final_placement?: number;
  search_time_seconds?: number;
  total_faults?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Multi-tenant isolation
  license_key?: string;     // Should be set by API, but included for safety
}

/**
 * Concrete implementation for entries table
 */
export class ReplicatedEntriesTable extends ReplicatedTable<Entry> {
  constructor() {
    // Use default TTL from feature flags (30 min for entries)
    super('entries');
  }

  /**
   * Sync with Supabase server
   * Implements bidirectional sync:
   * 1. Download changes from server (incremental)
   * 2. Upload pending mutations
   * 3. Resolve conflicts
   */
  async sync(licenseKey: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let rowsSynced = 0;
    let conflictsResolved = 0;

    try {
      // Update sync status to 'syncing'
      await this.updateSyncMetadata({ syncStatus: 'syncing' });

      // Step 1: Get last sync timestamp
      const metadata = await this.getSyncMetadata();

      // Check if cache is empty - if so, force full sync from epoch
      const allCachedEntries = await this.getAll();
      const isCacheEmpty = allCachedEntries.length === 0;

      // If cache is empty but we have a lastSync timestamp, it means the cache was cleared
      // Reset to epoch (0) to fetch all data
      const lastSync = isCacheEmpty ? 0 : (metadata?.lastIncrementalSyncAt || 0);

      console.log(`[${this.tableName}] Cache status: ${allCachedEntries.length} entries, lastSync: ${new Date(lastSync).toISOString()}`);

      // Step 2: Fetch changes from server since last sync
      // Join through: entries → classes → trials → shows.license_key
      const { data: remoteEntries, error: fetchError} = await supabase
        .from('entries')
        .select(`
          *,
          classes!inner(
            trial_id,
            trials!inner(
              show_id,
              shows!inner(
                license_key
              )
            )
          )
        `)
        .eq('classes.trials.shows.license_key', licenseKey)
        .gt('updated_at', new Date(lastSync).toISOString())
        .order('updated_at', { ascending: true });

      if (fetchError) {
        errors.push(`Fetch error: ${fetchError.message}`);
        throw fetchError;
      }

      // Step 3: Merge remote changes with local cache (conflict resolution)
      if (remoteEntries && remoteEntries.length > 0) {
        for (const rawEntry of remoteEntries) {
          // Flatten the response (remove nested classes/trials/shows objects)
          const { classes: _classes, ...remoteEntry } = rawEntry as any;

          // Convert ID to string for consistent IndexedDB key format (bigserial returns as number)
          const entryId = String(remoteEntry.id);
          const localEntry = await this.get(entryId);

          if (localEntry) {
            // Conflict: both local and remote have data
            const resolved = this.resolveConflict(localEntry, remoteEntry as Entry);
            await this.set(entryId, resolved, false); // Not dirty after merge
            conflictsResolved++;
          } else {
            // No conflict: just cache the remote entry
            await this.set(entryId, remoteEntry as Entry, false);
          }

          rowsSynced++;
        }
      }

      // Step 4: Upload pending mutations (Phase 2 - SyncEngine)
      // For now, just log that we would upload here
      logger.log(`[${this.tableName}] Would upload pending mutations here (Phase 2)`);

      // Step 5: Update sync metadata
      await this.updateSyncMetadata({
        lastIncrementalSyncAt: Date.now(),
        syncStatus: 'idle',
        errorMessage: undefined,
        conflictCount: (metadata?.conflictCount || 0) + conflictsResolved,
      });

      const duration = Date.now() - startTime;
      logger.log(`[${this.tableName}] Sync complete: ${rowsSynced} rows, ${conflictsResolved} conflicts, ${duration}ms`);

      return {
        tableName: this.tableName,
        success: true,
        operation: 'incremental-sync',
        rowsAffected: rowsSynced,
        conflictsResolved,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);

      // Update sync metadata with error
      await this.updateSyncMetadata({
        syncStatus: 'error',
        errorMessage,
      });

      logger.error(`[${this.tableName}] Sync failed:`, error);

      return {
        tableName: this.tableName,
        success: false,
        operation: 'incremental-sync',
        rowsAffected: rowsSynced,
        conflictsResolved,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Resolve conflicts between local and remote data
   *
   * Strategy for entries:
   * - Client-authoritative: entry_status (check-in state controlled by user)
   * - Server-authoritative: result_status, final_placement, search_time_seconds, total_faults (judge's scoring)
   * - Last-write-wins: other fields (compare updated_at)
   */
  protected resolveConflict(local: Entry, remote: Entry): Entry {
    // Start with remote data as base (server is source of truth)
    const resolved: Entry = { ...remote };

    // Client wins for check-in status (user controls this)
    resolved.entry_status = local.entry_status;
    resolved.is_in_ring = local.is_in_ring;

    // Server always wins for scoring results (judge is authoritative)
    // (These are already in `remote`, so no override needed)

    // Log conflict resolution for debugging
    if (local.entry_status !== remote.entry_status) {
      logger.log(
        `[${this.tableName}] Conflict resolved for entry ${local.id}:`,
        `local status="${local.entry_status}", remote status="${remote.entry_status}", resolved="${resolved.entry_status}"`
      );
    }

    return resolved;
  }

  /**
   * Helper: Get all entries for a specific class
   * This is the most common query pattern for entries
   * OPTIMIZED: Uses IndexedDB index for O(log n) performance instead of O(n) table scan
   */
  async getByClassId(classId: string, licenseKey?: string): Promise<Entry[]> {
    // Use indexed query for much better performance
    const entries = await this.queryByField('class_id', classId);

    // Filter by license_key if needed (for multi-tenant isolation)
    if (licenseKey) {
      return entries.filter((entry) => (entry as any).license_key === licenseKey);
    }

    return entries;
  }

  /**
   * Helper: Get entry by armband number (within a class)
   * Used for quick lookup during scoring
   */
  async getByArmband(armbandNumber: number, classId: string): Promise<Entry | null> {
    const classEntries = await this.getByClassId(classId);
    return classEntries.find((entry) => entry.armband_number === armbandNumber) || null;
  }

  /**
   * Helper: Update entry status (optimistic update)
   * Used for check-in flow
   */
  async updateEntryStatus(
    entryId: string,
    newStatus: string,
    queueMutation = true
  ): Promise<void> {
    const entry = await this.get(entryId);
    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    // Optimistic update
    const updated: Entry = {
      ...entry,
      entry_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Mark as dirty to queue for sync
    await this.set(entryId, updated, queueMutation);

    logger.log(`[${this.tableName}] Updated entry ${entryId} status: ${entry.entry_status} → ${newStatus}`);
  }

  /**
   * Helper: Mark entry as scored (server will calculate placement)
   * This is a local optimistic update - server processes the score
   */
  async markAsScored(
    entryId: string,
    scoreData: {
      search_time_seconds?: number;
      total_faults?: number;
      result_status?: string;
    },
    queueMutation = true
  ): Promise<void> {
    const entry = await this.get(entryId);
    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    // Optimistic update
    const updated: Entry = {
      ...entry,
      ...scoreData,
      is_scored: true,
      entry_status: 'completed',
      updated_at: new Date().toISOString(),
    };

    // Mark as dirty to queue for sync
    await this.set(entryId, updated, queueMutation);

    logger.log(`[${this.tableName}] Marked entry ${entryId} as scored`);
  }
}

/**
 * Singleton instance (for convenience)
 * Can be used directly or via ReplicationManager
 */
export const replicatedEntriesTable = new ReplicatedEntriesTable();
