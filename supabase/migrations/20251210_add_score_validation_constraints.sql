-- Migration: Add CHECK constraints for score validation
-- Purpose: Prevent invalid score values at the database level
--
-- This migration adds constraints to the entries table to ensure:
-- - Time values are non-negative
-- - Fault counts are non-negative
-- - Placements are positive integers
-- - Score values are non-negative
--
-- IMPORTANT: These constraints allow NULL values (optional fields)
-- but reject invalid values when provided.

-- ============================================
-- ENTRIES TABLE CONSTRAINTS
-- ============================================

-- Time must be non-negative (NULL allowed for unscored entries)
ALTER TABLE entries
ADD CONSTRAINT entries_time_non_negative
CHECK (time IS NULL OR time >= 0);

-- Faults must be non-negative (NULL allowed)
ALTER TABLE entries
ADD CONSTRAINT entries_faults_non_negative
CHECK (faults IS NULL OR faults >= 0);

-- Placement must be positive (1st place = 1, etc.) (NULL allowed for non-placed entries)
ALTER TABLE entries
ADD CONSTRAINT entries_placement_positive
CHECK (placement IS NULL OR placement > 0);

-- Score must be non-negative (NULL allowed for unscored entries)
-- Note: Some scoring systems may use negative scores - adjust max if needed
ALTER TABLE entries
ADD CONSTRAINT entries_score_non_negative
CHECK (score IS NULL OR score >= 0);

-- ============================================
-- EVENT_STATISTICS TABLE CONSTRAINTS (if used for nationals)
-- ============================================

-- Time must be non-negative
ALTER TABLE event_statistics
ADD CONSTRAINT event_statistics_time_non_negative
CHECK (time IS NULL OR time >= 0);

-- Score must be non-negative
ALTER TABLE event_statistics
ADD CONSTRAINT event_statistics_score_non_negative
CHECK (score IS NULL OR score >= 0);

-- Placement must be positive
ALTER TABLE event_statistics
ADD CONSTRAINT event_statistics_placement_positive
CHECK (placement IS NULL OR placement > 0);

-- ============================================
-- CLASSES TABLE CONSTRAINTS
-- ============================================

-- Time limits must be positive (if specified)
ALTER TABLE classes
ADD CONSTRAINT classes_time_limit_positive
CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0);

ALTER TABLE classes
ADD CONSTRAINT classes_time_limit_area2_positive
CHECK (time_limit_area2_seconds IS NULL OR time_limit_area2_seconds > 0);

ALTER TABLE classes
ADD CONSTRAINT classes_time_limit_area3_positive
CHECK (time_limit_area3_seconds IS NULL OR time_limit_area3_seconds > 0);

-- Area count must be positive (if specified)
ALTER TABLE classes
ADD CONSTRAINT classes_area_count_positive
CHECK (area_count IS NULL OR area_count > 0);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON CONSTRAINT entries_time_non_negative ON entries IS
'Ensures run times are never negative. NULL indicates unscored entry.';

COMMENT ON CONSTRAINT entries_faults_non_negative ON entries IS
'Ensures fault counts are never negative. NULL indicates unscored entry.';

COMMENT ON CONSTRAINT entries_placement_positive ON entries IS
'Ensures placements are positive integers (1st, 2nd, etc.). NULL indicates unplaced.';

COMMENT ON CONSTRAINT entries_score_non_negative ON entries IS
'Ensures scores are never negative. NULL indicates unscored entry.';
