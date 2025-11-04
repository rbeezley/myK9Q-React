# Offline-First Pattern Audit - Phase 2
**Date**: 2025-11-04
**Reason**: Reset score bug revealed pattern inconsistency - not all entry modifications create pending changes

## Summary
The reset score bug (dog reverting to completed status on refresh) revealed a **systematic issue**: Most entry modification actions do NOT create pending changes in `localStateManager`, meaning they don't persist across page refreshes if offline or if refresh happens before database sync completes.

## Actions Audited

| Action | Hook Location | Creates Pending Change? | Persists Across Refresh? | Status |
|--------|--------------|------------------------|-------------------------|--------|
| **Submit Score** | `useOptimisticScoring.ts:120` | ✅ YES | ✅ YES | ✅ WORKING |
| **Reset Score** | `useEntryListActions.ts:36-72` | ✅ YES (after fix) | ✅ YES (after fix) | ✅ FIXED |
| **Status Change** | `useEntryListActions.ts:18-31` | ❌ NO | ❌ NO | 🔴 BROKEN |
| **Mark In-Ring** | `useEntryListActions.ts:77-88` | ❌ NO | ❌ NO | 🔴 BROKEN |
| **Mark In-Ring (manual)** | `useEntryListActions.ts:93-104` | ❌ NO | ❌ NO | 🔴 BROKEN |
| **Mark Completed** | `useEntryListActions.ts:109-120` | ❌ NO | ❌ NO | 🔴 BROKEN |
| **Batch Status Update** | `useEntryListActions.ts:125-138` | ❌ NO | ❌ NO | 🔴 BROKEN |

## Root Cause Analysis

