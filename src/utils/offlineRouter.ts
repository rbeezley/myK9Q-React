/**
 * Offline Router
 *
 * Enhances React Router with offline capabilities:
 * - Cache visited routes and their data
 * - Prefetch likely next routes based on navigation patterns
 * - Provide fallback UI when routes aren't cached
 * - Handle navigation without network
 *
 * Usage:
 * - Call initOfflineRouter() in App.tsx
 * - Use markRouteVisited() when routes load successfully
 * - Use prefetchRoute() for likely next routes
 */

import { cache as idbCache } from '@/utils/indexedDB';

export interface CachedRoute {
  path: string;
  timestamp: number;
  data?: any;
  html?: string;
}

const ROUTE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const visitedRoutes = new Set<string>();

/**
 * Initialize offline router
 * Call this once in App.tsx
 */
export function initOfflineRouter() {
  // Load visited routes from IndexedDB
  loadVisitedRoutes();

  // Listen for navigation events
  window.addEventListener('popstate', handleNavigation);

  console.log('🧭 Offline router initialized');
}

/**
 * Load visited routes from IndexedDB
 */
async function loadVisitedRoutes() {
  try {
    const cached = await idbCache.get<string[]>('visited-routes');
    if (cached?.data) {
      cached.data.forEach((route) => visitedRoutes.add(route));
      console.log(`🗺️ Loaded ${cached.data.length} visited routes`);
    }
  } catch (error) {
    console.error('Failed to load visited routes:', error);
  }
}

/**
 * Save visited routes to IndexedDB
 */
async function saveVisitedRoutes() {
  try {
    await idbCache.set('visited-routes', Array.from(visitedRoutes), ROUTE_CACHE_TTL);
  } catch (error) {
    console.error('Failed to save visited routes:', error);
  }
}

/**
 * Mark a route as visited and cache its data
 */
export async function markRouteVisited(path: string, data?: any) {
  visitedRoutes.add(path);
  await saveVisitedRoutes();

  // Cache route data
  const cached: CachedRoute = {
    path,
    timestamp: Date.now(),
    data,
  };

  try {
    await idbCache.set(`route:${path}`, cached, ROUTE_CACHE_TTL);
    console.log(`📍 Cached route: ${path}`);
  } catch (error) {
    console.error(`Failed to cache route ${path}:`, error);
  }
}

/**
 * Check if a route has been visited/cached
 */
export function isRouteVisited(path: string): boolean {
  return visitedRoutes.has(path);
}

/**
 * Get cached route data
 */
export async function getCachedRoute(path: string): Promise<CachedRoute | null> {
  try {
    const cached = await idbCache.get<CachedRoute>(`route:${path}`);
    if (!cached?.data) return null;

    // Check if expired
    const age = Date.now() - cached.data.timestamp;
    if (age > ROUTE_CACHE_TTL) {
      await idbCache.delete(`route:${path}`);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error(`Failed to get cached route ${path}:`, error);
    return null;
  }
}

/**
 * Prefetch a route and its data
 */
export async function prefetchRoute(path: string, fetchData: () => Promise<any>) {
  // Skip if already visited
  if (isRouteVisited(path)) {
    console.log(`⏭️ Skipping prefetch for already visited route: ${path}`);
    return;
  }

  try {
    console.log(`🔮 Prefetching route: ${path}`);
    const data = await fetchData();
    await markRouteVisited(path, data);
  } catch (error) {
    console.error(`Failed to prefetch route ${path}:`, error);
  }
}

/**
 * Predict and prefetch likely next routes based on current path
 */
export async function prefetchLikelyRoutes(
  currentPath: string,
  dataFetchers: { [path: string]: () => Promise<any> }
) {
  const predictions = predictNextRoutes(currentPath);

  for (const path of predictions) {
    if (dataFetchers[path]) {
      // Prefetch in background (don't await)
      prefetchRoute(path, dataFetchers[path]).catch((err) => {
        console.error(`Background prefetch failed for ${path}:`, err);
      });
    }
  }
}

/**
 * Predict likely next routes based on navigation patterns
 */
function predictNextRoutes(currentPath: string): string[] {
  const predictions: string[] = [];

  // Home page -> likely to visit class list
  if (currentPath === '/' || currentPath === '/home') {
    predictions.push('/class-list');
  }

  // Class list -> likely to visit entry list
  if (currentPath === '/class-list') {
    predictions.push('/entries');
  }

  // Entry list -> likely to visit scoresheets
  if (currentPath === '/entries') {
    // Can't predict specific scoresheet without entry ID
    // But we can prefetch entry data
  }

  // Scoresheet -> likely to return to entry list
  if (currentPath.startsWith('/scoresheet/')) {
    predictions.push('/entries');
  }

  return predictions;
}

/**
 * Handle navigation events
 */
function handleNavigation() {
  const path = window.location.pathname;
  console.log(`🧭 Navigated to: ${path}`);

  // Mark as visited (no data, just the path)
  markRouteVisited(path).catch((err) => {
    console.error('Failed to mark route as visited:', err);
  });
}

/**
 * Clear all cached routes
 */
export async function clearRoutingCache() {
  try {
    const routes = Array.from(visitedRoutes);
    for (const route of routes) {
      await idbCache.delete(`route:${route}`);
    }
    visitedRoutes.clear();
    await idbCache.delete('visited-routes');
    console.log('🗑️ Cleared all routing cache');
  } catch (error) {
    console.error('Failed to clear routing cache:', error);
  }
}

/**
 * Get all visited routes
 */
export function getVisitedRoutes(): string[] {
  return Array.from(visitedRoutes);
}

/**
 * Get routing statistics
 */
export async function getRoutingStats(): Promise<{
  visitedCount: number;
  cachedCount: number;
  totalSize: number;
}> {
  const routes = Array.from(visitedRoutes);
  let cachedCount = 0;
  let totalSize = 0;

  for (const route of routes) {
    const cached = await getCachedRoute(route);
    if (cached) {
      cachedCount++;
      totalSize += JSON.stringify(cached).length;
    }
  }

  return {
    visitedCount: routes.length,
    cachedCount,
    totalSize,
  };
}
