#!/usr/bin/env node

/**
 * Apply Migration Script for myK9Show Supabase Database
 * This script applies the release_mode enum migration directly to the database
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

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_release_mode_enum_refactor.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📖 Migration file loaded successfully');

    // Split the migration into individual statements (excluding comments and empty lines)
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          throw error;
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
        if (data) {
          console.log('📊 Result:', data);
        }
      } catch (statementError) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, statementError);
        throw statementError;
      }
    }

    console.log('\n🎉 Migration applied successfully!');

    // Verify the migration
    await verifyMigration();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  try {
    // Check if the enum type exists
    const { data: enumData, error: enumError } = await supabase
      .from('information_schema.enum_values')
      .select('*')
      .eq('type_name', 'release_mode_enum');

    if (enumError) {
      console.error('❌ Error checking enum type:', enumError);
      return;
    }

    if (enumData && enumData.length > 0) {
      console.log('✅ release_mode_enum type created successfully');
      console.log('📋 Enum values:', enumData.map(row => row.enum_value));
    } else {
      console.log('⚠️  Could not verify enum type creation');
    }

    // Check if the column exists
    const { data: columnData, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'tbl_class_queue')
      .eq('column_name', 'release_mode');

    if (columnError) {
      console.error('❌ Error checking column:', columnError);
      return;
    }

    if (columnData && columnData.length > 0) {
      console.log('✅ release_mode column added successfully');
      console.log('📋 Column details:', columnData[0]);
    } else {
      console.log('⚠️  Could not verify column creation');
    }

    // Check data migration
    const { data: migrationData, error: migrationError } = await supabase
      .from('tbl_class_queue')
      .select('release_mode')
      .limit(5);

    if (migrationError) {
      console.error('❌ Error checking migrated data:', migrationError);
      return;
    }

    if (migrationData && migrationData.length > 0) {
      console.log('✅ Data migration successful');
      console.log('📊 Sample release_mode values:', migrationData.map(row => row.release_mode));
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
applyMigration();