### Why Submit Score Works
In [useOptimisticScoring.ts:116-139](src/hooks/useOptimisticScoring.ts#L116-L139):
```typescript
// 🚀 LOCAL-FIRST: Update LocalStateManager immediately
await localStateManager.updateEntry(
  entryId,
  {
    isScored: true,
    status: 'completed',
    resultText: scoreData.resultText,
    // ... other fields
  },
  'score'
);
```

### Why Status Changes Don't Work
In [useEntryListActions.ts:18-31](src/pages/EntryList/hooks/useEntryListActions.ts#L18-L31):
```typescript
const handleStatusChange = useCallback(
  async (entryId: number, newStatus: ...) => {
    await update({  // ❌ This is useOptimisticUpdate, NOT localStateManager!
      optimisticData: { entryId, status: newStatus },
      serverUpdate: async () => {
        await updateEntryCheckinStatus(entryId, newStatus);
        return { entryId, status: newStatus };
      },
      onSuccess: () => {}, // Real-time subscriptions will update the data
      onError: (error) => console.error('Status update failed:', error)
    });
  },
  [update]
);
```

**Problem**: `useOptimisticUpdate` does NOT create pending changes in `localStateManager`. It only provides retry logic and error handling. The pending change creation is the **caller's responsibility**, but the callers (EntryList.tsx) only update component state via `setLocalEntries`, not persistent state.

### Component State vs Persistent State

**Component State** (`setLocalEntries` in EntryList.tsx):
- ✅ Updates UI immediately
- ❌ Lost on page refresh
- ❌ Not merged with database queries

**Persistent State** (`localStateManager.updateEntry()`):
- ✅ Updates UI immediately (via subscription → refresh)
- ✅ Persists across page refreshes (saved to IndexedDB)
- ✅ Merged with database queries in `getClassEntries()`

## Detailed Issues

### 1. Status Changes (Check-in, At Gate, etc.)
**User Impact**: If user changes status (e.g., marks dog as "checked-in"), then refreshes before database sync completes, the status reverts to old value.

**Test Case**:
1. Mark dog 118 as "checked-in"
2. Immediately refresh page
3. Result: Dog shows as "no-status" (not checked-in)

**Fix Needed**: Add `localStateManager.updateEntry()` call to `handleStatusChange`

### 2. Mark In-Ring
**User Impact**: If user marks dog as "in-ring", then refreshes, the status reverts.

**Test Case**:
1. Mark dog 118 as "in-ring"
2. Immediately refresh page
3. Result: Dog shows as not in-ring

**Fix Needed**: Add `localStateManager.updateEntry()` call to `handleToggleInRing` and `handleMarkInRing`

### 3. Mark Completed
**User Impact**: If user marks dog as "completed" (without full score), then refreshes, the status reverts.

**Test Case**:
1. Mark dog 118 as "completed"
2. Immediately refresh page
3. Result: Dog shows as not completed

**Fix Needed**: Add `localStateManager.updateEntry()` call to `handleMarkCompleted`

### 4. Batch Status Updates
**User Impact**: If user updates multiple dogs' statuses, then refreshes, all updates revert.

**Test Case**:
1. Select 5 dogs and mark all as "checked-in"
2. Immediately refresh page
3. Result: All 5 dogs show as "no-status"

**Fix Needed**: Add `localStateManager.updateEntry()` calls in batch loop

## Why This Wasn't Caught

### 1. Audit Scope
The Phase 1 audit (previous session) focused on:
- ✅ Database column mapping (computed_* vs actual columns)
- ✅ Real-time subscription handling
- ✅ Removing manual refresh calls

But it **did NOT verify** that every action creates pending changes.

### 2. Test Coverage
- ✅ `localStateManager` tested in isolation
- ✅ `entryService` tested in isolation
- ❌ **Integration between hooks and localStateManager NOT tested**
- ❌ **Persistence across page refreshes NOT tested**

### 3. Pattern Inconsistency
- Submit score uses `localStateManager.updateEntry()` directly ✅
- Reset score was direct database call (now fixed) ✅
- Status changes use `useOptimisticUpdate` (doesn't create pending changes) ❌
- Other actions are direct database calls ❌

## Recommended Fixes

### Pattern to Follow
All entry modifications should follow this pattern (from reset score fix):

```typescript
const handleAction = useCallback(
  async (entryId: number, ...params) => {
    // 🚀 LOCAL-FIRST: Update LocalStateManager immediately
    try {
      await localStateManager.updateEntry(
        entryId,
        { /* changes */ },
        'action-type'
      );
      console.log('✅ LocalStateManager updated with pending change');
    } catch (error) {
      console.error('❌ Could not update LocalStateManager:', error);
    }

    // Sync with server in background (silently fails if offline)
    try {
      await databaseUpdateFunction(entryId, ...params);
      // Real-time subscription will clear the pending change when database confirms
    } catch (error) {
      console.error('Error syncing in background:', error);
      // Don't throw - offline-first means this is transparent
    }
  },
  []
);
```

### Fixes Required
1. ✅ **Reset Score** - FIXED (already done)
2. 🔴 **Status Changes** - Update `handleStatusChange` in useEntryListActions.ts
3. 🔴 **Mark In-Ring** - Update `handleToggleInRing` and `handleMarkInRing`
4. 🔴 **Mark Completed** - Update `handleMarkCompleted`
5. 🔴 **Batch Updates** - Update `handleBatchStatusUpdate`

### Integration Tests Needed
Add tests in `src/pages/EntryList/__tests__/` that verify:

1. **Persistence Test**: Action → Refresh → Verify change persists
2. **Offline Test**: Go offline → Action → Verify optimistic update shows → Go online → Verify sync completes
3. **Merge Test**: Pending change + new database data → Verify pending change takes precedence

## Next Steps
1. ✅ Create this audit document
2. ⏳ Fix all broken actions (5 functions to update)
3. ⏳ Add integration tests for persistence
4. ⏳ Create offline-first pattern checklist for future actions
5. ⏳ Update documentation with the canonical pattern

## Files to Modify
- [src/pages/EntryList/hooks/useEntryListActions.ts](src/pages/EntryList/hooks/useEntryListActions.ts) - Fix all 5 broken actions
- [src/pages/EntryList/__tests__/](src/pages/EntryList/__tests__/) - Add integration tests
- [docs/OFFLINE_FIRST_PATTERN.md](docs/OFFLINE_FIRST_PATTERN.md) - New doc with checklist (to be created)
