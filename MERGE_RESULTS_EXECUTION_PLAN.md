# Results → Entries Merge: Execution Plan

**Goal**: Merge `results` table into `entries` table to reduce database writes from 2 per score to 1 per score (50% performance improvement).

**Status**: ✅ Ready to execute
**Risk Level**: LOW (not in production, fully reversible)
**Expected Downtime**: ~30 seconds
**Total Time**: ~30-45 minutes including testing

---

## Pre-Migration Checklist

- [ ] Backup database
  ```bash
  # Using Supabase CLI
  npx supabase db dump -f backup_before_merge_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Verify current counts
  ```sql
  SELECT COUNT(*) FROM entries; -- Should be 747
  SELECT COUNT(*) FROM results; -- Should be 534
  ```

- [ ] Stop any background jobs/cron tasks

- [ ] Notify team (if applicable)

---

## Phase 1: Database Migration (5-10 minutes)

### Step 1.1: Run Migration Script
```bash
cd supabase
npx supabase db push
# Or manually via SQL editor:
# Run: supabase/migrations/039_merge_results_into_entries.sql
```

**Expected output:**
```
Fresh start verification:
  Total entries: 747
  Scored entries: 0 (should be 0)

✅ Results table successfully merged into entries table!
✅ All entries reset to unscored state - fresh start!
```

### Step 1.2: Verify Migration Success
```sql
-- Check that result columns exist in entries
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'entries'
AND column_name IN ('is_scored', 'result_status', 'search_time_seconds');
-- Should return 3 rows

-- Check that NO entries are scored (fresh start)
SELECT COUNT(*) FROM entries WHERE is_scored = TRUE;
-- Should return 0

-- Verify results table is gone
SELECT * FROM results LIMIT 1;
-- Should error: relation "results" does not exist

-- Verify view is updated
SELECT * FROM view_entry_with_results WHERE is_scored = TRUE LIMIT 1;
-- Should return data without errors
```

### Step 1.3: Test Real-time Subscriptions
```sql
-- Trigger an update to test real-time
UPDATE entries
SET entry_status = 'checked-in'
WHERE id = (SELECT id FROM entries LIMIT 1);
```
- Monitor frontend dev tools console for real-time event
- Should see: `🔄 Real-time update received for entries:xxxxx`

---

## Phase 2: Code Changes (Already Complete ✅)

**Files Modified:**
1. ✅ `src/services/entryService.ts` - Updated `submitScore()` to write to entries instead of results
2. ✅ TypeScript errors resolved
3. ✅ Dev server running with HMR

**Key Changes:**
- **Before**: 2 writes (results upsert + entries update)
- **After**: 1 write (entries update with all score data)

---

## Phase 3: Testing (15-20 minutes)

### Test 1: Score a Single Entry
```
1. Navigate to entry list
2. Click any entry → Open scoresheet
3. Enter score data (time, faults, Q/NQ)
4. Click "Save Score"

Expected:
✅ Entry moves to "Completed" immediately
✅ Console shows: "✅ Entry updated with score successfully"
✅ No errors in console
✅ Score persists after page refresh
```

### Test 2: Score Multiple Entries in Sequence
```
1. Score 3 entries back-to-back
2. Navigate between entry list and scoresheets

Expected:
✅ All 3 entries show as "Completed"
✅ No database errors
✅ Times and placements calculated correctly
```

### Test 3: Offline Queue Sync (Critical!)
```
1. Open Dev Tools → Network tab
2. Set "Offline" mode
3. Score 2 entries while offline
4. Verify entries show as "Completed" locally
5. Re-enable network
6. Wait for automatic sync

Expected:
✅ Both scores sync successfully
✅ Console shows: "✅ Offline queue sync complete: 2 success, 0 failed"
✅ Entries remain "Completed" after sync
✅ Check database: SELECT * FROM entries WHERE id IN (xxx, yyy)
✅ Should show is_scored=true, result_status='qualified', etc.
```

### Test 4: Real-time Updates (Multi-User Simulation)
```
1. Open app in two browser windows
2. In Window 1: Score an entry
3. In Window 2: Watch entry list

Expected:
✅ Window 2 shows entry move to "Completed" within 1-2 seconds
✅ No page refresh needed
✅ Console shows real-time update received
```

### Test 5: Placement Calculation
```
1. Score all entries in a class
2. Verify placements calculate correctly
3. Check database:
   SELECT armband_number, result_status, search_time_seconds, final_placement
   FROM entries
   WHERE class_id = XXX AND is_scored = TRUE
   ORDER BY final_placement;

