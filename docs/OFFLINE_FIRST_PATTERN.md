# Offline-First Pattern Checklist

**Purpose**: Ensure all entry modification actions persist correctly across page refreshes, offline scenarios, and database sync delays.

**Last Updated**: 2025-11-04

## TL;DR - The Pattern

Every user action that modifies entry data must follow this 3-step pattern:

```typescript
const handleAction = useCallback(
  async (entryId: number, ...params) => {
    // STEP 1: Update LocalStateManager immediately (creates pending change)
    try {
      await localStateManager.updateEntry(
        entryId,
        { /* field changes */ },
        'action-type' // 'score' | 'status' | 'checkin' | 'reset'
      );
    } catch (error) {
      console.error('Could not update LocalStateManager:', error);
    }

    // STEP 2: Sync with database in background (fails silently if offline)
    try {
      await databaseUpdateFunction(entryId, ...params);
      // Real-time subscription will clear pending change when DB confirms
    } catch (error) {
      console.error('Error syncing in background:', error);
      // Don't throw - offline-first means transparent failures
    }
  },
  []
);
```

## Why This Pattern?

### Problem
Without `localStateManager.updateEntry()`, changes only update component state (`setLocalEntries`), which:
- ❌ Is lost on page refresh
- ❌ Isn't merged with database queries
- ❌ Doesn't persist if sync fails

### Solution
With `localStateManager.updateEntry()`, changes:
- ✅ Update UI immediately
- ✅ Persist across page refreshes (saved to IndexedDB)
- ✅ Are merged with database queries in `getClassEntries()`
- ✅ Work offline (sync retries when back online)

## Checklist for New Actions

When implementing ANY user action that modifies entry data, verify:

- [ ] **Creates Pending Change**: Calls `localStateManager.updateEntry()` BEFORE database call
- [ ] **Silent Failure**: Database call wrapped in try-catch that logs but doesn't throw
- [ ] **No Manual Refresh**: Doesn't call `refresh(true)` - lets real-time subscriptions handle it
- [ ] **Console Logging**: Includes debug logs for tracking:
  - `🔄 Creating pending [action] for entry: {id}`
  - `✅ LocalStateManager updated with pending [action]`
  - `❌ Could not update LocalStateManager:` (catch block)
- [ ] **Type Safety**: Uses correct `PendingChange['type']`:
  - `'score'` - Score submission or reset
  - `'status'` - Status changes (checked-in, at-gate, in-ring, completed, etc.)
  - `'checkin'` - Check-in specific actions
  - `'reset'` - Score reset
- [ ] **Integration Test**: Has test verifying persistence across simulated page refresh

## Current Implementation Status

| Action | File | Line | Status | Notes |
|--------|------|------|--------|-------|
| Submit Score | `useOptimisticScoring.ts` | 116-139 | ✅ COMPLIANT | Original pattern |
| Reset Score | `useEntryListActions.ts` | 36-72 | ✅ COMPLIANT | Fixed 2025-11-04 |
| Status Change | `useEntryListActions.ts` | 18-46 | ✅ COMPLIANT | Fixed 2025-11-04 |
| Mark In-Ring (toggle) | `useEntryListActions.ts` | 92-119 | ✅ COMPLIANT | Fixed 2025-11-04 |
| Mark In-Ring (set) | `useEntryListActions.ts` | 124-149 | ✅ COMPLIANT | Fixed 2025-11-04 |
| Mark Completed | `useEntryListActions.ts` | 154-182 | ✅ COMPLIANT | Fixed 2025-11-04 |
| Batch Status Update | `useEntryListActions.ts` | 187-217 | ✅ COMPLIANT | Fixed 2025-11-04 |

## How It Works End-to-End

### Flow Diagram
```
User Action
    ↓
[1] localStateManager.updateEntry()
    ├→ Create pending change
    ├→ Save to IndexedDB
    ├→ Notify subscribers (triggers UI refresh)
    └→ Return merged entry
    ↓
[2] Database Update (async, background)
    ├→ Success → Real-time subscription fires
    │   └→ localStateManager.clearPendingChange()
    └→ Failure → Pending change remains
        └→ Retry when back online
```

### Example: Reset Score

**User clicks "Reset Score" for dog 118:**

1. **Immediate (< 50ms)**:
   ```typescript
   await localStateManager.updateEntry(118, {
     isScored: false,
     status: 'no-status',
     resultText: ''
   }, 'reset');
   ```
   - Pending change created
   - Saved to IndexedDB
   - Subscribers notified
   - UI updates immediately

2. **Background (async)**:
   ```typescript
   await resetEntryScore(118);
   ```
   - Sends update to Supabase
   - May succeed or fail silently

