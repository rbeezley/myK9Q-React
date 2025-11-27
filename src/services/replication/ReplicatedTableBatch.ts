/**
 * ReplicatedTableBatch - Batch Operations for Replicated Tables
 *
 * Extracted from ReplicatedTable.ts (DEBT-003) to improve maintainability.
 *
 * Responsibilities:
 * - Batch set (bulk insert)
 * - Chunked batch set (for large syncs)
 * - Batch delete
 * - Cache clearing
 */

import type { IDBPDatabase } from 'idb';
import type { ReplicatedRow } from './types';
import type { Logger } from './dependencies';
import { REPLICATION_STORES } from './DatabaseManager';
import { MAX_CHUNK_SIZE } from './replicationConstants';

/**
 * Batch operations manager for a replicated table
 */
export class ReplicatedTableBatchManager<T extends { id: string }> {
  constructor(
    private tableName: string,
    private logger: Logger,
    private getDb: () => Promise<IDBPDatabase>,
    private notifyListeners: () => void
  ) {}

  /**
   * Batch set (for initial sync)
   */
  async batchSet(items: T[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

    for (const item of items) {
      const row: ReplicatedRow<T> = {
        tableName: this.tableName,
        id: item.id,
        data: item,
        version: 1,
        lastSyncedAt: Date.now(),
        lastAccessedAt: Date.now(),
        isDirty: false,
        syncStatus: 'synced',
      };

      await tx.store.put(row);
    }

    await tx.done;
    this.logger.log(`[${this.tableName}] Batch cached ${items.length} rows`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Batch set with chunking (for large syncs > 500 rows)
   * Day 23-24: Performance optimization to prevent UI freezing on large syncs
   *
   * Processes data in chunks of 100 rows to:
   * - Reduce memory pressure
   * - Allow progress updates
   * - Prevent transaction timeouts
   */
  async batchSetChunked(items: T[], chunkSize: number = MAX_CHUNK_SIZE): Promise<void> {
    const totalRows = items.length;

    // For small datasets, use regular batchSet
    if (totalRows <= chunkSize) {
      return this.batchSet(items);
    }

    this.logger.log(`[${this.tableName}] Starting chunked batch set: ${totalRows} rows (chunks of ${chunkSize})`);

    let processedRows = 0;

    for (let i = 0; i < totalRows; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const db = await this.getDb();
      const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

      for (const item of chunk) {
        const row: ReplicatedRow<T> = {
          tableName: this.tableName,
          id: item.id,
          data: item,
          version: 1,
          lastSyncedAt: Date.now(),
          lastAccessedAt: Date.now(),
          isDirty: false,
          syncStatus: 'synced',
        };

        await tx.store.put(row);
      }

      await tx.done;
      processedRows += chunk.length;

      const progress = Math.round((processedRows / totalRows) * 100);
      this.logger.log(`[${this.tableName}] Chunk progress: ${processedRows}/${totalRows} (${progress}%)`);
    }

    this.logger.log(`[${this.tableName}] Chunked batch complete: ${processedRows} rows`);

    // Notify listeners once at the end
    this.notifyListeners();
  }

  /**
   * Batch delete
   */
  async batchDelete(ids: string[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

    for (const id of ids) {
      await tx.store.delete([this.tableName, id]);
    }

    await tx.done;
    this.logger.log(`[${this.tableName}] Batch deleted ${ids.length} rows`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Clear all cached rows for this table
   */
  async clearCache(): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');
    const index = tx.store.index('tableName');

    const keys = await index.getAllKeys(this.tableName);
    for (const key of keys) {
      await tx.store.delete(key);
    }

    await tx.done;
    this.logger.log(`[${this.tableName}] Cache cleared`);

    // Notify listeners
    this.notifyListeners();
  }
}
