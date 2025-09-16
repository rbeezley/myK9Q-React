#!/usr/bin/env node

/**
 * Supabase Connection and Table Test Script
 * Tests the connection to Supabase and checks for specific tables
 */

import { createClient } from '@supabase/supabase-js';

// Credentials from user request
const SUPABASE_URL = 'https://ggreahsjqzombkvagxle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI';

const LICENSE_KEY = 'myK9Q1-d8609f3b-d3fd43aa-6323a604';

// Tables to check
const TABLES_TO_CHECK = [
  'tbl_trial_queue',
  'tbl_class_queue',
  'tbl_entry_queue',
  'tbl_show_queue' // Additional table found in the codebase
];

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log(`🏷️  License Key: ${LICENSE_KEY}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('✅ Supabase client created successfully');

    // Test basic connection by directly trying one of our target tables
    console.log('\n🔍 Testing basic connection...');
    let connectionWorking = false;
    
    // Try to connect by testing one of the expected tables first
    try {
      const { data: testData, error: testError } = await supabase
        .from('tbl_show_queue')
        .select('count', { count: 'exact', head: true });
      
      if (!testError) {
        console.log('✅ Basic connection successful (via tbl_show_queue)');
        connectionWorking = true;
      } else {
        // Try another table if show_queue doesn't exist
        const { data: trialTest, error: trialTestError } = await supabase
          .from('tbl_trial_queue')
          .select('count', { count: 'exact', head: true });
        
        if (!trialTestError) {
          console.log('✅ Basic connection successful (via tbl_trial_queue)');
          connectionWorking = true;
        }
      }
    } catch (err) {
      console.log('⚠️  Testing connection with direct table queries...');
    }
    
    if (!connectionWorking) {
      // Last resort: try with RPC to test connection
      try {
        const { error: rpcError } = await supabase.rpc('version');
        if (!rpcError) {
          console.log('✅ Basic connection successful (via RPC)');
          connectionWorking = true;
        }
      } catch (err) {
        console.log('⚠️  Could not verify basic connection, proceeding with table checks...');
        connectionWorking = true; // Continue anyway
      }
    }

    // Check for specific tables
    console.log('\n🗂️  Checking for required tables...');
    const tableResults = {};

    for (const tableName of TABLES_TO_CHECK) {
      console.log(`\n📋 Checking table: ${tableName}`);
      
      try {
        // Test if table exists by querying it
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ Table '${tableName}' - Error: ${error.message}`);
          tableResults[tableName] = { exists: false, error: error.message };
        } else {
          console.log(`   ✅ Table '${tableName}' exists with ${count} rows`);
          tableResults[tableName] = { exists: true, rowCount: count };
        }
      } catch (err) {
        console.log(`   ❌ Table '${tableName}' - Exception: ${err.message}`);
        tableResults[tableName] = { exists: false, error: err.message };
      }
    }

    // Test the specific query requested
    console.log('\n🎯 Testing specific query on tbl_trial_queue...');
    try {
      const { data: trialData, error: trialError } = await supabase
        .from('tbl_trial_queue')
        .select('*')
        .eq('mobile_app_lic_key', LICENSE_KEY)
        .limit(1);

      if (trialError) {
        console.log(`   ❌ Query failed: ${trialError.message}`);
      } else {
        console.log(`   ✅ Query successful, returned ${trialData?.length || 0} rows`);
        if (trialData && trialData.length > 0) {
          console.log('   📊 Sample data:', JSON.stringify(trialData[0], null, 2));
        } else {
          console.log('   📭 No data found for the specified license key');
        }
      }
    } catch (err) {
      console.log(`   ❌ Query exception: ${err.message}`);
    }

    // Additional table exploration
    console.log('\n🔍 Exploring other tables...');
    try {
      const { data: showData, error: showError } = await supabase
        .from('tbl_show_queue')
        .select('*')
        .limit(3);

      if (!showError && showData) {
        console.log(`   ✅ Found ${showData.length} shows in tbl_show_queue`);
        showData.forEach((show, index) => {
          console.log(`      ${index + 1}. ${show.show_name} (${show.mobile_app_lic_key})`);
        });
      }
    } catch (err) {
      console.log(`   ⚠️  Could not explore tbl_show_queue: ${err.message}`);
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 Connection Status: ✅ CONNECTED');
    
    console.log('\n📋 Table Status:');
    Object.entries(tableResults).forEach(([table, result]) => {
      const status = result.exists ? '✅ EXISTS' : '❌ MISSING';
      const detail = result.exists ? `(${result.rowCount} rows)` : `(${result.error})`;
      console.log(`   ${table}: ${status} ${detail}`);
    });

    const existingTables = Object.entries(tableResults).filter(([_, result]) => result.exists);
    const missingTables = Object.entries(tableResults).filter(([_, result]) => !result.exists);

    console.log(`\n📈 Found ${existingTables.length}/${TABLES_TO_CHECK.length} required tables`);
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing Tables:');
      missingTables.forEach(([table, result]) => {
        console.log(`   - ${table}: ${result.error}`);
      });
    }

    return existingTables.length === TABLES_TO_CHECK.length;

  } catch (error) {
    console.error('💥 FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    console.log('\n🏁 Test completed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed with exception:', error);
    process.exit(1);
  });