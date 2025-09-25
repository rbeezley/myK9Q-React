-- Legacy Database Cleanup Script
-- This script removes all unused legacy tables, functions, and triggers
-- Run this after confirming no dependencies exist

-- 1. Drop legacy sync trigger first
DROP TRIGGER IF EXISTS trigger_auto_bulk_sync_entries ON shows;

-- 2. Drop all unused sync-related functions
DROP FUNCTION IF EXISTS auto_bulk_sync_entries() CASCADE;
DROP FUNCTION IF EXISTS sync_entry_to_normalized() CASCADE;
DROP FUNCTION IF EXISTS sync_class_to_normalized() CASCADE;
DROP FUNCTION IF EXISTS sync_show_to_normalized() CASCADE;
DROP FUNCTION IF EXISTS sync_trial_to_normalized() CASCADE;
DROP FUNCTION IF EXISTS sync_result_to_normalized() CASCADE;
DROP FUNCTION IF EXISTS sync_normalized_to_entry() CASCADE;
DROP FUNCTION IF EXISTS sync_normalized_to_class() CASCADE;
DROP FUNCTION IF EXISTS sync_normalized_to_show() CASCADE;
DROP FUNCTION IF EXISTS sync_normalized_to_trial() CASCADE;
DROP FUNCTION IF EXISTS sync_normalized_to_result() CASCADE;
DROP FUNCTION IF EXISTS handle_entry_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_class_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_show_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_trial_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_result_changes() CASCADE;
DROP FUNCTION IF EXISTS bulk_sync_entries() CASCADE;
DROP FUNCTION IF EXISTS bulk_sync_classes() CASCADE;
DROP FUNCTION IF EXISTS bulk_sync_shows() CASCADE;

-- 3. Drop unused logging function (no triggers use it)
DROP FUNCTION IF EXISTS log_table_changes() CASCADE;

-- 4. Drop all legacy tables (empty, no longer used)
DROP TABLE IF EXISTS tbl_logs CASCADE;
DROP TABLE IF EXISTS tbl_moveto_trigger CASCADE;
DROP TABLE IF EXISTS tbl_notifications CASCADE;
DROP TABLE IF EXISTS tbl_reorder CASCADE;
DROP TABLE IF EXISTS tbl_score_trigger CASCADE;
DROP TABLE IF EXISTS tbl_show_queue CASCADE;
DROP TABLE IF EXISTS tbl_class_queue CASCADE;
DROP TABLE IF EXISTS tbl_entry_queue CASCADE;
DROP TABLE IF EXISTS tbl_akc_class_requirements CASCADE;
DROP TABLE IF EXISTS tbl_ukc_class_requirements CASCADE;

-- 5. Verify cleanup completed successfully
SELECT 'Legacy cleanup completed successfully' as status;