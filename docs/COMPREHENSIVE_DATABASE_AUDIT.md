# Comprehensive Database Schema Audit - All Core Tables

**Date:** 2025-01-30
**Scope:** shows, trials, classes, entries, results tables
**Purpose:** Identify deprecated/unused fields across entire schema

---

## Executive Summary

After auditing all 5 core tables, here's what I found:

### ✅ Safe to Remove (33 deprecated fields)
- **Trials table:** 9 counter fields (denormalized aggregates)
- **Classes table:** 9 counter fields (denormalized aggregates)
- **Shows table:** 1 version field
- **Access integration:** 14 legacy ID fields across multiple tables

### ⚠️ Keep for Now
- Counter fields in **classes** table: Used by TV Run Order display
- `app_version` in **shows** table: May be used for compatibility checks

---

## Table 1: SHOWS Table

### Fields (26 total)

#### ✅ ACTIVELY USED (Keep All)
All core show information fields are actively used:
- Identity: `id`, `license_key` (multi-tenant isolation)
- Show info: `show_name`, `club_name`, `start_date`, `end_date`
- Organization: `organization`, `show_type`
- Location: `site_name`, `site_address`, `site_city`, `site_state`, `site_zip`
- Contacts: `secretary_name`, `secretary_email`, `secretary_phone`
- Contacts: `chairman_name`, `chairman_email`, `chairman_phone`
- Web: `event_url`, `website`, `logo_url`
- Metadata: `notes`, `created_at`, `updated_at`

#### ⚠️ REVIEW (Probably Safe to Remove)
- **`app_version`** (text, default '2.0.7')
  - **Usage:** Only in type definitions (`src/lib/supabase.ts`)
  - **Purpose:** Legacy version tracking from original Access database
  - **Current value:** Hardcoded '2.0.7' (outdated)
  - **Recommendation:** Remove if version tracking not needed

### Shows Table: No Critical Issues ✅

---

## Table 2: TRIALS Table

### Fields (19 total)

#### ✅ ACTIVELY USED (Keep These)
- Identity: `id`, `show_id` (FK to shows)
- Trial info: `trial_name`, `trial_date`, `trial_number`, `trial_type`
- Timing: `planned_start_time`, `actual_start_time`, `actual_end_time`
- Metadata: `created_at`, `updated_at`

#### ❌ DEPRECATED - Counter Fields (Safe to Remove - 9 fields)
These are **denormalized aggregates** that should be calculated on-demand:

1. **`total_class_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(*) FROM classes WHERE trial_id = ?`

2. **`completed_class_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(*) FROM classes WHERE trial_id = ? AND is_completed = true`

3. **`pending_class_count`** (integer, default 0)
   - **Usage:** Only in type definitions (never read)
   - **Should use:** `COUNT(*) FROM classes WHERE trial_id = ? AND is_completed = false`

4. **`total_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(*) FROM entries JOIN classes ON class_id WHERE trial_id = ?`

5. **`completed_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** Query with `results.is_scored = true`

6. **`pending_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** Query with `results.is_scored = false`

**Why deprecated:**
- Denormalized data that gets out of sync
- No database triggers to maintain them
- ClassList.tsx calculates counts on-demand anyway
- Adds complexity without benefit

#### ⚠️ LEGACY (Review Before Removing)
- **`access_trial_id`** (bigint)
  - Legacy Access database integration
  - Not found in active codebase
  - Recommendation: Verify not needed for data imports

#### ⚠️ REVIEW
- **`app_version`** (text, default '2.0.7')
  - Same as shows table
  - Only in type definitions

---

## Table 3: CLASSES Table

### Fields (31 total)

#### ✅ ACTIVELY USED (Keep These)
- Identity: `id`, `trial_id` (FK)
- Class definition: `element`, `level`, `section`
- Configuration: `judge_name`, `class_order`
- Time limits: `time_limit_seconds`, `time_limit_area2_seconds`, `time_limit_area3_seconds`, `area_count`
- Features: `self_checkin_enabled`, `realtime_results_enabled`
- Status: `class_status` (none, setup, briefing, in_progress, completed, etc.)
- Completion: `is_completed` (boolean)
- Fees: `pre_entry_fee`, `day_of_show_fee`
- Metadata: `created_at`, `updated_at`, `class_status_comment`

