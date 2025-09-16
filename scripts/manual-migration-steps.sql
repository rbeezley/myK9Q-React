-- ============================================================================
-- Manual Migration Steps for myK9Show Supabase Database
-- Migration: 004_release_mode_enum_refactor.sql
--
-- INSTRUCTIONS:
-- Execute these SQL commands in the Supabase Dashboard SQL Editor
-- Go to: https://app.supabase.com/project/ggreahsjqzombkvagxle/sql
-- ============================================================================

-- Step 1: Create the enum type
CREATE TYPE release_mode_enum AS ENUM ('hidden', 'auto', 'immediate', 'released');

-- Step 2: Add the new column with default value
ALTER TABLE tbl_class_queue
ADD COLUMN release_mode release_mode_enum DEFAULT 'hidden';

-- Step 3: Migrate existing data (this is the critical step)
-- Based on our analysis: 457 records with auto_release_results=true, 1 with results_released=true
UPDATE tbl_class_queue
SET release_mode = CASE
  WHEN results_released = true THEN 'released'::release_mode_enum
  WHEN auto_release_results = true THEN 'auto'::release_mode_enum
  ELSE 'hidden'::release_mode_enum
END;

-- Step 4: Update the trigger function
CREATE OR REPLACE FUNCTION handle_results_release()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp when results are manually released
  IF OLD.release_mode != 'released' AND NEW.release_mode = 'released' THEN
    NEW.results_released_at = NOW();
  END IF;

  -- Update timestamp when class is marked complete
  IF OLD.class_completed = FALSE AND NEW.class_completed = TRUE THEN
    NEW.class_completed_at = NOW();

    -- Auto-release results if mode is set to 'auto'
    IF NEW.release_mode = 'auto' THEN
      NEW.release_mode = 'released';
      NEW.results_released_at = NOW();
      NEW.results_released_by = 'SYSTEM_AUTO';
    -- For immediate mode, release immediately when class completes
    ELSIF NEW.release_mode = 'immediate' THEN
      NEW.release_mode = 'released';
      NEW.results_released_at = NOW();
      NEW.results_released_by = 'SYSTEM_IMMEDIATE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the helper function
CREATE OR REPLACE FUNCTION should_show_class_results(
  class_release_mode release_mode_enum,
  class_completed BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Show results based on release mode
  CASE class_release_mode
    WHEN 'hidden' THEN
      RETURN FALSE;
    WHEN 'auto' THEN
      RETURN class_completed;
    WHEN 'immediate' THEN
      RETURN TRUE; -- Always show for immediate mode
    WHEN 'released' THEN
      RETURN TRUE;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add comments to deprecate old columns
COMMENT ON COLUMN tbl_class_queue.auto_release_results IS 'DEPRECATED: Use release_mode enum instead';
COMMENT ON COLUMN tbl_class_queue.results_released IS 'DEPRECATED: Use release_mode enum instead';

-- Step 7: Add comment to new column
COMMENT ON COLUMN tbl_class_queue.release_mode IS 'Release mode: hidden (never show), auto (show when complete), immediate (show immediately), released (manually released)';

-- Step 8: Create index for performance
CREATE INDEX IF NOT EXISTS idx_class_queue_release_mode ON tbl_class_queue(release_mode);

-- ============================================================================
-- VERIFICATION QUERIES (run these after the migration)
-- ============================================================================

-- Check that the enum type was created
SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'release_mode_enum'
ORDER BY e.enumsortorder;

-- Check the new column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tbl_class_queue' AND column_name = 'release_mode';

-- Verify the data migration
SELECT
  release_mode,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE auto_release_results = true) as had_auto_release,
  COUNT(*) FILTER (WHERE results_released = true) as had_results_released
FROM tbl_class_queue
GROUP BY release_mode
ORDER BY release_mode;

-- Check index was created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tbl_class_queue' AND indexname = 'idx_class_queue_release_mode';

-- Sample the migrated data
SELECT
  id,
  release_mode,
  auto_release_results,
  results_released,
  class_completed
FROM tbl_class_queue
LIMIT 10;