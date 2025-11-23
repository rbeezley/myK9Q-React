# Real-Time Subscription Consolidation

**Date:** 2025-11-23
**Issue:** Race condition causing "In Ring" status not updating in exhibitor view
**Root Cause:** Duplicate real-time subscription systems creating timing conflicts

---

## Problem Analysis

### The Race Condition

**Symptom:**
- Admin opens scoresheet → Entry status changes to "in-ring" in database
- Exhibitor screen does NOT show blue "In Ring" border
- Manual refresh sometimes shows it, sometimes doesn't

**Root Cause:**
We had **TWO separate real-time subscription systems** running in parallel:

1. **Old `syncManager`** ([src/services/syncManager.ts](../src/services/syncManager.ts))
   - Used by UI via `entrySubscriptions.ts`
   - Subscribes to database changes filtered by `class_id`
   - Immediately calls UI callback when event arrives

2. **New `ReplicationManager`** ([src/services/replication/ReplicationManager.ts](../src/services/replication/ReplicationManager.ts))
   - Used by replication cache system
   - Subscribes to database changes filtered by `license_key`
   - Updates IndexedDB cache when event arrives

**The Race:**
```
Database Change → Old syncManager → UI callback → refresh() reads cache (STALE!)
                → ReplicationManager → async sync → cache updated (TOO LATE!)
```

