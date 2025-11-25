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

  // Run order (exhibitor-controlled)
  exhibitor_order?: number; // Custom run order set by gate steward/exhibitors

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Multi-tenant isolation (denormalized for real-time subscription filtering)
  license_key: string;      // Auto-populated by database trigger from classes->trials->shows
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
    console.log(`[${this.tableName}] 🚀 Starting sync for license: ${licenseKey}`);
    const startTime = Date.now();
    const errors: string[] = [];
    let rowsSynced = 0;
    let conflictsResolved = 0;

    try {
      console.log(`[${this.tableName}] Step 1: Updating sync metadata...`);
      // Update sync status to 'syncing'
      await this.updateSyncMetadata({ syncStatus: 'syncing' });

      console.log(`[${this.tableName}] Step 2: Getting sync metadata...`);
      // Step 1: Get last sync timestamp
      const metadata = await this.getSyncMetadata();
      console.log(`[${this.tableName}] Metadata retrieved:`, metadata);

      console.log(`[${this.tableName}] Step 3: Checking cache...`);
      // Check if cache is empty - if so, force full sync from epoch
      const allCachedEntries = await this.getAll();
      console.log(`[${this.tableName}] Cache check complete: ${allCachedEntries.length} entries`);
      const isCacheEmpty = allCachedEntries.length === 0;

      // If cache is empty but we have a lastSync timestamp, it means the cache was cleared
      // Reset to epoch (0) to fetch all data
      const lastSync = isCacheEmpty ? 0 : (metadata?.lastIncrementalSyncAt || 0);

      console.log(`[${this.tableName}] Cache status: ${allCachedEntries.length} entries, lastSync: ${new Date(lastSync).toISOString()}`);

      // Step 2: Fetch changes from server since last sync
      // Join through: entries → classes → trials → shows.license_key
      console.log(`[${this.tableName}] Fetching entries for license: ${licenseKey}, since: ${new Date(lastSync).toISOString()}`);

      const fetchPromise = supabase
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

      // Add 30 second timeout to prevent infinite hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Entries fetch timed out after 30 seconds')), 30000);
      });

      let result;
      try {
        result = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (_timeoutError) {
        console.error(`[${this.tableName}] Fetch timed out, trying simpler query...`);
        // Fallback: use view instead of complex join
        result = await supabase
          .from('view_entry_class_join_normalized')
          .select('*')
          .eq('license_key', licenseKey)
          .gt('updated_at', new Date(lastSync).toISOString())
          .order('updated_at', { ascending: true });
      }

      const { data: remoteEntries, error: fetchError } = result as any;

      if (fetchError) {
        console.error(`[${this.tableName}] Fetch error:`, fetchError);
        errors.push(`Fetch error: ${fetchError.message}`);
        throw fetchError;
      }

      console.log(`[${this.tableName}] Fetched ${remoteEntries?.length || 0} entries from server`);

      // Step 3: Merge remote changes with local cache (conflict resolution)
      if (remoteEntries && remoteEntries.length > 0) {
        console.log(`[${this.tableName}] 🔍 Processing ${remoteEntries.length} entries from server:`);

        for (const rawEntry of remoteEntries) {
          // Flatten the response (remove nested classes/trials/shows objects)
          const { classes: _classes, ...remoteEntry } = rawEntry as any;

          // DEBUG: Log the entry data we're processing
          console.log(`[${this.tableName}] 📦 Entry ${remoteEntry.id}:`, {
            armband: remoteEntry.armband_number,
            entry_status: remoteEntry.entry_status,
            is_in_ring: remoteEntry.is_in_ring,
            is_scored: remoteEntry.is_scored
          });

          // Convert ID to string for consistent IndexedDB key format (bigserial returns as number)
          const entryId = String(remoteEntry.id);
          const localEntry = await this.get(entryId);

          if (localEntry) {
            // Conflict: both local and remote have data
            console.log(`[${this.tableName}] 🔄 Resolving conflict for entry ${entryId}`);
            const resolved = this.resolveConflict(localEntry, remoteEntry as Entry);
            console.log(`[${this.tableName}] ✅ Resolved entry ${entryId}:`, {
              old_status: localEntry.entry_status,
              new_status: remoteEntry.entry_status,
              resolved_status: resolved.entry_status
            });
            await this.set(entryId, resolved, false); // Not dirty after merge
            conflictsResolved++;
          } else {
            // No conflict: just cache the remote entry
            console.log(`[${this.tableName}] 📝 Caching new entry ${entryId} with status: ${remoteEntry.entry_status}`);
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
        conflictCount: conflictsResolved, // Fixed: Don't accumulate, just set current count
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
   * - State progression: More advanced workflow states always win (prevents regression)
   * - Scoring data: Server always wins (judge is authoritative)
   * - Other fields: Remote wins (server is source of truth)
   *
   * Workflow progression: no-status → checked-in → at-gate → in-ring → completed
   * A state cannot regress - if local is further along, it wins.
   */
  protected resolveConflict(local: Entry, remote: Entry): Entry {
    // Start with remote data as base (server is source of truth for scoring/metadata)
    const resolved: Entry = { ...remote };

    // State progression order (higher index = more advanced in workflow)
    // 'no-status' is the lowest - it represents uninitialized/stale data
    const stateProgression = ['no-status', 'checked-in', 'at-gate', 'in-ring', 'completed'];

    const localStateIndex = stateProgression.indexOf(local.entry_status);
    const remoteStateIndex = stateProgression.indexOf(remote.entry_status);

    // Keep the more progressed state (prevents regression from stale server data)
    // This handles:
    // - Client checked-in (1) beats server no-status (0)
    // - Client completed (4) beats server no-status (0)
    // - Server in-ring (3) beats client checked-in (1)
    if (localStateIndex > remoteStateIndex) {
      resolved.entry_status = local.entry_status;
      resolved.is_in_ring = local.is_in_ring;
    } else {
      resolved.entry_status = remote.entry_status;
      resolved.is_in_ring = remote.entry_status === 'in-ring';
    }

    // Server always wins for scoring results (judge is authoritative)
    // These fields are already in `remote`, so no override needed:
    // - result_status, search_time_seconds, total_faults, final_placement

    // Log conflict resolution for debugging
    if (local.entry_status !== remote.entry_status) {
      logger.log(
        `[${this.tableName}] Conflict resolved for entry ${local.id}:`,
        `local="${local.entry_status}" (${localStateIndex}), remote="${remote.entry_status}" (${remoteStateIndex}), resolved="${resolved.entry_status}"`
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

    console.log(`[${this.tableName}] 🔎 getByClassId(${classId}) returned ${entries.length} entries`);

    // DEBUG: Log first few entries with their status
    if (entries.length > 0) {
      const sample = entries.slice(0, 3).map(e => ({
        id: e.id,
        armband: e.armband_number,
        entry_status: e.entry_status,
        is_in_ring: e.is_in_ring
      }));
      console.log(`[${this.tableName}] 📋 Sample entries:`, sample);
    }

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
