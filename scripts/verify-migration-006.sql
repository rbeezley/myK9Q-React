-- Verification script for migration 006 - Class timing fields
-- Run this after applying the migration to verify everything is working correctly

-- Check if the new columns exist
SELECT 'Checking if timing columns exist...' as step;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tbl_class_queue'
  AND column_name IN ('scheduled_start_time', 'briefing_time', 'break_until')
ORDER BY column_name;

-- Check if indexes were created
SELECT 'Checking if indexes were created...' as step;

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tbl_class_queue'
  AND indexname LIKE '%timing%'
  OR indexname LIKE '%scheduled_start%'
  OR indexname LIKE '%briefing%'
  OR indexname LIKE '%break_until%'
ORDER BY indexname;

-- Test data insertion (optional - only run if you want to test)
-- SELECT 'Testing data insertion...' as step;
--
-- UPDATE tbl_class_queue
-- SET
--   scheduled_start_time = NOW() + INTERVAL '1 hour',
--   briefing_time = NOW() + INTERVAL '30 minutes',
--   break_until = NULL
-- WHERE id = (SELECT id FROM tbl_class_queue LIMIT 1);

-- Show sample of updated data structure
SELECT 'Sample of table structure with new fields...' as step;

SELECT
  id,
  class_name,
  scheduled_start_time,
  briefing_time,
  break_until,
  release_mode,
  class_completed
FROM tbl_class_queue
LIMIT 5;