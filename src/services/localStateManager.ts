/**
 * Local State Manager
 *
 * Manages the local-first state by merging database data with pending changes.
 * This is the single source of truth for all entry data in the application.
 *
 * Key Principles:
 * - Local state is ALWAYS the source of truth
 * - Database writes happen in background
 * - Pending changes are immediately reflected in UI
 * - Cache saves merged state, not raw database queries
 */

import { Entry } from '@/stores/entryStore';
import { db, STORES } from '@/utils/indexedDB';

/**
 * Represents a pending change that hasn't been synced to the database yet
 */
export interface PendingChange {
  id: string; // UUID for tracking
  entryId: number;
  timestamp: number;
  type: 'score' | 'checkin' | 'status' | 'reset';
  changes: Partial<Entry>;
  metadata: {
    queueId?: string; // Reference to offline queue item
    retryCount: number; // Number of sync attempts
    maxRetries: number; // Maximum retry attempts (default 3)
    lastError?: string; // Last error message
    status: 'pending' | 'syncing' | 'failed' | 'retrying'; // Current status
    failedAt?: number; // Timestamp when marked as failed
    lastAttemptAt?: number; // Timestamp of last sync attempt
  };
}

/**
 * Internal state structure
 */
interface LocalState {
  entries: Map<number, Entry>; // Key = entry.id
  pendingChanges: Map<number, PendingChange>; // Key = entry.id
  lastSync: number;
}

class LocalStateManager {
  private state: LocalState = {
    entries: new Map(),
    pendingChanges: new Map(),
    lastSync: 0,
  };

  private listeners: Set<() => void> = new Set();

  /**
   * Initialize the manager by loading persisted state from IndexedDB
   */
  async initialize(): Promise<void> {
    try {
      // Load entries from metadata store
      const savedEntriesData = await db.get(STORES.METADATA, 'local-state-entries');
      if (savedEntriesData && typeof savedEntriesData === 'object' && 'value' in savedEntriesData) {
        const savedEntries = savedEntriesData.value as Entry[];
        if (Array.isArray(savedEntries)) {
          savedEntries.forEach((entry: Entry) => {
            this.state.entries.set(entry.id, entry);
          });
        }
      }

      // Load pending changes
      const savedPendingData = await db.get(STORES.METADATA, 'pending-changes');
      if (savedPendingData && typeof savedPendingData === 'object' && 'value' in savedPendingData) {
        const savedPending = savedPendingData.value as PendingChange[];
        if (Array.isArray(savedPending)) {
          savedPending.forEach((change: PendingChange) => {
            this.state.pendingChanges.set(change.entryId, change);
          });
        }
      }

      console.log('[LocalStateManager] Initialized with', {
        entries: this.state.entries.size,
        pending: this.state.pendingChanges.size,
      });

      // Auto-cleanup stale pending changes on initialization (> 1 minute old)
      // This prevents corrupt data from previous sessions showing incorrect UI state
      const staleCount = await this.clearStalePending(60 * 1000); // 1 minute
      if (staleCount > 0) {
        console.log(`[LocalStateManager] Cleaned up ${staleCount} stale pending changes on init`);
      }
    } catch (error) {
      console.error('[LocalStateManager] Failed to initialize:', error);
      // Continue with empty state
    }
  }

  /**
   * Get entries for a specific class, with pending changes merged
   */
  getEntries(classId: number): Entry[] {
    const entries = Array.from(this.state.entries.values())
      .filter(entry => entry.classId === classId);

    // Apply pending changes
    return entries.map(entry => {
      const pending = this.state.pendingChanges.get(entry.id);
      if (pending) {
        return this.mergeEntry(entry, pending);
      }
      return entry;
    });
  }

  /**
   * Get a single entry by ID with pending changes applied
   */
  getEntry(entryId: number): Entry | undefined {
    const entry = this.state.entries.get(entryId);
    if (!entry) return undefined;

    const pending = this.state.pendingChanges.get(entryId);
    if (pending) {
      return this.mergeEntry(entry, pending);
    }
    return entry;
  }

