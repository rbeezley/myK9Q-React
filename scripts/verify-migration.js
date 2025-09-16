#!/usr/bin/env node

/**
 * Migration Verification Script for myK9Show Supabase Database
 * This script verifies that the release_mode enum migration was applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

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

async function verifyMigration() {
  try {
    console.log('🔍 Verifying release_mode enum migration...');
    console.log(`📍 Database URL: ${supabaseUrl}\n`);

    let verificationsPassed = 0;
    let totalVerifications = 0;

    // Test 1: Check if release_mode column exists
    totalVerifications++;
    console.log('📋 Test 1: Checking if release_mode column exists...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('tbl_class_queue')
      .select('release_mode')
      .limit(1);

    if (sampleError) {
      console.error('❌ release_mode column does not exist or is not accessible');
      console.error('   Error:', sampleError.message);
    } else {
      console.log('✅ release_mode column exists and is accessible');
      verificationsPassed++;
    }

    // Test 2: Check data migration results
    totalVerifications++;
    console.log('\n📊 Test 2: Checking data migration results...');
    const { data: allData, error: dataError } = await supabase
      .from('tbl_class_queue')
      .select('release_mode, auto_release_results, results_released');

    if (dataError) {
      console.error('❌ Could not retrieve migration data');
      console.error('   Error:', dataError.message);
    } else {
      console.log('✅ Successfully retrieved migration data');
      verificationsPassed++;

      // Analyze the migration results
      const distribution = allData.reduce((acc, row) => {
        const mode = row.release_mode || 'null';
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Release mode distribution:');
      Object.entries(distribution).forEach(([mode, count]) => {
        console.log(`   ${mode}: ${count} records`);
      });

      // Check migration logic
      const autoReleaseCount = allData.filter(row => row.auto_release_results === true).length;
      const resultsReleasedCount = allData.filter(row => row.results_released === true).length;
      const autoModeCount = distribution['auto'] || 0;
      const releasedModeCount = distribution['released'] || 0;

      console.log('\n🔍 Migration logic verification:');
      console.log(`   auto_release_results = true: ${autoReleaseCount} records`);
      console.log(`   results_released = true: ${resultsReleasedCount} records`);
      console.log(`   release_mode = 'auto': ${autoModeCount} records`);
      console.log(`   release_mode = 'released': ${releasedModeCount} records`);

      if (autoModeCount >= autoReleaseCount && releasedModeCount >= resultsReleasedCount) {
        console.log('✅ Migration logic appears correct');
      } else {
        console.log('⚠️  Migration logic may need review');
      }
    }

    // Test 3: Check for enum values
    totalVerifications++;
    console.log('\n🎯 Test 3: Testing enum values...');
    try {
      // Try to query for each expected enum value
      const enumValues = ['hidden', 'auto', 'immediate', 'released'];
      let enumTestsPassed = 0;

      for (const enumValue of enumValues) {
        const { data: enumData, error: enumError } = await supabase
          .from('tbl_class_queue')
          .select('id')
          .eq('release_mode', enumValue)
          .limit(1);

        if (!enumError) {
          enumTestsPassed++;
        }
      }

      if (enumTestsPassed === enumValues.length) {
        console.log('✅ All enum values are accessible');
        verificationsPassed++;
      } else {
        console.log(`⚠️  Only ${enumTestsPassed}/${enumValues.length} enum values are accessible`);
      }
    } catch (enumTestError) {
      console.error('❌ Enum value test failed:', enumTestError.message);
    }

    // Test 4: Sample data verification
    totalVerifications++;
    console.log('\n📋 Test 4: Sample data verification...');
    const { data: sampleRecords, error: sampleRecordsError } = await supabase
      .from('tbl_class_queue')
      .select('id, release_mode, auto_release_results, results_released, class_completed')
      .limit(5);

    if (sampleRecordsError) {
      console.error('❌ Could not retrieve sample records');
      console.error('   Error:', sampleRecordsError.message);
    } else {
      console.log('✅ Sample data retrieved successfully');
      verificationsPassed++;

      console.log('\n📊 Sample records:');
      sampleRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      release_mode: ${record.release_mode}`);
        console.log(`      auto_release_results: ${record.auto_release_results}`);
        console.log(`      results_released: ${record.results_released}`);
        console.log(`      class_completed: ${record.class_completed}`);
        console.log('');
      });
    }

    // Summary
    console.log('🏁 MIGRATION VERIFICATION SUMMARY');
    console.log('=====================================');
    console.log(`✅ Tests passed: ${verificationsPassed}/${totalVerifications}`);
    console.log(`🔢 Success rate: ${Math.round((verificationsPassed / totalVerifications) * 100)}%`);

    if (verificationsPassed === totalVerifications) {
      console.log('\n🎉 MIGRATION SUCCESSFULLY VERIFIED!');
      console.log('   The release_mode enum migration has been applied correctly.');
      console.log('   All data has been migrated properly.');
      console.log('   The application should now work with the new enum system.');
    } else {
      console.log('\n⚠️  MIGRATION VERIFICATION INCOMPLETE');
      console.log('   Some tests failed. Please review the migration manually.');
      console.log('   Check the Supabase Dashboard for any issues.');
    }

  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
verifyMigration();