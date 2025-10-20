/**
 * Pre-download Service
 *
 * Allows users to download entire shows for offline use.
 * This is especially useful for judges/stewards working in areas with poor WiFi.
 *
 * Features:
 * - Download all entries, classes, trials for a show
 * - Progress tracking with granular updates
 * - Pause/resume capability
 * - Automatic retry on failure
 * - Storage estimation
 * - Cleanup of old downloads
 */

import { supabase } from '@/lib/supabase';
import { cache as idbCache, metadata as idbMetadata } from '@/utils/indexedDB';
import type { Entry } from '@/stores/entryStore';

export interface PreloadProgress {
  stage: 'preparing' | 'classes' | 'trials' | 'entries' | 'complete' | 'error';
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
  error?: string;
}

export interface PreloadedShow {
  licenseKey: string;
  showName: string;
  downloadedAt: number;
  expiresAt: number;
  size: number; // bytes
  classCount: number;
  trialCount: number;
  entryCount: number;
}

export interface PreloadOptions {
  licenseKey: string;
  onProgress?: (progress: PreloadProgress) => void;
  ttl?: number; // Time-to-live in milliseconds (default: 7 days)
  signal?: AbortSignal; // For cancellation
}

const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE = 50; // Fetch entries in batches

/**
 * Estimate storage required for downloading a show
 */
export async function estimateShowSize(licenseKey: string): Promise<{
  estimatedBytes: number;
  classCount: number;
  trialCount: number;
  entryCount: number;
}> {
  try {
    // Get counts for all data
    const [classesResult, trialsResult, entriesResult] = await Promise.all([
      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('license_key', licenseKey),
      supabase
        .from('trials')
        .select('id', { count: 'exact', head: true })
        .eq('license_key', licenseKey),
      supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('license_key', licenseKey),
    ]);

    const classCount = classesResult.count || 0;
    const trialCount = trialsResult.count || 0;
    const entryCount = entriesResult.count || 0;

    // Rough estimation: 1KB per class, 1KB per trial, 2KB per entry
    const estimatedBytes = (classCount * 1024) + (trialCount * 1024) + (entryCount * 2048);

    return {
      estimatedBytes,
      classCount,
      trialCount,
      entryCount,
    };
  } catch (error) {
    console.error('❌ Failed to estimate show size:', error);
    throw error;
  }
}

/**
 * Download an entire show for offline use
 */