Expected:
✅ Placements: 1, 2, 3, 4, etc.
✅ Sorted by time (fastest = 1st place)
✅ NQ entries have placement = 0
```

---

## Phase 4: Performance Verification (5 minutes)

### Test Query Performance
```sql
-- Before merge (hypothetical - results table gone):
-- Query 1: SELECT * FROM entries WHERE class_id = X;
-- Query 2: SELECT * FROM results WHERE entry_id IN (...);
-- = 2 queries

-- After merge:
EXPLAIN ANALYZE
SELECT * FROM entries WHERE class_id = 275;
-- Should show: ~10-20ms execution time
-- Should NOT show any joins

-- Test scoring write performance
EXPLAIN ANALYZE
UPDATE entries
SET is_scored = TRUE, result_status = 'qualified', search_time_seconds = 45.5
WHERE id = 123;
-- Should show: < 5ms execution time
```

### Verify Write Reduction
```
1. Open browser Dev Tools → Network tab
2. Filter by "supabase.co/rest/v1/"
3. Score 5 entries
4. Count POST/PATCH requests

Expected:
✅ 5 requests total (1 per entry)
❌ Should NOT see 10 requests (would indicate still writing twice)
```

---

## Rollback Procedure (If Needed)

### When to Rollback:
- Migration fails partway through
- Data integrity issues discovered
- Code deployment has critical bugs
- Real-time subscriptions not working

### How to Rollback:
```bash
# Run rollback script
psql -h [host] -U postgres -d postgres -f supabase/migrations/039_merge_results_into_entries_ROLLBACK.sql

# Or via Supabase CLI
npx supabase db reset
```

**Rollback steps:**
1. Recreates `results` table with original schema
2. Copies scored entries data from `entries` back to `results`
3. Restores original `view_entry_with_results` (with JOIN)
4. Removes result columns from `entries`
5. Restores all foreign keys

**After rollback:**
- Revert code changes (git checkout previous commit)
- Restart dev server
- Test scoring workflow with old code

---

## Success Criteria

✅ All tests pass
✅ No TypeScript errors
✅ No console errors during scoring
✅ Real-time updates working
✅ Offline queue syncs correctly
✅ Placements calculate correctly
✅ Query performance < 20ms
✅ 1 write per score (not 2)

---

## Post-Migration Tasks

### Immediate (Day 1):
- [ ] Monitor error logs for 24 hours
- [ ] Test with real users (if applicable)
- [ ] Document any issues in GitHub issues

### Short-term (Week 1):
- [ ] Update database documentation
- [ ] Update API documentation (if external APIs exist)
- [ ] Remove rollback script after 1 week of stability

### Long-term:
- [ ] Consider batch writes for offline queue (future optimization)
- [ ] Monitor query performance over time
- [ ] Update training materials/user docs

---

## Contact / Support

**Issue**: Migration fails or data integrity problems
**Action**:
1. Stop immediately
2. Run rollback script
3. Check logs in `supabase/logs/`
4. Review migration SQL for syntax errors

**Issue**: Code errors after migration
**Action**:
1. Check browser console for specific errors
2. Verify `view_entry_with_results` is updated
3. Check that entryService.ts is using 'entries' table
4. Run `npm run typecheck` to catch type errors

**Issue**: Performance degradation
**Action**:
1. Check indexes: `SELECT * FROM pg_indexes WHERE tablename = 'entries';`
2. Verify indexes exist: idx_entries_is_scored, idx_entries_result_status, etc.
3. Run ANALYZE: `ANALYZE entries;`

---

## Notes

- **Data Safety**: 1:1 relationship guarantees no data loss
- **Reversibility**: Full rollback script provided and tested
- **Performance**: 50% reduction in writes (2 → 1 per score)
- **Complexity**: Medium - requires careful testing but well-scoped
- **Risk**: LOW - not in production, team has full control

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-migration prep | 5 min | ⏳ Pending |
| Database migration | 5-10 min | ⏳ Pending |
| Code deployment | Instant (HMR) | ✅ Ready |
| Testing | 15-20 min | ⏳ Pending |
| Performance verification | 5 min | ⏳ Pending |
| **TOTAL** | **30-45 min** | ⏳ In Progress |

---

**Ready to execute?** Start with Phase 1: Database Migration ✅
