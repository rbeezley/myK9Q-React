// Debug script to check class_status values in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ggreahsjqzombkvagxle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClassStatus() {
  console.log('🔍 Checking class_status values...');
  
  const licenseKey = 'myK9Q1-d8609f3b-d3fd43aa-6323a604';
  
  // Query class queue
  const { data: classes, error } = await supabase
    .from('tbl_class_queue')
    .select('*')
    .eq('mobile_app_lic_key', licenseKey)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error querying classes:', error);
    return;
  }

  console.log(`📊 Found ${classes?.length || 0} classes:`);
  
  classes?.forEach((cls, index) => {
    console.log(`${index + 1}. ${cls.class_name || cls.classname || 'Unknown'}:`);
    console.log(`   class_status: ${cls.class_status} (type: ${typeof cls.class_status})`);
    console.log(`   completed_count: ${cls.completed_count}`);
    console.log(`   entry_count: ${cls.entry_count}`);
    console.log(`   created_at: ${cls.created_at}`);
    console.log('---');
  });
  
  // Also check view data
  console.log('\n🔍 Checking view data...');
  const { data: viewData, error: viewError } = await supabase
    .from('view_entry_class_join_distinct')
    .select('*')
    .eq('mobile_app_lic_key', licenseKey)
    .limit(5);
    
  if (viewError) {
    console.error('❌ Error querying view:', viewError);
  } else {
    console.log(`📊 View data sample (${viewData?.length || 0} entries):`, viewData);
  }
}

checkClassStatus().catch(console.error);