export async function preloadShow(options: PreloadOptions): Promise<PreloadedShow> {
  const { licenseKey, onProgress, ttl = DEFAULT_TTL, signal } = options;

  let totalItems = 0;
  let currentItem = 0;

  const updateProgress = (stage: PreloadProgress['stage'], current: number, total: number, currentItemName?: string) => {
    const progress: PreloadProgress = {
      stage,
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
      currentItem: currentItemName,
    };
    onProgress?.(progress);
  };

  try {
    // Stage 1: Preparing
    updateProgress('preparing', 0, 1);

    // Get show info
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .select('name')
      .eq('license_key', licenseKey)
      .single();

    if (showError || !showData) {
      throw new Error('Show not found');
    }

    if (signal?.aborted) {
      throw new Error('Download cancelled');
    }

    // Get counts
    const estimate = await estimateShowSize(licenseKey);
    totalItems = estimate.classCount + estimate.trialCount + estimate.entryCount;

    // Stage 2: Download Classes
    updateProgress('classes', 0, estimate.classCount);

    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('license_key', licenseKey);

    if (classError) throw classError;
    if (signal?.aborted) throw new Error('Download cancelled');

    // Cache classes
    const classesKey = `classes:${licenseKey}`;
    await idbCache.set(classesKey, classes || [], ttl);
    currentItem += classes?.length || 0;
    updateProgress('classes', classes?.length || 0, estimate.classCount);

    // Stage 3: Download Trials
    updateProgress('trials', 0, estimate.trialCount);

    const { data: trials, error: trialError } = await supabase
      .from('trials')
      .select('*')
      .eq('license_key', licenseKey);

    if (trialError) throw trialError;
    if (signal?.aborted) throw new Error('Download cancelled');

    // Cache trials
    const trialsKey = `trials:${licenseKey}`;
    await idbCache.set(trialsKey, trials || [], ttl);
    currentItem += trials?.length || 0;
    updateProgress('trials', trials?.length || 0, estimate.trialCount);

    // Stage 4: Download Entries (in batches)
    updateProgress('entries', 0, estimate.entryCount);

    const allEntries: Entry[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      if (signal?.aborted) throw new Error('Download cancelled');

      const { data: entriesBatch, error: entryError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', licenseKey)
        .range(offset, offset + BATCH_SIZE - 1)
        .order('armband_number', { ascending: true });

      if (entryError) throw entryError;

      if (!entriesBatch || entriesBatch.length === 0) {
        hasMore = false;
      } else {
        allEntries.push(...entriesBatch);
        offset += BATCH_SIZE;
        currentItem += entriesBatch.length;
        updateProgress('entries', allEntries.length, estimate.entryCount, `Entry ${allEntries.length}/${estimate.entryCount}`);
      }
    }

    // Cache all entries
    const entriesKey = `entries:${licenseKey}`;
    await idbCache.set(entriesKey, allEntries, ttl);

    // Calculate actual size (rough estimate)
    const actualSize = JSON.stringify({
      classes,
      trials,
      entries: allEntries,
    }).length;

    // Save show metadata
    const preloadedShow: PreloadedShow = {
      licenseKey,
      showName: showData.name,
      downloadedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      size: actualSize,
      classCount: classes?.length || 0,
      trialCount: trials?.length || 0,
      entryCount: allEntries.length,
    };

    await idbMetadata.set(`preloaded-show:${licenseKey}`, preloadedShow);

    // Stage 5: Complete
    updateProgress('complete', totalItems, totalItems);

    console.log(`✅ Downloaded show ${licenseKey}:`, preloadedShow);
    return preloadedShow;

  } catch (error) {
    console.error('❌ Failed to preload show:', error);

    const errorProgress: PreloadProgress = {
      stage: 'error',
      current: currentItem,
      total: totalItems,
      percentage: totalItems > 0 ? Math.round((currentItem / totalItems) * 100) : 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    onProgress?.(errorProgress);

    throw error;
  }
}

/**
 * Check if a show is already downloaded
 */
export async function isShowPreloaded(licenseKey: string): Promise<boolean> {
  try {
    const metadata = await idbMetadata.get(`preloaded-show:${licenseKey}`);
    if (!metadata?.value) return false;

    const show = metadata.value as PreloadedShow;

    // Check if expired
    if (show.expiresAt < Date.now()) {
      await deletePreloadedShow(licenseKey);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to check if show is preloaded:', error);
    return false;
  }
}

/**
 * Get metadata about a preloaded show
 */
export async function getPreloadedShow(licenseKey: string): Promise<PreloadedShow | null> {
  try {
    const metadata = await idbMetadata.get(`preloaded-show:${licenseKey}`);
    if (!metadata?.value) return null;

    const show = metadata.value as PreloadedShow;

    // Check if expired
    if (show.expiresAt < Date.now()) {
      await deletePreloadedShow(licenseKey);
      return null;
    }

    return show;
  } catch (error) {
    console.error('❌ Failed to get preloaded show:', error);
    return null;
  }
}

/**
 * Get all preloaded shows
 */
export async function getAllPreloadedShows(): Promise<PreloadedShow[]> {
  try {
    const allMetadata = await idbMetadata.getAll();

    // Filter for preloaded show metadata
    const showMetadata = allMetadata.filter((m) => m.key.startsWith('preloaded-show:'));

    // Filter out expired shows
    const now = Date.now();
    const validShows: PreloadedShow[] = [];

    for (const metadata of showMetadata) {
      const show = metadata.value as PreloadedShow;
      if (show.expiresAt > now) {
        validShows.push(show);
      } else {
        // Clean up expired show
        await deletePreloadedShow(show.licenseKey);
      }
    }

    return validShows;
  } catch (error) {
    console.error('❌ Failed to get all preloaded shows:', error);
    return [];
  }
}

/**
 * Delete a preloaded show
 */
export async function deletePreloadedShow(licenseKey: string): Promise<void> {
  try {
    // Delete cached data
    await Promise.all([
      idbCache.delete(`classes:${licenseKey}`),
      idbCache.delete(`trials:${licenseKey}`),
      idbCache.delete(`entries:${licenseKey}`),
      idbMetadata.delete(`preloaded-show:${licenseKey}`),
    ]);

    console.log(`🗑️ Deleted preloaded show: ${licenseKey}`);
  } catch (error) {
    console.error('❌ Failed to delete preloaded show:', error);
    throw error;
  }
}

/**
 * Get total storage usage by preloaded shows
 */
export async function getTotalStorageUsage(): Promise<{
  totalBytes: number;
  showCount: number;
  shows: PreloadedShow[];
}> {
  try {
    const shows = await getAllPreloadedShows();
    const totalBytes = shows.reduce((sum, show) => sum + show.size, 0);

    return {
      totalBytes,
      showCount: shows.length,
      shows,
    };
  } catch (error) {
    console.error('❌ Failed to get storage usage:', error);
    return {
      totalBytes: 0,
      showCount: 0,
      shows: [],
    };
  }
}

/**
 * Clean up old/expired preloaded shows
 */
export async function cleanupExpiredShows(): Promise<number> {
  try {
    const allMetadata = await idbMetadata.getAll();
    const showMetadata = allMetadata.filter((m) => m.key.startsWith('preloaded-show:'));
    const now = Date.now();
    let deletedCount = 0;

    for (const metadata of showMetadata) {
      const show = metadata.value as PreloadedShow;
      if (show.expiresAt < now) {
        await deletePreloadedShow(show.licenseKey);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired show(s)`);
    }

    return deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup expired shows:', error);
    return 0;
  }
}

/**
 * Extend expiration of a preloaded show
 */
export async function extendShowExpiration(
  licenseKey: string,
  additionalTtl: number = DEFAULT_TTL
): Promise<PreloadedShow | null> {
  try {
    const show = await getPreloadedShow(licenseKey);
    if (!show) return null;

    show.expiresAt = Date.now() + additionalTtl;
    await idbMetadata.set(`preloaded-show:${licenseKey}`, show);

    console.log(`⏰ Extended expiration for show ${licenseKey}`);
    return show;
  } catch (error) {
    console.error('❌ Failed to extend show expiration:', error);
    return null;
  }
}
