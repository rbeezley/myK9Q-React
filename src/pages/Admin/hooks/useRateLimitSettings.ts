/**
 * useRateLimitSettings Hook
 *
 * Manages rate limit status and clearing for admin users.
 * Allows admins to view blocked IPs and clear rate limits
 * when users are locked out due to failed login attempts.
 */

import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

// Storage keys (matching pushNotificationService and announcementStore)
const LICENSE_KEY_STORAGE = 'current_show_license';
const PASSCODE_SESSION_KEY = 'myK9Q_passcode';

export interface RateLimitEntry {
  ip_address: string;
  failed_attempts: number;
  last_attempt: string;
  is_blocked: boolean;
  blocked_until: string | null;
}

export interface RateLimitSettingsResult {
  /** List of IPs with failed login attempts */
  rateLimits: RateLimitEntry[];
  /** Number of currently blocked IPs */
  blockedCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the section is expanded */
  rateLimitSectionExpanded: boolean;
  /** Set section expanded state */
  setRateLimitSectionExpanded: (expanded: boolean) => void;
  /** Fetch current rate limit status */
  fetchRateLimitStatus: () => Promise<void>;
  /** Clear all rate limits */
  clearAllRateLimits: () => Promise<{ success: boolean; message: string }>;
  /** Clear rate limits for a specific IP */
  clearIpRateLimit: (ipAddress: string) => Promise<{ success: boolean; message: string }>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Helper to get auth credentials from storage
function getAuthCredentials(): { licenseKey: string | null; passcode: string | null } {
  return {
    licenseKey: localStorage.getItem(LICENSE_KEY_STORAGE),
    passcode: sessionStorage.getItem(PASSCODE_SESSION_KEY),
  };
}

export function useRateLimitSettings(): RateLimitSettingsResult {
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSectionExpanded, setRateLimitSectionExpanded] = useState(false);

  const fetchRateLimitStatus = useCallback(async () => {
    const { licenseKey, passcode } = getAuthCredentials();

    if (!licenseKey || !passcode) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${SUPABASE_URL}/functions/v1/clear-rate-limits?license_key=${encodeURIComponent(licenseKey)}&passcode=${encodeURIComponent(passcode)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch rate limit status');
      }

      setRateLimits(data.rate_limits || []);
      setBlockedCount(data.blocked_count || 0);
      logger.log(`[useRateLimitSettings] Fetched ${data.rate_limits?.length || 0} entries, ${data.blocked_count || 0} blocked`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[useRateLimitSettings] Error fetching status:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAllRateLimits = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const { licenseKey, passcode } = getAuthCredentials();

    if (!licenseKey || !passcode) {
      return { success: false, message: 'Not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${SUPABASE_URL}/functions/v1/clear-rate-limits`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: licenseKey,
          passcode: passcode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to clear rate limits');
      }

      // Refresh the list
      await fetchRateLimitStatus();

      logger.log(`[useRateLimitSettings] Cleared rate limits: ${data.message}`);
      return { success: true, message: data.message || 'Rate limits cleared' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[useRateLimitSettings] Error clearing rate limits:', err);
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchRateLimitStatus]);

  const clearIpRateLimit = useCallback(async (ipAddress: string): Promise<{ success: boolean; message: string }> => {
    const { licenseKey, passcode } = getAuthCredentials();

    if (!licenseKey || !passcode) {
      return { success: false, message: 'Not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${SUPABASE_URL}/functions/v1/clear-rate-limits`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: licenseKey,
          passcode: passcode,
          ip_address: ipAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to clear rate limit');
      }

      // Refresh the list
      await fetchRateLimitStatus();

      logger.log(`[useRateLimitSettings] Cleared rate limit for ${ipAddress}: ${data.message}`);
      return { success: true, message: data.message || 'Rate limit cleared' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[useRateLimitSettings] Error clearing rate limit:', err);
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchRateLimitStatus]);

  return {
    rateLimits,
    blockedCount,
    isLoading,
    error,
    rateLimitSectionExpanded,
    setRateLimitSectionExpanded,
    fetchRateLimitStatus,
    clearAllRateLimits,
    clearIpRateLimit,
  };
}
