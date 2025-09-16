import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('📝 Please create a .env.local file with:');
  console.error('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('💡 See .env.example for template');
  throw new Error('Missing Supabase environment variables. Please check console for setup instructions.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on Flutter analysis
export interface ShowQueue {
  id: number;
  mobile_app_lic_key: string;
  show_name: string;
  club_name: string;
  show_date: string;
  trial_date: string;
  created_at: string;
  updated_at: string;
}

export interface TrialQueue {
  id: number;
  mobile_app_lic_key: string;
  trial_name: string;
  trial_date: string;
  trial_type: string;
  created_at: string;
  updated_at: string;
}

export interface ClassQueue {
  id: number;
  mobile_app_lic_key: string;
  class_name: string;
  class_type: string;
  trial_id: number;
  created_at: string;
  updated_at: string;
}

export interface EntryQueue {
  id: number;
  mobile_app_lic_key: string;
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
  result_text: string | null;
  search_time: string | null;
  fault_count: number | null;
  is_scored: boolean;
  in_ring: boolean;
  class_id: number;
  created_at: string;
  updated_at: string;
}

// Main view used by Flutter app
export interface ViewEntryClassJoinDistinct {
  id: number;
  mobile_app_lic_key: string;
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
  result_text: string | null;
  search_time: string | null;
  fault_count: number | null;
  is_scored: boolean;
  in_ring: boolean;
  class_name: string;
  class_type: string;
  trial_name: string;
  trial_type: string;
  show_name: string;
  club_name: string;
}