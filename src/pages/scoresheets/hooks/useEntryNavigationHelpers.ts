/**
 * useEntryNavigation Helper Functions
 *
 * Extracted from useEntryNavigation.ts to reduce complexity.
 * Contains the entry loading logic split into separate functions.
 */

import type { Entry as StoreEntry } from '../../../stores/entryStore';
import type { Entry as ReplicatedEntry } from '../../../services/replication/tables/ReplicatedEntriesTable';
import type { Class } from '../../../services/replication/tables/ReplicatedClassesTable';
import type { Trial } from '../../../services/replication/tables/ReplicatedTrialsTable';
import type { Entry } from '../../../stores/entryStore';
import type { AreaScore } from '../../../services/scoresheets/areaInitialization';
import { markInRing } from '../../../services/entryService';
import { initializeAreas } from '../../../services/scoresheets/areaInitialization';
import { ensureReplicationManager } from '../../../utils/replicationHelper';
import { logger } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface ClassInfo {
  element: string;
  level: string;
  section?: string;
}

export interface RouteState {
  entry?: StoreEntry;
  classInfo?: ClassInfo;
}

export interface LoadEntriesCallbacks {
  onEntryLoaded?: (entry: Entry, areas: AreaScore[]) => void;
  onTrialDateLoaded?: (date: string) => void;
  onTrialNumberLoaded?: (number: string) => void;
}

export interface FastPathResult {
  entry: Entry;
  classInfo: ClassInfo;
  areas: AreaScore[];
}

export interface SlowPathResult {
  entries: Entry[];
  targetEntry: Entry | null;
  classInfo: ClassInfo;
  areas: AreaScore[];
}

// ============================================================================
// Fast Path - Load from Route State
// ============================================================================

/**
 * Load entry data from route state (instant load optimization).
 * This skips all IndexedDB operations for much faster rendering.
 */
export function loadFromRouteState(
  routeState: RouteState,
  isNationals: boolean
): FastPathResult {
   
  logger.log('⚡ [useEntryNavigation] Using route state for instant load');

  const passedEntry = routeState.entry!;
  const passedClassInfo = routeState.classInfo!;

  const classInfo: ClassInfo = {
    element: passedClassInfo.element,
    level: passedClassInfo.level,
    section: passedClassInfo.section
  };

  const areas = initializeAreas(
    passedEntry.element || '',
    passedEntry.level || '',
    isNationals
  );

  // Mark in ring in background (fire-and-forget)
  // Pass current status so it can be restored if scoresheet is canceled
  markInRing(passedEntry.id, true, passedEntry.status).catch(console.error);

  return {
    entry: passedEntry,
    classInfo,
    areas
  };
}

// ============================================================================
// Slow Path - Load from IndexedDB
// ============================================================================

/**
 * Load class data from replication cache.
 * Syncs if not found in cache.
 */
async function loadClassData(
  manager: Awaited<ReturnType<typeof ensureReplicationManager>>,
  classId: string
): Promise<Class> {
  const classesTable = manager.getTable('classes');
  if (!classesTable) {
    throw new Error('Classes table not registered');
  }

  let classData = await classesTable.get(classId) as Class | undefined;

  if (!classData) {
    await manager.syncTable('classes');
    classData = await classesTable.get(classId) as Class | undefined;

    if (!classData) {
      throw new Error(`Class ${classId} not found`);
    }
  }

  return classData;
}

/**
 * Load trial data and format date/number.
 */
