# Replication System Refactoring Plan
**Comprehensive Race Condition Fixes (1-2 Weeks)**

---

## Executive Summary

**Goal:** Fix all 12 identified race conditions in the IndexedDB replication system to enable stable offline-first functionality.

**Current Status:** Replication system disabled due to database corruption and locking issues (commit f0b324d).

**Timeline:** 10 working days (2 weeks)
**Estimated Effort:** 60-80 hours
**Risk Level:** Medium-High (critical production system)

**Success Criteria:**
- ✅ All 12 race conditions resolved
- ✅ Comprehensive test suite with 90%+ coverage
- ✅ Zero database corruption incidents in 2-week canary period
- ✅ Replication re-enabled in production
- ✅ Performance monitoring and alerting in place

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Critical Fixes (Days 1-3)](#phase-1-critical-fixes-days-1-3)
3. [Phase 2: High Severity Fixes (Days 4-6)](#phase-2-high-severity-fixes-days-4-6)
4. [Phase 3: Testing Infrastructure (Days 5-7)](#phase-3-testing-infrastructure-days-5-7)
5. [Phase 4: Medium/Low Fixes (Days 8-9)](#phase-4-mediumlow-fixes-days-8-9)
6. [Phase 5: Monitoring & Deployment (Day 10)](#phase-5-monitoring--deployment-day-10)
7. [Testing Strategy](#testing-strategy)
8. [Migration Plan](#migration-plan)
9. [Rollback Plan](#rollback-plan)
10. [Risk Mitigation](#risk-mitigation)

---

## Architecture Overview

### Current System
- **16 replicated tables** syncing between Supabase (PostgreSQL) and IndexedDB
- **Shared database instance** (`sharedDB`) used by all tables
- **Table initialization queue** (10ms delays) - recent fix, incomplete
- **Real-time subscriptions** for instant cache invalidation
- **Cross-tab sync** via BroadcastChannel

### Key Files
| File | Lines | Purpose |
|------|-------|---------|
| `ReplicatedTable.ts` | 1,014 | Core table replication logic |
| `ReplicationManager.ts` | 945 | Orchestrates all tables |
| `SyncEngine.ts` | 982 | Sync coordination |
| `initReplication.ts` | 267 | Initialization entry point |
| `ConflictResolver.ts` | ~200 | Merge conflict handling |

### Dependencies
- `idb` (v8.0.0) - IndexedDB wrapper
- `@supabase/supabase-js` - Real-time subscriptions
- Zustand stores - UI state management

---

## Phase 1: Critical Fixes (Days 1-3)

### Day 1: Issue #1 - Global State Mutation Without Locking

**File:** `src/services/replication/ReplicatedTable.ts:33-42, 88-115, 198-206`

**Problem:**
Multiple tables can simultaneously assign `dbInitPromise`, overwriting each other's database open operations.

**Current Code:**
```typescript
// Lines 33-34
let sharedDB: IDBPDatabase | null = null;
let dbInitPromise: Promise<IDBPDatabase> | null = null;

// Line 89-93
if (dbInitPromise) {
  this.db = await dbInitPromise;
  // ... queue logic
}

// Line 200 - RACE CONDITION!
dbInitPromise = Promise.race([openDBPromise, timeoutPromise]);
```

**Fix Implementation:**

```typescript
// Step 1: Add atomic assignment helper
let dbInitInProgress = false; // New flag

protected async init(): Promise<IDBPDatabase> {
  // Return shared instance if already initialized
  if (sharedDB) {
    this.db = sharedDB;
    return sharedDB;
  }

  // If initialization is in progress, wait for it
  if (dbInitPromise) {
    this.db = await dbInitPromise;
    // ... existing queue logic
    return this.db;
  }

  // CRITICAL FIX: Atomic compare-and-swap
  if (dbInitInProgress) {
    // Another thread won the race, wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.init(); // Recursive retry
  }

  // WE WON THE RACE - set flag atomically
  dbInitInProgress = true;

  try {
    // Only create promise if we won the race
    const openDBPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // ... existing upgrade logic
      },
    });

    const timeoutPromise = new Promise<IDBPDatabase>((_, reject) => {
      setTimeout(() => reject(new Error('DB open timeout')), 30000);
    });

    dbInitPromise = Promise.race([openDBPromise, timeoutPromise]);
    sharedDB = await dbInitPromise;

    console.log(`[${this.tableName}] Successfully opened database`);
    return sharedDB;

  } catch (error) {
    // Reset on failure
    dbInitPromise = null;
    sharedDB = null;
    dbInitInProgress = false; // Release flag
    throw error;
  } finally {
    dbInitInProgress = false; // Always release flag
  }
}
```

**Testing:**
```typescript
// Test concurrent initialization
test('16 tables initializing simultaneously use same DB', async () => {
  const tables = Array.from({ length: 16 }, (_, i) =>
    new ReplicatedTable(`table_${i}`)
  );

  const promises = tables.map(t => t.init());
  const dbs = await Promise.all(promises);

  // All should reference the same instance
  const firstDB = dbs[0];
  expect(dbs.every(db => db === firstDB)).toBe(true);
});
```

**Validation:**
- ✅ Run test 100 times without failure
- ✅ No console errors during concurrent init
- ✅ IndexedDB inspector shows single connection

**Estimated Time:** 4 hours (2h implementation, 2h testing)

---

### Day 2: Issue #2 - Transaction Stampede After DB Open

**File:** `src/services/replication/ReplicatedTable.ts:88-115`

**Problem:**
10ms delay is a timing heuristic, not a guarantee. Transactions can overlap causing deadlocks.

**Current Code:**
```typescript
// Line 98-112
const myTurn = tableInitQueue.then(async () => {
  tablesInitialized++;
  console.log(`[${this.tableName}] My turn in queue (${tablesInitialized}/16)`);

  // Small delay to ensure previous table's transactions complete
  await new Promise(resolve => setTimeout(resolve, 10)); // NOT SAFE!

  console.log(`[${this.tableName}] Proceeding with initialization`);
});

tableInitQueue = myTurn;
await myTurn;
```

**Fix Implementation:**

```typescript
// Step 1: Add transaction tracking (top of file)
let activeTransactions = new Set<Promise<void>>();

// Step 2: Replace timing delay with transaction coordination
const myTurn = tableInitQueue.then(async () => {
  tablesInitialized++;
  console.log(`[${this.tableName}] My turn in queue (${tablesInitialized}/16)`);

  // CRITICAL FIX: Wait for ALL active transactions to complete
  if (activeTransactions.size > 0) {
    console.log(`[${this.tableName}] Waiting for ${activeTransactions.size} active transactions...`);
    await Promise.all(activeTransactions);
    console.log(`[${this.tableName}] All transactions complete`);
  }

  console.log(`[${this.tableName}] Proceeding with initialization`);
});

tableInitQueue = myTurn;
await myTurn;

// Step 3: Track transactions when they're created
protected async runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBPObjectStore) => Promise<T>
): Promise<T> {
  const db = await this.init();

  const txPromise = (async () => {
    const tx = db.transaction(storeName, mode);
    const result = await callback(tx.store);
    await tx.done;
    return result;
  })();

  // Track this transaction
  activeTransactions.add(txPromise as Promise<void>);

  // Remove when complete
  txPromise
    .then(() => activeTransactions.delete(txPromise as Promise<void>))
    .catch(() => activeTransactions.delete(txPromise as Promise<void>));

  return txPromise;
}
```

**Testing:**
```typescript
test('handles slow transactions without overlap', async () => {
  const table1 = new ReplicatedTable('table1');
  const table2 = new ReplicatedTable('table2');

  let table1TxStart = 0;
  let table1TxEnd = 0;
  let table2TxStart = 0;

  const promise1 = table1.init().then(async () => {
    table1TxStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Slow transaction
    table1TxEnd = Date.now();
  });

  const promise2 = table2.init().then(async () => {
    table2TxStart = Date.now();
  });

  await Promise.all([promise1, promise2]);

  // Table 2 should start AFTER table 1 finishes
  expect(table2TxStart).toBeGreaterThanOrEqual(table1TxEnd);
});
```

**Validation:**
- ✅ No "transaction deadlock" errors in logs
- ✅ Transactions execute sequentially under load
- ✅ Performance acceptable (< 500ms total init time)

**Estimated Time:** 6 hours (3h implementation, 3h testing)

---

### Day 3: Issue #3 - Retry Promise Overwrites Original

**File:** `src/services/replication/ReplicatedTable.ts:251-252, 271-274`

**Problem:**
Retry logic overwrites `dbInitPromise` while other threads are using it, causing crashes.

**Current Code:**
```typescript
// Line 251-252 - OVERWRITES dbInitPromise!
dbInitPromise = Promise.race([retryPromise, timeoutPromise]);
sharedDB = await dbInitPromise;

// Line 271-274 - Resets global state while in use!
dbInitPromise = null;
sharedDB = null;
tableInitQueue = Promise.resolve();
tablesInitialized = 0;
```

**Fix Implementation:**

```typescript
// Don't overwrite dbInitPromise - use a local variable
try {
  console.log(`[${this.tableName}] Database corrupted, attempting recovery...`);

  // Close and delete corrupted database
  if (sharedDB) {
    sharedDB.close();
    sharedDB = null;
  }

  await deleteDB(DB_NAME);

  // CRITICAL FIX: Use separate promise for retry
  const retryPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // ... existing upgrade logic
    },
  });

  const timeoutPromise = new Promise<IDBPDatabase>((_, reject) => {
    setTimeout(() => reject(new Error('Retry timeout')), 30000);
  });

  // NEW VARIABLE - don't overwrite dbInitPromise
  const retryDbPromise = Promise.race([retryPromise, timeoutPromise]);
  sharedDB = await retryDbPromise;

  // NOW update dbInitPromise to point to the new database
  dbInitPromise = Promise.resolve(sharedDB);

  // Reset queue state for clean retry
  tableInitQueue = Promise.resolve();
  tablesInitialized = 0;

  console.log(`[${this.tableName}] Database recovered successfully`);
  this.db = sharedDB;
  return sharedDB;

} catch (retryError) {
  console.error(`[${this.tableName}] Failed to recover database:`, retryError);

  // CRITICAL FIX: Only reset if no other threads are using the DB
  const currentlyInUse = activeTransactions.size > 0;
  if (!currentlyInUse) {
    dbInitPromise = null;
    sharedDB = null;
    tableInitQueue = Promise.resolve();
    tablesInitialized = 0;
  } else {
    console.warn(`[${this.tableName}] Not resetting DB - ${activeTransactions.size} transactions active`);
  }

  throw new Error(`Failed to initialize database: ${retryError}`);
}
```

**Testing:**
```typescript
test('concurrent threads during retry don\'t crash', async () => {
  // Simulate corruption during multi-table init
  const tables = Array.from({ length: 5 }, (_, i) =>
    new ReplicatedTable(`table_${i}`)
  );

  // Table 0 will trigger corruption
  jest.spyOn(tables[0] as any, 'checkDatabaseHealth').mockResolvedValue(false);

  // All tables init concurrently
  const promises = tables.map(async (t, i) => {
    try {
      await t.init();
      return { success: true, table: i };
    } catch (error) {
      return { success: false, table: i, error };
    }
  });

  const results = await Promise.all(promises);

  // At least some should succeed (not all crash)
  const successes = results.filter(r => r.success);
  expect(successes.length).toBeGreaterThan(0);
});
```

**Validation:**
- ✅ Retry doesn't crash other tables
- ✅ Successful retry allows new tables to connect
- ✅ Failed retry doesn't leave system in broken state

**Estimated Time:** 5 hours (2.5h implementation, 2.5h testing)

**Phase 1 Total:** 15 hours (3 days @ 5h/day)

---

## Phase 2: High Severity Fixes (Days 4-6)

### Day 4: Issue #4 - Concurrent Subscription Setup During Sync

**File:** `src/services/replication/initReplication.ts:84-125`, `ReplicationManager.ts:124-126, 821-865`

**Problem:**
Auto-sync starts before all table registrations complete, causing concurrent sync operations.

**Current Code:**
```typescript
// initReplication.ts line 84-89
const manager = initReplicationManager({
  licenseKey,
  autoSyncOnStartup: true, // ← Sync starts immediately!
});

// Line 95-120 - These happen AFTER sync started!
manager.registerTable('entries', replicatedEntriesTable);
manager.registerTable('classes', replicatedClassesTable);
// ... 14 more tables
```

**Fix Implementation:**

```typescript
// Step 1: Disable auto-sync during registration
const manager = initReplicationManager({
  licenseKey,
  autoSyncInterval: 5 * 60 * 1000,
  autoSyncOnStartup: false, // ← Don't start yet!
  autoSyncOnReconnect: true,
});

// Step 2: Register all tables (synchronous operations)
console.log('[Replication] Registering tables...');

manager.registerTable('entries', replicatedEntriesTable);
manager.registerTable('classes', replicatedClassesTable);
manager.registerTable('trials', replicatedTrialsTable);
manager.registerTable('shows', replicatedShowsTable);
manager.registerTable('class_requirements', replicatedClassRequirementsTable);
manager.registerTable('show_result_visibility_defaults', replicatedShowVisibilityDefaultsTable);
manager.registerTable('trial_result_visibility_overrides', replicatedTrialVisibilityOverridesTable);
manager.registerTable('class_result_visibility_overrides', replicatedClassVisibilityOverridesTable);
manager.registerTable('announcements', replicatedAnnouncementsTable);
manager.registerTable('announcement_reads', replicatedAnnouncementReadsTable);
manager.registerTable('push_subscriptions', replicatedPushSubscriptionsTable);
manager.registerTable('push_notification_config', replicatedPushNotificationConfigTable);
manager.registerTable('view_stats_summary', replicatedStatsViewTable);
manager.registerTable('event_statistics', replicatedEventStatisticsTable);
manager.registerTable('nationals_rankings', replicatedNationalsRankingsTable);
manager.registerTable('view_audit_log', replicatedAuditLogViewTable);

console.log('[Replication] Registered 16 tables');

// Step 3: Wait for all subscriptions to be ready
console.log('[Replication] Waiting for subscriptions to initialize...');
await manager.waitForSubscriptionsReady();

// Step 4: NOW start auto-sync
console.log('[Replication] Starting auto-sync...');
manager.startAutoSync();

console.log('[Replication] ✅ Replication system initialized successfully');
```

**Step 5: Add subscription readiness tracking to ReplicationManager:**

```typescript
// ReplicationManager.ts
private subscriptionReadyPromises: Map<string, Promise<void>> = new Map();

registerTable<T extends { id: string }>(
  tableName: string,
  table: ReplicatedTable<T>
): void {
  this.tables.set(tableName, table);

  // Track subscription setup
  if (this.config.enableRealtimeSync !== false) {
    const readyPromise = this.subscribeToRealtimeChanges(tableName);
    this.subscriptionReadyPromises.set(tableName, readyPromise);
  }

  logger.log(`[ReplicationManager] Registered table: ${tableName}`);
}

async waitForSubscriptionsReady(): Promise<void> {
  if (this.subscriptionReadyPromises.size === 0) {
    return;
  }

  console.log(`[ReplicationManager] Waiting for ${this.subscriptionReadyPromises.size} subscriptions...`);
  await Promise.all(this.subscriptionReadyPromises.values());
  console.log('[ReplicationManager] All subscriptions ready');
}

private subscribeToRealtimeChanges(tableName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const channel = supabase
        .channel(`${this.config.licenseKey}_${tableName}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter: `license_key=eq.${this.config.licenseKey}`,
          },
          (payload) => {
            // ... existing handler
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[ReplicationManager] Subscribed to ${tableName}`);
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error(`Subscription failed for ${tableName}`));
          }
        });

      this.realtimeChannels.set(tableName, channel);
    } catch (error) {
      reject(error);
    }
  });
}
```

**Testing:**
```typescript
test('sync does not start before subscriptions ready', async () => {
  const syncSpy = jest.fn();
  jest.spyOn(ReplicationManager.prototype, 'syncAll').mockImplementation(syncSpy);

  const manager = initReplicationManager({
    licenseKey: 'test-key',
    autoSyncOnStartup: false,
  });

  // Register tables
  manager.registerTable('entries', mockTable);
  manager.registerTable('classes', mockTable);

  // Sync should NOT have been called yet
  expect(syncSpy).not.toHaveBeenCalled();

  // Wait for subscriptions
  await manager.waitForSubscriptionsReady();

  // Start sync
  manager.startAutoSync();

  // Now sync should be called
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(syncSpy).toHaveBeenCalled();
});
```

**Validation:**
- ✅ Subscriptions all show "SUBSCRIBED" status
- ✅ First sync happens after all tables registered
- ✅ No concurrent sync operations during init

**Estimated Time:** 6 hours (3h implementation, 3h testing)

---

### Day 5: Issue #5 - Optimistic Update Retry Race

**File:** `src/services/replication/ReplicatedTable.ts:505-547`

**Problem:**
Multiple concurrent updates to the same row can livelock in exponential backoff retry loops.

**Fix Implementation:**

```typescript
// Step 1: Add per-row mutex (top of class)
private rowLocks: Map<string, Promise<void>> = new Map();

// Step 2: Wrap optimisticUpdate with lock acquisition
async optimisticUpdate(
  id: string,
  updateFn: (current: T) => Partial<T>
): Promise<void> {
  // CRITICAL FIX: Acquire row lock
  await this.acquireRowLock(id);

  try {
    // Now perform the update (no retry needed - we have exclusive access!)
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

    const existingRow = await tx.store.get([this.tableName, id]);
    if (!existingRow) {
      throw new Error(`Row not found: ${id}`);
    }

    const updates = updateFn(existingRow.data);
    const currentVersion = existingRow.version;

    // Apply update with version increment
    const updatedData = { ...existingRow.data, ...updates };
    await this.set(id, updatedData, true, currentVersion);

    await tx.done;
  } finally {
    // Always release lock
    this.releaseRowLock(id);
  }
}

// Step 3: Lock helpers
private async acquireRowLock(id: string): Promise<void> {
  // If lock exists, wait for it
  while (this.rowLocks.has(id)) {
    await this.rowLocks.get(id);
    // Re-check in case another lock was created
  }

  // Create our lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>(resolve => {
    releaseLock = resolve;
  });

  this.rowLocks.set(id, lockPromise);

  // Store the release function for later
  (this.rowLocks.get(id) as any)._release = releaseLock!;
}

private releaseRowLock(id: string): void {
  const lock = this.rowLocks.get(id);
  if (lock && (lock as any)._release) {
    (lock as any)._release();
    this.rowLocks.delete(id);
  }
}
```

**Testing:**
```typescript
test('100 concurrent updates to same row complete without livelock', async () => {
  const table = new ReplicatedTable('entries');
  await table.init();

  // Create initial row
  await table.set('entry-1', { id: 'entry-1', value: 0 });

  // 100 concurrent increments
  const promises = Array.from({ length: 100 }, (_, i) =>
    table.optimisticUpdate('entry-1', (current) => ({
      value: (current.value || 0) + 1
    }))
  );

  await Promise.all(promises);

  // Verify final value is exactly 100
  const final = await table.get('entry-1');
  expect(final.value).toBe(100);
}, 10000); // 10 second timeout
```

**Validation:**
- ✅ No exponential backoff retries in logs
- ✅ All updates complete in < 5 seconds
- ✅ Final version equals number of updates

**Estimated Time:** 5 hours (2.5h implementation, 2.5h testing)

---

### Day 6: Issue #6 - Notification Flood During Batch Operations

**File:** `src/services/replication/ReplicatedTable.ts:692-711, 552-576`

**Problem:**
Trailing-edge debounce can prevent notifications from firing if batches arrive faster than 100ms.

**Fix Implementation:**

```typescript
// Step 1: Add leading-edge flag
private notifyDebounceTimer: NodeJS.Timeout | null = null;
private hasNotifiedLeadingEdge: boolean = false; // NEW FLAG

// Step 2: Implement leading-edge debounce
private notifyListeners(data: T[]): void {
  // CRITICAL FIX: Fire immediately if this is the first call
  if (!this.hasNotifiedLeadingEdge) {
    this.hasNotifiedLeadingEdge = true;
    this.actuallyNotifyListeners(data);
  }

  // Clear existing timer
  if (this.notifyDebounceTimer) {
    clearTimeout(this.notifyDebounceTimer);
  }

  // Set trailing-edge timer for subsequent updates
  this.notifyDebounceTimer = setTimeout(() => {
    this.actuallyNotifyListeners(data);
    this.notifyDebounceTimer = null;
    this.hasNotifiedLeadingEdge = false; // Reset flag
  }, this.NOTIFY_DEBOUNCE_MS);
}

// Step 3: Extract actual notification logic
private actuallyNotifyListeners(data: T[]): void {
  this.listeners.forEach((callback) => {
    try {
      callback(data);
    } catch (error) {
      logger.error(`[${this.tableName}] Listener error:`, error);
    }
  });
}
```

**Testing:**
```typescript
test('leading-edge notification fires immediately', async () => {
  const table = new ReplicatedTable('entries');
  const notifySpy = jest.fn();
  table.subscribe(notifySpy);

  // First notification should fire immediately
  const start = Date.now();
  await table.set('entry-1', { id: 'entry-1' });

  // Should be notified within 10ms (not 100ms debounce)
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(notifySpy).toHaveBeenCalledTimes(1);
  expect(Date.now() - start).toBeLessThan(50);
});

test('rapid batches still trigger notifications', async () => {
  const table = new ReplicatedTable('entries');
  const notifySpy = jest.fn();
  table.subscribe(notifySpy);

  // Send 10 batches, 50ms apart (faster than 100ms debounce)
  for (let i = 0; i < 10; i++) {
    await table.batchSet([{ id: `entry-${i}` }]);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Should have at least 2 notifications (leading + trailing)
  expect(notifySpy.mock.calls.length).toBeGreaterThanOrEqual(2);
});
```

**Validation:**
- ✅ First notification within 10ms
- ✅ Subsequent rapid updates don't starve notifications
- ✅ UI stays responsive during batch operations

**Estimated Time:** 4 hours (2h implementation, 2h testing)

**Phase 2 Total:** 15 hours (3 days @ 5h/day)

---

## Phase 3: Testing Infrastructure (Days 5-7)

### Day 5-7: Comprehensive Race Condition Test Suite

**Goal:** Catch race conditions before they reach production.

**Test Categories:**

#### 1. Concurrent Initialization Tests
```typescript
// File: src/services/replication/__tests__/concurrent-init.test.ts

describe('Concurrent Initialization', () => {
  test('16 tables initialize without deadlock', async () => {
    const tables = Array.from({ length: 16 }, (_, i) =>
      new ReplicatedTable(`table_${i}`)
    );

    const start = Date.now();
    await Promise.all(tables.map(t => t.init()));
    const duration = Date.now() - start;

    // Should complete in reasonable time (< 5 seconds)
    expect(duration).toBeLessThan(5000);

    // All should share same DB
    expect(tables.every(t => t['db'] === tables[0]['db'])).toBe(true);
  });

  test('handles DB corruption during init', async () => {
    // Simulate corruption on 5th table
    const tables = Array.from({ length: 10 }, (_, i) =>
      new ReplicatedTable(`table_${i}`)
    );

    jest.spyOn(tables[4] as any, 'checkDatabaseHealth').mockResolvedValue(false);

    const results = await Promise.allSettled(tables.map(t => t.init()));

    // Some should succeed despite corruption
    const successes = results.filter(r => r.status === 'fulfilled');
    expect(successes.length).toBeGreaterThan(0);
  });

  test('hot reload doesn\'t corrupt database', async () => {
    // First init
    const table1 = new ReplicatedTable('entries');
    await table1.init();

    // Simulate HMR by creating new instance
    const table2 = new ReplicatedTable('entries');
    await table2.init();

    // Both should work
    await table1.set('test-1', { id: 'test-1' });
    await table2.set('test-2', { id: 'test-2' });

    expect(await table1.get('test-2')).toBeTruthy();
  });
});
```

#### 2. Concurrent Update Tests
```typescript
// File: src/services/replication/__tests__/concurrent-updates.test.ts

describe('Concurrent Updates', () => {
  test('100 concurrent updates to same row', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();
    await table.set('entry-1', { id: 'entry-1', counter: 0 });

    const promises = Array.from({ length: 100 }, () =>
      table.optimisticUpdate('entry-1', (current) => ({
        counter: (current.counter || 0) + 1
      }))
    );

    await Promise.all(promises);

    const result = await table.get('entry-1');
    expect(result.counter).toBe(100);
  });

  test('concurrent updates to different rows', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    const promises = Array.from({ length: 100 }, (_, i) =>
      table.set(`entry-${i}`, { id: `entry-${i}`, value: i })
    );

    await Promise.all(promises);

    const all = await table.getAll();
    expect(all.length).toBe(100);
  });

  test('batch operations don\'t interfere', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    const batch1 = Array.from({ length: 50 }, (_, i) => ({
      id: `batch1-${i}`, value: 1
    }));

    const batch2 = Array.from({ length: 50 }, (_, i) => ({
      id: `batch2-${i}`, value: 2
    }));

    await Promise.all([
      table.batchSet(batch1),
      table.batchSet(batch2),
    ]);

    const all = await table.getAll();
    expect(all.length).toBe(100);
  });
});
```

#### 3. Sync Race Condition Tests
```typescript
// File: src/services/replication/__tests__/sync-races.test.ts

describe('Sync Race Conditions', () => {
  test('subscription doesn\'t trigger during active sync', async () => {
    const manager = initReplicationManager({
      licenseKey: 'test-key',
      autoSyncOnStartup: false,
    });

    manager.registerTable('entries', mockTable);
    await manager.waitForSubscriptionsReady();

    let syncCount = 0;
    jest.spyOn(manager as any, 'syncTable').mockImplementation(async () => {
      syncCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Trigger sync
    const syncPromise = manager.syncTable('entries');

    // Simulate real-time event during sync
    await new Promise(resolve => setTimeout(resolve, 50));
    mockRealtimeEvent('entries', 'INSERT');

    await syncPromise;

    // Should only sync once (not trigger second sync)
    expect(syncCount).toBe(1);
  });

  test('cross-tab sync doesn\'t echo', async () => {
    const tab1 = initReplicationManager({
      licenseKey: 'test-key',
      enableCrossTabSync: true,
    });

    const tab2 = initReplicationManager({
      licenseKey: 'test-key',
      enableCrossTabSync: true,
    });

    let tab2SyncCount = 0;
    jest.spyOn(tab2 as any, 'syncTable').mockImplementation(() => {
      tab2SyncCount++;
    });

    // Tab 1 triggers sync
    await tab1.syncTable('entries');

    // Tab 2 should receive broadcast and sync ONCE
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(tab2SyncCount).toBe(1);

    // Tab 1 should NOT receive its own broadcast
    // (Implementation should check message origin)
  });
});
```

#### 4. Notification/Subscription Tests
```typescript
// File: src/services/replication/__tests__/notifications.test.ts

describe('Notification System', () => {
  test('leading-edge notification fires immediately', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    const notifySpy = jest.fn();
    table.subscribe(notifySpy);

    const start = Date.now();
    await table.set('entry-1', { id: 'entry-1' });

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(notifySpy).toHaveBeenCalled();
    expect(Date.now() - start).toBeLessThan(50);
  });

  test('rapid updates don\'t starve notifications', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    const notifySpy = jest.fn();
    table.subscribe(notifySpy);

    // 20 updates, 40ms apart
    for (let i = 0; i < 20; i++) {
      await table.set(`entry-${i}`, { id: `entry-${i}` });
      await new Promise(resolve => setTimeout(resolve, 40));
    }

    // Should have multiple notifications (not just one at the end)
    expect(notifySpy.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  test('listener exception doesn\'t block others', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    const badListener = jest.fn(() => { throw new Error('Bad listener'); });
    const goodListener = jest.fn();

    table.subscribe(badListener);
    table.subscribe(goodListener);

    await table.set('entry-1', { id: 'entry-1' });

    // Good listener should still be called
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(goodListener).toHaveBeenCalled();
  });
});
```

#### 5. Performance Tests
```typescript
// File: src/services/replication/__tests__/performance.test.ts

describe('Performance Under Load', () => {
  test('init completes in < 5 seconds', async () => {
    const start = Date.now();
    await initializeReplication();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  test('handles 1000 entries without degradation', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    const entries = Array.from({ length: 1000 }, (_, i) => ({
      id: `entry-${i}`,
      armband_number: i + 1,
      call_name: `Dog ${i}`,
    }));

    const start = Date.now();
    await table.batchSet(entries);
    const writeDuration = Date.now() - start;

    expect(writeDuration).toBeLessThan(2000); // < 2 seconds

    // Read performance
    const readStart = Date.now();
    const all = await table.getAll();
    const readDuration = Date.now() - readStart;

    expect(all.length).toBe(1000);
    expect(readDuration).toBeLessThan(500); // < 500ms
  });

  test('quota management doesn\'t block active reads', async () => {
    const table = new ReplicatedTable('entries');
    await table.init();

    // Fill up to quota
    const largeEntries = Array.from({ length: 2000 }, (_, i) => ({
      id: `entry-${i}`,
      largeField: 'x'.repeat(1000), // 1KB each
    }));

    await table.batchSet(largeEntries);

    // Trigger eviction while reading
    const readPromise = table.get('entry-100');
    const evictPromise = (table as any).evictLRU(500); // Evict 500 entries

    const [readResult] = await Promise.all([readPromise, evictPromise]);

    // Read should succeed
    expect(readResult).toBeTruthy();
  });
});
```

**Test Infrastructure:**
- Use Vitest for unit tests
- Use Playwright for E2E replication scenarios
- Add test utilities: `mockReplicationManager()`, `mockReplicatedTable()`
- Set up GitHub Actions to run tests on every PR

**Coverage Target:** 90%+ for replication system files

**Estimated Time:** 15 hours (3 days @ 5h/day, overlapping with Days 4-6)

---

## Phase 4: Medium/Low Fixes (Days 8-9)

### Day 8: Medium Severity Issues

#### Issue #7: Metadata Update Race
**File:** `ReplicatedTable.ts:965-998`

**Fix:**
```typescript
// Use atomic increment instead of read-modify-write
async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
  const db = await this.init();
  const tx = db.transaction(REPLICATION_STORES.SYNC_METADATA, 'readwrite');

  // For numeric fields, use atomic increment
  if (updates.conflictCount !== undefined) {
    const existing = await tx.store.get(this.tableName);
    const currentCount = existing?.conflictCount || 0;
    updates.conflictCount = currentCount + updates.conflictCount;
  }

  // Merge and write
  const existing = await tx.store.get(this.tableName);
  const metadata = { ...existing, ...updates };
  await tx.store.put(metadata);
  await tx.done;
}
```

**Estimated Time:** 2 hours

#### Issue #8: Cross-Tab Sync Cascade
**File:** `ReplicationManager.ts:790-815, 833-851`

**Fix:**
```typescript
// Add tab ID and message origin tracking
const TAB_ID = `tab_${Date.now()}_${Math.random()}`;

private initCrossTabSync(): void {
  this.broadcastChannel = new BroadcastChannel('myK9Q_replication');

  this.broadcastChannel.onmessage = (event) => {
    // CRITICAL FIX: Ignore our own messages
    if (event.data.originTabId === TAB_ID) {
      return;
    }

    // ... rest of handler
  };
}

private broadcastTableChange(tableName: string): void {
  if (this.broadcastChannel) {
    this.broadcastChannel.postMessage({
      type: 'table-changed',
      tableName,
      originTabId: TAB_ID, // Track origin
      licenseKey: this.config.licenseKey,
    });
  }
}
```

**Estimated Time:** 2 hours

#### Issue #9: LRU Eviction During Active Reads
**File:** `ReplicatedTable.ts:853-931`

**Fix:**
```typescript
// Pin recently accessed rows
const EVICTION_GRACE_PERIOD = 30000; // 30 seconds

async evictLRU(targetCount: number): Promise<number> {
  const db = await this.init();
  const now = Date.now();
  let evicted = 0;

  const rows = await db.getAll(REPLICATION_STORES.REPLICATED_TABLES);
  const tableRows = rows.filter(r => r.tableName === this.tableName);

  // Sort by lastAccessedAt (oldest first)
  tableRows.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  for (const row of tableRows) {
    if (evicted >= targetCount) break;

    // CRITICAL FIX: Don't evict recently accessed rows
    if ((now - row.lastAccessedAt) < EVICTION_GRACE_PERIOD) {
      continue;
    }

    await db.delete(REPLICATION_STORES.REPLICATED_TABLES, [row.tableName, row.id]);
    evicted++;
  }

  return evicted;
}
```

**Estimated Time:** 2 hours

#### Issue #10: Subscription Callback Blocking
**File:** `ReplicatedTable.ts:699-708`

**Fix:**
```typescript
// Execute callbacks asynchronously
private notifyListeners(data: T[]): void {
  this.listeners.forEach((callback) => {
    // CRITICAL FIX: Don't block on slow callbacks
    Promise.resolve()
      .then(() => callback(data))
      .catch(error => {
        logger.error(`[${this.tableName}] Listener error:`, error);
      });
  });
}
```

**Estimated Time:** 1 hour

**Day 8 Total:** 7 hours

---

### Day 9: Low Severity Issues

#### Issue #11: Query Timeout Doesn't Cancel
**File:** `ReplicatedTable.ts:377-435`

**Fix:**
```typescript
// Add transaction abortion on timeout
async query<K extends keyof T>(
  indexName: string,
  value: T[K]
): Promise<T[]> {
  const db = await this.init();

  let txAborted = false;
  const queryPromise = (async () => {
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readonly');

    try {
      const index = tx.store.index(indexName);
      const rows = await index.getAll([this.tableName, value]);
      return rows.map(row => row.data);
    } finally {
      if (txAborted) {
        tx.abort();
      }
    }
  })();

  const timeoutPromise = new Promise<T[]>((_, reject) => {
    setTimeout(() => {
      txAborted = true; // Signal abortion
      reject(new Error('Query timeout'));
    }, this.QUERY_TIMEOUT_MS);
  });

  return Promise.race([queryPromise, timeoutPromise]);
}
```

**Estimated Time:** 2 hours

#### Issue #12: localStorage Backup Race
**File:** `SyncEngine.ts:808-822`

**Fix:**
```typescript
// Debounce backup writes
private backupDebounceTimer: NodeJS.Timeout | null = null;
private isBackupInProgress = false;

async backupMutationsToLocalStorage(): Promise<void> {
  // Clear existing timer
  if (this.backupDebounceTimer) {
    clearTimeout(this.backupDebounceTimer);
  }

  // Debounce for 1 second
  return new Promise(resolve => {
    this.backupDebounceTimer = setTimeout(async () => {
      if (this.isBackupInProgress) {
        resolve();
        return;
      }

      this.isBackupInProgress = true;
      try {
        const pending = await db.getAll(REPLICATION_STORES.PENDING_MUTATIONS);
        if (pending.length > 0) {
          localStorage.setItem('replication_mutation_backup', JSON.stringify(pending));
        }
      } finally {
        this.isBackupInProgress = false;
        resolve();
      }
    }, 1000);
  });
}
```

**Estimated Time:** 2 hours

**Day 9 Total:** 4 hours

**Phase 4 Total:** 11 hours (2 days @ 5.5h/day)

---

## Phase 5: Monitoring & Deployment (Day 10)

### Monitoring Infrastructure

#### 1. Performance Monitoring
```typescript
// File: src/services/replication/PerformanceMonitor.ts

export class ReplicationPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  trackInit(tableName: string, duration: number): void {
    this.track(`${tableName}_init`, duration);

    // Alert if slow
    if (duration > 2000) {
      console.warn(`[Monitor] Slow init for ${tableName}: ${duration}ms`);
    }
  }

  trackSync(tableName: string, duration: number, rowCount: number): void {
    this.track(`${tableName}_sync`, duration);

    // Alert if slow
    if (duration > 5000) {
      console.warn(`[Monitor] Slow sync for ${tableName}: ${duration}ms (${rowCount} rows)`);
    }
  }

  trackTransaction(storeName: string, duration: number): void {
    this.track(`${storeName}_tx`, duration);

    // Alert if deadlock likely
    if (duration > 10000) {
      console.error(`[Monitor] Possible deadlock in ${storeName}: ${duration}ms`);
    }
  }

  private track(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(value);

    // Keep last 100 measurements
    if (this.metrics.get(key)!.length > 100) {
      this.metrics.get(key)!.shift();
    }
  }

  getReport(): Record<string, { avg: number; max: number; p95: number }> {
    const report: Record<string, any> = {};

    this.metrics.forEach((values, key) => {
      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];

      report[key] = { avg, max, p95 };
    });

    return report;
  }
}
```

#### 2. Error Tracking
```typescript
// File: src/services/replication/ErrorTracker.ts

export class ReplicationErrorTracker {
  private errors: Map<string, number> = new Map();

  trackError(category: string, error: Error): void {
    const key = `${category}_${error.message}`;
    const count = (this.errors.get(key) || 0) + 1;
    this.errors.set(key, count);

    // Alert if error is frequent
    if (count >= 5) {
      console.error(`[ErrorTracker] Frequent error in ${category}: ${error.message} (${count} times)`);
    }

    // Send to external monitoring (Sentry, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { category },
        extra: { count },
      });
    }
  }

  getReport(): Record<string, number> {
    return Object.fromEntries(this.errors);
  }
}
```

#### 3. Health Checks
```typescript
// File: src/services/replication/HealthCheck.ts

export async function performHealthCheck(): Promise<HealthReport> {
  const manager = getReplicationManager();
  if (!manager) {
    return { status: 'disabled', issues: ['Manager not initialized'] };
  }

  const issues: string[] = [];

  // Check database connectivity
  try {
    const table = new ReplicatedTable('_health_check');
    await table.init();
    await table.set('test', { id: 'test' });
    await table.get('test');
  } catch (error) {
    issues.push(`Database connectivity: ${error.message}`);
  }

  // Check subscription health
  const channels = (manager as any).realtimeChannels;
  channels.forEach((channel: any, tableName: string) => {
    if (channel.state !== 'joined') {
      issues.push(`Subscription ${tableName}: ${channel.state}`);
    }
  });

  // Check quota usage
  const usage = await (manager as any).getQuotaUsage();
  if (usage > 0.9) {
    issues.push(`Quota at ${(usage * 100).toFixed(1)}%`);
  }

  return {
    status: issues.length === 0 ? 'healthy' : 'degraded',
    issues,
    timestamp: Date.now(),
  };
}
```

### Deployment Strategy

#### 1. Feature Flag
```typescript
// src/config/featureFlags.ts

export function isReplicationEnabled(): boolean {
  // Check localStorage override
  const override = localStorage.getItem('replication_enabled');
  if (override !== null) {
    return override === 'true';
  }

  // Default: enabled in production, disabled in dev (until stable)
  return import.meta.env.PROD;
}
```

#### 2. Canary Rollout
```
Week 1: Internal testing (dev team only)
Week 2: Beta testers (10% of users)
Week 3: Gradual rollout (50% of users)
Week 4: Full rollout (100% of users)
```

#### 3. Rollback Triggers
- Database corruption errors > 0.1% of sessions
- Sync failure rate > 5%
- Performance degradation > 20%
- User-reported issues > 10 in 24h

**Estimated Time:** 5 hours (monitoring: 3h, deployment plan: 2h)

**Phase 5 Total:** 5 hours (1 day @ 5h/day)

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /----\
      /      \  Integration Tests (30%)
     /--------\
    /          \  Unit Tests (60%)
   /------------\
```

### Coverage Targets
- **Unit Tests:** 90%+ for all replication files
- **Integration Tests:** 80%+ for manager/sync engine
- **E2E Tests:** Critical workflows (init, sync, offline)

### Test Execution
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only replication tests
npm test -- src/services/replication

# Run race condition tests specifically
npm test -- --grep "concurrent|race|stampede"
```

### Continuous Integration
```yaml
# .github/workflows/test-replication.yml
name: Test Replication System

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run typecheck

      # Fail if replication coverage < 90%
      - name: Check coverage
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 90%"
            exit 1
          fi
```

---

## Migration Plan

### Pre-Migration Checklist
- [ ] All 12 issues fixed and tested
- [ ] Test coverage >= 90%
- [ ] TypeScript strict mode passing
- [ ] No ESLint errors
- [ ] Performance benchmarks passing
- [ ] Documentation updated

### Migration Steps

#### Step 1: Development Environment (Day 1)
1. Merge PR to `develop` branch
2. Enable replication via localStorage: `localStorage.setItem('replication_enabled', 'true')`
3. Test with full dev workflow (HMR, multiple tabs, offline mode)
4. Monitor DevTools console for errors

#### Step 2: Staging Environment (Day 2-3)
1. Deploy to staging
2. Run automated E2E tests
3. Perform manual testing with realistic data (1000+ entries)
4. Stress test with 10 concurrent users

#### Step 3: Beta Release (Week 1)
1. Deploy to production with feature flag OFF by default
2. Enable for internal team (10 users)
3. Monitor error logs daily
4. Collect performance metrics

#### Step 4: Canary Rollout (Week 2-4)
1. Week 2: 10% of users (random sampling)
2. Week 3: 50% of users
3. Week 4: 100% of users
4. Monitor health metrics at each stage

### Rollback Procedure
If critical issues arise:

```typescript
// Emergency rollback via feature flag
localStorage.setItem('replication_disabled_reason', 'Critical issue: [description]');
localStorage.setItem('replication_disabled_until', '2025-12-01');

// OR deploy hotfix reverting changes
git revert <commit-hash>
```

---

## Risk Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| New race conditions introduced | Medium | High | Comprehensive test suite, code review |
| Performance regression | Low | Medium | Performance benchmarks, monitoring |
| Breaking changes to API | Low | High | Maintain backward compatibility |
| Data loss during migration | Very Low | Critical | Backup strategy, gradual rollout |
| Browser compatibility issues | Low | Medium | Test on Chrome, Firefox, Safari, Edge |

### Contingency Plans

#### If Critical Bug Found in Production
1. Immediately disable feature flag
2. Roll back to previous stable version
3. Investigate root cause
4. Fix and re-test in staging
5. Re-deploy with extra caution

#### If Performance Degrades
1. Identify bottleneck via performance monitor
2. Apply targeted fix (e.g., increase debounce, reduce batch size)
3. A/B test fix vs rollback
4. Deploy optimized version

#### If Data Corruption Occurs
1. Disable replication immediately
2. Clear all IndexedDB caches
3. Force full sync from Supabase
4. Audit database for corruption patterns
5. Fix root cause before re-enabling

---

## Timeline Summary

| Phase | Days | Effort | Key Deliverables |
|-------|------|--------|------------------|
| Phase 1: Critical Fixes | 1-3 | 15h | Issues #1-3 fixed |
| Phase 2: High Severity | 4-6 | 15h | Issues #4-6 fixed |
| Phase 3: Testing | 5-7 | 15h | 90%+ test coverage |
| Phase 4: Medium/Low | 8-9 | 11h | Issues #7-12 fixed |
| Phase 5: Monitoring | 10 | 5h | Monitoring, deployment plan |
| **Total** | **10 days** | **61h** | **All 12 issues resolved** |

### Daily Schedule (5h/day)
- **Morning (2.5h):** Implementation work
- **Afternoon (2.5h):** Testing and validation

### Milestones
- **Day 3:** Critical issues resolved, system minimally functional
- **Day 6:** High severity issues resolved, system production-ready
- **Day 7:** Test suite complete, ready for code review
- **Day 9:** All issues resolved, ready for staging
- **Day 10:** Monitoring deployed, ready for production rollout

---

## Success Metrics

### Technical Metrics
- ✅ Zero race condition errors in logs
- ✅ Zero database corruption incidents
- ✅ Sync success rate > 99.5%
- ✅ Init time < 3 seconds (16 tables)
- ✅ Test coverage > 90%

### User Experience Metrics
- ✅ Offline mode works reliably
- ✅ Real-time updates appear within 1 second
- ✅ No UI freezes during sync
- ✅ Data consistency across tabs
- ✅ Pull-to-refresh works smoothly

### Business Metrics
- ✅ Replication re-enabled in production
- ✅ Zero user-reported data loss
- ✅ Support tickets related to sync < 5/month
- ✅ User satisfaction score > 4.5/5

---

## Conclusion

This refactoring plan provides a systematic approach to fixing all 12 race conditions in the replication system over a 10-day period. By following this plan:

1. **Critical issues** are addressed first (Days 1-3)
2. **High-impact issues** are resolved next (Days 4-6)
3. **Comprehensive testing** ensures reliability (Days 5-7)
4. **Medium/low issues** are cleaned up (Days 8-9)
5. **Monitoring** enables safe deployment (Day 10)

The phased approach minimizes risk while ensuring thorough coverage of all identified problems. With proper testing, monitoring, and gradual rollout, the replication system can be safely re-enabled in production without the corruption and locking issues that necessitated its previous disablement.

**Next Steps:**
1. Review this plan with the team
2. Get approval for 10-day timeline
3. Create GitHub issues for each phase
4. Begin Phase 1: Critical Fixes

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Author:** Claude Code (via test-specialist and tech-debt-analyzer skills)
**Status:** Ready for Review