  /**
   * Apply a server update (from database query or real-time subscription)
   * This updates the base state but preserves pending changes
   *
   * IMPORTANT: If the server data matches the pending changes, we can clear them
   * (they've been successfully synced)
   */
  async applyServerUpdate(entries: Entry[]): Promise<void> {
    let hasChanges = false;
    const pendingToRemove: number[] = [];

    // 🧹 CLEANUP: Check for stale pending changes (> 1 minute old) and remove them
    // This ensures that failed sync attempts don't show incorrect UI state
    // We do this on every refresh instead of just on init for faster recovery
    const now = Date.now();
    const staleThreshold = 60 * 1000; // 1 minute

    for (const [entryId, change] of this.state.pendingChanges.entries()) {
      const age = now - change.timestamp;
      if (age > staleThreshold) {
        console.log(`[LocalStateManager] Removing stale pending change for entry ${entryId} (${Math.floor(age / 1000)}s old)`);
        pendingToRemove.push(entryId);
      }
    }

    for (const entry of entries) {
      const pending = this.state.pendingChanges.get(entry.id);

      if (!pending) {
        // No pending change, safe to update from server
        this.state.entries.set(entry.id, entry);
        hasChanges = true;
      } else {
        // Has pending change - check if server confirms our changes
        const serverMatchesPending = this.serverMatchesPendingChanges(entry, pending);

        if (serverMatchesPending) {
          // Server confirms our pending changes - safe to clear and use server data
          console.log(`[LocalStateManager] Server confirmed pending changes for entry ${entry.id}, clearing pending`);
          this.state.entries.set(entry.id, entry);

          // Only add to pendingToRemove if not already there from stale check
          if (!pendingToRemove.includes(entry.id)) {
            pendingToRemove.push(entry.id);
          }
          hasChanges = true;
        } else {
          // Server data differs from pending - keep pending changes (unless stale)
          // Note: If the change is stale (> 1 minute), it's already in pendingToRemove
          if (!pendingToRemove.includes(entry.id)) {
            console.log(`[LocalStateManager] Server data differs from pending for entry ${entry.id}, keeping pending`);
            const merged = this.mergeServerWithPending(entry, pending);
            this.state.entries.set(entry.id, merged);
            hasChanges = true;
          } else {
            // Stale pending change - use server data
            console.log(`[LocalStateManager] Stale pending change for entry ${entry.id}, using server data`);
            this.state.entries.set(entry.id, entry);
            hasChanges = true;
          }
        }
      }
    }

    // Remove confirmed pending changes
    for (const entryId of pendingToRemove) {
      this.state.pendingChanges.delete(entryId);
    }

    if (hasChanges || pendingToRemove.length > 0) {
      await this.persistState();
      this.state.lastSync = Date.now();

      // Only notify listeners if we cleared pending changes
      // Don't notify on regular server updates (hasChanges without pendingToRemove)
      // This prevents infinite refresh loops
      if (pendingToRemove.length > 0) {
        console.log(`[LocalStateManager] Notifying listeners after clearing ${pendingToRemove.length} pending changes`);
        this.notifyListeners();
      }
    }
  }

  /**
   * Update an entry with local changes (optimistic update)
   * This adds a pending change that will be synced later
   *
   * If the entry is not yet in local state, we still create the pending change.
   * This handles the case where a scoresheet loads and submits a score before
   * the EntryList has loaded the entries into localStateManager.
   */
  async updateEntry(entryId: number, changes: Partial<Entry>, type: PendingChange['type']): Promise<Entry> {
    const existingEntry = this.state.entries.get(entryId);

    // Create pending change with metadata
    const pendingChange: PendingChange = {
      id: crypto.randomUUID(),
      entryId,
      timestamp: Date.now(),
      type,
      changes,
      metadata: {
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
        lastAttemptAt: Date.now(),
      },
    };

    // Store pending change (even if entry not loaded yet)
    this.state.pendingChanges.set(entryId, pendingChange);

    let updatedEntry: Entry;

    if (existingEntry) {
      // Entry exists in local state - update it immediately for UI
      updatedEntry = { ...existingEntry, ...changes };
      this.state.entries.set(entryId, updatedEntry);
    } else {
      // Entry not loaded yet - create a minimal entry with just the changes
      // This will be properly merged when the real entry data is loaded via applyServerUpdate
      console.log(`[LocalStateManager] Entry ${entryId} not in local state yet - creating pending-only entry`);
      updatedEntry = {
        id: entryId,
        ...changes,
      } as Entry;
      // Don't add to entries map - wait for real data from server
    }

    await this.persistState();

    // Notify listeners of state change (this triggers EntryList refresh)
    this.notifyListeners();

    return updatedEntry;
  }

