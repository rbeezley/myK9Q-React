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
  license_key: string;
  show_name: string;
  club_name: string;
  show_date: string;
  trial_date: string;
  created_at: string;
  updated_at: string;
}

export interface TrialQueue {
  id: number;
  show_id: number;
  trial_name: string;
  trial_date: string;
  trial_number: number;
  trial_type: string;
  total_class_count: number;
  completed_class_count: number;
  pending_class_count: number;
  total_entry_count: number;
  completed_entry_count: number;
  pending_entry_count: number;
  planned_start_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  access_trial_id: number | null;
  app_version: string;
  created_at: string;
  updated_at: string;
}

export interface ClassQueue {
  id: number;
  trial_id: number;
  element: string;
  level: string;
  section: string;
  judge_name: string | null;
  class_order: number;
  time_limit_seconds: number;
  time_limit_area2_seconds: number;
  time_limit_area3_seconds: number;
  area_count: number;
  self_checkin_enabled: boolean;
  realtime_results_enabled: boolean;
  is_completed: boolean;
  class_status: number;
  class_status_comment: string;
  total_entry_count: number;
  pending_entry_count: number;
  completed_entry_count: number;
  absent_entry_count: number;
  qualified_entry_count: number;
  nq_entry_count: number;
  excused_entry_count: number;
  in_progress_count: number;
  pre_entry_fee: number;
  day_of_show_fee: number;
  access_class_id: number | null;
  access_trial_id: number | null;
  access_show_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface EntryQueue {
  id: number;
  armband_number: number;
  handler_name: string;
  dog_call_name: string;
  dog_breed: string | null;
  run_order: number;
  exhibitor_order: number;
  check_in_status: number;
  is_paid: boolean;
  entry_fee: number;
  entry_type: number;
  is_qualified: boolean;
  is_absent: boolean;
  is_excused: boolean;
  is_withdrawn: boolean;
  has_health_issues: boolean;
  payment_method: string | null;
  withdrawal_reason: string | null;
  excuse_reason: string | null;
  health_timestamp: string | null;
  health_comment: string | null;
  online_order_number: string | null;
  myk9q_entry_data: any | null;
  access_entry_id: number | null;
  access_class_id: number | null;
  access_trial_id: number | null;
  access_show_id: number | null;
  access_exhibitor_id: number | null;
  class_id: number;
  section: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultQueue {
  id: number;
  entry_id: number;
  is_in_ring: boolean;
  is_scored: boolean;
  result_status: string;
  final_placement: number;
  search_time_seconds: number;
  area1_time_seconds: number;
  area2_time_seconds: number;
  area3_time_seconds: number;
  area4_time_seconds: number;
  total_correct_finds: number;
  total_incorrect_finds: number;
  total_faults: number;
  no_finish_count: number;
  area1_correct: number;
  area1_incorrect: number;
  area1_faults: number;
  area2_correct: number;
  area2_incorrect: number;
  area2_faults: number;
  area3_correct: number;
  area3_incorrect: number;
  area3_faults: number;
  total_score: number;
  points_earned: number;
  points_possible: number;
  has_video_review: boolean;
  bonus_points: number;
  penalty_points: number;
  time_over_limit: boolean;
  time_limit_exceeded_seconds: number;
  ring_entry_time: string | null;
  ring_exit_time: string | null;
  scoring_started_at: string | null;
  scoring_completed_at: string | null;
  disqualification_reason: string | null;
  judge_notes: string | null;
  video_review_notes: string | null;
  judge_signature: string | null;
  judge_signature_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

// Main view used by Flutter app
export interface ViewEntryClassJoinDistinct {
  id: number;
  license_key: string;
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