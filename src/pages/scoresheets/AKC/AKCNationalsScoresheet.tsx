/**
 * AKC Nationals Scent Work Scoresheet
 *
 * Nationals-only scoresheet with simplified scoring:
 * - Point counter components for Nationals scoring
 * - Qualifying results: Qualified, Absent, Excused (no NQ)
 * - Dual storage: tbl_entry_queue + nationals_scores
 * - Auto-calculated areas based on alerts
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
import { NationalsCounterSimple } from '../../../components/scoring/NationalsCounterSimple';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import { HamburgerMenu, SyncIndicator, ArmbandBadge } from '../../../components/ui';
import { DogCard } from '../../../components/DogCard';
import { X, ClipboardCheck } from 'lucide-react';
import { nationalsScoring } from '../../../services/nationalsScoring';
import { formatSecondsToTime } from '../../../utils/timeUtils';
import voiceAnnouncementService from '../../../services/voiceAnnouncementService';
import { parseSmartTime } from '../../../utils/timeInputParsing';
import { initializeAreas, type AreaScore } from '../../../services/scoresheets/areaInitialization';
import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet-Nationals.css';
import './AKCScentWorkScoresheet-Flutter.css';
import './AKCScentWorkScoresheet-JudgeDialog.css';
import '../../../styles/containers.css';
import '../../../components/wireframes/NationalsWireframe.css';

// Nationals-specific qualifying results
type NationalsResult = 'Qualified' | 'Absent' | 'Excused';

export const AKCNationalsScoresheet: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();

  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: _addScoreToSession,
    moveToNextEntry: _moveToNextEntry,
    endScoringSession: _endScoringSession
  } = useScoringStore();

  const {
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

  // Nationals-specific state
  const [alertsCorrect, setAlertsCorrect] = useState(0);
  const [alertsIncorrect, setAlertsIncorrect] = useState(0);
  const [finishCallErrors, setFinishCallErrors] = useState(0);
  const [isExcused, setIsExcused] = useState(false);

  // Scoresheet state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<NationalsResult | ''>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  const [trialDate, setTrialDate] = useState<string>('');
  const [trialNumber, setTrialNumber] = useState<string>('');
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);
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

  // Timer state
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
  }, []);

  // Initialize areas based on element and level (always Nationals mode)
  const initializeAreasForClass = (element: string, level: string): AreaScore[] => {
    return initializeAreas(element, level, true);
  };

  // Calculate Nationals points in real-time
  const calculateNationalsPoints = () => {
    if (isExcused) return 0;

    const correctPoints = alertsCorrect * 10;
    const incorrectPenalty = alertsIncorrect * 5;
    const faultPenalty = faultCount * 2;
    const finishErrorPenalty = finishCallErrors * 5;

    return correctPoints - incorrectPenalty - faultPenalty - finishErrorPenalty;
  };

  // Auto-calculate areas based on alerts
  useEffect(() => {
    if (areas.length > 0) {
      const updatedAreas = areas.map((area, index) => {
        const correctForThisArea = index < alertsCorrect;
        const incorrectForThisArea = index < alertsIncorrect && index >= alertsCorrect;

        return {
          ...area,
          found: correctForThisArea || incorrectForThisArea,
          correct: correctForThisArea
        };
      });

      setAreas(updatedAreas);
    }
  }, [alertsCorrect, alertsIncorrect]);

  // Helper function: Convert time string to seconds
  const convertTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return Math.round(minutes * 60 + seconds);
    }
    return Math.round(parseFloat(timeString) || 0);
  };

  // Get correct max time based on AKC Scent Work requirements
  const getDefaultMaxTime = (element: string, level: string): string => {
    const elem = element?.toLowerCase() || '';
    const lvl = level?.toLowerCase() || '';

    // AKC Scent Work time limits from class requirements
    if (elem.includes('container')) {
      return '2:00'; // Container is always 2 minutes
    }

    if (elem.includes('interior')) {
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
      return "3:00";
    }

    // Try to get max time from entry data
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

    // Convert if stored as seconds
    if (maxTime && !maxTime.includes(':')) {
      const totalSeconds = parseInt(maxTime);
      if (!isNaN(totalSeconds) && totalSeconds > 0) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        maxTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    // FAILSAFE: If missing or empty, use correct default
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
    if (qualifying === 'Excused') {
      setIsExcused(true);

      // Nationals: zero points and max search time
      setAlertsCorrect(0);
      setAlertsIncorrect(0);
      setFinishCallErrors(0);
      setFaultCount(0);

      // Set max search time for all areas
      const updatedAreas = areas.map((area, index) => ({
        ...area,
        time: getMaxTimeForArea(index),
        found: false,
        correct: false
      }));
      setAreas(updatedAreas);

      // Set total time to sum of all max times
      const totalMaxTime = updatedAreas.reduce((sum, area) => {
        const timeInSeconds = convertTimeToSeconds(area.time);
        return sum + timeInSeconds;
      }, 0);
      setTotalTime(formatSecondsToTime(totalMaxTime));
    }
  }, [qualifying, areas.length]);

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
    const finalQualifying = qualifying || 'Qualified';
    const finalResultText = finalQualifying;
    const finalTotalTime = totalTime || calculateTotalTime() || '0.00';

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
        nonQualifyingReason: undefined,
        areas: areaResults,
        correctCount: alertsCorrect,
        incorrectCount: alertsIncorrect,
        faultCount: faultCount,
        finishCallErrors: finishCallErrors,
        points: calculateNationalsPoints(),
        areaTimes: areas.map(area => area.time).filter(time => time && time !== ''),
        element: currentEntry.element,
        level: currentEntry.level
      },
      onSuccess: async () => {
        console.log('✅ Score saved - handling post-submission tasks');

        // Submit to nationals_scores table for TV dashboard
        if (showContext?.licenseKey) {
          try {
            const timeInSeconds = convertTimeToSeconds(finalTotalTime || '0');
            const elementType = mapElementToNationalsType(currentEntry.element || '');
            const day = getCurrentDay();

            await nationalsScoring.submitScore({
              entry_id: currentEntry.id,
              armband: currentEntry.armband.toString(),
              element_type: elementType,
              day: day,
              alerts_correct: alertsCorrect,
              alerts_incorrect: alertsIncorrect,
              faults: faultCount,
              finish_call_errors: finishCallErrors,
              time_seconds: timeInSeconds,
              excused: isExcused || finalQualifying === 'Excused',
              notes: undefined
            });

            console.log('✅ Nationals score submitted to TV dashboard');
          } catch (nationalsError) {
            console.error('❌ Failed to submit Nationals score:', nationalsError);
            // Don't fail the whole submission - regular score still saved
          }
        }

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

  // Helper functions
  const mapElementToNationalsType = (element: string) => {
    const elementLower = element?.toLowerCase() || '';
    if (elementLower.includes('container')) return 'CONTAINER';
    if (elementLower.includes('buried')) return 'BURIED';
    if (elementLower.includes('interior')) return 'INTERIOR';
    if (elementLower.includes('exterior')) return 'EXTERIOR';
    if (elementLower.includes('handler') || elementLower.includes('discrimination')) return 'HD_CHALLENGE';
    return 'CONTAINER'; // Default
  };

  const getCurrentDay = (): 1 | 2 | 3 => {
    // This should be determined by your trial/class data
    // For now, return 1 as default
    return 1;
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

  const calculateTotalTime = (): string => {
    const validTimes = areas.filter(area => area.time && area.time !== '').map(area => area.time);
    if (validTimes.length === 0) return '0.00';

    // For multi-area, sum the times; for single area, use that time
    if (validTimes.length === 1) {
      return validTimes[0];
    }

    // Sum multiple areas
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

  // Timer functions
  const formatStopwatchTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  const getRemainingTime = (): string => {
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

      // Auto-stop when time expires
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

  const stopStopwatch = () => {
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
  };

  // Record time for a specific area
  const recordTimeForArea = (areaIndex: number) => {
    const formattedTime = formatStopwatchTime(stopwatchTime);
    handleAreaUpdate(areaIndex, 'time', formattedTime);
    resetStopwatch();
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

    // Parse max time string
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Show warning if less than 30 seconds remaining
    const remainingMs = maxTimeMs - stopwatchTime;
    return remainingMs > 0 && remainingMs <= 30000;
  };

  const isTimeExpired = (): boolean => {
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return false;

    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

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

    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Calculate remaining time
    const remainingMs = maxTimeMs - stopwatchTime;
    const remainingSeconds = Math.floor(remainingMs / 1000);

    // Announce when crossing the 30-second threshold
    if (remainingSeconds <= 30 && remainingSeconds > 29 && !has30SecondAnnouncedRef.current) {
      console.log('[VoiceAnnouncement] Triggering 30-second warning');
      voiceAnnouncementService.announceTimeRemaining(30);
      has30SecondAnnouncedRef.current = true;
    }

    // Reset flag if we're above 30 seconds
    if (remainingSeconds > 30 && has30SecondAnnouncedRef.current) {
      has30SecondAnnouncedRef.current = false;
    }
  }, [stopwatchTime, isStopwatchRunning, settings.voiceAnnouncements, settings.announceTimerCountdown, currentEntry?.level, areas]);

  // Set scoring active state to suppress push notification voices while timing
  useEffect(() => {
    voiceAnnouncementService.setScoringActive(isStopwatchRunning);

    return () => {
      voiceAnnouncementService.setScoringActive(false);
    };
  }, [isStopwatchRunning]);

  const handleAreaUpdate = (index: number, field: keyof AreaScore, value: any) => {
    setAreas(prev => prev.map((area, i) =>
      i === index ? { ...area, [field]: value } : area
    ));
  };

  // Clear time functions
  const clearTimeInput = (index: number) => {
    handleAreaUpdate(index, 'time', '');
  };

  // Enhanced time input handler with smart parsing
  const handleSmartTimeInput = (index: number, rawInput: string) => {
    handleAreaUpdate(index, 'time', rawInput);
  };

  // Handle blur (when user finishes typing) - apply smart parsing
  const handleTimeInputBlur = (index: number, rawInput: string) => {
    const parsedTime = parseSmartTime(rawInput);
    handleAreaUpdate(index, 'time', parsedTime);
  };

  // Load entries on mount
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

    setIsLoadingEntry(true);
    try {
      console.log('[REPLICATION] Loading scoresheet data for class:', classId);

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

        try {
          console.log('[Scoresheet] Attempting to sync class data from server...');
          await manager.syncTable('classes');

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
        const rawDate = trialData.trial_date || '';
        if (rawDate) {
          // Parse date manually to avoid timezone conversion issues
          // Assumes YYYY-MM-DD format from database
          const [year, month, day] = rawDate.split('T')[0].split('-');
          const formatted = `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
          setTrialDate(formatted);
        }
        setTrialNumber('1');
      }

      // Get all entries for this class
      let allEntries = await entriesTable.getAll() as ReplicatedEntry[];
      console.log(`[Scoresheet] Total entries in cache: ${allEntries.length}`);

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

          allEntries = await entriesTable.getAll() as ReplicatedEntry[];
          classEntries = allEntries.filter(entry => String(entry.class_id) === classIdStr);

          console.log(`[Scoresheet] After sync, found ${classEntries.length} entries`);
        } catch (syncError) {
          console.error('[Scoresheet] Failed to sync entries:', syncError);
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

      // Start scoring session (always AKC_SCENT_WORK_NATIONAL)
      if (!isScoring && transformedEntries.length > 0) {
        startScoringSession(
          parseInt(classId),
          transformedEntries[0].className || 'AKC Scent Work',
          'AKC_SCENT_WORK_NATIONAL',
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
      alert(`Unable to load scoresheet data. Please refresh the page and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingEntry(false);
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
            🏆 AKC Nationals
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


      {/* Dog Info Card */}
      <div className="scoresheet-dog-info-card">
        <ArmbandBadge number={currentEntry.armband} />
        <div className="scoresheet-dog-details">
          <div className="scoresheet-dog-name">{currentEntry.callName}</div>
          <div className="scoresheet-dog-breed">{currentEntry.breed}</div>
          <div className="scoresheet-dog-handler">Handler: {currentEntry.handler}</div>
        </div>
      </div>


      {/* Timer Section */}
      <div className="scoresheet-timer-card">
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
            <button
              className="timer-btn-start stop"
              onClick={stopStopwatch}
            >
              Stop
            </button>
          ) : stopwatchTime > 0 ? (
            <button
              className="timer-btn-start resume"
              onClick={startStopwatch}
              title="Continue timing"
            >
              Resume
            </button>
          ) : (
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

      {/* Time Input */}
      {areas.map((area, index) => (
        <div key={index} className="scoresheet-time-card">
          <div className="time-input-flutter">
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

      {/* Results Section */}
      <div className="results-section">
        <ResultChoiceChips
          selectedResult={qualifying as 'Qualified' | 'Absent' | 'Excused' | null}
          onResultChange={(result) => {
            setQualifying(result);
          }}
          showNQ={false}
          showEX={true}
          onNQClick={() => {}}
          onEXClick={() => {
            setQualifying('Excused');
          }}
          selectedResultInternal={qualifying || ''}
          faultCount={faultCount}
          onFaultCountChange={setFaultCount}
          nqReason={''}
          onNQReasonChange={() => {}}
          excusedReason={''}
          onExcusedReasonChange={() => {}}
          isNationalsMode={true}
        />
      </div>

      {/* Nationals Counters */}
      <NationalsCounterSimple
        alertsCorrect={alertsCorrect}
        alertsIncorrect={alertsIncorrect}
        faults={faultCount}
        finishCallErrors={finishCallErrors}
        onAlertsCorrectChange={setAlertsCorrect}
        onAlertsIncorrectChange={setAlertsIncorrect}
        onFaultsChange={setFaultCount}
        onFinishCallErrorsChange={setFinishCallErrors}
      />

      {/* Validation message for incomplete Qualified scores */}
      {qualifying === 'Qualified' && !areas.every(area => area.time && area.time !== '') && (
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

      {/* Action Buttons */}
      <div className="scoresheet-actions">
        <button className="scoresheet-btn-cancel" onClick={handleNavigateWithRingCleanup}>
          Cancel
        </button>
        <button
          className="scoresheet-btn-save"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting || !qualifying || (qualifying === 'Qualified' && !areas.every(area => area.time && area.time !== ''))}
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
              <div className="result-time-grid nationals-mode">
                <div className="score-item">
                  <span className="item-label">Result</span>
                  <span className={`item-value result-${qualifying?.toLowerCase()}`}>
                    {qualifying === 'Qualified' ? 'Qualified' :
                     qualifying === 'Absent' ? 'Absent' :
                     qualifying === 'Excused' ? 'Excused' : qualifying}
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
                  <div className="score-item time-container">
                    <span className="item-label">Time</span>
                    <span className="item-value time-value">{areas[0]?.time || totalTime || calculateTotalTime()}</span>
                  </div>
                )}
              </div>

              <div className="nationals-breakdown">
                <h3>Nationals Scoring</h3>
                <div className="score-grid">
                  <div className="score-item">
                    <span className="item-label">Correct Calls</span>
                    <span className="item-value positive">{alertsCorrect}</span>
                  </div>
                  <div className="score-item">
                    <span className="item-label">Incorrect Calls</span>
                    <span className="item-value negative">{alertsIncorrect}</span>
                  </div>
                  <div className="score-item">
                    <span className="item-label">Faults</span>
                    <span className="item-value negative">{faultCount}</span>
                  </div>
                  <div className="score-item">
                    <span className="item-label">No Finish Calls</span>
                    <span className="item-value negative">{finishCallErrors}</span>
                  </div>
                </div>
                <div className="total-points">
                  <span className="total-label">Total Points:</span>
                  <span className="total-value">{calculateNationalsPoints()}</span>
                </div>
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
      </div>
    </div>
    </>
  );
};

export default AKCNationalsScoresheet;
