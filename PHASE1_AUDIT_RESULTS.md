# Phase 1: Audit Results - Current State Management

## Overview
This document maps all data flows for entry management in the myK9Q application, identifying how data moves from database through cache to UI.

---

## 1. Entry Data Flow Mapping

### Primary Flow (EntryList Loading)
```
User navigates to EntryList
    ↓
useEntryListData hook
    ↓
useStaleWhileRevalidate
    ↓
Check L1 cache (in-memory Map)
    ↓
Check L2 cache (IndexedDB)
    ↓
Fetch from database (getClassEntries)
    ↓
Save to both caches
    ↓
Render UI
```

### Scoring Flow (Current - The Problem)
```
User scores dog in Scoresheet
    ↓
useOptimisticScoring.submitScoreOptimistically()
    ↓
├─ Optimistic: markAsScored() in entryStore (in-memory only)
└─ Background: submitScore() to database
    ↓
onSuccess callback
    ↓
markInRing(entryId, false)  ← Async, no wait
    ↓
navigate(-1)  ← IMMEDIATE, doesn't wait for DB
    ↓
EntryList loads
    ↓
useStaleWhileRevalidate fetches
    ↓
getClassEntries() queries database  ← DB not updated yet!
    ↓
Cache saves stale data (dog still pending)
    ↓
Real-time update arrives 500ms later
    ↓
Local state updates (dog moves to completed)
    ↓
BUT: Cache still has stale data
    ↓
Page refresh → Loads stale cache → Dog back to pending ❌
```

---

## 2. Database Fetch Points

### Direct Supabase Queries
All found in `src/services/entryService.ts`:

1. **`getClassEntries()` (Line 55-254)**
   - Fetches from `view_entry_with_results`
   - Main entry point for all entry data
   - Returns: Array of Entry objects
   - Used by: useEntryListData hook

2. **`submitScore()` (Line 279-491)**
   - Upserts to `results` table (Line 397)
   - Updates `entries.entry_status` (Line 428-430)
   - **Critical**: Both writes are async, no guarantee of completion

3. **`markInRing()` (Line 682-738)**
   - Updates `entries.entry_status` to 'in-ring' or 'no-status'
   - **Bug fixed**: Now checks if scored before resetting to 'no-status'

4. **`updateEntryCheckinStatus()` (Line 929-977)**
   - Updates `entries.entry_status` for check-in changes

5. **`resetEntryScore()` (Line 979-1023)**
   - Deletes from `results` table
   - Updates `entries.entry_status` back to 'no-status'

### Cache Layer Queries
In `src/hooks/useStaleWhileRevalidate.ts`:

1. **IndexedDB Load** (Line 88-127)
   - Loads from IndexedDB on mount
   - Key: `entries-class-${classId}`
   - TTL: 60 seconds (default)

2. **Network Fetch** (Line 129-215)
   - Calls fetcher function (getClassEntries)
   - Saves to both L1 (memory) and L2 (IndexedDB)
   - Happens on mount if cache stale/empty

3. **Window Focus Refresh** (Line 224-235)
   - Force refresh on window focus
   - **Always bypasses cache** (refresh(true))

---

## 3. Offline Queue Structure

### Storage Location
- **Store**: `src/stores/offlineQueueStore.ts`
- **Persistence**: IndexedDB via `src/utils/indexedDB.ts`
- **Table**: `mutations`

### QueuedScore Interface
```typescript
{
  id: string;              // UUID
  entryId: number;         // Entry being scored
  armband: number;
  classId: number;
  className: string;
  scoreData: {
    resultText: string;    // Q, NQ, ABS, etc.
    searchTime?: string;
    faultCount?: number;
    // ... full score details
  };
  timestamp: string;
  retryCount: number;
  maxRetries: number;       // Default: 3
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}
```

### Key Methods
1. **`addToQueue()`** (Line 86-123)
   - Adds score to queue
   - Persists to IndexedDB
   - Triggers immediate sync if online

2. **`startSync()`** (Line 151-160)
   - Begins sync process
   - Calls external sync handler

3. **`markAsCompleted()`** (Line 222-231)
   - Removes from queue after successful sync
   - Deletes from IndexedDB

### Current Limitation
**The queue only stores the mutation, not the resulting state change**
- Queue knows "score was submitted"
- Queue does NOT update local entry state
- UI doesn't reflect queued changes until sync completes
- **This breaks offline-first experience**

