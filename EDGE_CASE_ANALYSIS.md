# Edge Case Analysis - Day 25-26 Testing Plan

**Analysis Date**: 2025-11-10
**Replication System Version**: Phase 4 (Day 23-24 Complete)
**Analyzer**: Code Review AI

## Executive Summary

This document provides a comprehensive analysis of edge cases in the Full Table Replication system, identifying **17 critical edge cases** across 4 testing categories. The analysis reveals **5 HIGH-SEVERITY** issues that require immediate attention before production deployment.

**Risk Assessment**:
- 🔴 **HIGH RISK** (5 issues): Multi-device conflicts, timestamp precision, orphaned mutations
- 🟡 **MEDIUM RISK** (8 issues): Cache staleness, performance degradation, memory pressure
- 🟢 **LOW RISK** (4 issues): Edge cases with existing mitigations

---

## Test Category 1: Multi-Device Sync (Same User, 2+ Browsers)

### Edge Case 1.1: Concurrent Writes to Same Row 🔴 HIGH RISK

**Scenario**: User edits entry #123 on Device A while Device B simultaneously edits the same entry.

**Current Behavior**:
```typescript
// ConflictResolver.ts:35-60 - Last-Write-Wins (LWW)
const localTime = new Date(local.updated_at).getTime();
const remoteTime = new Date(remote.updated_at).getTime();
const resolved = localTime > remoteTime ? local : remote;
```

**Problem Identified**:
- **Timestamp precision**: `updated_at` uses PostgreSQL timestamps (microsecond precision)
- **JavaScript Date**: Only millisecond precision (1000x less precise)
- **Risk**: Two edits within the same millisecond will resolve non-deterministically

**Impact**:
- Lost edits if both devices write within 1ms window
- Non-deterministic conflict resolution (depends on floating-point rounding)

**Exploitation Scenario**:
```
Device A: Updates entry at 2025-11-10T14:23:45.123456Z
Device B: Updates entry at 2025-11-10T14:23:45.123789Z
Both convert to: 1699628625123 (same millisecond!)
Result: Last device to sync "wins" arbitrarily
```

**Recommendation**:
- ✅ **Add hybrid resolution**: Compare microseconds if milliseconds match
- ✅ **Add version vectors**: Track per-device edit counts
- ✅ **Add conflict UI**: Alert user when true conflict detected

**Test Script**:
```javascript
// Manual test in browser DevTools (2 tabs)
// Tab 1:
const entry = await replicatedEntriesTable.get('entry-123');
entry.call_name = 'Fluffy-A';
await replicatedEntriesTable.set('entry-123', entry, true);

// Tab 2 (execute within 1 second):
const entry = await replicatedEntriesTable.get('entry-123');
entry.call_name = 'Fluffy-B';
await replicatedEntriesTable.set('entry-123', entry, true);

// Both tabs sync
await getReplicationManager().syncAll();

// CHECK: Which call_name won? Is it deterministic?
```

---

### Edge Case 1.2: Mutation Queue Ordering 🔴 HIGH RISK

**Scenario**: Device A makes edits 1→2→3 while offline. Device B makes edits 4→5. Device A comes online.

**Current Behavior**:
```typescript
// SyncEngine.ts:378-435 - Serial mutation upload
for (const mutation of pending as PendingMutation[]) {
  await this.executeMutation(mutation);
  await db.delete(REPLICATION_STORES.PENDING_MUTATIONS, mutation.id);
}
```

**Problem Identified**:
- **No ordering guarantee**: Mutations processed in IndexedDB key order (UUID)
- **No causality tracking**: System doesn't know edit 3 depends on edit 2
- **Risk**: Mutations apply out-of-order on server

**Impact**:
- Data corruption if mutations are causally dependent
- Example: "Set score to 45" → "Add 5 points" could become "Add 5 points" → "Set score to 45"

