-- Migration: Add auto_complete_stale_classes setting to trials table
--
-- Purpose: When enabled (default), automatically completes stale in-progress classes
-- when a judge scores in a different level. This prevents classes from being left
-- "in progress" with unscored dogs when clubs move on to the next level.
--
-- Rule: Same judge + different level + stale 15+ minutes = auto-complete
-- Same judge + same level = do nothing (legitimate buried/containers workflow)

-- ============================================================
-- STEP 1: Add auto_complete_stale_classes to trials table
-- ============================================================

ALTER TABLE trials
ADD COLUMN auto_complete_stale_classes BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN trials.auto_complete_stale_classes IS
  'When TRUE (default), auto-completes stale in-progress classes when judge scores in a different level. Set FALSE to disable for trials where judges legitimately work multiple levels simultaneously.';

-- ============================================================
-- STEP 2: Add index for efficient querying
-- ============================================================

-- Index helps when checking this setting during score submission
CREATE INDEX IF NOT EXISTS idx_trials_auto_complete_stale
ON trials(auto_complete_stale_classes)
WHERE auto_complete_stale_classes = TRUE;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM trials WHERE auto_complete_stale_classes IS NOT NULL;
  RAISE NOTICE 'Migration complete: % trials now have auto_complete_stale_classes setting (defaulted to TRUE)', v_count;
END $$;