---

## 4. State Management Layers

### Layer 1: Zustand Stores (In-Memory State)
- **`entryStore`** (`src/stores/entryStore.ts`)
  - Purpose: Global entry state
  - **Current Usage**: Minimal - just markAsScored()
  - **Issue**: Not persisted, lost on refresh

- **`offlineQueueStore`** (`src/stores/offlineQueueStore.ts`)
  - Purpose: Mutation queue for offline sync
  - **Current Usage**: Stores pending operations
  - **Issue**: Doesn't update entry state

- **`scoringStore`** (`src/stores/scoringStore.ts`)
  - Purpose: Active scoring session state
  - Scope: Scoresheet page only

### Layer 2: Component Local State
- **EntryList Components**
  - `localEntries` state
  - Updated by: cache data + real-time subscriptions
  - **Issue**: Lost on unmount/refresh

### Layer 3: Cache Layer (Persistent)
- **In-Memory Cache** (`useStaleWhileRevalidate`)
  - Map<string, CacheEntry>
  - Fast access (<1ms)
  - Lost on page refresh

- **IndexedDB Cache**
  - Table: `cache`
  - Persists across refresh
  - TTL: 60 seconds
  - **Issue**: Saves raw database queries, not merged state

### Layer 4: Database (Remote State)
- **Supabase PostgreSQL**
  - Tables: `entries`, `results`, `classes`
  - Source of truth for synced data
  - Real-time via WebSocket subscriptions

---

## 5. Real-time Subscription Flow

### Subscription Setup
In `src/pages/EntryList/hooks/useEntryListSubscriptions.ts`:

1. **Entry Updates** (Line 38-59)
   ```
   Subscribe to entries table
   Filter: classId, licenseKey
   Event: entry_status changes
   Handler: onEntryUpdate callback → updates localEntries
   ```

2. **Results Updates** (Line 63-117)
   ```
   Subscribe to results table
   Event: scoring changes
   Handler: Debounced refresh (300ms delay)
   Note: Checks if entry update already handled (<500ms)
   ```

### Timing Issue
```
Scoresheet: submitScore() starts
    ↓ (50ms)
Results table write completes
    ↓ (50ms)
Entries table write completes
    ↓ (100ms)
Real-time LISTEN/NOTIFY fires
    ↓ (200ms)
WebSocket delivers to client
    ↓ (50ms)
onEntryUpdate() fires
    ↓
Total: ~450ms from submitScore() to UI update

BUT: Navigation happens at ~100ms
     Cache query happens at ~150ms
     Cache saves stale data at ~200ms
     Real-time update at ~450ms (too late!)
```

---

## 6. Critical Race Conditions Identified

### Race #1: Navigation vs Database Write
```
T+0ms:   submitScore() called
T+50ms:  Database write starts (async)
T+100ms: onSuccess fires → navigate(-1) ← PROBLEM
T+150ms: EntryList mounts → fetches entries
T+200ms: Database write completes (too late!)
```

### Race #2: Cache Save vs Real-time Update
```
T+0ms:   Navigate to EntryList
T+10ms:  useStaleWhileRevalidate fetches
T+100ms: Database query returns (pre-score state)
T+150ms: Cache saves stale data to IndexedDB
T+500ms: Real-time update arrives (correct state)
T+501ms: localEntries updated
         BUT cache already has wrong data!
```

### Race #3: Page Refresh vs Pending Queue
```
T+0ms:   Score offline → Added to queue
T+50ms:  Queue persisted to IndexedDB
T+100ms: Navigate back to EntryList
T+150ms: Page refresh (user presses F5)
T+200ms: Cache loads from IndexedDB
T+201ms: Cache has old entry data (dog pending)
         Queue has score data (dog completed)
         BUT: These are never merged! ❌
```

---

## 7. Cache Behavior Analysis

### Current Cache Strategy
- **Pattern**: Stale-While-Revalidate
- **TTL**: 60 seconds
- **L1 (Memory)**: Map, fast, not persistent
- **L2 (IndexedDB)**: Persistent, survives refresh
- **Revalidation**: Background fetch on mount/focus

### Cache Update Triggers
1. Initial load (cache miss)
2. Stale data (>60 sec old)
3. Window focus
4. Manual refresh(true) call
5. Real-time update triggers onRefresh()

