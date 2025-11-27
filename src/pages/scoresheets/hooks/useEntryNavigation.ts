/**
 * useEntryNavigation Hook
 *
 * Handles entry loading and navigation for AKC scoresheets.
 * Extracts shared entry management logic from scoresheet components.
 *
 * Features:
 * - Load entries from replication cache
 * - Sync from server if cache is empty
 * - Transform entries to store format
 * - Navigate between entries
 * - Mark entries as "in ring"
 * - Initialize areas based on element/level
 *
 * @see docs/SCORESHEET_REFACTORING_PLAN.md
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore } from '../../../stores';
import { useAuth } from '../../../contexts/AuthContext';
import { markInRing } from '../../../services/entryService';
import { ensureReplicationManager } from '../../../utils/replicationHelper';
import { initializeAreas, type AreaScore } from '../../../services/scoresheets/areaInitialization';
import type { Entry as ReplicatedEntry } from '../../../services/replication/tables/ReplicatedEntriesTable';
import type { Class } from '../../../services/replication/tables/ReplicatedClassesTable';
import type { Trial } from '../../../services/replication/tables/ReplicatedTrialsTable';
import type { Entry } from '../../../stores/entryStore';

/**
 * Configuration options for entry navigation
 */
export interface EntryNavigationConfig {
  /** Class ID from route params */
  classId: string | undefined;
  /** Entry ID from route params (optional, defaults to first entry) */
  entryId: string | undefined;
  /** Whether this is a Nationals scoresheet (affects area initialization) */
  isNationals?: boolean;
  /** Sport type for scoring session */
  sportType?: 'AKC_SCENT_WORK' | 'AKC_SCENT_WORK_NATIONAL' | 'AKC_FASTCAT';
  /** Callback when entry is loaded and areas should be initialized */
  onEntryLoaded?: (entry: Entry, areas: AreaScore[]) => void;
  /** Callback to set trial date */
  onTrialDateLoaded?: (date: string) => void;
  /** Callback to set trial number */
  onTrialNumberLoaded?: (number: string) => void;
  /** Callback to set loading state */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Return type for useEntryNavigation hook
 */
export interface EntryNavigationReturn {
  /** Currently selected entry */
  currentEntry: Entry | null;
  /** All entries for the class */
  entries: Entry[];
  /** Class information */
  classInfo: {
    element: string;
    level: string;
    section?: string;
  } | null;
  /** Whether entries are being loaded */
  isLoading: boolean;
  /** Navigate to a specific entry */
  navigateToEntry: (entryId: number) => void;
  /** Navigate to next entry in list */
  navigateToNextEntry: () => void;
  /** Navigate to previous entry in list */
  navigateToPreviousEntry: () => void;
  /** Get max time for a specific area index */
  getMaxTimeForArea: (areaIndex: number) => string;
  /** Reload entries from cache/server */
  reloadEntries: () => Promise<void>;
}

/**
 * Default max times based on AKC Scent Work requirements
 */
function getDefaultMaxTime(element: string, level: string): string {
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
 * Hook for managing entry loading and navigation in scoresheets
 *
 * @example
 * ```tsx
 * const navigation = useEntryNavigation({
 *   classId,
 *   entryId,
 *   onEntryLoaded: (entry, areas) => {
 *     core.setAreas(areas);
 *   }
 * });
 *
 * // Use entry data
 * const { currentEntry, getMaxTimeForArea } = navigation;
 * ```
 */
export function useEntryNavigation(config: EntryNavigationConfig): EntryNavigationReturn {
  const {
    classId,
    entryId,
    isNationals = false,
    sportType = 'AKC_SCENT_WORK',
    onEntryLoaded,
    onTrialDateLoaded,
    onTrialNumberLoaded,
    onLoadingChange
  } = config;

  const navigate = useNavigate();
  const { showContext } = useAuth();

  // Store hooks
  const {
    isScoring,
    startScoringSession
  } = useScoringStore();

  const {
    currentEntry,
    setEntries,
    setCurrentClassEntries,
    setCurrentEntry
  } = useEntryStore();

  // Local state
  const [entries, setLocalEntries] = useState<Entry[]>([]);
  const [classInfo, setClassInfo] = useState<{
    element: string;
    level: string;
    section?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref for cleanup
  const currentEntryRef = useRef(currentEntry);

  // Refs for callbacks to prevent infinite re-render loops
  // These callbacks change on every parent render, so we store them in refs
  // to avoid triggering loadEntries recreations
  const onEntryLoadedRef = useRef(onEntryLoaded);
  const onTrialDateLoadedRef = useRef(onTrialDateLoaded);
  const onTrialNumberLoadedRef = useRef(onTrialNumberLoaded);
  const onLoadingChangeRef = useRef(onLoadingChange);

  // Keep refs updated
  useEffect(() => {
    onEntryLoadedRef.current = onEntryLoaded;
    onTrialDateLoadedRef.current = onTrialDateLoaded;
    onTrialNumberLoadedRef.current = onTrialNumberLoaded;
    onLoadingChangeRef.current = onLoadingChange;
  });

  // Update ref when entry changes
  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  // Cleanup: remove dog from ring on unmount
  useEffect(() => {
    return () => {
      const entry = currentEntryRef.current;
      if (entry?.id) {
        markInRing(entry.id, false).then(() => {}).catch((error) => {
          console.error('❌ Cleanup: Failed to remove dog from ring:', error);
        });
      }
    };
  }, []);

  // ==========================================================================
  // ENTRY LOADING
  // ==========================================================================

  const loadEntries = useCallback(async () => {
if (!classId || !showContext?.licenseKey) {
return;
    }

    setIsLoading(true);
    onLoadingChangeRef.current?.(true);

    try {
      // Ensure replication manager is initialized
      const manager = await ensureReplicationManager();

      const entriesTable = manager.getTable('entries');
      const classesTable = manager.getTable('classes');
      const trialsTable = manager.getTable('trials');

      if (!entriesTable || !classesTable || !trialsTable) {
        throw new Error('Required tables not registered');
      }

      // Get class information
      let classData = await classesTable.get(classId) as Class | undefined;

      if (!classData) {
await manager.syncTable('classes');
        classData = await classesTable.get(classId) as Class | undefined;

        if (!classData) {
          throw new Error(`Class ${classId} not found`);
        }
      }

      // Store class info
      setClassInfo({
        element: classData.element,
        level: classData.level,
        section: classData.section
      });

      // Get trial information
      const trialData = await trialsTable.get(String(classData.trial_id)) as Trial | undefined;
      if (trialData?.trial_date) {
        // Format date as mm/dd/yyyy
        const rawDate = trialData.trial_date;
        const [year, month, day] = rawDate.split('T')[0].split('-');
        const formatted = `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
        onTrialDateLoadedRef.current?.(formatted);
        onTrialNumberLoadedRef.current?.('1');
      }

      // Get all entries for this class
      let allEntries = await entriesTable.getAll() as ReplicatedEntry[];
      const classIdStr = String(classId);
      let classEntries = allEntries.filter(entry => String(entry.class_id) === classIdStr);

      // If no entries found, try to sync
      if (classEntries.length === 0) {
await manager.syncTable('entries');
        allEntries = await entriesTable.getAll() as ReplicatedEntry[];
        classEntries = allEntries.filter(entry => String(entry.class_id) === classIdStr);
      }

// Transform to Entry format
      const transformedEntries: Entry[] = classEntries.map(entry => ({
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

      setLocalEntries(transformedEntries);
      setEntries(transformedEntries);
      setCurrentClassEntries(parseInt(classId));

      // Set current entry
      let targetEntry: Entry | undefined;
      if (entryId) {
        targetEntry = transformedEntries.find(e => e.id === parseInt(entryId));
      }
      if (!targetEntry && transformedEntries.length > 0) {
        targetEntry = transformedEntries[0];
      }

      if (targetEntry) {
        setCurrentEntry(targetEntry);
        await markInRing(targetEntry.id, true);

        // Initialize areas and notify
        const initialAreas = initializeAreas(
          targetEntry.element || '',
          targetEntry.level || '',
          isNationals
        );
        onEntryLoadedRef.current?.(targetEntry, initialAreas);
      }

      // Start scoring session if not already started
      if (!isScoring && transformedEntries.length > 0) {
        startScoringSession(
          parseInt(classId),
          transformedEntries[0].className || 'AKC Scent Work',
          sportType,
          'judge-1',
          transformedEntries.length
        );
      }

    } catch (error) {
      console.error('[EntryNavigation] Error loading entries:', error);
    } finally {
      setIsLoading(false);
      onLoadingChangeRef.current?.(false);
    }
  }, [
    classId,
    entryId,
    showContext?.licenseKey,
    isNationals,
    sportType,
    isScoring,
    // Callbacks removed from deps - using refs instead to prevent infinite re-render loops
    setEntries,
    setCurrentClassEntries,
    setCurrentEntry,
    startScoringSession
  ]);

  // Load entries on mount
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, entryId, showContext?.licenseKey, loadEntries]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const navigateToEntry = useCallback((targetEntryId: number) => {
    navigate(`/class/${classId}/score/${targetEntryId}`);
  }, [classId, navigate]);

  const navigateToNextEntry = useCallback(() => {
    if (!currentEntry || entries.length === 0) return;

    const currentIndex = entries.findIndex(e => e.id === currentEntry.id);
    const nextIndex = (currentIndex + 1) % entries.length;
    navigateToEntry(entries[nextIndex].id);
  }, [currentEntry, entries, navigateToEntry]);

  const navigateToPreviousEntry = useCallback(() => {
    if (!currentEntry || entries.length === 0) return;

    const currentIndex = entries.findIndex(e => e.id === currentEntry.id);
    const prevIndex = (currentIndex - 1 + entries.length) % entries.length;
    navigateToEntry(entries[prevIndex].id);
  }, [currentEntry, entries, navigateToEntry]);

  // ==========================================================================
  // MAX TIME HELPER
  // ==========================================================================

  const getMaxTimeForArea = useCallback((areaIndex: number): string => {
    if (!currentEntry) {
      return '3:00';
    }

    // Try to get max time from entry data
    let maxTime = '';
    switch (areaIndex) {
      case 0:
        maxTime = currentEntry.timeLimit || '';
        break;
      case 1:
        maxTime = currentEntry.timeLimit2 || '';
        break;
      case 2:
        maxTime = currentEntry.timeLimit3 || '';
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
      maxTime = getDefaultMaxTime(
        currentEntry.element || '',
        currentEntry.level || ''
      );
    }

    return maxTime;
  }, [currentEntry]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    currentEntry,
    entries,
    classInfo,
    isLoading,
    navigateToEntry,
    navigateToNextEntry,
    navigateToPreviousEntry,
    getMaxTimeForArea,
    reloadEntries: loadEntries
  };
}