#### ⚠️ ACTIVELY USED BUT DENORMALIZED (Keep for Now)
These counter fields ARE used in TV Run Order display:

1. **`total_entry_count`** (integer, default 0)
   - **Usage:** `useTVData.ts` line 71 ✅ ACTIVE
   - **Purpose:** Display total entries in TV run order
   - **Status:** KEEP (actively queried)

2. **`completed_entry_count`** (integer, default 0)
   - **Usage:** `useTVData.ts` line 72 ✅ ACTIVE
   - **Purpose:** Display progress in TV run order
   - **Status:** KEEP (actively queried)

#### ❌ DEPRECATED - Unused Counter Fields (7 fields - Safe to Remove)

3. **`pending_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Reason:** Calculated as `total - completed`

4. **`absent_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(results WHERE result_status = 'absent')`

5. **`qualified_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(results WHERE result_status = 'qualified')`

6. **`nq_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(results WHERE result_status = 'nq')`

7. **`excused_entry_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(results WHERE result_status = 'excused')`

8. **`in_progress_count`** (integer, default 0)
   - **Usage:** Only in type definitions
   - **Should use:** `COUNT(entries WHERE entry_status = 'in-ring')`

#### ⚠️ LEGACY (Review Before Removing - 3 fields)
- **`access_class_id`** (bigint)
- **`access_trial_id`** (bigint)
- **`access_show_id`** (bigint)
  - Legacy Access database integration
  - Not found in active codebase

---

## Table 4: ENTRIES Table

### ✅ CLEANED UP (Already Audited)

**Previous audit removed 4 deprecated boolean result fields:**
- ❌ `is_qualified` → Removed in Migration 015 ✅
- ❌ `is_absent` → Removed in Migration 015 ✅
- ❌ `is_excused` → Removed in Migration 015 ✅
- ❌ `is_withdrawn` → Removed in Migration 015 ✅

**Current status:** Clean ✅

#### ⚠️ LEGACY (Review Before Removing - 5 fields)
- `access_entry_id`, `access_class_id`, `access_trial_id`, `access_show_id`, `access_exhibitor_id`
  - Legacy Access database integration
  - Not found in active codebase

---

## Table 5: RESULTS Table

### Fields (43 total)

#### ✅ ACTIVELY USED (Keep All)
All results table fields appear to be actively used:
- Status: `is_scored`, `is_in_ring`, `result_status`
- Timing: `ring_entry_time`, `ring_exit_time`, `scoring_started_at`, `scoring_completed_at`
- Time fields: `search_time_seconds`, `area1_time_seconds`, `area2_time_seconds`, `area3_time_seconds`, `area4_time_seconds`
- Scoring: `total_score`, `points_earned`, `points_possible`, `bonus_points`, `penalty_points`
- Faults: `total_faults`, `area1_faults`, `area2_faults`, `area3_faults`
- Finds: `total_correct_finds`, `total_incorrect_finds`, `no_finish_count`
- Finds by area: `area1_correct`, `area1_incorrect`, `area2_correct`, `area2_incorrect`, `area3_correct`, `area3_incorrect`
- Placement: `final_placement`
- Reasons: `disqualification_reason`
- Time limits: `time_over_limit`, `time_limit_exceeded_seconds`
- Judge: `judge_notes`, `judge_signature`, `judge_signature_timestamp`
- Video: `has_video_review`, `video_review_notes`

**No deprecated fields found in results table.** ✅

---

## Summary: Fields to Remove

### High Priority - Safe to Remove Now

#### Trials Table (9 fields)
```sql
ALTER TABLE trials DROP COLUMN IF EXISTS total_class_count;
ALTER TABLE trials DROP COLUMN IF EXISTS completed_class_count;
ALTER TABLE trials DROP COLUMN IF EXISTS pending_class_count;
ALTER TABLE trials DROP COLUMN IF EXISTS total_entry_count;
ALTER TABLE trials DROP COLUMN IF EXISTS completed_entry_count;
ALTER TABLE trials DROP COLUMN IF EXISTS pending_entry_count;
```

#### Classes Table (7 fields)
```sql
-- NOTE: Keep total_entry_count and completed_entry_count (used by TV display)
ALTER TABLE classes DROP COLUMN IF EXISTS pending_entry_count;
ALTER TABLE classes DROP COLUMN IF EXISTS absent_entry_count;
ALTER TABLE classes DROP COLUMN IF EXISTS qualified_entry_count;
ALTER TABLE classes DROP COLUMN IF EXISTS nq_entry_count;
ALTER TABLE classes DROP COLUMN IF EXISTS excused_entry_count;
ALTER TABLE classes DROP COLUMN IF EXISTS in_progress_count;
```

### ✅ KEEP - Access Database Integration (14 fields total)
- `entries`: access_entry_id, access_class_id, access_trial_id, access_show_id, access_exhibitor_id (5)
- `classes`: access_class_id, access_trial_id, access_show_id (3)
- `trials`: access_trial_id (1)

**Decision:** Keep for legacy data imports and backward compatibility

#### App Version Fields (2 fields)
- `shows.app_version`
- `trials.app_version`

**Action:** Confirm version tracking not needed for compatibility

---

## Counter Fields: Why Denormalization is Problematic

### The Problem
Counter fields like `total_entry_count`, `qualified_entry_count`, etc. are **denormalized aggregates**:
- They store calculated values that should come from queries
- They can get out of sync with actual data
- They require complex triggers or application logic to maintain
- They add complexity without providing real performance benefits

### Example Issues
1. If you manually UPDATE a result in the database, counters don't update
2. If a trigger fails, counters become incorrect
3. ClassList.tsx calculates counts on-demand anyway (ignores these fields)
4. CombinedEntryList.tsx calculates counts on-demand (ignores these fields)

### The Solution
Calculate counts on-demand:
```sql
-- Instead of storing total_entry_count
SELECT COUNT(*) FROM entries WHERE class_id = ?;