async function loadTrialData(
  manager: Awaited<ReturnType<typeof ensureReplicationManager>>,
  trialId: number,
  callbacks: LoadEntriesCallbacks
): Promise<void> {
  const trialsTable = manager.getTable('trials');
  if (!trialsTable) return;

  const trialData = await trialsTable.get(String(trialId)) as Trial | undefined;

  if (trialData?.trial_date) {
    const rawDate = trialData.trial_date;
    const [year, month, day] = rawDate.split('T')[0].split('-');
    const formatted = `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    callbacks.onTrialDateLoaded?.(formatted);
    callbacks.onTrialNumberLoaded?.(String(trialData.trial_number || '1'));
  }
}

/**
 * Load entries for a class from replication cache.
 * Syncs if no entries found.
 */
async function loadClassEntries(
  manager: Awaited<ReturnType<typeof ensureReplicationManager>>,
  classId: string
): Promise<ReplicatedEntry[]> {
  const entriesTable = manager.getTable('entries');
  if (!entriesTable) {
    throw new Error('Entries table not registered');
  }

  let allEntries = await entriesTable.getAll() as ReplicatedEntry[];
  let classEntries = allEntries.filter(entry => String(entry.class_id) === classId);

  if (classEntries.length === 0) {
    await manager.syncTable('entries');
    allEntries = await entriesTable.getAll() as ReplicatedEntry[];
    classEntries = allEntries.filter(entry => String(entry.class_id) === classId);
  }

  return classEntries;
}

/**
 * Transform replicated entries to store format.
 */
export function transformEntries(
  classEntries: ReplicatedEntry[],
  classData: Class
): Entry[] {
  return classEntries.map(entry => ({
    id: parseInt(entry.id),
    armband: entry.armband_number,
    callName: entry.dog_call_name || 'Unknown',
    breed: entry.dog_breed || 'Unknown',
    handler: entry.handler_name || 'Unknown',
    isScored: entry.is_scored || false,
    status: (entry.entry_status as Entry['status']) || 'no-status',
    classId: parseInt(entry.class_id),
    className: `${classData.element} ${classData.level}`,
    element: classData.element,
    level: classData.level,
    section: classData.section,
    timeLimit: classData.time_limit_seconds ? String(classData.time_limit_seconds) : undefined,
    timeLimit2: classData.time_limit_area2_seconds ? String(classData.time_limit_area2_seconds) : undefined,
    timeLimit3: classData.time_limit_area3_seconds ? String(classData.time_limit_area3_seconds) : undefined,
  }));
}

/**
 * Load entry data from IndexedDB (slow path).
 * Used as fallback for direct URL access.
 */
export async function loadFromIndexedDB(
  classId: string,
  entryId: string | undefined,
  isNationals: boolean,
  callbacks: LoadEntriesCallbacks
): Promise<SlowPathResult> {
  const manager = await ensureReplicationManager();

  const entriesTable = manager.getTable('entries');
  const classesTable = manager.getTable('classes');
  const trialsTable = manager.getTable('trials');

  if (!entriesTable || !classesTable || !trialsTable) {
    throw new Error('Required tables not registered');
  }

  // Load class data
  const classData = await loadClassData(manager, classId);

  const classInfo: ClassInfo = {
    element: classData.element,
    level: classData.level,
    section: classData.section
  };

  // Load trial data (fire callbacks for date/number)
  await loadTrialData(manager, classData.trial_id, callbacks);

  // Load entries
  const classEntries = await loadClassEntries(manager, classId);
  const transformedEntries = transformEntries(classEntries, classData);

  // Find target entry
  let targetEntry: Entry | null = null;
  if (entryId) {
    targetEntry = transformedEntries.find(e => e.id === parseInt(entryId)) || null;
  }
  if (!targetEntry && transformedEntries.length > 0) {
    targetEntry = transformedEntries[0];
  }

  // Initialize areas
  let areas: AreaScore[] = [];
  if (targetEntry) {
    // Pass current status so it can be restored if scoresheet is canceled
    await markInRing(targetEntry.id, true, targetEntry.status);
    areas = initializeAreas(
      targetEntry.element || '',
      targetEntry.level || '',
      isNationals
    );
  }

  return {
    entries: transformedEntries,
    targetEntry,
    classInfo,
    areas
  };
}

// ============================================================================
// Max Time Helpers
// ============================================================================

/**
 * Default max times based on AKC Scent Work requirements.
 */
export function getDefaultMaxTime(element: string, level: string): string {
  const elem = element?.toLowerCase() || '';
  const lvl = level?.toLowerCase() || '';

  // Container is always 2 minutes
  if (elem.includes('container')) {
    return '2:00';
  }

  // Interior is always 3 minutes
  if (elem.includes('interior')) {
    return '3:00';
  }

  // Exterior varies by level
  if (elem.includes('exterior')) {
    if (lvl.includes('excellent')) return '4:00';
    if (lvl.includes('master')) return '5:00';
    return '3:00';
  }

  // Buried varies by level
  if (elem.includes('buried')) {
    if (lvl.includes('excellent') || lvl.includes('master')) return '4:00';
    return '3:00';
  }

  // Default fallback
  return '3:00';
}

/**
 * Get max time for a specific area, falling back to defaults.
 */
export function getMaxTimeForAreaHelper(
  entry: Entry | null,
  areaIndex: number
): string {
  if (!entry) {
    return '3:00';
  }

  // Try to get max time from entry data
  let maxTime = '';
  switch (areaIndex) {
    case 0:
      maxTime = entry.timeLimit || '';
      break;
    case 1:
      maxTime = entry.timeLimit2 || '';
      break;
    case 2:
      maxTime = entry.timeLimit3 || '';
      break;
  }

  // Convert if stored as seconds (e.g., 240 -> 4:00)
  if (maxTime && !maxTime.includes(':')) {
    const totalSeconds = parseInt(maxTime);
    if (!isNaN(totalSeconds) && totalSeconds > 0) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      maxTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Fallback to defaults
  if (!maxTime || maxTime === '' || maxTime === '0:00') {
    maxTime = getDefaultMaxTime(entry.element || '', entry.level || '');
  }

  return maxTime;
}
