/**
 * useAutoCompleteSettings Hook
 *
 * Manages auto-complete stale classes settings at the trial level.
 * This feature automatically completes stale in-progress classes when
 * a judge starts scoring a different level.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface AutoCompleteSettingsResult {
  /** Map of trial_id to auto_complete_stale_classes setting (true = enabled, false = disabled, undefined = default/enabled) */
  trialAutoCompleteSettings: Map<number, boolean>;
  /** Whether the section is expanded */
  autoCompleteSectionExpanded: boolean;
  /** Set section expanded state */
  setAutoCompleteSectionExpanded: (expanded: boolean) => void;
  /** Set trial auto-complete setting */
  handleSetTrialAutoComplete: (
    trialId: number,
    enabled: boolean,
    trialLabel: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Reset trial to default (enabled) */
  handleResetTrialAutoComplete: (
    trialId: number,
    trialLabel: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Refresh settings from database */
  refreshSettings: () => void;
}

export function useAutoCompleteSettings(): AutoCompleteSettingsResult {
  const [trialAutoCompleteSettings, setTrialAutoCompleteSettings] = useState<Map<number, boolean>>(new Map());
  const [autoCompleteSectionExpanded, setAutoCompleteSectionExpanded] = useState(false);

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trials')
        .select('id, auto_complete_stale_classes')
        .not('auto_complete_stale_classes', 'is', null);

      if (error) {
        logger.error('[useAutoCompleteSettings] Error fetching settings:', error);
        return;
      }

      const settingsMap = new Map<number, boolean>();
      data?.forEach((trial) => {
        if (trial.auto_complete_stale_classes !== null) {
          settingsMap.set(trial.id, trial.auto_complete_stale_classes);
        }
      });
      setTrialAutoCompleteSettings(settingsMap);
    } catch (err) {
      logger.error('[useAutoCompleteSettings] Unexpected error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSetTrialAutoComplete = useCallback(async (
    trialId: number,
    enabled: boolean,
    trialLabel: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('trials')
        .update({
          auto_complete_stale_classes: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialId);

      if (error) {
        logger.error('[useAutoCompleteSettings] Error updating trial:', error);
        return { success: false, error: error.message };
      }

      // Update local state
      setTrialAutoCompleteSettings((prev) => {
        const newMap = new Map(prev);
        newMap.set(trialId, enabled);
        return newMap;
      });

      logger.log(`[useAutoCompleteSettings] Set auto-complete to ${enabled} for ${trialLabel}`);
      return { success: true };
    } catch (err) {
      logger.error('[useAutoCompleteSettings] Unexpected error:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }, []);

  const handleResetTrialAutoComplete = useCallback(async (
    trialId: number,
    trialLabel: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('trials')
        .update({
          auto_complete_stale_classes: null, // Reset to default (enabled)
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialId);

      if (error) {
        logger.error('[useAutoCompleteSettings] Error resetting trial:', error);
        return { success: false, error: error.message };
      }

      // Remove from local state (null means default/enabled)
      setTrialAutoCompleteSettings((prev) => {
        const newMap = new Map(prev);
        newMap.delete(trialId);
        return newMap;
      });

      logger.log(`[useAutoCompleteSettings] Reset auto-complete for ${trialLabel}`);
      return { success: true };
    } catch (err) {
      logger.error('[useAutoCompleteSettings] Unexpected error:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }, []);

  return {
    trialAutoCompleteSettings,
    autoCompleteSectionExpanded,
    setAutoCompleteSectionExpanded,
    handleSetTrialAutoComplete,
    handleResetTrialAutoComplete,
    refreshSettings: fetchSettings,
  };
}
