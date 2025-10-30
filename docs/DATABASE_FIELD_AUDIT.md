# Database Field Audit - Deprecated Fields

This document identifies deprecated fields that can be safely removed from the database schema.

## Executive Summary

**Migration 014** (`014_consolidate_entry_status.sql`) consolidated entry status management by introducing `entry_status` as the single source of truth. However, several deprecated fields remain in the schema that are no longer used in the codebase.

## Entries Table - Fields to Remove

### ✅ ACTIVELY USED (Keep These)
- `entry_status` - **Current standard** (added in migration 014)
- All core entry fields (armband_number, handler_name, dog_call_name, dog_breed, etc.)
- Payment fields (is_paid, payment_method, entry_fee)
- Order fields (run_order, exhibitor_order)
- Health fields (has_health_issues, health_timestamp, health_comment)
- Reason fields (withdrawal_reason, excuse_reason)

### ❌ DEPRECATED (Safe to Remove)

#### 1. Result Status Fields (replaced by `results.result_status`)
- **`is_qualified`** (boolean) → Use `results.result_status = 'qualified'`
- **`is_absent`** (boolean) → Use `results.result_status = 'absent'`
- **`is_excused`** (boolean) → Use `results.result_status = 'excused'`
- **`is_withdrawn`** (boolean) → Use `results.result_status = 'withdrawn'`

**Why deprecated:**
- These boolean flags duplicated data that's already in the `results` table
- `results.result_status` is the single source of truth for scoring outcomes
- Only used in type definitions (`src/lib/supabase.ts`), not in actual queries

**Codebase usage:** Only found in:
- `src/lib/supabase.ts` (TypeScript type definitions)
- Documentation files
- One migration script (`fix-nationals-schema.sql`)

#### 2. Legacy Check-in Status Fields
- **`check_in_status`** (integer 0-3) - Numeric check-in status

**Why deprecated:**
- Migration 012 removed numeric check_in_status
- Migration 014 consolidated all status into `entry_status` text field
- Still appears in some code (DogDetails.tsx, conflictResolution.ts) but only in commented/legacy sections

**Status:** Probably already removed by migration 012, needs verification

## Results Table - Fields to Review

### ✅ ACTIVELY USED (Keep These)
- `is_scored` - **Critical** - Used everywhere to determine if entry is completed
- `is_in_ring` - Used for ring management (though `entry_status = 'in-ring'` is preferred)
- `result_status` - Single source of truth for Q/NQ/ABS/EX/WD
- All scoring fields (search_time_seconds, total_faults, final_placement, etc.)

### ⚠️ REVIEW NEEDED (Possibly Redundant)

#### 1. Ring Management Duplication
- **`is_in_ring`** (in results table)
- vs. **`entry_status = 'in-ring'`** (in entries table)

**Issue:** Two sources of truth for same state
- Migration 014 uses `entry_status` as primary
- But `results.is_in_ring` is still actively queried in `entryService.ts`

**Recommendation:** Keep both for now, but prefer `entry_status` in new code

## Access Database ID Fields (Entries Table)

### ⚠️ LEGACY INTEGRATION (Review Before Removing)
- `access_entry_id`
- `access_class_id`
- `access_trial_id`
- `access_show_id`
- `access_exhibitor_id`

**Purpose:** Legacy Microsoft Access database integration
**Usage:** Not found in current codebase
**Recommendation:** Confirm these are not needed for data imports before removing

## Recommended Migration Plan

### Phase 1: Remove Boolean Result Status Fields (Low Risk)
```sql
-- Migration: Remove deprecated result status boolean fields
ALTER TABLE entries DROP COLUMN IF EXISTS is_qualified;
ALTER TABLE entries DROP COLUMN IF EXISTS is_absent;
ALTER TABLE entries DROP COLUMN IF EXISTS is_excused;
ALTER TABLE entries DROP COLUMN IF EXISTS is_withdrawn;
```

**Impact:** None - these fields are not queried in the codebase
**Risk:** Low
**Verification:** Search codebase for field names (already done - only in type definitions)

### Phase 2: Remove Access Database ID Fields (Medium Risk)
```sql
-- Migration: Remove legacy Access database integration fields
ALTER TABLE entries DROP COLUMN IF EXISTS access_entry_id;
ALTER TABLE entries DROP COLUMN IF EXISTS access_class_id;
ALTER TABLE entries DROP COLUMN IF EXISTS access_trial_id;
ALTER TABLE entries DROP COLUMN IF EXISTS access_show_id;
ALTER TABLE entries DROP COLUMN IF EXISTS access_exhibitor_id;
```

**Impact:** Breaks data imports from Access database (if still used)
**Risk:** Medium
**Verification:** Confirm with stakeholders that Access integration is no longer needed

### Phase 3: Remove Old Check-in Status (If Not Already Done)
```sql
-- Migration: Verify and document removal of check_in_status
-- (May already be done by migration 012)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entries' AND column_name = 'check_in_status'
    ) THEN
        ALTER TABLE entries DROP COLUMN check_in_status;
        RAISE NOTICE 'Removed legacy check_in_status column';
    ELSE
        RAISE NOTICE 'check_in_status column already removed';
    END IF;
END $$;
```

**Impact:** None - already replaced by `entry_status`
**Risk:** Low
**Verification:** Migration 012 and 014 already handled this

### Phase 4: Consolidate Ring Status (Future Consideration)
**Decision needed:** Should we remove `results.is_in_ring` and only use `entries.entry_status`?

**Current state:**
- `entry_status = 'in-ring'` is the official status (migration 014)
- But `results.is_in_ring` is still checked in multiple places

**Recommendation:**
1. Update all code to check `entry_status` instead of `results.is_in_ring`
2. Add database trigger to keep `results.is_in_ring` synced with `entry_status` (for backward compatibility)
3. Eventually deprecate `results.is_in_ring` in a future migration

## Summary Table

| Field | Table | Status | Safe to Remove? | Priority |
|-------|-------|--------|----------------|----------|
| `is_qualified` | entries | Deprecated | ✅ Yes | High |
| `is_absent` | entries | Deprecated | ✅ Yes | High |
| `is_excused` | entries | Deprecated | ✅ Yes | High |
| `is_withdrawn` | entries | Deprecated | ✅ Yes | High |
| `check_in_status` | entries | Deprecated | ✅ Yes (verify) | Medium |
| `access_*_id` (5 fields) | entries | Legacy | ⚠️ Verify first | Low |
| `is_in_ring` | results | Active but redundant | ❌ Not yet | Future |
| `is_scored` | results | Active | ✅ Keep | N/A |
| `result_status` | results | Active | ✅ Keep | N/A |
| `entry_status` | entries | Active | ✅ Keep | N/A |

## Next Steps

1. **Immediate:** Remove boolean result status fields (is_qualified, is_absent, is_excused, is_withdrawn)
2. **Short-term:** Verify Access database fields are not needed, then remove
3. **Long-term:** Consolidate ring status to use only `entry_status`

## Files Updated for This Audit
- Searched entire codebase for field usage patterns
- Reviewed migrations 012, 014
- Analyzed `entryService.ts`, `ClassList.tsx`, `CombinedEntryList.tsx`
- Checked type definitions in `src/lib/supabase.ts`

---
**Date:** 2025-01-30
**Author:** Database Cleanup Audit
**Related Migrations:** 012, 014
