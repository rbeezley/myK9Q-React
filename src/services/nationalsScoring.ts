/**
 * AKC Scent Work Master National 2025 - Scoring Service
 *
 * Handles all scoring calculations, database operations, and business logic
 * for the Nationals scoring system according to AKC rules.
 *
 * Key Rules:
 * - Correct alert: +10 points
 * - Incorrect alert: -5 points
 * - Fault: -2 points
 * - Finish call error: -5 points
 * - Excused: 0 points, 120 seconds
 * - Top 100 advance to Day 3 finals
 */

import { supabase } from '../lib/supabase';

// Types matching our database schema
export type ElementType = 'CONTAINER' | 'BURIED' | 'INTERIOR' | 'EXTERIOR' | 'HD_CHALLENGE';
export type CompetitionDay = 1 | 2 | 3;

export interface NationalsScore {
  id?: number;
  entry_id: number;
  armband: string;
  element_type: ElementType;
  day: CompetitionDay;
  judge_id?: number;
  points: number;
  time_seconds: number;
  alerts_correct: number;
  alerts_incorrect: number;
  faults: number;
  finish_call_errors: number;
  excused: boolean;
  disqualified: boolean;
  no_time: boolean;
  scored_at?: string;
  scored_by?: string;
  notes?: string;
  mobile_app_lic_key: string;
}

export interface NationalsRanking {
  entry_id: number;
  armband: string;
  total_points: number;
  day1_points: number;
  day2_points: number;
  day3_points: number;
  total_time_seconds: number;
  day1_time_seconds: number;
  day2_time_seconds: number;
  day3_time_seconds: number;
  container_completed: boolean;
  buried_completed: boolean;
  interior_completed: boolean;
  exterior_completed: boolean;
  hd_challenge_completed: boolean;
  rank?: number;
  qualified_for_finals: boolean;
  final_rank?: number;
  eliminated: boolean;
  withdrawal: boolean;
  updated_at?: string;
  mobile_app_lic_key: string;
}

export interface LeaderboardEntry {
  entry_id: number;
  armband: string;
  call_name: string;
  breed: string;
  handler_name: string;
  handler_location: string;
  total_points: number;
  total_time_seconds: number;
  day1_points: number;
  day2_points: number;
  day3_points: number;
  rank?: number;
  qualified_for_finals: boolean;
  eliminated: boolean;
  withdrawal: boolean;
  container_completed: boolean;
  buried_completed: boolean;
  interior_completed: boolean;
  exterior_completed: boolean;
  hd_challenge_completed: boolean;
  completion_percentage: number;
  updated_at?: string;
}

export interface ScoringInput {
  entry_id: number;
  armband: string;
  element_type: ElementType;
  day: CompetitionDay;
  alerts_correct: number;
  alerts_incorrect: number;
  faults: number;
  finish_call_errors: number;
  time_seconds: number;
  excused?: boolean;
  disqualified?: boolean;
  judge_id?: number;
  notes?: string;
}

export class NationalsScoring {
  private licenseKey: string;

  constructor(licenseKey: string) {
    this.licenseKey = licenseKey;
  }

  /**
   * Calculate points based on AKC Nationals scoring rules
   */
  calculatePoints(input: Pick<ScoringInput, 'alerts_correct' | 'alerts_incorrect' | 'faults' | 'finish_call_errors' | 'excused'>): number {
    // Excused dogs get 0 points
    if (input.excused) {
      return 0;
    }

    const correctPoints = input.alerts_correct * 10;
    const incorrectPenalty = input.alerts_incorrect * 5;
    const faultPenalty = input.faults * 2;
    const finishErrorPenalty = input.finish_call_errors * 5;

    const totalPoints = correctPoints - incorrectPenalty - faultPenalty - finishErrorPenalty;

    // Points can go negative but typically won't go below -20
    return totalPoints;
  }

  /**
   * Handle excused dog special case (0 points, 120 seconds)
   */
  handleExcusedDog(input: ScoringInput): NationalsScore {
    return {
      entry_id: input.entry_id,
      armband: input.armband,
      element_type: input.element_type,
      day: input.day,
      judge_id: input.judge_id,
      points: 0,
      time_seconds: 120, // Max time for excused
      alerts_correct: 0,
      alerts_incorrect: 0,
      faults: 0,
      finish_call_errors: 0,
      excused: true,
      disqualified: false,
      no_time: false,
      notes: input.notes || 'Dog excused',
      mobile_app_lic_key: this.licenseKey
    };
  }

