/**
 * Type definitions for Full Table Replication System
 *
 * Core interfaces for replication infrastructure:
 * - ReplicatedRow: Wrapper for cached table rows
 * - SyncMetadata: Sync state tracking per table
 * - PendingMutation: Offline mutation queue
 * - SyncResult: Result of sync operations
 */

/**
 * Generic replicated row wrapper
 * Wraps any table row with replication metadata
 */
export interface ReplicatedRow<T> {
  tableName: string;        // e.g., 'entries', 'classes'
  id: string;               // Primary key value
  data: T;                  // Actual row data
  version: number;          // For conflict detection (increments on update)
  lastSyncedAt: number;     // Timestamp of last successful sync
  lastAccessedAt: number;   // For LRU eviction
  isDirty: boolean;         // Has local changes not yet synced
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
}

/**
 * Sync metadata per table
 */
export interface SyncMetadata {
  tableName: string;
  lastFullSyncAt: number;
  lastIncrementalSyncAt: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
  conflictCount: number;
  pendingMutations: number;
}

/**
 * Pending mutation queue item
 */
export interface PendingMutation {
  id: string;               // UUID for mutation
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'BATCH_UPDATE';
  rowId: string;            // ID of affected row
  data: any;                // Mutation data
  timestamp: number;        // When mutation was queued
  retries: number;          // Retry attempts
  status: 'pending' | 'syncing' | 'failed' | 'success';
  error?: string;           // Last error message
}

/**
 * Sync result returned from sync operations
 */
export interface SyncResult {
  tableName: string;
  success: boolean;
  rowsSynced: number;
  conflictsResolved: number;
  errors: string[];
  duration: number;         // Milliseconds
}

/**
 * Performance report for replication system
 */
export interface PerformanceReport {
  cacheHitRate: string;           // e.g., "95.2%"
  avgSyncDuration: string;        // e.g., "234ms"
  conflictsResolved: number;
  mutationSuccessRate: number;    // 0-100
  storageUsedMB: string;          // e.g., "12.4"
  tablesReplicated: number;
}

/**
 * Sync progress event (for UI progress indicators)
 */
export interface SyncProgress {
  tableName: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  status: 'synced' | 'syncing' | 'error';
}

/**
 * Sync failure notification (for error banner)
 */
export interface SyncFailure {
  count: number;
  mutations: PendingMutation[];
  message: string;
}

/**
 * Conflict resolution strategy enum
 */
export type ConflictStrategy =
  | 'last-write-wins'           // Compare timestamps
  | 'server-authoritative'      // Server always wins
  | 'client-authoritative'      // Client always wins
  | 'field-level-merge';        // Merge specific fields

/**
 * Table query filter
 */
export interface TableFilter<T = any> {
  field: keyof T;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'like';
  value: any;
}

/**
 * Table query options
 */
export interface QueryOptions<T = any> {
  filters?: TableFilter<T>[];
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
