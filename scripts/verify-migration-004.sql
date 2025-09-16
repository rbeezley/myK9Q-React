-- Verification script for migration 004_release_mode_enum_refactor
-- This script can be run in Supabase dashboard to verify the migration

-- Check if enum type was created
SELECT
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'release_mode_enum'
GROUP BY typname;

-- Check if column was added
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tbl_class_queue'
  AND column_name = 'release_mode';

-- Check data migration results
SELECT
  'Data Migration Results' as section,
  release_mode,
  COUNT(*) as count
FROM tbl_class_queue
GROUP BY release_mode
ORDER BY release_mode;

-- Check that old columns still exist but are deprecated
SELECT
  column_name,
  data_type,
  column_default,
  col_description(pgc.oid, ordinal_position) as comment
FROM information_schema.columns isc
JOIN pg_class pgc ON pgc.relname = isc.table_name
WHERE table_name = 'tbl_class_queue'
  AND column_name IN ('auto_release_results', 'results_released', 'release_mode')
ORDER BY column_name;

-- Check if index was created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tbl_class_queue'
  AND indexname = 'idx_class_queue_release_mode';

-- Test the new function
SELECT
  'Function Tests' as section,
  'hidden mode, not completed' as test_case,
  should_show_class_results('hidden'::release_mode_enum, false) as result
UNION ALL
SELECT
  'Function Tests' as section,
  'auto mode, completed' as test_case,
  should_show_class_results('auto'::release_mode_enum, true) as result
UNION ALL
SELECT
  'Function Tests' as section,
  'auto mode, not completed' as test_case,
  should_show_class_results('auto'::release_mode_enum, false) as result
UNION ALL
SELECT
  'Function Tests' as section,
  'immediate mode, not completed' as test_case,
  should_show_class_results('immediate'::release_mode_enum, false) as result
UNION ALL
SELECT
  'Function Tests' as section,
  'released mode, not completed' as test_case,
  should_show_class_results('released'::release_mode_enum, false) as result;