**Exploitation Scenario**:
```
User workflow:
1. Create entry (id: new-entry-1)
2. Set status to "checked-in" (depends on #1 existing)
3. Update armband_number (depends on #1 existing)

Without causal ordering:
- Mutation #2 fails (entry doesn't exist yet)
- Mutation #1 succeeds
- Mutation #3 fails (entry exists but #2 failed)
Result: Entry exists but not checked in, no armband!
```

**Recommendation**:
- ✅ **Add mutation.dependsOn field**: Link dependent mutations
- ✅ **Add topological sort**: Order mutations by dependency graph
- ✅ **Add operation batching**: Group mutations into transactions

**Code Location**: [SyncEngine.ts:378-435](d:\AI-Projects\myK9Q-React-new\src\services\replication\SyncEngine.ts#L378-L435)

---

### Edge Case 1.3: Pending Mutation Orphaning 🔴 HIGH RISK

**Scenario**: Device A creates pending mutation, then user clears browser data. Mutation permanently lost.

**Current Behavior**:
- Mutations stored in IndexedDB only
- No server-side backup until uploaded
- Browser clear = data loss

**Problem Identified**:
- **No mutation durability**: Single point of failure (browser storage)
- **No mutation recovery**: If IndexedDB cleared, mutations gone forever
- **Risk**: User loses offline work if browser data cleared

**Impact**:
- Permanent data loss for offline edits
- Violates offline-first guarantees

**Recommendation**:
- ✅ **Add mutation backup to localStorage**: Redundant storage
- ✅ **Add mutation export**: Allow user to save pending changes as file
- ✅ **Add mutation auto-upload**: Aggressive retry on network reconnect

**Test Script**:
```javascript
// Create offline mutation
navigator.serviceWorker.controller.postMessage({ type: 'GO_OFFLINE' });
await replicatedEntriesTable.update('entry-123', { status: 'checked-in' });

// Verify mutation queued
const pending = await getReplicationManager().getPendingMutations();
console.log(`Pending: ${pending.length}`); // Should be 1

// Simulate browser data clear
await indexedDB.deleteDatabase('replication-v2');

// Go back online
navigator.serviceWorker.controller.postMessage({ type: 'GO_ONLINE' });
await getReplicationManager().syncAll();

// CHECK: Is mutation recovered? (Currently: NO!)
```

---

### Edge Case 1.4: IndexedDB Transaction Conflicts 🟡 MEDIUM RISK

**Scenario**: Device A reads entry, Device B modifies same entry, Device A writes back.

**Current Behavior**:
```typescript
// ReplicatedTable.ts:148-169 - No transaction isolation
async set(id: string, data: T, isDirty = false): Promise<void> {
  const db = await this.init();
  const existingRow = await db.get(...); // Read
  // ... compute new row ...
  await db.put(...); // Write (no read lock!)
}
```

**Problem Identified**:
- **No optimistic locking**: Read/write not atomic
- **No version checking**: Doesn't verify data unchanged since read
- **Risk**: Lost Update problem (classic DB race condition)

**Impact**:
- Silent data overwrite if two devices write concurrently

**Recommendation**:
- ✅ **Add version checking**: Verify `row.version` unchanged before write
- ✅ **Add retry logic**: Re-read and merge if version changed
- ✅ **Use IDB transactions**: Wrap read+write in single transaction

**Code Location**: [ReplicatedTable.ts:148-169](d:\AI-Projects\myK9Q-React-new\src\services\replication\ReplicatedTable.ts#L148-L169)

---

### Edge Case 1.5: Cache Inconsistency Across Devices 🟡 MEDIUM RISK

**Scenario**: Device A syncs, gets 100 entries. Device B syncs 5 seconds later, gets 102 entries. Device A doesn't know about +2.

**Current Behavior**:
```typescript
// ReplicationManager.ts - 5-minute auto-sync interval
private readonly DEFAULT_AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 min
```

**Problem Identified**:
- **No real-time invalidation**: Device A won't know about new data until next sync
- **Stale cache window**: Up to 5 minutes of staleness possible
- **No cross-device coordination**: Devices operate independently

**Impact**:
- User sees different data on different devices
- Confusing UX ("I just added this entry on my phone, where is it?")

**Recommendation**:
- ✅ **Add Supabase real-time subscriptions**: Instant cache invalidation
- ✅ **Add cross-tab communication**: BroadcastChannel for same-browser sync
- ✅ **Reduce sync interval**: Consider 1-2 minutes for active sessions

**Test Script**:
```javascript
// Tab 1: Create entry
await replicatedEntriesTable.create({ call_name: 'NewDog', ... });
await getReplicationManager().syncAll(); // Upload to server

// Tab 2: Check immediately
const entries = await replicatedEntriesTable.getAll();
console.log(entries.find(e => e.call_name === 'NewDog'));

// CHECK: Is NewDog visible? (Currently: Only after next sync in <5 min)
```

---

## Test Category 2: Long Offline Periods (24+ Hours)

### Edge Case 2.1: Expired TTL Cache Wiping 🟡 MEDIUM RISK

**Scenario**: User goes offline for 48 hours with TTL=24h. All cache expires and is deleted.

**Current Behavior**:
```typescript
// ReplicatedTable.ts:411-416 - Expiration check
private isExpired(row: ReplicatedRow<T>): boolean {
  if (!this.ttl) return false;
  return Date.now() - row.lastSyncedAt > this.ttl;
}

// ReplicatedTable.ts:132-136 - Delete on read if expired
if (this.isExpired(row)) {
  await db.delete(REPLICATION_STORES.REPLICATED_TABLES, key);
  return null;
}
```

**Problem Identified**:
- **Aggressive expiration**: Deletes data on access if TTL exceeded
- **No grace period**: No "stale but usable" mode for offline scenarios
- **Risk**: User loses all offline access to data after TTL expires

**Impact**:
- Offline mode becomes unusable after 24 hours
- User forced to go online to restore data

**Recommendation**:
- ✅ **Add offline mode exception**: Don't expire if offline
- ✅ **Add stale-while-revalidate**: Mark as stale but don't delete
- ✅ **Add manual refresh**: User can force refresh when back online

**Test Script**:
```javascript
// Simulate 48-hour offline period
const manager = getReplicationManager();
await manager.syncAll(); // Initial sync

// Fast-forward time (mock Date.now)
const originalNow = Date.now;
Date.now = () => originalNow() + (48 * 60 * 60 * 1000); // +48 hours

// Try to access data
const entries = await replicatedEntriesTable.getAll();
console.log(`Entries available: ${entries.length}`);

// CHECK: Are entries still accessible? (Currently: Depends on TTL config)
```

---

### Edge Case 2.2: Mutation Queue Overflow 🟡 MEDIUM RISK

**Scenario**: User makes 500 offline edits over 3 days. Browser quota limit hit.

**Current Behavior**:
- No mutation queue size limit
- No quota checks before queuing
- Mutations stored indefinitely until uploaded

**Problem Identified**:
- **Unbounded growth**: Mutation queue can grow without limit
- **No overflow handling**: No strategy when quota exhausted
- **Risk**: Browser throws QuotaExceededError, app crashes

**Impact**:
- App becomes unusable when quota exceeded
- Recent edits lost if queue write fails

**Recommendation**:
- ✅ **Add queue size limit**: Cap at 1000 mutations
- ✅ **Add quota monitoring**: Check before each mutation
- ✅ **Add auto-upload triggers**: Upload every 50 mutations even if offline
- ✅ **Add compression**: Store mutations as compressed JSON

**Test Script**:
```javascript
// Simulate large mutation queue
for (let i = 0; i < 1000; i++) {
  await replicatedEntriesTable.update(`entry-${i}`, {
    call_name: `Dog-${i}-Modified`,
  });
}

// Check quota
const estimate = await navigator.storage?.estimate();
console.log(`Quota used: ${(estimate.usage / estimate.quota * 100).toFixed(1)}%`);

// CHECK: Does app handle gracefully or crash?
```

---

### Edge Case 2.3: Incremental Sync After Long Offline 🔴 HIGH RISK

**Scenario**: User offline for 7 days. Server has 10,000 changes. Incremental sync fetches all 10K rows.

**Current Behavior**:
```typescript
// SyncEngine.ts:267-276 - Incremental sync fetches ALL changes since lastSync
const { data } = await supabase
  .from(tableName)
  .select('*')
  .eq('license_key', options.licenseKey)
  .gt('updated_at', new Date(lastSync).toISOString())
  .order('updated_at', { ascending: true });
```

**Problem Identified**:
- **No pagination**: Fetches unlimited rows
- **No row count limit**: Could fetch 100K+ rows
- **Risk**: Out-of-memory, slow sync, browser freeze

**Impact**:
- App hangs for minutes during massive sync
- Mobile browser may crash (memory pressure)

**Recommendation**:
- ✅ **Add row count check**: If >5000 changes, do full sync instead
- ✅ **Add pagination**: Fetch in batches of 1000 rows
- ✅ **Add progress UI**: Show "Syncing 3000/5000 rows..."

**Code Location**: [SyncEngine.ts:267-276](d:\AI-Projects\myK9Q-React-new\src\services\replication\SyncEngine.ts#L267-L276)

**Test Script**:
```javascript
// Setup: Create 10,000 test entries in Supabase
// (Use SQL script to insert directly)

// Simulate 7-day offline
const metadata = await syncEngine.getSyncMetadata('entries');
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

// Force old lastSync timestamp
await syncEngine.updateSyncMetadata('entries', {
  lastIncrementalSyncAt: sevenDaysAgo,
});

// Trigger incremental sync
const startTime = performance.now();
const result = await replicatedEntriesTable.sync(licenseKey);
const duration = performance.now() - startTime;

console.log(`Sync duration: ${(duration / 1000).toFixed(1)}s`);
console.log(`Memory used: ${(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(0)} MB`);

// CHECK: Did app remain responsive? Did sync complete?
```

---

### Edge Case 2.4: Server-Side Deletions Not Propagated 🔴 HIGH RISK

**Scenario**: Entry deleted on server while client offline. Client never learns about deletion.

**Current Behavior**:
- Incremental sync only fetches `updated_at > lastSync`
- Deletions don't trigger `updated_at` changes
- No deletion log or tombstone tracking

**Problem Identified**:
- **No deletion detection**: Deleted rows never appear in incremental sync
- **Zombie data**: Client cache keeps deleted data forever
- **Risk**: User sees deleted entries, can edit them (mutation fails on upload)

**Impact**:
- Severe data inconsistency
- User confused why edits to "deleted" entries fail

**Recommendation**:
- ✅ **Add periodic full sync**: Force full sync every 24h to detect deletions
- ✅ **Add server deletion log**: Track deleted IDs in separate table
- ✅ **Add tombstone pattern**: Mark rows as deleted instead of DROP

**Test Script**:
```javascript
// Tab 1: Create entry
const newEntry = await replicatedEntriesTable.create({ call_name: 'ToDelete' });
await manager.syncAll(); // Upload

// Server: Delete entry directly in Supabase
await supabase.from('entries').delete().eq('id', newEntry.id);

// Tab 1: Go offline for 1 hour
await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));

// Tab 1: Come back online, incremental sync
await manager.syncAll();

// Tab 1: Check if entry still visible
const entries = await replicatedEntriesTable.getAll();
console.log(entries.find(e => e.id === newEntry.id));

// CHECK: Is deleted entry still in cache? (Currently: YES!)
```

---

## Test Category 3: Large Datasets (1000+ Entries)

### Edge Case 3.1: IndexedDB Quota Exceeded 🟡 MEDIUM RISK

**Scenario**: User syncs 2000 entries with photos. Total size exceeds browser quota.

**Current Behavior**:
```typescript
// ReplicationManager.ts - Automatic quota management
if (stats.totalSizeMB > softLimit) {
  await this.evictLRU(target);
}
```

**Problem Identified**:
- **Reactive eviction**: Only checks AFTER sync completes
- **No pre-sync quota check**: Doesn't verify space available before sync
- **Risk**: Sync fails mid-operation with QuotaExceededError

**Impact**:
- Partial sync (first 1000 entries cached, next 1000 fail)
- Inconsistent cache state

**Recommendation**:
- ✅ **Add pre-sync quota check**: Estimate sync size, verify quota available
- ✅ **Add proactive eviction**: Evict before sync if needed
- ✅ **Add sync rollback**: Revert to previous state if quota error

**Test Script**:
```javascript
// Pre-fill cache to near quota limit
const stats = await manager.getCacheStats();
console.log(`Current cache: ${stats.totalSizeMB.toFixed(2)} MB`);

// Trigger large sync
const result = await manager.syncAll({ forceFullSync: true });

// Check for quota errors
const quotaErrors = result.filter(r => r.error?.includes('quota'));
console.log(`Quota errors: ${quotaErrors.length}`);

// CHECK: Did sync fail gracefully or corrupt cache?
```

---

### Edge Case 3.2: Query Performance Degradation 🟡 MEDIUM RISK

**Scenario**: User has 5000 entries cached. Query for entries by class_id takes >200ms.

**Current Behavior** (OPTIMIZED in Day 23-24):
```typescript
// ReplicatedTable.ts - Indexed query path
const index = tx.store.index(`tableName_data.${field}`);
const rows = await index.getAll(value);
```

**Problem Identified** (MITIGATED):
- ✅ **Compound indexes added**: O(log n) lookups for class_id, trial_id, show_id
- ⚠️ **No query plan analysis**: Can't detect if index used or full scan
- ⚠️ **No query timeout**: Long queries block UI thread

**Impact**:
- Potential UI freezing on large datasets (if index not used)

**Recommendation**:
- ✅ **Add query timeout**: Abort queries >500ms, show error
- ✅ **Add query logging**: Track slow queries in console
- ✅ **Add index usage verification**: Warn if full table scan detected

**Test Script**:
```javascript
// Create 5000 test entries
const entries = Array.from({ length: 5000 }, (_, i) => ({
  id: `test-${i}`,
  class_id: `class-${i % 50}`, // 50 classes, 100 entries each
  call_name: `Dog-${i}`,
}));
await replicatedEntriesTable.batchSet(entries);

// Query by class_id
const startTime = performance.now();
const classEntries = await replicatedEntriesTable.queryByField('class_id', 'class-10');
const duration = performance.now() - startTime;

console.log(`Query duration: ${duration.toFixed(2)}ms`);
console.log(`Results: ${classEntries.length} entries`);

// CHECK: Is query <50ms? (Target: <50ms with index)
```

---

### Edge Case 3.3: Memory Pressure During Batch Sync 🟡 MEDIUM RISK

**Scenario**: Full sync of 3000 entries loads entire dataset into memory simultaneously.

**Current Behavior** (OPTIMIZED in Day 23-24):
```typescript
// SyncEngine.ts:166-201 - Chunked batch set
if (data.length >= 500) {
  await table.batchSetChunked(data, batchSize); // Chunks of 100
}
```

**Problem Identified** (MOSTLY MITIGATED):
- ✅ **Chunking implemented**: Processes in 100-row batches
- ⚠️ **Initial data fetch**: Still loads full dataset from Supabase
- ⚠️ **No backpressure**: Doesn't slow down if memory low

**Impact**:
- Initial fetch of 3000 rows creates memory spike
- Mobile devices may trigger GC pauses

**Recommendation**:
- ✅ **Add streaming fetch**: Use Supabase pagination to fetch 500 rows at a time
- ✅ **Add memory monitoring**: Check heap size, pause if >100 MB
- ✅ **Add GC hints**: Manually trigger GC between chunks (if available)

**Code Location**: [SyncEngine.ts:166-201](d:\AI-Projects\myK9Q-React-new\src\services\replication\SyncEngine.ts#L166-L201)

---

### Edge Case 3.4: LRU Eviction of Actively Used Data 🟢 LOW RISK

**Scenario**: User viewing Class A entries. LRU eviction kicks in, evicts Class B entries user was just editing.

**Current Behavior**:
```typescript
// ReplicatedTable.ts:556-560 - LRU sorts by lastAccessedAt
const evictableRows = rows
  .filter(row => !row.isDirty)
  .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
```

**Problem Identified**:
- **Simple LRU**: Only considers access time, not usage frequency
- **No usage heuristics**: Doesn't protect "important" data
- **Risk**: Evicts recently edited data that user may need again soon

**Impact**:
- Minor UX degradation (data re-fetched on next access)
- No data loss (dirty rows protected)

**Recommendation**:
- ✅ **Add LFU component**: Track access frequency, not just recency
- ✅ **Add priority hints**: Mark certain tables as "pin in cache"
- ✅ **Add usage patterns**: Protect data edited in last 5 minutes

**Test Script**:
```javascript
// Access entries in sequence
for (let i = 0; i < 100; i++) {
  await replicatedEntriesTable.get(`entry-${i}`);
}

// Trigger eviction
await manager.evictLRU(1); // 1 MB target

// Check which entries evicted
const remaining = await replicatedEntriesTable.getAll();
console.log(`Remaining: ${remaining.length}/100`);

// CHECK: Were most recently accessed entries protected?
```

---

## Test Category 4: Race Conditions (Rapid Updates)

### Edge Case 4.1: Listener Notification Flood 🟡 MEDIUM RISK

**Scenario**: Batch update of 500 entries triggers 500 listener notifications.

**Current Behavior**:
```typescript
// ReplicatedTable.ts:392-399 - Notify on every change
protected async notifyListeners(): Promise<void> {
  const data = await this.getAll();
  this.listeners.forEach((callback) => {
    callback(data); // Calls listener with FULL dataset
  });
}
```

**Problem Identified**:
- **No debouncing**: Notifies immediately on every change
- **No batching**: 500 updates = 500 notifications
- **Expensive payload**: Sends entire dataset (not just changes)

**Impact**:
- React re-renders 500 times
- UI freezing during batch operations
- High CPU/battery usage

**Recommendation**:
- ✅ **Add debouncing**: Batch notifications (100ms delay)
- ✅ **Add delta updates**: Send only changed rows
- ✅ **Add notification throttling**: Max 1 notification per 100ms

**Code Location**: [ReplicatedTable.ts:392-399](d:\AI-Projects\myK9Q-React-new\src\services\replication\ReplicatedTable.ts#L392-L399)

**Test Script**:
```javascript
// Subscribe to changes
let notificationCount = 0;
const unsubscribe = replicatedEntriesTable.subscribe(() => {
  notificationCount++;
});

// Batch update
const entries = Array.from({ length: 500 }, (_, i) => ({
  id: `entry-${i}`,
  call_name: `Dog-${i}-Updated`,
}));

const startTime = performance.now();
await replicatedEntriesTable.batchSet(entries);
const duration = performance.now() - startTime;

console.log(`Batch update: ${duration.toFixed(0)}ms`);
console.log(`Notifications fired: ${notificationCount}`);

unsubscribe();

// CHECK: How many notifications? (Target: 1-2, Current: potentially 500)
```

---

### Edge Case 4.2: Auto-Sync Collision with Manual Sync 🟡 MEDIUM RISK

**Scenario**: User triggers manual sync while auto-sync is already running.

**Current Behavior**:
```typescript
// ReplicationManager.ts:160-217 - syncAll checks isSyncing flag
if (this.isSyncing) {
  logger.warn('[ReplicationManager] Sync already in progress, skipping');
  return [];
}
```

**Problem Identified**:
- ✅ **Sync lock exists**: Prevents concurrent syncAll()
- ⚠️ **No queuing**: Manual sync request silently dropped
- ⚠️ **No feedback**: User doesn't know sync was skipped

**Impact**:
- User pull-to-refresh does nothing if auto-sync running
- Confusing UX (pull gesture with no result)

**Recommendation**:
- ✅ **Add sync queue**: Queue manual sync if auto-sync running
- ✅ **Add user feedback**: Show "Sync already in progress" message
- ✅ **Add sync priority**: Manual sync cancels auto-sync

**Code Location**: [ReplicationManager.ts:160-217](d:\AI-Projects\myK9Q-React-new\src\services\replication\ReplicationManager.ts#L160-L217)

---

### Edge Case 4.3: Mutation Upload During Concurrent Sync 🟡 MEDIUM RISK

**Scenario**: Incremental sync downloads entry #123 while mutation upload is updating same entry.

**Current Behavior**:
- Mutation upload runs serially (SyncEngine.ts:378-435)
- Incremental sync runs independently (SyncEngine.ts:250-353)
- No coordination between upload and download

**Problem Identified**:
- **No operation ordering**: Upload/download can interleave
- **No transaction isolation**: Entry #123 could be half-updated
- **Risk**: Conflict resolution with partially applied mutation

**Impact**:
- Unpredictable conflict resolution results
- Potential for stale data overwriting fresh data

**Recommendation**:
- ✅ **Add operation serialization**: Upload mutations before download sync
- ✅ **Add mutation locking**: Lock rows during upload
- ✅ **Add sync phases**: Phase 1: Upload, Phase 2: Download

**Test Script**:
```javascript
// Queue offline mutation
await replicatedEntriesTable.update('entry-123', { call_name: 'Updated-Offline' });

// Trigger concurrent operations
const uploadPromise = manager.uploadPendingMutations();
const syncPromise = manager.syncAll();

// Wait for both
await Promise.all([uploadPromise, syncPromise]);

// Check final state
const entry = await replicatedEntriesTable.get('entry-123');
console.log(`Final call_name: ${entry.call_name}`);

// CHECK: Is final state correct? Or did operations interfere?
```

---

### Edge Case 4.4: Prefetch Triggering During Active Sync 🟢 LOW RISK

**Scenario**: User navigates to new page, triggers prefetch, while background sync is running.

**Current Behavior**:
```typescript
// PrefetchManager.ts:117-145 - Checks isPrefetching flag
if (this.isPrefetching || !this.replicationManager) {
  return; // Skip if already prefetching
}
```

**Problem Identified**:
- ✅ **Prefetch lock exists**: Prevents concurrent prefetches
- ⚠️ **No coordination with sync**: Prefetch and sync can run concurrently
- ⚠️ **Duplicate fetches**: Prefetch may re-fetch data sync just downloaded

**Impact**:
- Wasted bandwidth (minor)
- Potential for increased server load

**Recommendation**:
- ✅ **Add sync awareness**: Skip prefetch if sync in progress
- ✅ **Add cache freshness check**: Improved (already checks 1-minute freshness)
- ✅ **Add prefetch coordination**: Share sync state with prefetch manager

**Code Location**: [PrefetchManager.ts:209-229](d:\AI-Projects\myK9Q-React-new\src\services\replication\PrefetchManager.ts#L209-L229)

---

## Summary: Critical Issues Requiring Fixes

### 🔴 HIGH SEVERITY (Must Fix Before Production)

1. **Edge Case 1.1**: Timestamp precision in conflict resolution (data loss risk)
2. **Edge Case 1.2**: Mutation queue ordering (data corruption risk)
3. **Edge Case 1.3**: Pending mutation orphaning (offline work loss risk)
4. **Edge Case 2.3**: Unbounded incremental sync (memory/performance risk)
5. **Edge Case 2.4**: Server-side deletions not propagated (zombie data risk)

### 🟡 MEDIUM SEVERITY (Should Fix Soon)

6. **Edge Case 1.4**: IndexedDB transaction conflicts (lost update problem)
7. **Edge Case 1.5**: Cache inconsistency across devices (UX issue)
8. **Edge Case 2.1**: Expired TTL cache wiping (offline usability issue)
9. **Edge Case 2.2**: Mutation queue overflow (quota error risk)
10. **Edge Case 3.1**: IndexedDB quota exceeded (sync failure risk)
11. **Edge Case 3.2**: Query performance degradation (UI freeze risk)
12. **Edge Case 3.3**: Memory pressure during batch sync (mobile crash risk)
13. **Edge Case 4.1**: Listener notification flood (performance issue)
14. **Edge Case 4.2**: Auto-sync collision with manual sync (UX issue)
15. **Edge Case 4.3**: Mutation upload during concurrent sync (race condition)

### 🟢 LOW SEVERITY (Nice to Have)

16. **Edge Case 3.4**: LRU eviction of actively used data (minor UX)
17. **Edge Case 4.4**: Prefetch triggering during active sync (inefficiency)

---

## Next Steps: Day 25-26 Implementation Plan

### Phase 1: Critical Fixes (4-6 hours)

1. **Fix timestamp precision** (Edge Case 1.1)
   - Add microsecond comparison fallback
   - Add version vector tracking
   - Add conflict UI alerts

2. **Fix mutation ordering** (Edge Case 1.2)
   - Add mutation.dependsOn field
   - Add topological sort
   - Add transaction batching

3. **Fix deletion propagation** (Edge Case 2.4)
   - Add periodic full sync (every 24h)
   - Add server deletion log table
   - Add tombstone pattern

4. **Fix unbounded incremental sync** (Edge Case 2.3)
   - Add row count limit (5000)
   - Add pagination for large syncs
   - Add progress UI

5. **Fix mutation orphaning** (Edge Case 1.3)
   - Add localStorage backup
   - Add mutation export feature
   - Add aggressive retry on reconnect

### Phase 2: Manual Testing (2-3 hours)

Run all 17 test scripts documented above. Track results in spreadsheet:

| Edge Case | Test Result | Severity if Failed | Fix Required? |
|-----------|-------------|-------------------|---------------|
| 1.1 | PASS/FAIL | HIGH | YES/NO |
| ... | ... | ... | ... |

### Phase 3: Automated Test Suite (Optional, 4-6 hours)

Build test harness for automated edge case testing:
- Multi-tab test runner
- Network condition simulator
- Time travel mocking
- Quota limit enforcement

---

## File References

**Code Locations** (for fixes):
- [ReplicatedTable.ts](d:\AI-Projects\myK9Q-React-new\src\services\replication\ReplicatedTable.ts)
- [SyncEngine.ts](d:\AI-Projects\myK9Q-React-new\src\services\replication\SyncEngine.ts)
- [ReplicationManager.ts](d:\AI-Projects\myK9Q-React-new\src\services\replication\ReplicationManager.ts)
- [ConflictResolver.ts](d:\AI-Projects\myK9Q-React-new\src\services\replication\ConflictResolver.ts)
- [PrefetchManager.ts](d:\AI-Projects\myK9Q-React-new\src\services\replication\PrefetchManager.ts)

**Documentation**:
- [FULL_TABLE_REPLICATION_PLAN.md](d:\AI-Projects\myK9Q-React-new\FULL_TABLE_REPLICATION_PLAN.md) - Master plan
- [DATABASE_REFERENCE.md](d:\AI-Projects\myK9Q-React-new\DATABASE_REFERENCE.md) - Schema reference