  /**
   * Get all pending changes (for sync queue)
   */
  getPendingChanges(): PendingChange[] {
    return Array.from(this.state.pendingChanges.values());
  }

  /**
   * Get pending changes for a specific class (for merge logic)
   */
  getPendingChangesForClass(classId: number): PendingChange[] {
    const entries = Array.from(this.state.entries.values())
      .filter(entry => entry.classId === classId);

    return entries
      .map(entry => this.state.pendingChanges.get(entry.id))
      .filter((change): change is PendingChange => change !== undefined);
  }

  /**
   * Clear a pending change after successful sync
   */
  async clearPendingChange(entryId: number): Promise<void> {
    this.state.pendingChanges.delete(entryId);
    await this.persistState();

    // Notify listeners of state change
    this.notifyListeners();
  }

  /**
   * Check if an entry has pending changes
   */
  hasPendingChange(entryId: number): boolean {
    return this.state.pendingChanges.has(entryId);
  }

  /**
   * Check if server data matches pending changes
   * Used to determine if pending changes have been successfully synced
   */
  private serverMatchesPendingChanges(serverEntry: Entry, pending: PendingChange): boolean {
    console.log(`[LocalStateManager] Comparing server data with pending for entry ${serverEntry.id}:`);

    // Check each field in the pending changes
    for (const [key, value] of Object.entries(pending.changes)) {
      const serverValue = (serverEntry as any)[key];

      console.log(`  - ${key}: pending=${JSON.stringify(value)} (${typeof value}) vs server=${JSON.stringify(serverValue)} (${typeof serverValue})`);

      // Handle different comparison types
      if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
        if (serverValue !== value) {
          console.log(`    ❌ MISMATCH: ${JSON.stringify(serverValue)} !== ${JSON.stringify(value)}`);
          return false; // Server data differs
        }
      } else if (value === null || value === undefined) {
        if (serverValue !== value) {
          console.log(`    ❌ MISMATCH: ${JSON.stringify(serverValue)} !== ${JSON.stringify(value)}`);
          return false;
        }
      }
    }

