#!/usr/bin/env node

/**
 * Direct Migration Script for myK9Show Supabase Database
 * This script applies the release_mode enum migration using raw SQL execution
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting migration application...');

    // Execute each part of the migration step by step
    console.log('\n📝 Step 1: Creating release_mode enum type...');
    await executeQuery("CREATE TYPE release_mode_enum AS ENUM ('hidden', 'auto', 'immediate', 'released');");

    console.log('\n📝 Step 2: Adding release_mode column...');
    await executeQuery("ALTER TABLE tbl_class_queue ADD COLUMN release_mode release_mode_enum DEFAULT 'hidden';");

    console.log('\n📝 Step 3: Migrating existing data...');
    const updateQuery = `
      UPDATE tbl_class_queue
      SET release_mode = CASE
        WHEN results_released = true THEN 'released'::release_mode_enum
        WHEN auto_release_results = true THEN 'auto'::release_mode_enum
        ELSE 'hidden'::release_mode_enum
      END;
    `;
    await executeQuery(updateQuery);

    console.log('\n📝 Step 4: Creating/updating trigger function...');
    const triggerFunction = `
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
    `;
    await executeQuery(triggerFunction);

    console.log('\n📝 Step 5: Creating helper function...');
    const helperFunction = `
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
    `;
    await executeQuery(helperFunction);

    console.log('\n📝 Step 6: Adding comments and index...');
    await executeQuery("COMMENT ON COLUMN tbl_class_queue.auto_release_results IS 'DEPRECATED: Use release_mode enum instead';");
    await executeQuery("COMMENT ON COLUMN tbl_class_queue.results_released IS 'DEPRECATED: Use release_mode enum instead';");
    await executeQuery("COMMENT ON COLUMN tbl_class_queue.release_mode IS 'Release mode: hidden (never show), auto (show when complete), immediate (show immediately), released (manually released)';");
    await executeQuery("CREATE INDEX IF NOT EXISTS idx_class_queue_release_mode ON tbl_class_queue(release_mode);");

    console.log('\n🎉 Migration applied successfully!');

    // Verify the migration
    await verifyMigration();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function executeQuery(query) {
  try {
    // Using the Supabase client's raw SQL execution capability
    const { data, error } = await supabase.rpc('sql', { query });

    if (error) {
      // Try alternative approach if rpc('sql') doesn't work
      console.log('⚠️  Attempting alternative query execution method...');
      throw error;
    }

    console.log('✅ Query executed successfully');
    return data;

  } catch (error) {
    console.error('❌ Query execution failed:', error);
    console.error('📝 Query was:', query.substring(0, 200) + '...');
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  try {
    // Check if we can query the new column
    const { data: sampleData, error: sampleError } = await supabase
      .from('tbl_class_queue')
      .select('release_mode, auto_release_results, results_released')
      .limit(10);

    if (sampleError) {
      console.error('❌ Error checking migrated data:', sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✅ Migration verification successful!');
      console.log('📊 Sample data with new release_mode column:');
      sampleData.forEach((row, index) => {
        console.log(`   ${index + 1}. release_mode: ${row.release_mode}, auto_release: ${row.auto_release_results}, results_released: ${row.results_released}`);
      });

      // Count the distribution of release modes
      const modeDistribution = sampleData.reduce((acc, row) => {
        acc[row.release_mode] = (acc[row.release_mode] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Release mode distribution in sample:');
      Object.entries(modeDistribution).forEach(([mode, count]) => {
        console.log(`   ${mode}: ${count} records`);
      });
    } else {
      console.log('⚠️  No data found in tbl_class_queue table');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
applyMigration();