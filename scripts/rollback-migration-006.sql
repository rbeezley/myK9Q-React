-- Rollback script for migration 006 - Remove class timing fields
-- WARNING: This will permanently delete the timing data. Use with caution!

BEGIN;

-- Drop the indexes first
DROP INDEX IF EXISTS idx_class_queue_timing_composite;
DROP INDEX IF EXISTS idx_class_queue_break_until;
DROP INDEX IF EXISTS idx_class_queue_briefing_time;
DROP INDEX IF EXISTS idx_class_queue_scheduled_start_time;

-- Drop the columns (this will delete all timing data)
ALTER TABLE tbl_class_queue
DROP COLUMN IF EXISTS scheduled_start_time,
DROP COLUMN IF EXISTS briefing_time,
DROP COLUMN IF EXISTS break_until;

COMMIT;

-- Verification
SELECT 'Timing fields removed from tbl_class_queue' as status;

-- Verify columns are gone
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tbl_class_queue'
  AND column_name IN ('scheduled_start_time', 'briefing_time', 'break_until');