    console.log(`  ✅ All fields match!`);
    return true; // All pending changes are confirmed by server
  }

  /**
   * Merge an entry with its pending changes
   */
  private mergeEntry(entry: Entry, pending: PendingChange): Entry {
    return {
      ...entry,
      ...pending.changes,
    };
  }

  /**
   * Merge server data with pending changes (keep pending changes, update other fields)
   */
  private mergeServerWithPending(serverEntry: Entry, pending: PendingChange): Entry {
    // Start with server data
    const merged = { ...serverEntry };

    // Apply pending changes on top (they take priority)
    Object.assign(merged, pending.changes);

    return merged;
  }

  /**
   * Persist current state to IndexedDB
   */
  private async persistState(): Promise<void> {
    try {
      // Save entries to metadata store
      const entries = Array.from(this.state.entries.values());
      await db.set(STORES.METADATA, {
        key: 'local-state-entries',
        value: entries,
        timestamp: Date.now(),
      });

      // Save pending changes
      const pending = Array.from(this.state.pendingChanges.values());
      await db.set(STORES.METADATA, {
        key: 'pending-changes',
        value: pending,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[LocalStateManager] Failed to persist state:', error);
    }
  }

  /**
   * Clear all local state (for logout or reset)
   */
  async clear(): Promise<void> {
    this.state.entries.clear();
    this.state.pendingChanges.clear();
    this.state.lastSync = 0;

    try {
      await db.delete(STORES.METADATA, 'local-state-entries');
      await db.delete(STORES.METADATA, 'pending-changes');
    } catch (error) {
      console.error('[LocalStateManager] Failed to clear state:', error);
    }
  }

  /**
   * Clear all pending changes (for debugging stale pending changes)
   */
  async clearAllPending(): Promise<void> {
    const count = this.state.pendingChanges.size;
    this.state.pendingChanges.clear();

    await this.persistState();
    this.notifyListeners();

    console.log(`[LocalStateManager] Cleared ${count} pending changes`);
  }

  /**
   * Clear stale pending changes older than specified age
   * Default is 1 minute (60000ms) to quickly clean up failed sync attempts
   */
  async clearStalePending(maxAgeMs: number = 60 * 1000): Promise<number> {
    const now = Date.now();
    const toRemove: number[] = [];

    for (const [entryId, change] of this.state.pendingChanges.entries()) {
      const age = now - change.timestamp;
      if (age > maxAgeMs) {
        console.log(`[LocalStateManager] Removing stale pending change for entry ${entryId} (${Math.floor(age / 1000)}s old)`);
        toRemove.push(entryId);
      }
    }

    for (const entryId of toRemove) {
      this.state.pendingChanges.delete(entryId);
    }

    if (toRemove.length > 0) {
      await this.persistState();
      this.notifyListeners();
      console.log(`[LocalStateManager] Cleared ${toRemove.length} stale pending changes`);
    }

    return toRemove.length;
  }

  /**
   * Mark a pending change as failed
   */
  async markAsFailed(entryId: number, error: string): Promise<void> {
    const pending = this.state.pendingChanges.get(entryId);
    if (!pending) return;

    pending.metadata.status = 'failed';
    pending.metadata.failedAt = Date.now();
    pending.metadata.lastError = error;
    pending.metadata.retryCount += 1;

    await this.persistState();
  }

  /**
   * Garbage collect old failed changes
   * Strategy:
   * - Failed changes older than 24 hours: Keep (user can still retry)
   * - Failed changes older than 7 days: Auto-discard
   */
  async garbageCollect(): Promise<{
    discarded: number;
    kept: number;
  }> {
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    let discarded = 0;
    let kept = 0;

    const toDiscard: number[] = [];

    for (const [entryId, change] of this.state.pendingChanges.entries()) {
      const age = now - change.timestamp;

      // Auto-discard after 7 days
      if (change.metadata.status === 'failed' && age > SEVEN_DAYS) {
        toDiscard.push(entryId);
        console.log(`🗑️ [GC] Discarding failed change for entry ${entryId} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
        discarded++;
      }
      // Keep failed changes less than 7 days old
      else if (change.metadata.status === 'failed' && age > TWENTY_FOUR_HOURS) {
        console.log(`⏳ [GC] Keeping failed change for entry ${entryId} (${Math.floor(age / (60 * 60 * 1000))} hours old)`);
        kept++;
      }
    }

    // Remove discarded changes
    for (const entryId of toDiscard) {
      this.state.pendingChanges.delete(entryId);
    }

    if (discarded > 0) {
      await this.persistState();
      console.log(`✅ [GC] Garbage collection complete: ${discarded} discarded, ${kept} kept`);
    }

    return { discarded, kept };
  }

  /**
   * Get failed pending changes for user review
   */
  getFailedChanges(): PendingChange[] {
    return Array.from(this.state.pendingChanges.values())
      .filter(change => change.metadata.status === 'failed');
  }

  /**
   * Retry a failed pending change
   */
  async retryFailedChange(entryId: number): Promise<void> {
    const pending = this.state.pendingChanges.get(entryId);
    if (!pending) return;

    pending.metadata.status = 'retrying';
    pending.metadata.lastAttemptAt = Date.now();

    await this.persistState();
  }

  /**
   * Get statistics about current state (for debugging)
   */
  getStats() {
    const pending = Array.from(this.state.pendingChanges.values());
    return {
      totalEntries: this.state.entries.size,
      pendingChanges: this.state.pendingChanges.size,
      failedChanges: pending.filter(c => c.metadata.status === 'failed').length,
      lastSync: this.state.lastSync,
      oldestPending: Math.min(
        ...pending.map(c => c.timestamp),
        Date.now()
      ),
    };
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const localStateManager = new LocalStateManager();
