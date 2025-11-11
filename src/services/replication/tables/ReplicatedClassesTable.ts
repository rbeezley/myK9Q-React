/**
 * ReplicatedClassesTable - Offline-first class data replication
 *
 * Manages class definitions (Novice A, Masters B, etc.) with offline support.
 *
 * Conflict Resolution:
 * - Server-authoritative: All class configuration comes from server
 * - Use case: Judges/stewards modify class status, no client conflicts
 *
 * **Phase 3 Day 12** - Core table migration
 */

import { ReplicatedTable } from '../ReplicatedTable';
import type { SyncResult } from '../types';
import type { SyncOptions } from '../SyncEngine';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface Class {
  id: string;  // bigserial returned as string by Supabase
  trial_id: number;  // bigint returned as number by Supabase (within safe integer range)
  element: string;
  level: string;
  section?: string;
  judge_name?: string;
  class_status?: string;
  briefing_time?: string;
  break_until?: string;
  start_time?: string;
  class_order?: number;
  self_checkin_enabled?: boolean;
  realtime_results_enabled?: boolean;
  is_completed?: boolean;
  time_limit_seconds?: number;
  time_limit_area2_seconds?: number;
  time_limit_area3_seconds?: number;
  area_count?: number;
  license_key: string;
  created_at?: string;
  updated_at?: string;
}

export class ReplicatedClassesTable extends ReplicatedTable<Class> {
  constructor() {
    super('classes'); // TTL managed by feature flags
  }

  /**
   * Sync classes from Supabase
   */
  async sync(licenseKey: string, options?: Partial<SyncOptions>): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let rowsSynced = 0;
    let conflictsResolved = 0;

    try {
      // Get last sync timestamp
      const metadata = await this.getSyncMetadata();

      // Check if cache is empty - if so, force full sync from epoch
      const allCachedClasses = await this.getAll();
      const isCacheEmpty = allCachedClasses.length === 0;

      // If cache is empty but we have a lastSync timestamp, it means the cache was cleared
      // Reset to epoch (0) to fetch all data
      const lastSync = options?.forceFullSync || isCacheEmpty ? 0 : (metadata?.lastIncrementalSyncAt || 0);

      logger.log(
        `[${this.tableName}] Starting ${options?.forceFullSync ? 'FULL' : isCacheEmpty ? 'FULL (empty cache)' : 'incremental'} sync (since ${new Date(lastSync).toISOString()}), cache: ${allCachedClasses.length} classes`
      );

      // Fetch classes updated since last sync (or all classes if full sync)
      // Join through: classes → trials → shows.license_key
      let query = supabase
        .from('classes')
        .select(`
          *,
          trials!inner(
            show_id,
            shows!inner(
              license_key
            )
          )
        `)
        .eq('trials.shows.license_key', licenseKey);

      // Always apply updated_at filter (use epoch for full sync)
      // This ensures we fetch all records when cache is empty (lastSync = 0)
      query = query.gt('updated_at', new Date(lastSync).toISOString());

      const { data: rawClasses, error } = await query.order('updated_at', { ascending: true });

      // Flatten the response (remove nested trials/shows objects)
      const remoteClasses = rawClasses?.map(({ trials: _trials, ...classData }) => classData) || [];

      if (error) {
        errors.push(error.message);
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      if (!remoteClasses || remoteClasses.length === 0) {
        logger.log(`[${this.tableName}] No updates found`);

        await this.updateSyncMetadata({
          lastIncrementalSyncAt: Date.now(),
          syncStatus: 'idle',
          errorMessage: undefined,
        });

        return {
          tableName: this.tableName,
          success: true,
          operation: 'incremental-sync',
          rowsAffected: 0,
          conflictsResolved: 0,
          duration: Date.now() - startTime,
        };
      }

      // Process each class
      for (const remoteClass of remoteClasses) {
        // Convert ID to string for consistent IndexedDB key format
        const classId = String(remoteClass.id);
        const localClass = await this.get(classId);

        if (localClass) {
          // Conflict resolution: server always wins for class config
          const resolved = this.resolveConflict(localClass, remoteClass);
          await this.set(classId, resolved);
          conflictsResolved++;
        } else {
          // New class
          await this.set(classId, remoteClass);
        }

        rowsSynced++;
      }

      // Update sync metadata
      await this.updateSyncMetadata({
        lastIncrementalSyncAt: Date.now(),
        syncStatus: 'idle',
        errorMessage: undefined,
        conflictCount: (metadata?.conflictCount || 0) + conflictsResolved,
      });

      const duration = Date.now() - startTime;
      logger.log(
        `[${this.tableName}] Sync complete: ${rowsSynced} rows, ${conflictsResolved} conflicts, ${duration}ms`
      );

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
   * Conflict resolution: Server-authoritative
   * Class configuration always comes from server
   */
  protected resolveConflict(_local: Class, remote: Class): Class {
    // Server always wins for class configuration
    // Judges/stewards modify on server, no client conflicts
    return remote;
  }

  /**
   * Get all classes for a trial
   * OPTIMIZED: Uses IndexedDB index for O(log n) performance
   */
  async getByTrialId(trialId: string): Promise<Class[]> {
    const trialIdNum = parseInt(trialId, 10);

    // Use indexed query for much better performance
    const classes = await this.queryByField('trial_id', trialIdNum);

    // Sort by class_order
    return classes.sort((a, b) => (a.class_order || 0) - (b.class_order || 0));
  }

  /**
   * Get a single class by ID
   */
  async getClassById(classId: string): Promise<Class | null> {
    const cls = await this.get(classId);
    return cls || null;
  }

  /**
   * Get classes by element (e.g., "Scent Work")
   */
  async getByElement(element: string): Promise<Class[]> {
    const allClasses = await this.getAll();
    return allClasses
      .filter((cls) => cls.element === element)
      .sort((a, b) => (a.class_order || 0) - (b.class_order || 0));
  }

  /**
   * Get classes by level (e.g., "Novice", "Masters")
   */
  async getByLevel(level: string): Promise<Class[]> {
    const allClasses = await this.getAll();
    return allClasses
      .filter((cls) => cls.level === level)
      .sort((a, b) => (a.class_order || 0) - (b.class_order || 0));
  }

  /**
   * Get classes with self-checkin enabled
   */
  async getSelfCheckinEnabled(): Promise<Class[]> {
    const allClasses = await this.getAll();
    return allClasses
      .filter((cls) => cls.self_checkin_enabled === true)
      .sort((a, b) => (a.class_order || 0) - (b.class_order || 0));
  }

  /**
   * Update class status (e.g., "briefing", "in-progress", "completed")
   * Queues mutation for offline support
   */
  async updateClassStatus(
    classId: string,
    status: string,
    additionalFields?: Partial<Class>
  ): Promise<void> {
    // Get current class
    const currentClass = await this.get(classId);
    if (!currentClass) {
      throw new Error(`Class ${classId} not found`);
    }

    // Update local cache optimistically
    const updatedClass: Class = {
      ...currentClass,
      class_status: status,
      ...additionalFields,
      updated_at: new Date().toISOString(),
    };

    await this.set(classId, updatedClass, true); // Mark as dirty

    logger.log(
      `[${this.tableName}] Updated class ${classId} status to "${status}"`
    );
  }
}

// Singleton export
export const replicatedClassesTable = new ReplicatedClassesTable();
