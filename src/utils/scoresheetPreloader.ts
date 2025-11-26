/**
 * Scoresheet JavaScript Bundle Preloader
 *
 * Preloads scoresheet JavaScript bundles to make navigation to scoresheets instant.
 * Works with React.lazy() components by triggering the import before navigation.
 */

// Map of scoresheet routes to their dynamic imports
const SCORESHEET_IMPORTS: Record<string, () => Promise<any>> = {
  'akc-scent-work': () => import('../pages/scoresheets/AKC/AKCScentWorkScoresheet'),
  'akc-fastcat': () => import('../pages/scoresheets/AKC/AKCFastCatScoresheet'),
  'ukc-obedience': () => import('../pages/scoresheets/UKC/UKCObedienceScoresheet'),
  'ukc-rally': () => import('../pages/scoresheets/UKC/UKCRallyScoresheet'),
  'ukc-nosework': () => import('../pages/scoresheets/UKC/UKCNoseworkScoresheet'),
  'asca-scent-detection': () => import('../pages/scoresheets/ASCA/ASCAScentDetectionScoresheet'),
};

/**
 * Cache for preloaded modules
 */
const preloadCache = new Map<string, Promise<any>>();

/**
 * Get scoresheet key from organization and element
 */
export function getScoresheetKey(org: string, element: string): string | null {
  const orgLower = org.toLowerCase();
  const elementLower = element.toLowerCase();

  // AKC Scoresheets
  if (orgLower.includes('akc')) {
    if (elementLower.includes('scent') || elementLower.includes('nosework')) {
      return 'akc-scent-work';
    }
    if (elementLower.includes('fastcat') || elementLower.includes('cat')) {
      return 'akc-fastcat';
    }
  }

  // UKC Scoresheets
  if (orgLower.includes('ukc')) {
    if (elementLower.includes('obedience')) {
      return 'ukc-obedience';
    }
    if (elementLower.includes('rally')) {
      return 'ukc-rally';
    }
    if (elementLower.includes('nosework') || elementLower.includes('scent')) {
      return 'ukc-nosework';
    }
  }

  // ASCA Scoresheets
  if (orgLower.includes('asca')) {
    if (elementLower.includes('scent') || elementLower.includes('detection')) {
      return 'asca-scent-detection';
    }
  }

  return null;
}

/**
 * Preload a scoresheet bundle
 */
export async function preloadScoresheet(key: string): Promise<void> {
  // Check if already cached
  if (preloadCache.has(key)) {
    console.log(`✅ Scoresheet bundle already preloaded: ${key}`);
    return;
  }

  const importFn = SCORESHEET_IMPORTS[key];
  if (!importFn) {
    console.warn(`⚠️ Unknown scoresheet key: ${key}`);
    return;
  }

  console.log(`📦 Preloading scoresheet bundle: ${key}`);

  // Store the promise in cache
  const importPromise = importFn();
  preloadCache.set(key, importPromise);

  try {
    await importPromise;
    console.log(`✅ Scoresheet bundle preloaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to preload scoresheet bundle: ${key}`, error);
    // Remove from cache on failure so it can be retried
    preloadCache.delete(key);
  }
}

/**
 * Preload scoresheet by organization and element
 */
export async function preloadScoresheetByType(org: string, element: string): Promise<void> {
  const key = getScoresheetKey(org, element);
  if (key) {
    await preloadScoresheet(key);
  }
}

/**
 * Preload all scoresheets (for use during idle time)
 */
export async function preloadAllScoresheets(): Promise<void> {
  console.log('📦 Preloading all scoresheet bundles...');
  const keys = Object.keys(SCORESHEET_IMPORTS);
  await Promise.all(keys.map(key => preloadScoresheet(key)));
  console.log('✅ All scoresheet bundles preloaded');
}

/**
 * Clear the preload cache
 */
export function clearPreloadCache(): void {
  preloadCache.clear();
  console.log('🗑️ Scoresheet preload cache cleared');
}

/**
 * Get the size of the preload cache
 */
export function getPreloadCacheSize(): number {
  return preloadCache.size;
}
