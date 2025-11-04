# Column Mapping Audit Results

**Date**: 2025-11-04
**Purpose**: Verify all database column names match TypeScript code after migrations 039-042

## Summary

✅ **All column mappings are now correct**

### Issues Found and Fixed

1. **Line 136** - `src/services/entryService.ts`
   - **Before**: `const status = row.computed_status as EntryStatus;`
   - **After**: `const status = (row.entry_status as EntryStatus) || 'no-status';`
   - **Issue**: View doesn't have `computed_status` column after migration 039

2. **Line 130** - `src/services/entryService.ts` (debug log)
   - **Before**: `isScored: row.computed_is_scored`
   - **After**: `isScored: row.is_scored, entryStatus: row.entry_status`
   - **Issue**: View doesn't have `computed_is_scored` column after migration 039

## Column Mapping Verification

### View: `view_entry_with_results` (Migration 039)
Provides: `e.*` (all columns from entries table) + `result_text` (computed)

### Entries Table Columns Used in Code

All references verified correct:

| TypeScript Code | Database Column | Status |
|----------------|----------------|---------|
| `row.id` | `entries.id` | ✅ Correct |
| `row.armband_number` | `entries.armband_number` | ✅ Correct |
| `row.dog_call_name` | `entries.dog_call_name` | ✅ Correct |
| `row.dog_breed` | `entries.dog_breed` | ✅ Correct |
| `row.handler_name` | `entries.handler_name` | ✅ Correct |
| `row.entry_status` | `entries.entry_status` | ✅ Correct (FIXED) |
| `row.is_scored` | `entries.is_scored` | ✅ Correct (FIXED) |
| `row.is_in_ring` | `entries.is_in_ring` | ✅ Correct |
| `row.result_status` | `entries.result_status` | ✅ Correct |
| `row.search_time_seconds` | `entries.search_time_seconds` | ✅ Correct |
| `row.total_faults` | `entries.total_faults` | ✅ Correct |
| `row.final_placement` | `entries.final_placement` | ✅ Correct |
| `row.total_correct_finds` | `entries.total_correct_finds` | ✅ Correct |
| `row.total_incorrect_finds` | `entries.total_incorrect_finds` | ✅ Correct |
| `row.no_finish_count` | `entries.no_finish_count` | ✅ Correct |
| `row.points_earned` | `entries.points_earned` | ✅ Correct |
| `row.disqualification_reason` | `entries.disqualification_reason` | ✅ Correct |
| `row.excuse_reason` | `entries.excuse_reason` | ✅ Correct |
| `row.withdrawal_reason` | `entries.withdrawal_reason` | ✅ Correct |
| `row.class_id` | `entries.class_id` | ✅ Correct |
| `row.exhibitor_order` | `entries.exhibitor_order` | ✅ Correct |

### Removed References (No Longer Valid)

| Old Code | Reason Removed |
|----------|----------------|
| `row.computed_status` | View no longer provides this after migration 039 |
| `row.computed_is_scored` | View no longer provides this after migration 039 |

## Migration History Context

- **Migration 017**: Created `view_entry_with_results` with `computed_status` and `computed_is_scored`
- **Migration 039**: Merged results table into entries, recreated view with `e.*` (no computed columns)
- **Migrations 040-042**: Updated other views but didn't affect entry column mappings

## Verification

✅ TypeScript compilation passes
✅ No references to non-existent computed columns
✅ All 30 column references verified correct
