// Debug script to check available fields in class table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ggreahsjqzombkvagxle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncmVhaHNqcXpvbWJrdmFneGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAxMjkxMjUsImV4cCI6MjAwNTcwNTEyNX0.iwm92tUF6LDa68s5AGzLYW_To8RDL7MdhrSc1hSDAPI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClassFields() {
  const licenseKey = 'myK9Q1-d8609f3b-d3fd43aa-6323a604';
  
  console.log('🔍 Checking all fields in class table...');
  const { data: classes, error } = await supabase
    .from('tbl_class_queue')
    .select('*')
    .eq('mobile_app_lic_key', licenseKey)
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (classes && classes.length > 0) {
    console.log('📊 Available fields in tbl_class_queue:');
    console.log(Object.keys(classes[0]));
    console.log('\n📊 Sample record:');
    console.log(classes[0]);
  }
  
  console.log('\n🔍 Checking unique elements in view...');
  const { data: viewData, error: viewError } = await supabase
    .from('view_entry_class_join_distinct')
    .select('element, classid_fk')
    .eq('mobile_app_lic_key', licenseKey);
    
  if (!viewError && viewData) {
    const uniqueElements = [...new Set(viewData.map(item => item.element))];
    const uniqueClassIds = [...new Set(viewData.map(item => item.classid_fk))];
    console.log('📊 Unique elements:', uniqueElements);
    console.log('📊 Unique class IDs:', uniqueClassIds);
  }
}

checkClassFields().catch(console.error);