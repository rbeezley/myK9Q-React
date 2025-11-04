# Offline-First Architecture Audit

## Audit Date: 2025-11-04

## Objective
Ensure scoring, status changes, and reset score all follow the same offline-first pattern for both online and offline scenarios.

## Offline-First Principles

### ✅ Correct Pattern:
1. **Optimistic Update**: Update UI immediately (< 50ms)
2. **Background Sync**: Database write happens in background
3. **Silent Failure**: If offline, no error shown to user
4. **Real-time Confirmation**: Subscription clears pending change when database confirms
5. **Auto Refresh**: LocalStateManager listener triggers ONE refresh automatically
6. **No Manual Refresh**: No `refresh(true)` calls in user action handlers

### ❌ Anti-Patterns to Avoid:
1. Manual `refresh(true)` calls after user actions
2. Error rollback (reverting optimistic updates on failure)
3. Showing error alerts to users when offline
4. Waiting for database response before updating UI
5. Multiple refresh calls in the same flow

---

## Scenario 1: Scoring

### Files Analyzed:
- `src/hooks/useOptimisticScoring.ts`
- `src/pages/scoresheets/AKC/AKCScentWorkScoresheet-Enhanced.tsx`
- `src/services/entryService.ts` (submitScore function)

### Flow Analysis:

#### Online Flow:
1. **Line 120-139**: Updates `localStateManager` with pending change ✅
2. **Line 168**: Calls `submitScore()` to sync with database ✅
3. **Line 171-175**: Does NOT clear pending change immediately ✅
4. **Line 177-187**: Safety timeout fallback (5 seconds) ✅
5. Real-time subscription fires (useEntryListSubscriptions.ts:44-51) ✅
6. Clears pending change in localStateManager ✅
7. LocalStateManager notifies listeners (localStateManager.ts:220) ✅
8. Listener triggers refresh (useEntryListData.ts:194-200) ✅

#### Offline Flow:
1. **Line 120-139**: Updates `localStateManager` with pending change ✅
2. **Line 148-164**: Detects offline, adds to queue, throws error ✅
3. **No error shown to user** ✅
4. Pending change remains until back online ✅
5. When back online, queue retries sync ✅

### Verdict: ✅ COMPLIANT
- No manual refresh calls
- Silent failure when offline
- No error rollback
- Real-time subscription handles confirmation

---

## Scenario 2: Status Changes

### Files Analyzed:
- `src/pages/EntryList/EntryList.tsx` (handleStatusChange function)
- `src/pages/EntryList/hooks/useEntryListActions.ts`
- `src/services/entryService.ts` (updateEntryCheckinStatus function)

### Flow Analysis (AFTER FIX):

#### Online Flow (EntryList.tsx:247-318):
1. **Line 290-301**: Optimistic update to `localEntries` ✅
2. **Line 305**: Calls `handleStatusChangeHook()` to sync ✅
3. **Line 307-312**: Comment explains NO manual refresh needed ✅
4. Real-time subscription fires when database updates ✅
5. LocalStateManager listener triggers automatic refresh ✅

#### Offline Flow:
1. **Line 290-301**: Optimistic update works ✅
2. **Line 305**: Sync fails silently ✅
3. **Line 314-316**: Silent error logging, no user alert ✅
4. Pending change remains until back online ✅

#### Special Cases (in-ring and completed):
- **Line 253-269**: in-ring status - same pattern ✅
- **Line 272-288**: completed status - same pattern ✅

### Verdict: ✅ COMPLIANT (after fix)
- No manual refresh calls
- Silent failure when offline
- No error rollback
- Real-time subscription handles confirmation

**Fixes Applied:**
1. ✅ Removed manual `refresh(true)` call after successful sync
2. ✅ Removed error rollback on failure
3. ✅ Removed manual `refresh(true)` on error
4. ✅ Changed to silent failure pattern
5. ✅ Fixed in-ring status handler
6. ✅ Fixed completed status handler

---

## Scenario 3: Reset Score

### Files Analyzed:
- `src/pages/EntryList/EntryList.tsx` (confirmResetScore function)
- `src/pages/EntryList/hooks/useEntryListActions.ts`
- `src/services/entryService.ts` (resetEntryScore function)

### Flow Analysis:

#### Online Flow (EntryList.tsx:515-552):
1. **Line 519-534**: Optimistic update to `localEntries` ✅
2. **Line 534**: Switches to pending tab ✅
3. **Line 538**: Calls `handleResetScoreHook()` to sync ✅
4. **Line 540-545**: ✅ **Comment explains NO manual refresh needed** - FIXED!
5. Real-time subscription clears pending change ✅
6. LocalStateManager listener triggers refresh ✅

#### Offline Flow:
1. **Line 519-534**: Optimistic update works ✅
2. **Line 538**: Sync fails silently ✅
3. **Line 546-550**: Silent error logging, no user alert ✅
4. Pending change remains until back online ✅

### Verdict: ✅ COMPLIANT (after recent fix)
- No manual refresh calls
- Silent failure when offline
- No error rollback
- Real-time subscription handles confirmation

---

## Summary Matrix (AFTER FIXES)

| Scenario | Online Compliant | Offline Compliant | Manual Refresh? | Error Rollback? | Silent Failure? |
|----------|------------------|-------------------|-----------------|-----------------|-----------------|
| Scoring | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Status Changes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Reset Score | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |

**All three scenarios now follow the same offline-first pattern!**

---

## Applied Fixes

### ✅ Fix 1: Removed Manual Refresh from Status Changes
**File:** `src/pages/EntryList/EntryList.tsx`
**Lines:** 307-312, 264-268, 283-287
**Action:** Removed all `await refresh(true)` calls from status change handlers
**Result:** Real-time subscriptions now handle refresh automatically

### ✅ Fix 2: Removed Error Rollback from Status Changes
**File:** `src/pages/EntryList/EntryList.tsx`
**Lines:** 314-316
**Action:** Changed error handling to silent failure (matching reset score pattern)
**Result:** Optimistic updates no longer revert on network failure

### ✅ Fix 3: Ensured Consistent Pattern Across All Three
**Action:** All three now follow this exact pattern:
```typescript
// 1. Optimistic update FIRST
setLocalEntries(prev => /* update */)

// 2. Background sync with silent failure
try {
  await backgroundSync()
  // NO refresh() call - let architecture handle it
} catch (error) {
  console.error('Background sync failed:', error)
  // NO rollback, NO alert - transparent to user
}
```

**Implementation Files:**
- Scoring: `src/hooks/useOptimisticScoring.ts` (lines 120-193)
- Status Changes: `src/pages/EntryList/EntryList.tsx` (lines 290-317)
- Reset Score: `src/pages/EntryList/EntryList.tsx` (lines 519-550)

---

## Testing Checklist

After fixes, verify:

### Online Tests:
- [ ] Score a dog → moves to completed tab immediately
- [ ] Change status → badge updates immediately
- [ ] Reset score → moves to pending tab immediately
- [ ] Refresh page → all changes persist

### Offline Tests:
- [ ] Turn off network
- [ ] Score a dog → UI updates immediately, no errors
- [ ] Change status → badge changes immediately, no errors
- [ ] Reset score → moves to pending tab immediately, no errors
- [ ] Turn on network → all changes sync automatically
- [ ] Verify no duplicate updates or conflicts

### Edge Cases:
- [ ] Score dog while offline, immediately change status → both work
- [ ] Reset score while offline, immediately re-score → both work
- [ ] Multiple status changes while offline → all queued correctly
- [ ] Connection drops mid-sync → silent failure, retry when back