### The Core Problem
```typescript
// In useStaleWhileRevalidate - Line 162-189
const fetchData = async () => {
  try {
    const newData = await fetcher();  // ← getClassEntries()

    // Save to L1 cache
    cache.set(key, { data: newData, timestamp: Date.now() });

    // Save to L2 cache (IndexedDB)
    if (persist) {
      await idbCache.set(key, {
        data: newData,
        timestamp: Date.now()
      });
    }

    setData(newData);
  }
}
```

**Issue**: `fetcher()` queries database directly.
**Missing**: No merge with pending offline changes.
**Result**: Cache saves incomplete picture of reality.

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER SCORES DOG                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │  useOptimisticScoring       │
         │  submitScoreOptimistically  │
         └─────┬─────────────────┬─────┘
               │                 │
               │                 │
        [Optimistic]      [Background Sync]
               │                 │
               ▼                 ▼
     ┌─────────────────┐  ┌──────────────────┐
     │  entryStore     │  │   submitScore()  │
     │  markAsScored() │  │   to Supabase    │
     └─────────────────┘  └────────┬─────────┘
          (memory only)            │
                                   │ (50-200ms)
                                   ▼
                         ┌──────────────────────┐
                         │   Database Updated   │
                         │   entry_status =     │
                         │   'completed'        │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
         ┌─────────────────────┐       ┌──────────────────────┐
         │  Real-time NOTIFY   │       │  navigate(-1)        │
         │  (500ms delay)      │       │  (100ms - immediate) │
         └──────────┬──────────┘       └──────────┬───────────┘
                    │                             │
                    │                             ▼
                    │              ┌──────────────────────────┐
                    │              │   EntryList mounts       │
                    │              │   useStaleWhileRevalidate│
                    │              └──────────┬───────────────┘
                    │                         │
                    │                         ▼
                    │              ┌──────────────────────────┐
                    │              │   Check IndexedDB cache  │
                    │              └──────────┬───────────────┘
                    │                         │
                    │              ┌──────────┴────────┐
                    │              │                   │
                    │         [Cache Hit]        [Cache Miss]
                    │              │                   │
                    │              ▼                   ▼
                    │    ┌─────────────────┐   ┌────────────────┐
                    │    │ Load stale data │   │ Fetch from DB  │
                    │    │ (dog pending)   │   │ getClassEntries│
                    │    └────────┬────────┘   └────────┬───────┘
                    │             │                     │
                    │             │                     │ (150ms)
                    │             │                     ▼
                    │             │          ┌──────────────────┐
                    │             │          │ Query returns    │
                    │             │          │ (pre-score data) │
                    │             │          └────────┬─────────┘
                    │             │                   │
                    │             │                   ▼
                    │             │          ┌──────────────────────┐
                    │             │          │ Save to cache        │
                    │             │          │ (WRONG STATE!)       │
                    │             │          └────────┬─────────────┘
                    │             │                   │
                    │             └───────────┬───────┘
                    │                         │
                    │                         ▼
                    │              ┌──────────────────────────┐
                    │              │   Display in UI          │
                    │              │   (dog shows pending)    │
                    │              └──────────────────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  Real-time update fires  │
         │  onEntryUpdate()         │
         └──────────┬───────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  Update localEntries     │
         │  (dog moves to completed)│
         └──────────────────────────┘
                    │
                    ▼
              ✓ Dog in Completed tab

         [User refreshes page]
                    │
                    ▼
         ┌──────────────────────────┐
         │  Load from IndexedDB     │
         │  cache (stale data)      │
         └──────────┬───────────────┘
                    │
                    ▼
              ✗ Dog back in Pending tab
```

---

## 9. Offline Queue Integration Points

### Where Queue is Used
1. **`useOptimisticScoring.ts`** (Line 77-174)
   - Adds scores to queue when offline
   - Does NOT update local state
   - Only queues the mutation

2. **`App.tsx`** (presumably - sync worker)
   - Processes queue when online
   - Calls submitScore() for each item
   - Marks as completed after sync

### What's Missing
```typescript
// Current: Queue stores mutation
addToQueue({
  entryId: 192,
  scoreData: { resultText: 'Q', ... }
})

