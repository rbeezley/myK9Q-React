/**
 * Auto-Download Service
 *
 * Automatically downloads entire show data on login for offline use.
 * Only downloads for admin/judge/steward roles (not exhibitors).
 *
 * Strategy:
 * - One passcode = one show (1:1 relationship via license key)
 * - Downloads ALL classes and entries for that show
 * - Typical size: ~0.5 MB (50 classes, 600+ entries)
 * - Cache freshness: 30 minutes (prevents redundant downloads)
 * - Non-blocking: Runs in background, doesn't delay navigation
 * - Fail-safe: Errors are logged but don't block app usage
 */

import { getClassEntries } from './entryService';
import { supabase } from '../lib/supabase';
import { cache as idbCache } from '@/utils/indexedDB';

interface DownloadProgress {
  current: number;
  total: number;
  classId: number;
  className: string;
}

interface DownloadResult {
  success: boolean;
  downloaded: number;
  total: number;
  errors: number[];
}

interface CachedDownload {
  downloaded: boolean;
  classCount: number;
  timestamp: number;
}

/**
 * Auto-download entire show for offline use
 * Downloads all classes and entries for the given license key
 *
 * @param licenseKey - License key tied to the passcode (one show per passcode)
 * @param onProgress - Optional progress callback for UI updates
 * @returns Promise with download results
 */
export async function autoDownloadShow(
  licenseKey: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {

  try {
    console.log('🚀 [AUTO-DOWNLOAD] Starting for license:', licenseKey);

    // 1. Check if already cached and fresh (< 30 min old)
    const cacheKey = `auto-download-${licenseKey}`;
    const cached = await idbCache.get<CachedDownload>(cacheKey);

    if (cached && cached.data.downloaded && Date.now() - cached.timestamp < 30 * 60 * 1000) {
      const ageMinutes = Math.round((Date.now() - cached.timestamp) / 60000);
      console.log(`✅ [AUTO-DOWNLOAD] Show already cached and fresh (${ageMinutes} min old)`);
      return {
        success: true,
        downloaded: cached.data.classCount,
        total: cached.data.classCount,
        errors: []
      };
    }

    // 2. Get ALL classes for this show (via license key)
    // One passcode = one license key = one show
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        element,
        level,
        section,
        trials!inner(
          trial_number,
          shows!inner(
            license_key
          )
        )
      `)
      .eq('trials.shows.license_key', licenseKey)
      .order('trials.trial_number', { ascending: true })
      .order('element', { ascending: true })
      .order('level', { ascending: true });

    if (error) {
      console.error('❌ [AUTO-DOWNLOAD] Failed to fetch classes:', error);
      return { success: false, downloaded: 0, total: 0, errors: [] };
    }

    if (!classes || classes.length === 0) {
      console.log('⚠️ [AUTO-DOWNLOAD] No classes found for show');
      return { success: false, downloaded: 0, total: 0, errors: [] };
    }

    console.log(`📥 [AUTO-DOWNLOAD] Downloading ${classes.length} classes...`);

    // 3. Download each class (entries + metadata)
    // getClassEntries() automatically caches to IndexedDB via useStaleWhileRevalidate
    let downloaded = 0;
    const errors: number[] = [];

    for (const classData of classes) {
      try {
        await getClassEntries(classData.id, licenseKey);
        downloaded++;

        // Report progress for UI updates
        const className = `${classData.element} ${classData.level}${
          classData.section && classData.section !== '-' ? ` ${classData.section}` : ''
        }`;

        onProgress?.({
          current: downloaded,
          total: classes.length,
          classId: classData.id,
          className
        });

        console.log(`📥 [AUTO-DOWNLOAD] ${downloaded}/${classes.length}: ${className}`);

      } catch (error) {
        console.error(`❌ [AUTO-DOWNLOAD] Failed to download class ${classData.id}:`, error);
        errors.push(classData.id);
        // Continue with other classes (partial success is OK)
      }
    }

    // 4. Mark as cached with timestamp
    const cacheData: CachedDownload = {
      downloaded: true,
      classCount: downloaded,
      timestamp: Date.now()
    };

    await idbCache.set(cacheKey, cacheData, 30 * 60 * 1000); // 30 min TTL

    const success = errors.length === 0;
    const statusIcon = success ? '✅' : '⚠️';
    console.log(
      `${statusIcon} [AUTO-DOWNLOAD] Complete: ${downloaded}/${classes.length} classes`
    );

    if (errors.length > 0) {
      console.warn(`⚠️ [AUTO-DOWNLOAD] Failed to download ${errors.length} classes:`, errors);
    }

    return {
      success,
      downloaded,
      total: classes.length,
      errors
    };

  } catch (error) {
    console.error('❌ [AUTO-DOWNLOAD] Unexpected error:', error);
    return { success: false, downloaded: 0, total: 0, errors: [] };
  }
}

/**
 * Check if show is already cached for offline use
 *
 * @param licenseKey - License key for the show
 * @returns True if cached and fresh (< 30 min old)
 */
export async function isShowCached(licenseKey: string): Promise<boolean> {
  try {
    const cacheKey = `auto-download-${licenseKey}`;
    const cached = await idbCache.get<CachedDownload>(cacheKey);

    if (!cached || !cached.data.downloaded) {
      return false;
    }

    // Consider cached if < 30 min old
    const isFresh = Date.now() - cached.timestamp < 30 * 60 * 1000;
    return isFresh;

  } catch (error) {
    console.error('❌ [AUTO-DOWNLOAD] Error checking cache status:', error);
    return false;
  }
}

/**
 * Get cache status for a show
 *
 * @param licenseKey - License key for the show
 * @returns Cache status with age and class count
 */
export async function getCacheStatus(licenseKey: string) {
  try {
    const cacheKey = `auto-download-${licenseKey}`;
    const cached = await idbCache.get<CachedDownload>(cacheKey);

    if (!cached || !cached.data.downloaded) {
      return {
        isCached: false,
        age: null,
        classCount: 0,
        ageMinutes: 0
      };
    }

    const age = Date.now() - cached.timestamp;
    const ageMinutes = Math.round(age / 60000);
    const isFresh = age < 30 * 60 * 1000;

    return {
      isCached: isFresh,
      age, // milliseconds
      ageMinutes, // minutes
      classCount: cached.data.classCount || 0
    };

  } catch (error) {
    console.error('❌ [AUTO-DOWNLOAD] Error getting cache status:', error);
    return {
      isCached: false,
      age: null,
      classCount: 0,
      ageMinutes: 0
    };
  }
}

/**
 * Clear auto-download cache for a show
 * Useful for forcing a fresh download
 *
 * @param licenseKey - License key for the show
 */
export async function clearAutoDownloadCache(licenseKey: string): Promise<void> {
  try {
    const cacheKey = `auto-download-${licenseKey}`;
    await idbCache.delete(cacheKey);
    console.log('🗑️ [AUTO-DOWNLOAD] Cache cleared for license:', licenseKey);
  } catch (error) {
    console.error('❌ [AUTO-DOWNLOAD] Error clearing cache:', error);
  }
}