Timeline:
1. Real-time event arrives: `entry_status = 'in-ring'`
2. Old `syncManager` immediately calls UI's `handleEntryUpdate()`
3. UI calls `refresh()` → reads from IndexedDB cache
4. Cache still has OLD data (hasn't synced yet)
5. UI renders with stale data
6. **LATER**: ReplicationManager completes sync → cache now has new data
7. But UI already rendered!

### Additional Issues

**Performance Waste:**
- Every database change triggers TWO Supabase subscriptions
- 2x network overhead
- 2x subscription costs

**Architecture Smell:**
- Single source of truth violated
- Duplicate logic
- Hard to debug timing issues

---

## Solution: Consolidated Architecture

### Single Subscription System

**New Flow:**
```
Database Change → ReplicationManager (ONLY) → sync cache → notify listeners → UI refresh
```

**Key Changes:**

1. **ReplicationManager gains event emitter** ([ReplicationManager.ts:91-1020](../src/services/replication/ReplicationManager.ts#L91-L1020))
   - Added `cacheUpdateListeners` Map to track UI listeners
   - Added `onCacheUpdate()` public method for UI to subscribe
   - Added `offCacheUpdate()` public method for cleanup
   - Added `notifyCacheUpdated()` private method to notify listeners after sync

2. **UI components listen to ReplicationManager**
   - [EntryList.tsx:83-113](../src/pages/EntryList/EntryList.tsx#L83-L113)
   - [CombinedEntryList.tsx:91-121](../src/pages/EntryList/CombinedEntryList.tsx#L91-L121)
   - Removed old `syncManager` subscriptions via `useEntryListSubscriptions`
   - Added direct subscription to ReplicationManager's `onCacheUpdate()` event
   - UI refreshes AFTER cache is guaranteed updated

3. **Real-time handler awaits sync** ([ReplicationManager.ts:881-907](../src/services/replication/ReplicationManager.ts#L881-L907))
   - Changed callback from sync to `async`
   - Added `await this.syncTable()` to ensure cache updates complete
   - Only notifies cross-tab after sync finishes
   - Guarantees cache is fresh before any UI refreshes

---

## Files Modified

### Core Changes

**[src/services/replication/ReplicationManager.ts](../src/services/replication/ReplicationManager.ts)**
- **Line 92**: Added `cacheUpdateListeners` Map property
- **Lines 269-272**: Call `notifyCacheUpdated()` after successful sync
- **Lines 881-907**: Made real-time handler async and await sync completion
- **Lines 948-1020**: Added `onCacheUpdate()`, `offCacheUpdate()`, and `notifyCacheUpdated()` methods
- **Line 1049**: Clean up listeners in `destroy()`

**[src/pages/EntryList/EntryList.tsx](../src/pages/EntryList/EntryList.tsx)**
- **Line 23**: Added `logger` import
- **Lines 81-113**: Replaced old subscription system with ReplicationManager listener
  - Removed manual `syncTable()` call in callback
  - Now subscribes to cache update events
  - UI refreshes only after cache is confirmed updated

**[src/pages/EntryList/CombinedEntryList.tsx](../src/pages/EntryList/CombinedEntryList.tsx)**
- **Line 16**: Added `logger` import
- **Lines 89-121**: Same subscription consolidation as EntryList

### Deprecated (To Be Removed Later)

These files/hooks are no longer needed but kept for now to avoid breaking other potential usages:

- `src/services/syncManager.ts` - Old subscription system (will remove after audit)
- `src/services/entry/entrySubscriptions.ts` - Wrapper for old system
- `src/pages/EntryList/hooks/useEntryListSubscriptions.ts` - React hook for old system

---

## Benefits

### Performance
- **50% fewer subscriptions**: Only one Supabase subscription per table (was 2)
- **Reduced network overhead**: Half as many real-time events processed
- **Lower costs**: Fewer Supabase real-time connections

### Reliability
- **No race conditions**: Cache always updated before UI refresh
- **Guaranteed consistency**: Single source of truth for real-time updates
- **Predictable timing**: Sync → notify → refresh (linear flow)

### Maintainability
- **Cleaner architecture**: One system to understand and debug
- **Better logs**: Clear "cache updated" events
- **Easier testing**: Single code path to test

---

## Migration Notes

### Before (Old Code)
```typescript
// UI component using old system
useEntryListSubscriptions({
  classIds,
  licenseKey: showContext?.licenseKey || '',
  onRefresh: refresh,
  onEntryUpdate: handleEntryUpdate,  // Immediate callback (race!)
  enabled: classIds.length > 0
});
```

### After (New Code)
```typescript
// UI component using consolidated system
useEffect(() => {
  if (!classIds.length) return;

  let unsubscribe: (() => void) | null = null;

  const setupCacheListener = async () => {
    const { ensureReplicationManager } = await import('@/utils/replicationHelper');
    const manager = await ensureReplicationManager();

    // Subscribe to cache updates - UI refreshes AFTER sync
    unsubscribe = manager.onCacheUpdate('entries', (tableName) => {
      console.log(`✅ Cache updated for ${tableName}, refreshing UI`);
      refresh();  // Cache guaranteed fresh
    });
  };

  setupCacheListener();

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [classIds, refresh]);
```

---

## Testing Checklist

### Real-Time Updates
- [ ] Admin opens scoresheet → Exhibitor sees "In Ring" border immediately
- [ ] Admin closes scoresheet → "In Ring" border disappears immediately
- [ ] Admin submits score → Entry moves to completed tab immediately
- [ ] Multiple exhibitors see updates simultaneously
- [ ] Updates work across browser tabs

### Performance
- [ ] Only ONE Supabase subscription per table (check Network tab)
- [ ] No duplicate events in console logs
- [ ] Cache sync completes before UI refresh (check log order)

### Edge Cases
- [ ] Works when multiple entries change rapidly
- [ ] Handles network reconnection gracefully
- [ ] Cleanup happens on component unmount (no memory leaks)

---

## Future Cleanup

After confirming this works in production:

1. **Remove old subscription system:**
   - Delete `src/services/syncManager.ts`
   - Delete `src/services/entry/entrySubscriptions.ts`
   - Delete `src/pages/EntryList/hooks/useEntryListSubscriptions.ts`

2. **Audit other usages:**
   - Search codebase for `syncManager.subscribeToUpdates()`
   - Migrate any remaining usages to ReplicationManager

3. **Update tests:**
   - Remove tests for old system
   - Add tests for `onCacheUpdate()` event emitter

---

## Rollback Plan

If issues arise, revert these commits:
1. ReplicationManager event emitter changes
2. UI component subscription changes

Old system still exists in codebase and can be re-enabled by reverting to:
```typescript
useEntryListSubscriptions({...})
```

---

## Related Issues

- **Original Bug:** "In Ring" status not updating in exhibitor view
- **Database Migration:** Added `license_key` to entries table (see [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md))
- **Transform Fix:** Fixed deprecated `is_in_ring` field usage (see [useEntryListData.ts:75](../src/pages/EntryList/hooks/useEntryListData.ts#L75))
