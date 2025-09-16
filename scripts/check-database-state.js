#!/usr/bin/env node

/**
 * Database State Checker for myK9Show Supabase Database
 * This script checks the current state of the database to determine migration needs
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

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking current database state...');
    console.log(`📍 Database URL: ${supabaseUrl}`);

    // Check if tbl_class_queue exists and its current structure
    console.log('\n📋 Checking tbl_class_queue table structure...');

    const { data: classQueueData, error: classQueueError } = await supabase
      .from('tbl_class_queue')
      .select('*')
      .limit(1);

    if (classQueueError) {
      console.error('❌ Error accessing tbl_class_queue:', classQueueError);
      return;
    }

    if (classQueueData && classQueueData.length > 0) {
      console.log('✅ tbl_class_queue table accessible');
      console.log('📊 Sample record structure:');
      const sampleRecord = classQueueData[0];
      const columns = Object.keys(sampleRecord);

      columns.forEach(col => {
        const value = sampleRecord[col];
        const type = typeof value;
        console.log(`   ${col}: ${value} (${type})`);
      });

      // Check specifically for the columns we're interested in
      const hasReleaseMode = columns.includes('release_mode');
      const hasAutoRelease = columns.includes('auto_release_results');
      const hasResultsReleased = columns.includes('results_released');

      console.log('\n🔍 Migration-relevant columns:');
      console.log(`   release_mode: ${hasReleaseMode ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   auto_release_results: ${hasAutoRelease ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   results_released: ${hasResultsReleased ? '✅ EXISTS' : '❌ MISSING'}`);

      if (hasReleaseMode) {
        console.log('\n🎉 Migration appears to already be applied!');

        // Check the distribution of release modes
        const { data: allData, error: allError } = await supabase
          .from('tbl_class_queue')
          .select('release_mode, auto_release_results, results_released');

        if (!allError && allData) {
          const distribution = allData.reduce((acc, row) => {
            const mode = row.release_mode || 'null';
            acc[mode] = (acc[mode] || 0) + 1;
            return acc;
          }, {});

          console.log('\n📈 Release mode distribution:');
          Object.entries(distribution).forEach(([mode, count]) => {
            console.log(`   ${mode}: ${count} records`);
          });
        }
      } else {
        console.log('\n⚠️  Migration needs to be applied');

        // Check existing boolean column values
        const { data: allData, error: allError } = await supabase
          .from('tbl_class_queue')
          .select('auto_release_results, results_released');

        if (!allError && allData) {
          const autoReleaseTrue = allData.filter(row => row.auto_release_results === true).length;
          const resultsReleasedTrue = allData.filter(row => row.results_released === true).length;

          console.log('\n📊 Current boolean column values:');
          console.log(`   auto_release_results = true: ${autoReleaseTrue} records`);
          console.log(`   results_released = true: ${resultsReleasedTrue} records`);
          console.log(`   Total records: ${allData.length}`);
        }
      }

    } else {
      console.log('⚠️  tbl_class_queue table is empty or not accessible');
    }

    // Test basic database connectivity
    console.log('\n🔗 Testing database connectivity...');
    const { data: connectTest, error: connectError } = await supabase
      .from('tbl_class_queue')
      .select('count', { count: 'exact', head: true });

    if (connectError) {
      console.error('❌ Database connectivity test failed:', connectError);
    } else {
      console.log(`✅ Database connected successfully. Record count: ${connectTest || 'Unknown'}`);
    }

  } catch (error) {
    console.error('❌ Database state check failed:', error);
  }
}

// Run the check
checkDatabaseState();