3. **Real-time Update**:
   - Database update confirmed via subscription
   - Subscription handler calls `clearPendingChange(118)`
   - Pending change removed from IndexedDB

4. **Page Refresh** (anytime during 1-3):
   - `getClassEntries()` fetches from database
   - `localStateManager.applyServerUpdate(entries)` loads data
   - `localStateManager.getEntries(classId)` merges pending changes
   - **Reset persists** even if database hasn't synced yet

## Common Pitfalls

### ❌ DON'T: Update only component state
```typescript
// This is NOT offline-first!
setLocalEntries(prev => prev.map(entry =>
  entry.id === entryId ? { ...entry, status: 'checked-in' } : entry
));
await updateEntryCheckinStatus(entryId, 'checked-in');
```
**Problem**: Lost on page refresh

### ✅ DO: Update LocalStateManager first
```typescript
// This IS offline-first!
await localStateManager.updateEntry(entryId, { status: 'checked-in' }, 'status');
await updateEntryCheckinStatus(entryId, 'checked-in');
```
**Benefit**: Persists across refreshes

### ❌ DON'T: Use useOptimisticUpdate alone
```typescript
// useOptimisticUpdate provides retry logic but NOT persistence!
await update({
  optimisticData: { entryId, status },
  serverUpdate: () => updateEntryCheckinStatus(entryId, status)
});
```
**Problem**: No pending change created

### ✅ DO: Combine LocalStateManager + useOptimisticUpdate
```typescript
// Best of both: persistence + retry logic
await localStateManager.updateEntry(entryId, { status }, 'status');
await update({
  optimisticData: { entryId, status },
  serverUpdate: () => updateEntryCheckinStatus(entryId, status)
});
```

### ❌ DON'T: Call refresh() manually
```typescript
await resetEntryScore(entryId);
await refresh(true); // DON'T DO THIS!
```
**Problem**: Race conditions, breaks real-time subscriptions

### ✅ DO: Let subscriptions handle refresh
```typescript
await resetEntryScore(entryId);
// Real-time subscription will trigger refresh automatically
```

## Testing Your Implementation

### Manual Test
1. Perform action (e.g., reset score for dog 118)
2. **Immediately** refresh page (F5 or Cmd+R)
3. Verify change persists (dog still shows as reset)
4. Check console for:
   - `🔄 Creating pending [action] for entry: 118`
   - `✅ LocalStateManager updated with pending [action]`

### Integration Test Template
```typescript
it('should persist [action] across simulated page refresh', async () => {
  // Setup
  await localStateManager.applyServerUpdate([mockEntry]);

  // Perform action
  await localStateManager.updateEntry(entryId, { /* changes */ }, 'action-type');

  // Verify pending change exists
  expect(localStateManager.hasPendingChange(entryId)).toBe(true);

  // Simulate page refresh
  const entries = localStateManager.getEntries(classId);
  const entry = entries.find(e => e.id === entryId);

  // Verify change persisted
  expect(entry).toMatchObject({ /* expected changes */ });
});
```

## Debugging

### Check Pending Changes
```typescript
// In browser console:
import { localStateManager } from './services/localStateManager';

// Get all pending changes
localStateManager.getPendingChanges();

// Check if specific entry has pending change
localStateManager.hasPendingChange(118);

// Get stats
localStateManager.getStats();
```

### Common Issues

**Issue**: "Entry X not found in local state"
- **Cause**: Trying to update entry before data is loaded
- **Solution**: Ensure `getClassEntries()` is called first (loads data into localStateManager)

**Issue**: Change persists forever (never clears)
- **Cause**: Real-time subscription not firing or not clearing pending change
- **Solution**: Check subscription handler calls `clearPendingChange(entryId)`

**Issue**: Stale data showing after refresh
- **Cause**: `getClassEntries()` not calling `localStateManager.getEntries()`
- **Solution**: Verify `getClassEntries()` returns merged entries (lines 191-197 in entryService.ts)

## Related Files

- [src/services/localStateManager.ts](../src/services/localStateManager.ts) - Core implementation
- [src/hooks/useOptimisticScoring.ts](../src/hooks/useOptimisticScoring.ts) - Reference implementation
- [src/pages/EntryList/hooks/useEntryListActions.ts](../src/pages/EntryList/hooks/useEntryListActions.ts) - All action implementations
- [src/services/entryService.ts](../src/services/entryService.ts) - getClassEntries merge logic (lines 184-197)
- [OFFLINE_FIRST_AUDIT_PHASE2.md](../OFFLINE_FIRST_AUDIT_PHASE2.md) - Detailed audit results

## References

- Original reset score bug fix: 2025-11-04
- Phase 2 audit completed: 2025-11-04
- All 7 actions fixed: 2025-11-04
