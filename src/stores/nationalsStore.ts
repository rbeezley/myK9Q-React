/**
 * AKC Nationals Scoring Store
 *
 * Zustand store for managing Nationals scoring state, leaderboards,
 * and real-time updates across components.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  NationalsScoring,
  LeaderboardEntry,
  NationalsScore,
  ScoringInput,
  ElementType,
  CompetitionDay
} from '../services/nationalsScoring';

export interface ElementProgressStats {
  element_type: ElementType;
  day: CompetitionDay;
  total_entries: number;
  successful_entries: number;
  excused_entries: number;
  disqualified_entries: number;
  avg_points: number;
  max_points: number;
  avg_time_seconds: number;
  fastest_time_seconds: number;
}

export interface AdvancementStatus {
  cutLinePoints: number;
  cutLineTime: number;
  qualifiedCount: number;
  needMoreResults: boolean;
}

interface NationalsState {
  // Data
  leaderboard: LeaderboardEntry[];
  qualifiers: LeaderboardEntry[];
  elementProgress: ElementProgressStats[];
  advancementStatus: AdvancementStatus;
  currentScores: NationalsScore[];

  // UI State
  isLoading: boolean;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;

  // Real-time
  realtimeChannel: RealtimeChannel | null;

  // Scoring state
  isScoring: boolean;
  currentScoringEntry: number | null;
  scoringElement: ElementType | null;
  scoringDay: CompetitionDay | null;

  // Actions
  initializeStore: (licenseKey: string) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  refreshQualifiers: () => Promise<void>;
  refreshElementProgress: () => Promise<void>;
  refreshAdvancementStatus: () => Promise<void>;
  submitScore: (input: ScoringInput) => Promise<{ success: boolean; error?: any }>;
  updateScore: (scoreId: number, input: Partial<ScoringInput>) => Promise<{ success: boolean; error?: any }>;
  getDogScores: (entryId: number) => Promise<NationalsScore[]>;
  startScoring: (entryId: number, element: ElementType, day: CompetitionDay) => void;
  stopScoring: () => void;
  enableRealtime: () => Promise<void>;
  disableRealtime: () => void;
  clearError: () => void;
  forceRefresh: () => Promise<void>;
}

export const useNationalsStore = create<NationalsState>()(
  devtools(
    persist(
      (set, get) => {
        let scoringService: NationalsScoring | null = null;

        return {
          // Initial state
          leaderboard: [],
          qualifiers: [],
          elementProgress: [],
          advancementStatus: {
            cutLinePoints: 0,
            cutLineTime: 0,
            qualifiedCount: 0,
            needMoreResults: true
          },
          currentScores: [],
          isLoading: false,
          isConnected: false,
          lastUpdated: null,
          error: null,
          realtimeChannel: null,
          isScoring: false,
          currentScoringEntry: null,
          scoringElement: null,
          scoringDay: null,

          // Initialize store with license key
          initializeStore: async (licenseKey: string) => {
            set({ isLoading: true, error: null });

            try {
              scoringService = new NationalsScoring(licenseKey);

              // Load initial data in parallel
              await Promise.all([
                get().refreshLeaderboard(),
                get().refreshQualifiers(),
                get().refreshElementProgress(),
                get().refreshAdvancementStatus()
              ]);

              set({
                isLoading: false,
                isConnected: true,
                lastUpdated: new Date(),
                error: null
              });

              // Enable real-time updates
              await get().enableRealtime();
            } catch (error) {
              console.error('Failed to initialize nationals store:', error);
              set({
                isLoading: false,
                isConnected: false,
                error: 'Failed to initialize scoring system'
              });
            }
          },

          // Refresh leaderboard
          refreshLeaderboard: async () => {
            if (!scoringService) return;

            try {
              const { data, error } = await scoringService.getLeaderboard();

              if (error) {
                console.error('Error refreshing leaderboard:', error);
                set({ error: 'Failed to load leaderboard' });
                return;
              }

              set({
                leaderboard: data,
                lastUpdated: new Date(),
                error: null
              });
            } catch (error) {
              console.error('Exception refreshing leaderboard:', error);
              set({ error: 'Failed to load leaderboard' });
            }
          },

          // Refresh qualifiers
          refreshQualifiers: async () => {
            if (!scoringService) return;

            try {
              const { data, error } = await scoringService.getQualifiers();

              if (error) {
                console.error('Error refreshing qualifiers:', error);
                return;
              }

              set({
                qualifiers: data,
                lastUpdated: new Date()
              });
            } catch (error) {
              console.error('Exception refreshing qualifiers:', error);
            }
          },

          // Refresh element progress
          refreshElementProgress: async () => {
            if (!scoringService) return;

            try {
              const { data, error } = await scoringService.getElementProgress();

              if (error) {
                console.error('Error refreshing element progress:', error);
                return;
              }

              set({
                elementProgress: data,
                lastUpdated: new Date()
              });
            } catch (error) {
              console.error('Exception refreshing element progress:', error);
            }
          },

          // Refresh advancement status
          refreshAdvancementStatus: async () => {
            if (!scoringService) return;

            try {
              const result = await scoringService.getAdvancementStatus();

              if (result.error) {
                console.error('Error refreshing advancement status:', result.error);
                return;
              }

              set({
                advancementStatus: {
                  cutLinePoints: result.cutLinePoints,
                  cutLineTime: result.cutLineTime,
                  qualifiedCount: result.qualifiedCount,
                  needMoreResults: result.qualifiedCount < 100
                },
                lastUpdated: new Date()
              });
            } catch (error) {
              console.error('Exception refreshing advancement status:', error);
            }
          },

          // Submit a new score
          submitScore: async (input: ScoringInput) => {
            if (!scoringService) {
              return { success: false, error: 'Scoring service not initialized' };
            }

            try {
              set({ isLoading: true });

              // Validate input
              const validation = scoringService.validateScoringInput(input);
              if (!validation.isValid) {
                set({ isLoading: false, error: validation.errors.join(', ') });
                return { success: false, error: validation.errors.join(', ') };
              }

              const { data: _data, error } = await scoringService.submitScore(input);

              if (error) {
                console.error('Error submitting score:', error);
                set({ isLoading: false, error: 'Failed to submit score' });
                return { success: false, error };
              }

              // Refresh data after successful submission
              await Promise.all([
                get().refreshLeaderboard(),
                get().refreshQualifiers(),
                get().refreshElementProgress(),
                get().refreshAdvancementStatus()
              ]);

              set({
                isLoading: false,
                error: null,
                lastUpdated: new Date()
              });

              return { success: true };
            } catch (error) {
              console.error('Exception submitting score:', error);
              set({ isLoading: false, error: 'Failed to submit score' });
              return { success: false, error };
            }
          },

          // Update existing score
          updateScore: async (scoreId: number, input: Partial<ScoringInput>) => {
            if (!scoringService) {
              return { success: false, error: 'Scoring service not initialized' };
            }

            try {
              set({ isLoading: true });

              const { data: _data, error } = await scoringService.updateScore(scoreId, input);

              if (error) {
                console.error('Error updating score:', error);
                set({ isLoading: false, error: 'Failed to update score' });
                return { success: false, error };
              }

              // Refresh data after successful update
              await Promise.all([
                get().refreshLeaderboard(),
                get().refreshQualifiers(),
                get().refreshElementProgress(),
                get().refreshAdvancementStatus()
              ]);

              set({
                isLoading: false,
                error: null,
                lastUpdated: new Date()
              });

              return { success: true };
            } catch (error) {
              console.error('Exception updating score:', error);
              set({ isLoading: false, error: 'Failed to update score' });
              return { success: false, error };
            }
          },

          // Get scores for specific dog
          getDogScores: async (entryId: number) => {
            if (!scoringService) return [];

            try {
              const { data, error } = await scoringService.getDogScores(entryId);

              if (error) {
                console.error('Error fetching dog scores:', error);
                return [];
              }

              return data;
            } catch (error) {
              console.error('Exception fetching dog scores:', error);
              return [];
            }
          },

          // Start scoring session
          startScoring: (entryId: number, element: ElementType, day: CompetitionDay) => {
            set({
              isScoring: true,
              currentScoringEntry: entryId,
              scoringElement: element,
              scoringDay: day
            });
          },

          // Stop scoring session
          stopScoring: () => {
            set({
              isScoring: false,
              currentScoringEntry: null,
              scoringElement: null,
              scoringDay: null
            });
          },

          // Enable real-time updates
          enableRealtime: async () => {
            const { realtimeChannel } = get();

            // Don't create duplicate channels
            if (realtimeChannel) return;

            try {
              const channel = supabase.channel('nationals-updates');

              // Listen for score changes
              channel
                .on('postgres_changes',
                  {
                    event: '*',
                    schema: 'public',
                    table: 'nationals_scores'
                  },
                  () => {
                    console.log('📺 Nationals scores updated, refreshing...');
                    get().refreshLeaderboard();
                    get().refreshQualifiers();
                    get().refreshElementProgress();
                  }
                )
                .on('postgres_changes',
                  {
                    event: '*',
                    schema: 'public',
                    table: 'nationals_rankings'
                  },
                  () => {
                    console.log('📺 Nationals rankings updated, refreshing...');
                    get().refreshLeaderboard();
                    get().refreshQualifiers();
                    get().refreshAdvancementStatus();
                  }
                );

              await channel.subscribe();

              set({
                realtimeChannel: channel,
                isConnected: true
              });

              console.log('✅ Nationals real-time updates enabled');
            } catch (error) {
              console.error('Failed to enable real-time updates:', error);
              set({ isConnected: false });
            }
          },

          // Disable real-time updates
          disableRealtime: () => {
            const { realtimeChannel } = get();

            if (realtimeChannel) {
              supabase.removeChannel(realtimeChannel);
              set({
                realtimeChannel: null,
                isConnected: false
              });
              console.log('❌ Nationals real-time updates disabled');
            }
          },

          // Clear error
          clearError: () => {
            set({ error: null });
          },

          // Force refresh all data
          forceRefresh: async () => {
            set({ isLoading: true });

            await Promise.all([
              get().refreshLeaderboard(),
              get().refreshQualifiers(),
              get().refreshElementProgress(),
              get().refreshAdvancementStatus()
            ]);

            set({ isLoading: false });
          }
        };
      },
      {
        name: 'nationals-storage',
        partialize: (state) => ({
          // Only persist essential state, not real-time data
          isScoring: state.isScoring,
          currentScoringEntry: state.currentScoringEntry,
          scoringElement: state.scoringElement,
          scoringDay: state.scoringDay
        })
      }
    ),
    { name: 'nationals-store' }
  )
);