-- Instead of storing qualified_entry_count
SELECT COUNT(*) FROM results r
JOIN entries e ON r.entry_id = e.id
WHERE e.class_id = ? AND r.result_status = 'qualified';
```

### Exception: TV Run Order
`classes.total_entry_count` and `classes.completed_entry_count` ARE actively used by TV display.

**Options:**
1. **Keep them** with proper database triggers to maintain accuracy
2. **Remove them** and update TV display to calculate on-demand
3. **Create a view** that calculates these values dynamically

**Recommendation:** Create a view for TV display, remove denormalized fields.

---

## Recommended Migration Plan

### Phase 1: Remove Unused Counter Fields (Low Risk)
- Migration 016: Remove trials counter fields (6 fields)
- Migration 017: Remove classes counter fields (7 fields, keep total/completed)

### Phase 2: Remove App Version Fields (Low Risk)
- Migration 018: Remove app_version fields (optional)

### Phase 3: Refactor TV Display (Future)
- Create materialized view for TV run order stats
- Remove remaining denormalized counters from classes table

---

## Files Referenced in This Audit

### Active Usage Found
- `src/pages/TVRunOrder/hooks/useTVData.ts` - Uses `total_entry_count`, `completed_entry_count`
- `src/pages/ClassList/ClassList.tsx` - Calculates counts on-demand (ignores denormalized fields)
- `src/pages/EntryList/CombinedEntryList.tsx` - Calculates counts on-demand

### Type Definitions Only
- `src/lib/supabase.ts` - TypeScript types (not actual queries)
- `docs/DATABASE_ERD.md` - Documentation
- `docs/TYPE_MAPPING.md` - Type mapping documentation

---

## Impact Assessment

### Performance
- ✅ Removing unused fields: Slight improvement (less data to store/index)
- ✅ Counter fields: No impact (not currently queried)
- ⚠️ TV display: Must update to query counts if we remove those fields

### Data Integrity
- ✅ Counter fields often out of sync anyway
- ✅ Calculating on-demand ensures accuracy

### Code Changes Required
- ✅ Trials/classes unused counters: No code changes needed (already ignored)
- ⚠️ TV display: Update `useTVData.ts` if we remove total/completed counters

---

**Next Steps:**
1. Review and approve removal of unused counter fields
2. Verify Access database integration no longer needed
3. Create migrations 016-019
4. Update TV display to use calculated values or view

**Total Fields to Remove:** 18 (16 unused counters + 2 versions)
**Fields to Keep:** Access database integration fields (14 total) - for legacy data imports
