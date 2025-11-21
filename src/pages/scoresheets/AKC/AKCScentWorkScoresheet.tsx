/**
 * AKC Scent Work Scoresheet
 *
 * Regular AKC Scent Work scoresheet for standard trials.
 * Supports:
 * - Timer/stopwatch functionality
 * - Regular qualifying results: Q, NQ, EX, ABS
 * - Standard area scoring
 * - Fault counting
 * - Voice announcements
 * - Entry navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { useSettingsStore } from '../../../stores/settingsStore';
import { markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import { useOptimisticScoring } from '../../../hooks/useOptimisticScoring';
import { useClassCompletion } from '../../../hooks/useClassCompletion';
import { ensureReplicationManager } from '../../../utils/replicationHelper';
import type { Entry as ReplicatedEntry } from '../../../services/replication/tables/ReplicatedEntriesTable';
import type { Class } from '../../../services/replication/tables/ReplicatedClassesTable';
import type { Trial } from '../../../services/replication/tables/ReplicatedTrialsTable';
import type { Entry } from '../../../stores/entryStore';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import { HamburgerMenu, SyncIndicator, ArmbandBadge } from '../../../components/ui';
import { DogCard } from '../../../components/DogCard';
import { X, ClipboardCheck } from 'lucide-react';
import voiceAnnouncementService from '../../../services/voiceAnnouncementService';
import { parseSmartTime } from '../../../utils/timeInputParsing';
import { initializeAreas, type AreaScore } from '../../../services/scoresheets/areaInitialization';
import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet-Flutter.css';
import './AKCScentWorkScoresheet-JudgeDialog.css';
import '../../../styles/containers.css';

import { QualifyingResult } from '../../../stores/scoringStore';

export const AKCScentWorkScoresheet: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();

  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: _addScoreToSession,
    moveToNextEntry: _moveToNextEntry,
    moveToPreviousEntry, // eslint-disable-line @typescript-eslint/no-unused-vars
    endScoringSession: _endScoringSession
  } = useScoringStore();

  const {
    currentClassEntries, // eslint-disable-line @typescript-eslint/no-unused-vars
    currentEntry,
    setEntries,
    setCurrentClassEntries,
    setCurrentEntry,
    markAsScored: _markAsScored,
    getPendingEntries: _getPendingEntries
  } = useEntryStore();

  const { addToQueue: _addToQueue, isOnline: _isOnline } = useOfflineQueueStore();

  // Optimistic scoring hook
  const { submitScoreOptimistically, isSyncing, hasError } = useOptimisticScoring();

  // Class completion celebration hook
  const { CelebrationModal, checkCompletion } = useClassCompletion(classId);

  // Regular scoresheet state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult | ''>('');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  const [trialDate, setTrialDate] = useState<string>('');
  const [trialNumber, setTrialNumber] = useState<string>('');
  const [isLoadingEntry, setIsLoadingEntry] = useState(true); // Track loading state
  const [_darkMode, _setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Prevent background scrolling when dialog is open
  useEffect(() => {
    if (showConfirmation) {
      document.body.classList.add('dialog-open');
    } else {
      document.body.classList.remove('dialog-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dialog-open');
    };
  }, [showConfirmation]);

  // Timer state (existing from original)
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchInterval, setStopwatchInterval] = useState<NodeJS.Timeout | null>(null);

  // Settings for voice announcements
  const settings = useSettingsStore(state => state.settings);

  // Refs to capture current values for cleanup
  const currentEntryRef = useRef(currentEntry);
  const stopwatchIntervalRef = useRef(stopwatchInterval);

  // Update refs when values change
  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  useEffect(() => {
    stopwatchIntervalRef.current = stopwatchInterval;
  }, [stopwatchInterval]);

  // Cleanup effect to remove dog from ring when component unmounts
  useEffect(() => {
    return () => {
      const entry = currentEntryRef.current;
      if (entry?.id) {
        // Use markInRing to remove dog from ring on cleanup
        markInRing(entry.id, false).then(() => {
          console.log(`✅ Cleanup: Removed dog ${entry.armband} from ring on unmount`);
        }).catch((error) => {
          console.error('❌ Cleanup: Failed to remove dog from ring:', error);
        });
      }

      // Also cleanup any running stopwatch
      const interval = stopwatchIntervalRef.current;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []); // Empty dependency array ensures this only runs on unmount

  // Initialize areas based on element and level using utility function
  const initializeAreasForClass = (element: string, level: string): AreaScore[] => {
    return initializeAreas(element, level, false);
  };

  // Failsafe: Get correct max time based on AKC Scent Work requirements
  const getDefaultMaxTime = (element: string, level: string): string => {
    const elem = element?.toLowerCase() || '';
    const lvl = level?.toLowerCase() || '';

    // AKC Scent Work time limits from class requirements
    if (elem.includes('container')) {
      if (lvl.includes('novice')) return '2:00';
      if (lvl.includes('advanced')) return '2:00';
      if (lvl.includes('excellent')) return '2:00';
      if (lvl.includes('master')) return '2:00';
      return '2:00'; // Container is always 2 minutes
    }

    if (elem.includes('interior')) {
      if (lvl.includes('novice')) return '3:00';
      if (lvl.includes('advanced')) return '3:00';
      if (lvl.includes('excellent')) return '3:00';
      if (lvl.includes('master')) return '3:00';
      return '3:00'; // Interior is always 3 minutes
    }

    if (elem.includes('exterior')) {
      if (lvl.includes('novice')) return '3:00';
      if (lvl.includes('advanced')) return '3:00';
      if (lvl.includes('excellent')) return '4:00';
      if (lvl.includes('master')) return '5:00';
      return '3:00';
    }

    if (elem.includes('buried')) {
      if (lvl.includes('novice')) return '3:00';
      if (lvl.includes('advanced')) return '3:00';
      if (lvl.includes('excellent')) return '4:00';
      if (lvl.includes('master')) return '4:00';
      return '3:00';
    }

    // Default fallback
    return '3:00';
  };

  const getMaxTimeForArea = useCallback((areaIndex: number, entry?: any): string => {
    const targetEntry = entry || currentEntry;
    if (!targetEntry) {
      // For sample/test mode, use default times
      return "3:00";
    }

    // Try to get max time from entry data (populated from database)
    let maxTime = '';
    switch (areaIndex) {
      case 0:
        maxTime = targetEntry.timeLimit;
        break;
      case 1:
        maxTime = targetEntry.timeLimit2;
        break;
      case 2:
        maxTime = targetEntry.timeLimit3;
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

    // FAILSAFE: If missing or empty, use correct default based on element and level
    if (!maxTime || maxTime === '' || maxTime === '0:00' || maxTime === '00:00') {
      const element = targetEntry.element || '';
      const level = targetEntry.level || '';
      maxTime = getDefaultMaxTime(element, level);
      console.warn(`⚠️ Max time not set for ${element} ${level} area ${areaIndex + 1}, using default: ${maxTime}`);
    }

    return maxTime;
  }, [currentEntry]);

  // Automatic penalty for excused dogs
  useEffect(() => {
    if (qualifying === 'EX') {
      // Regular shows: clear faults and found/correct flags, but preserve time data
      // (judges may accidentally click Excused and need to recover without losing timing)
      setFaultCount(0);

      const updatedAreas = areas.map((area) => ({
        ...area,
        // Keep time intact - don't clear it
        found: false,
        correct: false
      }));
      setAreas(updatedAreas);
      // Don't clear total time either - let judges keep their data
    }
  }, [qualifying, areas.length]); // Re-run when qualifying changes or areas are initialized

  // Enhanced submit handler with optimistic updates
  const handleEnhancedSubmit = async () => {
    console.log('🚀 handleEnhancedSubmit with OPTIMISTIC UPDATES!');
    if (!currentEntry) {
      console.log('⚠️ No currentEntry, returning early');
      return;
    }

    console.log('✅ currentEntry exists:', currentEntry.id);
    setShowConfirmation(false);

    // Prepare score data
    const finalQualifying = qualifying || 'NQ';
    const finalResultText = finalQualifying;
    const finalTotalTime = totalTime || calculateTotalTime() || '0.00';

    // Get the appropriate reason based on the result type
    const getFinalReason = () => {
      if (finalQualifying === 'Q') return undefined;
      return nonQualifyingReason;
    };
    const finalReason = getFinalReason();

    // Prepare area results
    const areaResults: Record<string, string> = {};
    areas.forEach(area => {
      areaResults[area.areaName.toLowerCase()] = `${area.time}${area.found ? ' FOUND' : ' NOT FOUND'}${area.correct ? ' CORRECT' : ' INCORRECT'}`;
    });

    // Submit score optimistically
    await submitScoreOptimistically({
      entryId: currentEntry.id,
      classId: parseInt(classId!),
      armband: currentEntry.armband,
      className: currentEntry.className,
      scoreData: {
        resultText: finalResultText,
        searchTime: finalTotalTime,
        nonQualifyingReason: finalReason,
        areas: areaResults,
        correctCount: 0,
        incorrectCount: 0,
        faultCount: faultCount,
        finishCallErrors: 0,
        points: 0,
        areaTimes: areas.map(area => area.time).filter(time => time && time !== ''),
        element: currentEntry.element,
        level: currentEntry.level
      },
      onSuccess: async () => {
        console.log('✅ Score saved - handling post-submission tasks');

        // Check if class is completed and show celebration
        await checkCompletion();

        // Remove from ring before navigating back
        if (currentEntry?.id) {
          try {
            await markInRing(currentEntry.id, false);
            console.log(`✅ Removed dog ${currentEntry.armband} from ring`);
          } catch (error) {
            console.error('❌ Failed to remove dog from ring:', error);
          }
        }

        // Navigate back to entry list
        navigate(-1);
      },
      onError: (error) => {
        console.error('❌ Score submission failed:', error);
        alert(`Failed to submit score: ${error.message}`);
        setIsSubmitting(false);
      }
    });
  };

  // Helper function to remove dog from ring and navigate
  const handleNavigateWithRingCleanup = async () => {
    if (currentEntry?.id) {
      try {
        await markInRing(currentEntry.id, false);
        console.log(`✅ Removed dog ${currentEntry.armband} from ring before navigation`);
      } catch (error) {
        console.error('❌ Failed to remove dog from ring:', error);
        // Continue with navigation even if ring cleanup fails
      }
    }
    navigate(-1);
  };

  const _resetForm = (entry?: any) => {
    const nextEntryAreas = initializeAreasForClass(entry?.element || '', entry?.level || '');
    setAreas(nextEntryAreas);
    setQualifying('');
    setNonQualifyingReason('');
    setFaultCount(0);
    setTotalTime('');
  };

  const calculateTotalTime = (): string => {
    const validTimes = areas.filter(area => area.time && area.time !== '').map(area => area.time);
    if (validTimes.length === 0) return '0.00';

    // For multi-area, sum the times; for single area, use that time
    if (validTimes.length === 1) {
      return validTimes[0];
    }

    // Sum multiple areas (simplified - you may want more complex logic)
    const totalSeconds = validTimes.reduce((sum, time) => {
      const parts = time.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        return sum + (minutes * 60 + seconds);
      }
      return sum + (parseFloat(time) || 0);
    }, 0);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  // Timer functions (existing logic - keeping for compatibility)
  const formatStopwatchTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  const getRemainingTime = (): string => {
    // Use the first area without a time as the "current" area for timer purposes
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return '';

    // Parse max time string (format: "3:00" or "4:00")
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Calculate remaining time
    const remainingMs = Math.max(0, maxTimeMs - stopwatchTime);
    const remainingSeconds = remainingMs / 1000;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = (remainingSeconds % 60).toFixed(2);

    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const startStopwatch = () => {
    setIsStopwatchRunning(true);
    const startTime = Date.now() - stopwatchTime;
    const interval = setInterval(() => {
      const currentTime = Date.now() - startTime;
      setStopwatchTime(currentTime);

      // Auto-stop when time expires (using first empty area as reference)
      const activeAreaIndex = getNextEmptyAreaIndex();
      const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
      const maxTimeStr = getMaxTimeForArea(areaIndex);
      if (maxTimeStr) {
        const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
        const maxTimeMs = (minutes * 60 + seconds) * 1000;

        if (currentTime >= maxTimeMs) {
          // Time expired - auto stop
          setIsStopwatchRunning(false);
          clearInterval(interval);
          setStopwatchInterval(null);

          // Set the exact max time as the final time
          setStopwatchTime(maxTimeMs);

          // For single-area classes, auto-fill the time field
          if (areas.length === 1) {
            const formattedMaxTime = formatStopwatchTime(maxTimeMs);
            handleAreaUpdate(0, 'time', formattedMaxTime);
          }
        }
      }
    }, 10);
    setStopwatchInterval(interval);
  };

  const _pauseStopwatch = () => {
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
  };

  const stopStopwatch = () => {
    // Just stop/pause the timer - don't reset or move to next area
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }

    // For single-area classes, automatically copy time to search time field
    if (areas.length === 1) {
      const formattedTime = formatStopwatchTime(stopwatchTime);
      handleAreaUpdate(0, 'time', formattedTime);
    }

    // Timer stays paused with current time visible
    // Judge can resume or record time for any area
  };

  // Record time for a specific area (new multi-area approach)
  const recordTimeForArea = (areaIndex: number) => {
    const formattedTime = formatStopwatchTime(stopwatchTime);
    handleAreaUpdate(areaIndex, 'time', formattedTime);
    resetStopwatch(); // Auto-reset stopwatch after recording (stays stopped)
  };

  // Helper to determine "next in sequence" for pulse indicator
  const getNextEmptyAreaIndex = (): number => {
    return areas.findIndex(area => !area.time);
  };

  const resetStopwatch = () => {
    setStopwatchTime(0);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    setIsStopwatchRunning(false);
  };

  // 30-second warning functionality (excluded for Master level)
  const shouldShow30SecondWarning = (): boolean => {
    if (!isStopwatchRunning) return false;

    // No warnings for Master level
    const level = currentEntry?.level?.toLowerCase() || '';
    if (level === 'master' || level === 'masters') return false;

    // Get max time for next empty area
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return false;

    // Parse max time string (format: "3:00") to milliseconds
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Show warning if less than 30 seconds remaining
    const remainingMs = maxTimeMs - stopwatchTime;
    return remainingMs > 0 && remainingMs <= 30000; // 30 seconds
  };

  const isTimeExpired = (): boolean => {
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return false;

    // Parse max time string (format: "3:00") to milliseconds
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Time is expired if current time equals or exceeds max time
    return stopwatchTime > 0 && stopwatchTime >= maxTimeMs;
  };

  const getTimerWarningMessage = (): string | null => {
    if (isTimeExpired()) {
      return "Time Expired";
    } else if (shouldShow30SecondWarning()) {
      return "30 Second Warning";
    }
    return null;
  };

  // Voice announcement for 30-second warning
  const has30SecondAnnouncedRef = useRef(false);

  useEffect(() => {
    if (!settings.voiceAnnouncements || !settings.announceTimerCountdown) {
      return;
    }

    if (!isStopwatchRunning) {
      // Reset the flag when timer stops
      has30SecondAnnouncedRef.current = false;
      return;
    }

    // No warnings for Master level
    const level = currentEntry?.level?.toLowerCase() || '';
    if (level === 'master' || level === 'masters') return;

    // Get max time for next empty area
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return;

    // Parse max time string (format: "3:00") to milliseconds
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Calculate remaining time
    const remainingMs = maxTimeMs - stopwatchTime;
    const remainingSeconds = Math.floor(remainingMs / 1000);

    // Announce when crossing the 30-second threshold (prevents race condition)
    // Trigger when: 29 < remaining <= 30 seconds
    if (remainingSeconds <= 30 && remainingSeconds > 29 && !has30SecondAnnouncedRef.current) {
      console.log('[VoiceAnnouncement] Triggering 30-second warning');
      voiceAnnouncementService.announceTimeRemaining(30);
      has30SecondAnnouncedRef.current = true;
    }

    // Reset flag if we're above 30 seconds (in case timer is reset/restarted)
    if (remainingSeconds > 30 && has30SecondAnnouncedRef.current) {
      has30SecondAnnouncedRef.current = false;
    }
  }, [stopwatchTime, isStopwatchRunning, settings.voiceAnnouncements, settings.announceTimerCountdown, currentEntry?.level, areas]);

  // Set scoring active state to suppress push notification voices while timing
  useEffect(() => {
    voiceAnnouncementService.setScoringActive(isStopwatchRunning);

    // Cleanup: ensure scoring state is cleared when component unmounts
    return () => {
      voiceAnnouncementService.setScoringActive(false);
    };
  }, [isStopwatchRunning]);

  const handleAreaUpdate = (index: number, field: keyof AreaScore, value: any) => {
    setAreas(prev => prev.map((area, i) =>
      i === index ? { ...area, [field]: value } : area
    ));
  };

  // Add missing handleTimeInputChange function
  const _handleTimeInputChange = (index: number, value: string) => {
    handleAreaUpdate(index, 'time', value);
  };

  // Clear time functions
  const clearTimeInput = (index: number) => {
    handleAreaUpdate(index, 'time', '');
  };

  // Smart time parsing - uses imported utility function

  // Enhanced time input handler with smart parsing
  const handleSmartTimeInput = (index: number, rawInput: string) => {
    // Always update with raw input first (for real-time typing)
    handleAreaUpdate(index, 'time', rawInput);
  };

  // Handle blur (when user finishes typing) - apply smart parsing
  const handleTimeInputBlur = (index: number, rawInput: string) => {
    const parsedTime = parseSmartTime(rawInput);
    handleAreaUpdate(index, 'time', parsedTime);
  };

  // Load entries on mount (existing logic)
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, entryId, showContext]);

  const loadEntries = async () => {
    console.log('[Scoresheet] loadEntries called with classId:', classId, 'showContext:', showContext);
    if (!classId || !showContext?.licenseKey) {
      console.log('[Scoresheet] Missing required data - classId:', classId, 'licenseKey:', showContext?.licenseKey);
      return;
    }

    setIsLoadingEntry(true); // Start loading
    try {
      // Load from replicated cache (direct replacement, no feature flags)
      console.log('[REPLICATION] 🔍 Loading scoresheet data for class:', classId);

      // Ensure replication manager is initialized (handles recovery scenarios)
      console.log('[Scoresheet] Ensuring replication manager...');
      const manager = await ensureReplicationManager();
      console.log('[Scoresheet] Got replication manager:', manager);

      const entriesTable = manager.getTable('entries');
      const classesTable = manager.getTable('classes');
      const trialsTable = manager.getTable('trials');

      console.log('[Scoresheet] Tables - entries:', !!entriesTable, 'classes:', !!classesTable, 'trials:', !!trialsTable);

      if (!entriesTable || !classesTable || !trialsTable) {
        throw new Error('Required tables not registered');
      }

      // Get class information
      console.log('[Scoresheet] Getting class data for classId:', classId);
      let classData = await classesTable.get(classId) as Class | undefined;
      console.log('[Scoresheet] Class data:', classData);

      if (!classData) {
        console.error('[Scoresheet] Class not found in cache, attempting to sync...');

        // Try to sync the class data from server
        try {
          console.log('[Scoresheet] Attempting to sync class data from server...');
          await manager.syncTable('classes');

          // Try again after sync
          classData = await classesTable.get(classId) as Class | undefined;
          if (classData) {
            console.log('[Scoresheet] Class data retrieved after sync');
          } else {
            throw new Error(`Class ${classId} not found even after sync`);
          }
        } catch (syncError) {
          console.error('[Scoresheet] Failed to sync class data:', syncError);
          throw new Error(`Class ${classId} not found in cache and sync failed`);
        }
      }

      // Get trial information
      const trialData = await trialsTable.get(String(classData.trial_id)) as Trial | undefined;
      if (trialData) {
        // Format date as mm/dd/yyyy
        const rawDate = trialData.trial_date || '';
        if (rawDate) {
          const date = new Date(rawDate);
          const formatted = (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
                           date.getDate().toString().padStart(2, '0') + '/' +
                           date.getFullYear();
          setTrialDate(formatted);
        }
        setTrialNumber('1'); // trial_number not in Trial schema yet
      }

      // Get all entries for this class
      let allEntries = await entriesTable.getAll() as ReplicatedEntry[];
      console.log(`[Scoresheet] Total entries in cache: ${allEntries.length}`);

      // Convert classId to string for comparison since entry.class_id is stored as string
      const classIdStr = String(classId);
      let classEntries = allEntries.filter(entry => String(entry.class_id) === classIdStr);

      console.log(`[REPLICATION] Found ${classEntries.length} entries for class ${classId}`);
      if (classEntries.length === 0 && allEntries.length > 0) {
        console.log(`[Scoresheet] Sample entry class_ids:`, allEntries.slice(0, 5).map(e => ({ id: e.id, class_id: e.class_id, type: typeof e.class_id })));
        console.log(`[Scoresheet] Looking for class_id: "${classIdStr}" (type: ${typeof classIdStr})`);
      }

      // If no entries found, try to sync
      if (classEntries.length === 0) {
        console.log('[Scoresheet] No entries found in cache, attempting to sync entries...');
        try {
          await manager.syncTable('entries');

          // Try again after sync
          allEntries = await entriesTable.getAll() as ReplicatedEntry[];
          classEntries = allEntries.filter(entry => String(entry.class_id) === classIdStr);

          console.log(`[Scoresheet] After sync, found ${classEntries.length} entries`);
        } catch (syncError) {
          console.error('[Scoresheet] Failed to sync entries:', syncError);
          // Continue with empty entries, user will be redirected
        }
      }

      // Transform to Entry format for store
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

      setEntries(transformedEntries);
      setCurrentClassEntries(parseInt(classId));

      if (entryId) {
        const targetEntry = transformedEntries.find(e => e.id === parseInt(entryId));
        if (targetEntry) {
          setCurrentEntry(targetEntry);
          await markInRing(targetEntry.id, true);
          const initialAreas = initializeAreasForClass(targetEntry.element || '', targetEntry.level || '');
          setAreas(initialAreas);
        }
      } else if (transformedEntries.length > 0) {
        setCurrentEntry(transformedEntries[0]);
        await markInRing(transformedEntries[0].id, true);
        const initialAreas = initializeAreasForClass(transformedEntries[0].element || '', transformedEntries[0].level || '');
        setAreas(initialAreas);
      }

      // Start scoring session
      if (!isScoring && transformedEntries.length > 0) {
        startScoringSession(
          parseInt(classId),
          transformedEntries[0].className || 'AKC Scent Work',
          'AKC_SCENT_WORK',
          'judge-1',
          transformedEntries.length
        );
      }
    } catch (error) {
      console.error('[Scoresheet] Error loading entries:', error);
      console.error('[Scoresheet] Full error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        classId,
        entryId,
        showContext
      });
      // Show user-friendly error message
      alert(`Unable to load scoresheet data. Please refresh the page and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingEntry(false); // Done loading (success or error)
    }
  };

  // Redirect to entry list if no entry data exists AFTER loading completes
  useEffect(() => {
    if (!isLoadingEntry && !currentEntry) {
      console.log('⚠️ No current entry found after loading, redirecting to entry list');
      navigate(`/class/${classId}/entries`);
    }
  }, [isLoadingEntry, currentEntry, classId, navigate]);


  // Show loading state while entry is being loaded
  if (isLoadingEntry) {
    return (
      <div className="scoresheet-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

  // Show nothing if no entry after loading (will redirect)
  if (!currentEntry) {
    return null;
  }

  return (
    <>
      {CelebrationModal}
      <div className="scoresheet-container">
        <div className="scoresheet">
        {/* Header */}
        <header className="page-header mobile-header">
        <HamburgerMenu
          backNavigation={{
            label: "Back to Entry List",
            action: handleNavigateWithRingCleanup
          }}
          currentPage="entries"
        />
        <div className="header-content">
          <h1>
            <ClipboardCheck className="title-icon" />
            AKC Scent Work
          </h1>
          <div className="header-trial-info">
            <span>{trialDate}</span>
            <span className="trial-separator">•</span>
            <span>Trial {trialNumber}</span>
            <span className="trial-separator">•</span>
            <span>{currentEntry.element} {currentEntry.level}</span>
          </div>
        </div>
      </header>

      {/* Content Wrapper - Constrained width on desktop */}
      <div className="scoresheet-content-wrapper">
      {/* Dog Info Card - Production Styling */}
      <div className="scoresheet-dog-info-card">
        <ArmbandBadge number={currentEntry.armband} />
        <div className="scoresheet-dog-details">
          <div className="scoresheet-dog-name">{currentEntry.callName}</div>
          <div className="scoresheet-dog-breed">{currentEntry.breed}</div>
          <div className="scoresheet-dog-handler">Handler: {currentEntry.handler}</div>
        </div>
      </div>


      {/* Flutter-style Timer Section */}
      <div className="scoresheet-timer-card">
        {/* Reset button - always in top-right corner */}
        <button
          className="timer-btn-reset"
          onClick={resetStopwatch}
          disabled={isStopwatchRunning}
          title={isStopwatchRunning ? "Reset disabled while timer is running" : "Reset timer"}
        >
          ⟲
        </button>

        <div className={`timer-display-large ${shouldShow30SecondWarning() ? 'warning' : ''} ${isTimeExpired() ? 'expired' : ''}`}>
          {formatStopwatchTime(stopwatchTime)}
        </div>
        <div className="timer-countdown-display">
          {stopwatchTime > 0 ? (
            <>Remaining: {getRemainingTime()}</>
          ) : (
            <>Max Time: {getMaxTimeForArea(getNextEmptyAreaIndex() >= 0 ? getNextEmptyAreaIndex() : 0)}</>
          )}
        </div>
        <div className="timer-controls-flutter">
          {isStopwatchRunning ? (
            // Timer is running - show Stop button (centered)
            <button
              className="timer-btn-start stop"
              onClick={stopStopwatch}
            >
              Stop
            </button>
          ) : stopwatchTime > 0 ? (
            // Timer is stopped with time recorded - show Resume button
            <button
              className="timer-btn-start resume"
              onClick={startStopwatch}
              title="Continue timing"
            >
              Resume
            </button>
          ) : (
            // Timer is at zero - show Start button (centered)
            <button
              className="timer-btn-start start"
              onClick={startStopwatch}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Timer Warning Message */}
      {getTimerWarningMessage() && (
        <div className={`timer-warning ${getTimerWarningMessage() === 'Time Expired' ? 'expired' : 'warning'}`}>
          {getTimerWarningMessage()}
        </div>
      )}

      {/* Time Input - Conditional Badge/Button Based on Area Count */}
      {areas.map((area, index) => (
        <div key={index} className="scoresheet-time-card">
          <div className="time-input-flutter">
            {/* Only show badge/button for multi-area elements/levels */}
            {areas.length > 1 && (
              <>
                {!area.time ? (
                  <button
                    className={`area-record-btn ${getNextEmptyAreaIndex() === index && stopwatchTime > 0 && !isStopwatchRunning ? 'next-in-sequence' : ''}`}
                    onClick={() => recordTimeForArea(index)}
                    title={`Record time from stopwatch for Area ${index + 1}`}
                  >
                    Record Area {index + 1}
                  </button>
                ) : (
                  <div className="area-badge recorded">
                    Area {index + 1}
                  </div>
                )}
              </>
            )}
            <div className="scoresheet-time-input-wrapper">
              <input
                type="text"
                value={area.time || ''}
                onChange={(e) => handleSmartTimeInput(index, e.target.value)}
                onBlur={(e) => handleTimeInputBlur(index, e.target.value)}
                placeholder="Type: 12345 or 1:23.45"
                className={`scoresheet-time-input ${areas.length === 1 ? 'single-area' : ''}`}
              />
              {area.time && (
                <button
                  type="button"
                  className="scoresheet-time-clear-button"
                  onClick={() => clearTimeInput(index)}
                  title="Clear time"
                >
                  <X size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                </button>
              )}
            </div>
            <div className="max-time-display">
              Max: {getMaxTimeForArea ? getMaxTimeForArea(index) : '02:00'}
            </div>
          </div>
        </div>
      ))}

      {/* Results Section - Choice Chips for All Shows */}
      <div className="results-section">
        <ResultChoiceChips
          selectedResult={
            // Map regular show results to choice chip format
            qualifying === 'Q' ? 'Qualified' :
            qualifying === 'ABS' ? 'Absent' :
            qualifying === 'EX' ? 'Excused' :
            null
          }
          onResultChange={(result) => {
            // Map choice chip results back to regular show format
            if (result === 'Qualified') {
              setQualifying('Q');
            } else if (result === 'Absent') {
              setQualifying('ABS');
              setNonQualifyingReason('Absent');
            } else if (result === 'Excused') {
              setQualifying('EX');
              setNonQualifyingReason('Dog Eliminated in Area');
            }
          }}
          showNQ={true}
          showEX={true}
          onNQClick={() => {
            setQualifying('NQ');
            setNonQualifyingReason('Incorrect Call');
          }}
          onEXClick={() => {
            setQualifying('EX');
            setNonQualifyingReason('Dog Eliminated in Area');
          }}
          // Additional props for enhanced functionality
          selectedResultInternal={qualifying || ''}
          faultCount={faultCount}
          onFaultCountChange={setFaultCount}
          nqReason={nonQualifyingReason}
          onNQReasonChange={setNonQualifyingReason}
          excusedReason={nonQualifyingReason}
          onExcusedReasonChange={setNonQualifyingReason}
          isNationalsMode={false}
        />


      </div>

      {/* Validation message for incomplete Qualified scores */}
      {qualifying === 'Q' && !areas.every(area => area.time && area.time !== '') && (
        <div style={{
          padding: '8px 16px',
          marginBottom: '8px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          color: '#92400e',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ⚠️ All area times must be completed for a Qualified score
        </div>
      )}

      {/* Flutter-style Action Buttons */}
      <div className="scoresheet-actions">
        <button className="scoresheet-btn-cancel" onClick={handleNavigateWithRingCleanup}>
          Cancel
        </button>
        <button
          className="scoresheet-btn-save"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting || !qualifying || (qualifying === 'Q' && !areas.every(area => area.time && area.time !== ''))}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Sync Status Indicators */}
      {(isSyncing || hasError) && (
        <div style={{ textAlign: 'center', marginTop: '-8px', marginBottom: '8px' }}>
          {isSyncing && <SyncIndicator status="syncing" />}
          {hasError && <SyncIndicator status="error" />}
        </div>
      )}

      {/* Judge Confirmation Dialog */}
      {showConfirmation && (
        <div className="judge-confirmation-overlay">
          <div className="judge-confirmation-dialog">
            <div className="dialog-header">
              <h2>Score Confirmation</h2>
              <div className="trial-info-line">
                {trialDate} • Trial {trialNumber} • {currentEntry.element} {currentEntry.level}
              </div>
            </div>

            <div className="dialog-dog-card">
              <DogCard
                armband={currentEntry.armband}
                callName={currentEntry.callName}
                breed={currentEntry.breed}
                handler={currentEntry.handler}
                className="confirmation-dog-card"
              />
            </div>

            <div className="score-details">
              <div className="result-time-grid">
                <div className="score-item">
                  <span className="item-label">Result</span>
                  <span className={`item-value result-${qualifying?.toLowerCase()}`}>
                    {qualifying === 'Q' ? 'Qualified' :
                     qualifying === 'NQ' ? 'NQ' :
                     qualifying === 'ABS' ? 'Absent' :
                     qualifying === 'EX' ? 'Excused' : qualifying}
                  </span>
                </div>

                {/* Multi-area search: show each area time + total */}
                {areas.length > 1 ? (
                  <>
                    {areas.map((area, index) => (
                      <div key={index} className="score-item time-container">
                        <span className="item-label">{area.areaName} Time</span>
                        <span className="item-value time-value">{area.time || '0:00.00'}</span>
                      </div>
                    ))}
                    <div className="score-item time-container total-time">
                      <span className="item-label">Total Time</span>
                      <span className="item-value time-value total">{totalTime || calculateTotalTime()}</span>
                    </div>
                  </>
                ) : (
                  /* Single area search: show time */
                  <div className="score-item time-container">
                    <span className="item-label">Time</span>
                    <span className="item-value time-value">{areas[0]?.time || totalTime || calculateTotalTime()}</span>
                  </div>
                )}

                {/* Show faults if any (both single and multi-area) */}
                {faultCount > 0 && (
                  <div className="score-item">
                    <span className="item-label">Faults</span>
                    <span className="item-value negative">{faultCount}</span>
                  </div>
                )}

                {nonQualifyingReason && (qualifying === 'NQ' || qualifying === 'EX') && (
                  <div className="score-item">
                    <span className="item-label">{qualifying === 'EX' ? 'Excused' : 'NQ'} Reason</span>
                    <span className="item-value">{nonQualifyingReason}</span>
                  </div>
                )}
              </div>

            </div>

            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button
                className="dialog-btn confirm"
                onClick={handleEnhancedSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div> {/* End scoresheet-content-wrapper */}
      </div> {/* End scoresheet */}
    </div> {/* End scoresheet-container */}
    </>
  );
};

export default AKCScentWorkScoresheet;