  /**
   * Create a complete score record from scoring input
   */
  createScore(input: ScoringInput): NationalsScore {
    // Handle excused dogs
    if (input.excused) {
      return this.handleExcusedDog(input);
    }

    // Calculate points
    const points = this.calculatePoints(input);

    // Ensure time is within bounds (0-120 seconds)
    const time_seconds = Math.max(0, Math.min(120, input.time_seconds));

    return {
      entry_id: input.entry_id,
      armband: input.armband,
      element_type: input.element_type,
      day: input.day,
      judge_id: input.judge_id,
      points,
      time_seconds,
      alerts_correct: input.alerts_correct,
      alerts_incorrect: input.alerts_incorrect,
      faults: input.faults,
      finish_call_errors: input.finish_call_errors,
      excused: false,
      disqualified: input.disqualified || false,
      no_time: time_seconds >= 120,
      notes: input.notes,
      mobile_app_lic_key: this.licenseKey
    };
  }

  /**
   * Submit a score to the database
   */
  async submitScore(input: ScoringInput): Promise<{ data: NationalsScore | null; error: any }> {
    try {
      const score = this.createScore(input);

      const { data, error } = await supabase
        .from('nationals_scores')
        .insert([score])
        .select()
        .single();

      if (error) {
        console.error('Error submitting nationals score:', error);
        return { data: null, error };
      }

      console.log('✅ Nationals score submitted:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Exception submitting nationals score:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing score
   */
  async updateScore(scoreId: number, input: Partial<ScoringInput>): Promise<{ data: NationalsScore | null; error: any }> {
    try {
      // Get existing score
      const { data: existingScore, error: fetchError } = await supabase
        .from('nationals_scores')
        .select('*')
        .eq('id', scoreId)
        .eq('mobile_app_lic_key', this.licenseKey)
        .single();

      if (fetchError || !existingScore) {
        return { data: null, error: fetchError || 'Score not found' };
      }

      // Merge with updates
      const updatedInput: ScoringInput = {
        entry_id: existingScore.entry_id,
        armband: existingScore.armband,
        element_type: existingScore.element_type,
        day: existingScore.day,
        alerts_correct: input.alerts_correct ?? existingScore.alerts_correct,
        alerts_incorrect: input.alerts_incorrect ?? existingScore.alerts_incorrect,
        faults: input.faults ?? existingScore.faults,
        finish_call_errors: input.finish_call_errors ?? existingScore.finish_call_errors,
        time_seconds: input.time_seconds ?? existingScore.time_seconds,
        excused: input.excused ?? existingScore.excused,
        disqualified: input.disqualified ?? existingScore.disqualified,
        judge_id: input.judge_id ?? existingScore.judge_id,
        notes: input.notes ?? existingScore.notes
      };

      const updatedScore = this.createScore(updatedInput);

      const { data, error } = await supabase
        .from('nationals_scores')
        .update(updatedScore)
        .eq('id', scoreId)
        .eq('mobile_app_lic_key', this.licenseKey)
        .select()
        .single();

      if (error) {
        console.error('Error updating nationals score:', error);
        return { data: null, error };
      }

      console.log('✅ Nationals score updated:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Exception updating nationals score:', error);
      return { data: null, error };
    }
  }

  /**
   * Get current leaderboard
   */
  async getLeaderboard(limit?: number): Promise<{ data: LeaderboardEntry[]; error: any }> {
    try {
      let query = supabase
        .from('view_nationals_leaderboard')
        .select('*')
        .eq('mobile_app_lic_key', this.licenseKey)
        .order('rank', { ascending: true, nullsFirst: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Exception fetching leaderboard:', error);
      return { data: [], error };
    }
  }

  /**
   * Get top 100 qualifiers for finals
   */
  async getQualifiers(): Promise<{ data: LeaderboardEntry[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('view_nationals_qualifiers')
        .select('*')
        .eq('mobile_app_lic_key', this.licenseKey)
        .order('rank', { ascending: true });

      if (error) {
        console.error('Error fetching qualifiers:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Exception fetching qualifiers:', error);
      return { data: [], error };
    }
  }

  /**
   * Get scores for a specific dog
   */
  async getDogScores(entryId: number): Promise<{ data: NationalsScore[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('nationals_scores')
        .select('*')
        .eq('entry_id', entryId)
        .eq('mobile_app_lic_key', this.licenseKey)
        .order('day', { ascending: true })
        .order('element_type', { ascending: true });

      if (error) {
        console.error('Error fetching dog scores:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Exception fetching dog scores:', error);
      return { data: [], error };
    }
  }

  /**
   * Get element progress statistics
   */
  async getElementProgress(): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('view_element_progress')
        .select('*')
        .order('day', { ascending: true })
        .order('element_type', { ascending: true });

      if (error) {
        console.error('Error fetching element progress:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Exception fetching element progress:', error);
      return { data: [], error };
    }
  }

  /**
   * Force recalculation of all rankings
   */
  async recalculateRankings(): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase.rpc('calculate_nationals_rankings');

      if (error) {
        console.error('Error recalculating rankings:', error);
        return { success: false, error };
      }

      console.log('✅ Rankings recalculated successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('Exception recalculating rankings:', error);
      return { success: false, error };
    }
  }

  /**
   * Get current advancement status (top 100 cut line)
   */
  async getAdvancementStatus(): Promise<{
    cutLinePoints: number;
    cutLineTime: number;
    qualifiedCount: number;
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('nationals_rankings')
        .select('day1_points, day2_points, day1_time_seconds, day2_time_seconds')
        .eq('mobile_app_lic_key', this.licenseKey)
        .gt('day1_points', 0)
        .gt('day2_points', 0)
        .order('rank', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching advancement status:', error);
        return { cutLinePoints: 0, cutLineTime: 0, qualifiedCount: 0, error };
      }

      const qualifiedCount = data?.length || 0;

      if (qualifiedCount >= 100) {
        const cutOffEntry = data[99]; // 100th place (0-indexed)
        const cutLinePoints = cutOffEntry.day1_points + cutOffEntry.day2_points;
        const cutLineTime = cutOffEntry.day1_time_seconds + cutOffEntry.day2_time_seconds;

        return { cutLinePoints, cutLineTime, qualifiedCount, error: null };
      }

      return { cutLinePoints: 0, cutLineTime: 0, qualifiedCount, error: null };
    } catch (error) {
      console.error('Exception fetching advancement status:', error);
      return { cutLinePoints: 0, cutLineTime: 0, qualifiedCount: 0, error };
    }
  }

  /**
   * Validate scoring input
   */
  validateScoringInput(input: ScoringInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!input.armband || input.armband.trim() === '') {
      errors.push('Armband is required');
    }

    if (input.alerts_correct < 0 || input.alerts_correct > 10) {
      errors.push('Correct alerts must be between 0 and 10');
    }

    if (input.alerts_incorrect < 0 || input.alerts_incorrect > 10) {
      errors.push('Incorrect alerts must be between 0 and 10');
    }

    if (input.faults < 0 || input.faults > 20) {
      errors.push('Faults must be between 0 and 20');
    }

    if (input.finish_call_errors < 0 || input.finish_call_errors > 10) {
      errors.push('Finish call errors must be between 0 and 10');
    }

    if (input.time_seconds < 0 || input.time_seconds > 120) {
      errors.push('Time must be between 0 and 120 seconds');
    }

    // Element type validation
    const validElements: ElementType[] = ['CONTAINER', 'BURIED', 'INTERIOR', 'EXTERIOR', 'HD_CHALLENGE'];
    if (!validElements.includes(input.element_type)) {
      errors.push('Invalid element type');
    }

    // Day validation
    if (![1, 2, 3].includes(input.day)) {
      errors.push('Day must be 1, 2, or 3');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export a singleton instance with default license key
export const nationalsScoring = new NationalsScoring(
  import.meta.env.VITE_DEFAULT_LICENSE_KEY || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
);

// Export utility functions
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatPoints = (points: number): string => {
  return points >= 0 ? `+${points}` : `${points}`;
};

export const getElementDisplayName = (element: ElementType): string => {
  switch (element) {
    case 'CONTAINER': return 'Container';
    case 'BURIED': return 'Buried';
    case 'INTERIOR': return 'Interior';
    case 'EXTERIOR': return 'Exterior';
    case 'HD_CHALLENGE': return 'Handler Discrimination';
    default: return element;
  }
};