// Missing: Queue updates local state
updateLocalEntry(192, {
  isScored: true,
  status: 'completed',
  resultText: 'Q'
})
```

**Impact**: Offline scoring doesn't update UI until sync completes.

---

## 10. Key Findings

### ✅ What Works Well
1. Optimistic scoring hook (good architecture)
2. Offline queue with IndexedDB persistence
3. Real-time subscriptions (when they arrive in time)
4. Cache performance (fast loads)

### ❌ What's Broken
1. **Cache captures pre-mutation state**
   - Timing: Navigation faster than database write
   - Result: Stale data persisted to IndexedDB

2. **No merge of queue with fetched data**
   - Offline queue and entry data are separate
   - getClassEntries() ignores pending queue items
   - Offline scores don't show in UI

3. **Multiple sources of truth**
   - Database (authoritative)
   - Cache (stale snapshot)
   - Local state (real-time updates)
   - Queue (pending mutations)
   - These never reconcile properly

4. **Real-time updates lost on refresh**
   - Real-time updates local state
   - Page refresh reloads cache
   - Cache doesn't have real-time updates

### 🎯 Root Cause
**The cache layer fetches from database without considering local/pending state.**

This violates local-first principles where local state should be the source of truth.

---

## 11. Proposed Architecture Changes

### What Needs to Change
1. **Entry Fetching**
   ```typescript
   // Current
   getClassEntries() → Database only

   // Needed
   getClassEntries() → Database + Merge with Queue
   ```

2. **Cache Behavior**
   ```typescript
   // Current
   Cache saves: Raw database result

   // Needed
   Cache saves: Merged state (DB + pending changes)
   ```

3. **Offline Queue**
   ```typescript
   // Current
   Queue stores: Mutation intent

   // Needed
   Queue stores: Mutation intent + Applies to local state
   ```

4. **Real-time Handler**
   ```typescript
   // Current
   Real-time → Update local state

   // Needed
   Real-time → Update local state + Invalidate cache
   ```

### New Data Flow
```
Local State = Database + Pending Queue
     ↓
Cache saves merged state
     ↓
UI always shows correct state
     ↓
Background sync pushes to database
     ↓
Real-time broadcasts to other devices
```

---

## 12. Files Requiring Modification

### High Priority
1. **`src/services/entryService.ts`**
   - Modify `getClassEntries()` to merge with queue
   - Add helper: `mergeEntriesWithPendingScores()`

2. **`src/stores/offlineQueueStore.ts`**
   - Add: `applyToLocalState()` method
   - Add: `getPendingScores(classId)` getter

3. **`src/pages/EntryList/hooks/useEntryListData.ts`**
   - fetchSingleClass() merges queue data
   - fetchCombinedClasses() merges queue data

4. **`src/hooks/useOptimisticScoring.ts`**
   - Update local state on offline score
   - Ensure queue application happens

### Medium Priority
5. **`src/pages/EntryList/EntryList.tsx`**
   - Remove forced refresh workaround
   - Simplify merge logic

6. **`src/pages/EntryList/CombinedEntryList.tsx`**
   - Remove forced refresh workaround
   - Simplify merge logic

7. **`src/pages/EntryList/hooks/useEntryListSubscriptions.ts`**
   - Invalidate cache on real-time updates
   - Prevent overwrite of pending changes

### Low Priority
8. **`src/hooks/useStaleWhileRevalidate.ts`**
   - Consider cache invalidation hooks
   - Optional: Add pre-fetch transformation

---

## Next Steps

1. ✅ **Complete this audit** (DONE)
2. ⏭️ **Create local state manager prototype**
3. ⏭️ **Implement merge logic**
4. ⏭️ **Test offline scoring flow**
5. ⏭️ **Refactor cache layer**

---

## Appendix: Performance Metrics

### Current Query Counts
- **Initial Load**: 1 query (getClassEntries)
- **Per Score**: 2-3 queries (submitScore + checkCompletion)
- **Real-time**: 0 queries (WebSocket push)
- **Cache Hit**: 0 queries (IndexedDB read)

### Target Query Counts (with local-first)
- **Initial Load**: 1 query (same)
- **Per Score**: 0 queries local, 1 query background sync
- **Offline Score**: 0 queries (fully local)
- **Sync Batch**: 1 query per score when online

### Performance Goals
- Score to UI update: <50ms (currently ~450ms with real-time)
- Offline scoring: Identical to online
- Page refresh: Load in <100ms (IndexedDB)
- No data loss: 100% reliability
