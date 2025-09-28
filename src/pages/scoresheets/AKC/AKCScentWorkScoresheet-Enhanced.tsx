/**
 * Enhanced AKC Scent Work Scoresheet with Nationals Support
 *
 * This enhances the existing scoresheet to support AKC Nationals mode:
 * - Point counter components for Nationals scoring
 * - Different qualifying results (no NQ in Nationals)
 * - Dual storage: tbl_entry_queue + nationals_scores
 * - Maintains compatibility with regular shows
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore, markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
// import { NationalsPointCounter, CompactPointCounter } from '../../../components/scoring/NationalsPointCounter';
import { NationalsCounterSimple } from '../../../components/scoring/NationalsCounterSimple';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import { HamburgerMenu, ArmbandBadge } from '../../../components/ui';
import { DogCard } from '../../../components/DogCard';
import { X } from 'lucide-react';
import { nationalsScoring } from '../../../services/nationalsScoring';
import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet.css';
import './AKCScentWorkScoresheet-Nationals.css';
import './AKCScentWorkScoresheet-Flutter.css';
import './AKCScentWorkScoresheet-JudgeDialog.css';
import '../../../styles/containers.css';
import '../../../components/wireframes/NationalsWireframe.css';

import { QualifyingResult } from '../../../stores/scoringStore';

interface AreaScore {
  areaName: string;
  time: string;
  found: boolean;
  correct: boolean;
}

// Nationals-specific qualifying results (simplified for Nationals)
type NationalsResult = 'Qualified' | 'Absent' | 'Excused';
type _RegularResult = QualifyingResult;

export const AKCScentWorkScoresheetEnhanced: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();

  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: addScoreToSession,
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
    markAsScored,
    getPendingEntries: _getPendingEntries
  } = useEntryStore();

  // Detect if this is Nationals mode
  const isNationalsMode = currentEntry?.competitionType === 'AKC_SCENT_WORK_NATIONAL' ||
                         currentEntry?.className?.toLowerCase().includes('national') ||
                         showContext?.showType?.toLowerCase().includes('national') ||
                         showContext?.licenseKey === 'myK9Q1-d8609f3b-d3fd43aa-6323a604'; // AKC Nationals license

  const { addToQueue, isOnline } = useOfflineQueueStore();

  // Nationals-specific state
  const [alertsCorrect, setAlertsCorrect] = useState(0);
  const [alertsIncorrect, setAlertsIncorrect] = useState(0);
  const [finishCallErrors, setFinishCallErrors] = useState(0);
  const [isExcused, setIsExcused] = useState(false);

  // Regular scoresheet state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult | NationalsResult | ''>('');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [withdrawnReason, setWithdrawnReason] = useState<string>('In Season');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  const [trialDate, setTrialDate] = useState<string>('');
  const [trialNumber, setTrialNumber] = useState<string>('');
  const [darkMode, setDarkMode] = useState(() => {
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
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);

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

  // Initialize areas based on element and level (existing logic)
  const initializeAreas = (element: string, level: string): AreaScore[] => {
    const elementLower = element?.toLowerCase() || '';
    const levelLower = level?.toLowerCase() || '';

    // For nationals mode, everything except Handler Discrimination has single area
    if (isNationalsMode) {
      if (elementLower === 'handler discrimination' || elementLower === 'handlerdiscrimination') {
        // Handler Discrimination in nationals still follows regular rules
        if (levelLower === 'master' || levelLower === 'masters') {
          return [
            { areaName: 'Handler Discrimination Area 1', time: '', found: false, correct: false },
            { areaName: 'Handler Discrimination Area 2', time: '', found: false, correct: false }
          ];
        } else {
          return [
            { areaName: 'Handler Discrimination', time: '', found: false, correct: false }
          ];
        }
      } else {
        // All other elements in nationals have single area regardless of level
        return [
          { areaName: element || 'Search Area', time: '', found: false, correct: false }
        ];
      }
    }

    // Regular show logic (non-nationals)
    if (elementLower === 'interior') {
      if (levelLower === 'excellent') {
        return [
          { areaName: 'Interior Area 1', time: '', found: false, correct: false },
          { areaName: 'Interior Area 2', time: '', found: false, correct: false }
        ];
      } else if (levelLower === 'master' || levelLower === 'masters') {
        return [
          { areaName: 'Interior Area 1', time: '', found: false, correct: false },
          { areaName: 'Interior Area 2', time: '', found: false, correct: false },
          { areaName: 'Interior Area 3', time: '', found: false, correct: false }
        ];
      } else {
        return [
          { areaName: 'Interior', time: '', found: false, correct: false }
        ];
      }
    } else if (elementLower === 'handler discrimination' || elementLower === 'handlerdiscrimination') {
      if (levelLower === 'master' || levelLower === 'masters') {
        return [
          { areaName: 'Handler Discrimination Area 1', time: '', found: false, correct: false },
          { areaName: 'Handler Discrimination Area 2', time: '', found: false, correct: false }
        ];
      } else {
        return [
          { areaName: 'Handler Discrimination', time: '', found: false, correct: false }
        ];
      }
    } else {
      // Container, Exterior, Buried - single area for all levels in regular shows
      return [
        { areaName: element || 'Search Area', time: '', found: false, correct: false }
      ];
    }
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

  // Auto-calculate areas based on alerts for Nationals
  useEffect(() => {
    if (isNationalsMode && areas.length > 0) {
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
  }, [alertsCorrect, alertsIncorrect, isNationalsMode]);

  // Get qualifying options based on mode
  const _getQualifyingOptions = () => {
    if (isNationalsMode) {
      // Nationals: Only Qualified/Absent/Excused
      return [
        { value: 'Qualified', label: 'Qualified' },
        { value: 'Absent', label: 'Absent' },
        { value: 'Excused', label: 'Excused' }
      ];
    } else {
      // Regular shows
      return [
        { value: 'Q', label: 'Qualified' },
        { value: 'NQ', label: 'Not Qualified' },
        { value: 'EX', label: 'Excused' },
        { value: 'WD', label: 'Withdrawn' },
        { value: 'DQ', label: 'Disqualified' },
        { value: 'ABS', label: 'Absent' }
      ];
    }
  };

  // Enhanced submit handler for dual storage
  const handleEnhancedSubmit = async () => {
    if (!currentEntry) return;

    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      // Regular scoresheet submission (existing logic)
      const finalQualifying = qualifying || (isNationalsMode ? 'Qualified' : 'NQ');
      const finalResultText = finalQualifying;
      const finalTotalTime = totalTime || calculateTotalTime() || '0.00';

      // Get the appropriate reason based on the result type
      const getFinalReason = () => {
        if (finalQualifying === 'Q' || finalQualifying === 'Qualified') return undefined;
        if (finalQualifying === 'WD' || finalQualifying === 'Withdrawn') {
          return withdrawnReason;
        }
        return nonQualifyingReason;
      };
      const finalReason = getFinalReason();

      // Prepare area results
      const areaResults: Record<string, string> = {};
      areas.forEach(area => {
        areaResults[area.areaName.toLowerCase()] = `${area.time}${area.found ? ' FOUND' : ' NOT FOUND'}${area.correct ? ' CORRECT' : ' INCORRECT'}`;
      });

      const scoreData = {
        entryId: currentEntry.id,
        armband: currentEntry.armband,
        time: finalTotalTime,
        qualifying: finalQualifying,
        areas: areaResults,
        nonQualifyingReason: finalReason,
        // Nationals-specific fields
        correctCount: alertsCorrect,
        incorrectCount: alertsIncorrect,
        faultCount: faultCount,
        finishCallErrors: finishCallErrors
      };

      // Add to scoring session
      addScoreToSession(scoreData);
      markAsScored(currentEntry.id, finalQualifying);

      // Submit to regular database
      if (isOnline) {
        await submitScore(currentEntry.id, {
          resultText: finalResultText,
          searchTime: finalTotalTime,
          nonQualifyingReason: finalReason,
          correctCount: alertsCorrect,
          incorrectCount: alertsIncorrect,
          faultCount: faultCount,
          finishCallErrors: finishCallErrors,
          points: calculateNationalsPoints()
        });
      } else {
        addToQueue({
          entryId: currentEntry.id,
          armband: currentEntry.armband,
          classId: parseInt(classId!),
          className: currentEntry.className,
          scoreData: {
            resultText: finalResultText,
            searchTime: finalTotalTime,
            nonQualifyingReason: finalReason,
            areas: areaResults,
            correctCount: alertsCorrect,
            incorrectCount: alertsIncorrect,
            faultCount: faultCount,
            finishCallErrors: finishCallErrors,
            points: calculateNationalsPoints()
          }
        });
      }

      // NATIONALS: Also submit to nationals_scores table for TV dashboard
      if (isNationalsMode && showContext?.licenseKey) {
        try {
          const timeInSeconds = convertTimeToSeconds(finalTotalTime || '0');
          const elementType = mapElementToNationalsType(currentEntry.element || '');
          const day = getCurrentDay(); // You'll need to implement this

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
            notes: finalReason
          });

          console.log('✅ Nationals score submitted to TV dashboard');
        } catch (nationalsError) {
          console.error('❌ Failed to submit Nationals score:', nationalsError);
          // Don't fail the whole submission - regular score still saved
        }
      }

      // Navigate back to entry list (dogs rarely come in order) and remove from ring
      if (currentEntry?.id) {
        try {
          await markInRing(currentEntry.id, false);
          console.log(`✅ Removed dog ${currentEntry.armband} from ring after score submission`);
        } catch (error) {
          console.error('❌ Failed to remove dog from ring:', error);
        }
      }
      navigate(-1);

    } catch (error) {
      console.error('Error submitting score:', error);
      alert(`Failed to submit score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const convertTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return Math.round(minutes * 60 + seconds);
    }
    return Math.round(parseFloat(timeString) || 0);
  };

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

  const getMaxTimeForArea = (areaIndex: number, entry?: any): string => {
    const targetEntry = entry || currentEntry;
    if (!targetEntry) {
      // For sample/test mode, use default times
      return "3:00";
    }

    // Map area index to the appropriate timeLimit field
    switch (areaIndex) {
      case 0:
        return targetEntry.timeLimit || '02:00';
      case 1:
        return targetEntry.timeLimit2 || '02:00';
      case 2:
        return targetEntry.timeLimit3 || '02:00';
      default:
        return '02:00';
    }
  };

  const _resetForm = (entry?: any) => {
    const nextEntryAreas = initializeAreas(entry?.element || '', entry?.level || '');
    setAreas(nextEntryAreas);
    setQualifying('');
    setNonQualifyingReason('');
    setFaultCount(0);
    setTotalTime('');

    // Reset Nationals-specific fields
    setAlertsCorrect(0);
    setAlertsIncorrect(0);
    setFinishCallErrors(0);
    setIsExcused(false);
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

  const startStopwatch = () => {
    setIsStopwatchRunning(true);
    const startTime = Date.now() - stopwatchTime;
    const interval = setInterval(() => {
      const currentTime = Date.now() - startTime;
      setStopwatchTime(currentTime);

      // Auto-stop when time expires
      const maxTimeStr = getMaxTimeForArea(currentAreaIndex || 0);
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

          // Auto-fill the area time field with max time
          const formattedMaxTime = formatStopwatchTime(maxTimeMs);
          if (currentAreaIndex < areas.length) {
            handleAreaUpdate(currentAreaIndex, 'time', formattedMaxTime);
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
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }

    const formattedTime = formatStopwatchTime(stopwatchTime);
    if (currentAreaIndex < areas.length) {
      handleAreaUpdate(currentAreaIndex, 'time', formattedTime);
      if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex(prev => prev + 1);
        resetStopwatch();
      }
    }
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

    // Get max time for current area being timed
    const maxTimeStr = getMaxTimeForArea(currentAreaIndex || 0);
    if (!maxTimeStr) return false;

    // Parse max time string (format: "3:00") to milliseconds
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    // Show warning if less than 30 seconds remaining
    const remainingMs = maxTimeMs - stopwatchTime;
    return remainingMs > 0 && remainingMs <= 30000; // 30 seconds
  };

  const isTimeExpired = (): boolean => {
    const maxTimeStr = getMaxTimeForArea(currentAreaIndex || 0);
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

  const handleAreaUpdate = (index: number, field: keyof AreaScore, value: any) => {
    setAreas(prev => prev.map((area, i) =>
      i === index ? { ...area, [field]: value } : area
    ));
  };

  // Add missing handleTimeInputChange function
  const handleTimeInputChange = (index: number, value: string) => {
    handleAreaUpdate(index, 'time', value);
  };

  // Clear time functions
  const clearTimeInput = (index: number) => {
    handleAreaUpdate(index, 'time', '');
  };

  // Smart time parsing function - handles multiple input formats
  const parseSmartTime = (input: string): string => {
    if (!input || input.trim() === '') return '';

    const cleaned = input.trim();

    // If already in MM:SS.HH format, validate and return
    const fullFormatMatch = cleaned.match(/^(\d{1,2}):(\d{2})\.(\d{2})$/);
    if (fullFormatMatch) {
      const [, minutes, seconds, hundredths] = fullFormatMatch;
      const min = parseInt(minutes);
      const sec = parseInt(seconds);
      const hun = parseInt(hundredths);

      if (min <= 59 && sec <= 59 && hun <= 99) {
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${hun.toString().padStart(2, '0')}`;
      }
    }

    // Handle MM:SS format (no hundredths)
    const timeFormatMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (timeFormatMatch) {
      const [, minutes, seconds] = timeFormatMatch;
      const min = parseInt(minutes);
      const sec = parseInt(seconds);

      if (min <= 59 && sec <= 59) {
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.00`;
      }
    }

    // Handle decimal format like 123.45
    const decimalMatch = cleaned.match(/^(\d{1,3})\.(\d{1,2})$/);
    if (decimalMatch) {
      const [, wholePart, decimalPart] = decimalMatch;
      const totalSeconds = parseInt(wholePart);
      const hundredths = decimalPart.padEnd(2, '0').slice(0, 2);

      if (totalSeconds <= 3599) { // Max 59:59
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths}`;
      }
    }

    // Handle pure digit strings
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length === 0) return '';

    const digits = digitsOnly.slice(0, 6); // Max 6 digits

    if (digits.length === 5) {
      // 5 digits: MSSYY format (1:23.45)
      const minutes = digits.slice(0, 1);
      const seconds = digits.slice(1, 3);
      const hundredths = digits.slice(3, 5);

      const min = parseInt(minutes);
      const sec = parseInt(seconds);

      if (min <= 9 && sec <= 59) {
        return `0${minutes}:${seconds}.${hundredths}`;
      }
    } else if (digits.length >= 6) {
      // 6+ digits: MMSSYY format
      const minutes = digits.slice(0, 2);
      const seconds = digits.slice(2, 4);
      const hundredths = digits.slice(4, 6).padEnd(2, '0');

      const min = parseInt(minutes);
      const sec = parseInt(seconds);

      if (min <= 59 && sec <= 59) {
        return `${minutes}:${seconds}.${hundredths}`;
      }
    } else if (digits.length === 4) {
      // 4 digits: SSYY format (under 1 minute)
      const seconds = digits.slice(0, 2);
      const hundredths = digits.slice(2, 4);

      const sec = parseInt(seconds);
      if (sec <= 59) {
        return `00:${seconds}.${hundredths}`;
      }
    } else if (digits.length === 3) {
      // 3 digits: SYY format (S.YY seconds)
      const seconds = digits.slice(0, 1);
      const hundredths = digits.slice(1, 3);

      const sec = parseInt(seconds);
      if (sec <= 9) {
        return `00:0${seconds}.${hundredths}`;
      }
    } else if (digits.length === 2) {
      // 2 digits: treat as hundredths of a second (0.YY)
      const hundredths = digits;
      return `00:00.${hundredths}`;
    } else if (digits.length === 1) {
      // 1 digit: treat as minutes
      const minutes = parseInt(digits);
      if (minutes <= 9) {
        return `0${minutes}:00.00`;
      }
    }

    // If no valid format found, return original input for user to continue typing
    return cleaned;
  };

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
    if (!classId || !showContext?.licenseKey) return;

    try {
      // First get class information including trial date
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select(`
          trials!inner (
            trial_date,
            trial_number
          )
        `)
        .eq('id', parseInt(classId))
        .single();

      if (classInfo && !classError) {
        const trial = Array.isArray(classInfo.trials) ? classInfo.trials[0] : classInfo.trials;
        // Format date as mm/dd/yyyy
        const rawDate = trial?.trial_date || '';
        if (rawDate) {
          const date = new Date(rawDate);
          const formatted = (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
                           date.getDate().toString().padStart(2, '0') + '/' +
                           date.getFullYear();
          setTrialDate(formatted);
        }
        setTrialNumber(trial?.trial_number?.toString() || '1');
      }

      const entries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      setEntries(entries);
      setCurrentClassEntries(parseInt(classId));

      if (entryId) {
        const targetEntry = entries.find(e => e.id === parseInt(entryId));
        if (targetEntry) {
          setCurrentEntry(targetEntry);
          await markInRing(targetEntry.id, true);
          const initialAreas = initializeAreas(targetEntry.element || '', targetEntry.level || '');
          setAreas(initialAreas);
        }
      } else if (entries.length > 0) {
        setCurrentEntry(entries[0]);
        await markInRing(entries[0].id, true);
        const initialAreas = initializeAreas(entries[0].element || '', entries[0].level || '');
        setAreas(initialAreas);
      }

      // Start scoring session
      if (!isScoring && entries.length > 0) {
        startScoringSession(
          parseInt(classId),
          entries[0].className || 'AKC Scent Work',
          isNationalsMode ? 'AKC_SCENT_WORK_NATIONAL' : 'AKC_SCENT_WORK',
          'judge-1',
          entries.length
        );
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  // Show demo mode when no real data is available
  if (!currentEntry) {
    // Create sample entry for demo
    const sampleEntry = {
      id: parseInt(entryId || '1'),
      armband: 173,
      callName: "Dog 74",
      breed: "Dutch Shepherd",
      handler: "Person 74",
      element: "Container",
      level: "Master",
      section: "A",
      className: "Container Master",
      timeLimit: "02:00",
      timeLimit2: "",
      timeLimit3: "",
      areas: 1
    };

    // Initialize sample areas if not already set
    if (areas.length === 0) {
      const sampleAreas = initializeAreas(sampleEntry.element, sampleEntry.level);
      setAreas(sampleAreas);
    }

    // Demo mode UI - same as main component but with sample data
    const allAreasScored = qualifying !== 'Q' || areas.every(area => area.time && area.time !== '');
    const isResultSelected = qualifying !== '';
    const isNQReasonRequired = (qualifying === 'NQ' || qualifying === 'EX' || qualifying === 'WD') && nonQualifyingReason === '';

    return (
      <div className="flutter-scoresheet-container app-container" data-theme="dark">
        <div className="flutter-scoresheet">
        {/* Demo Mode Banner */}
        <div style={{
          backgroundColor: '#ff6b35',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          🚧 DEMO MODE - Sample Data 🚧
        </div>

        {/* Header */}
        <header className="mobile-header">
          <HamburgerMenu
            backNavigation={{
              label: "Back to Entry List",
              action: handleNavigateWithRingCleanup
            }}
            currentPage="entries"
          />
          <h1>AKC Nationals</h1>
          <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Trial Info - Compact */}
        <div className="flutter-trial-info">
          <span>{trialDate || '10/11/2025'}</span>
          <span className="separator">•</span>
          <span>Trial {trialNumber || '1'}</span>
          <span className="separator">•</span>
          <span>{sampleEntry.element} {sampleEntry.level}</span>
        </div>

        {/* Dog Info Card - Production Styling */}
        <div className="flutter-dog-info-card">
          <div className="flutter-armband">
            {sampleEntry.armband}
          </div>
          <div className="flutter-dog-details">
            <div className="flutter-dog-name">{sampleEntry.callName}</div>
            <div className="flutter-dog-breed">{sampleEntry.breed}</div>
            <div className="flutter-dog-handler">Handler: {sampleEntry.handler}</div>
          </div>
        </div>

        {/* Timer Section */}
        <div className="timer-section">
          <div className="timer-display">
            <div className="timer-time">
              {formatStopwatchTime(stopwatchTime)}
            </div>
            {getTimerWarningMessage() && (
              <div className="timer-warning">{getTimerWarningMessage()}</div>
            )}

            <div className="timer-controls">
              <button className="timer-btn-secondary" onClick={resetStopwatch}>⟲</button>
              <button
                className={`timer-btn-main ${isStopwatchRunning ? 'stop' : 'start'}`}
                onClick={isStopwatchRunning ? stopStopwatch : startStopwatch}
              >
                {isStopwatchRunning ? '⏸' : '▶'}
                {isStopwatchRunning ? ' Stop' : ' Start'}
              </button>
              {isStopwatchRunning && (
                <button className="timer-btn-secondary" onClick={_pauseStopwatch} title="Pause without moving to next area">⏸️</button>
              )}
            </div>
          </div>
        </div>

        {/* Time Input */}
        <div className="time-inputs">
          {areas.map((area, index) => (
            <div key={area.areaName} className="time-input-group">
              {areas.length > 1 && (
                <div className={`area-badge ${area.time ? 'completed' : 'pending'}`}>
                  Area {index + 1}
                </div>
              )}
              <div className="time-input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Type: 12345 or 1:23.45"
                  value={area.time}
                  onChange={(e) => handleSmartTimeInput(index, e.target.value)}
                  onBlur={(e) => handleTimeInputBlur(index, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className={`time-input ${areas.length > 1 ? 'multi-area' : 'single-area'}`}
                />
                {area.time && (
                  <button
                    type="button"
                    className="time-clear-button"
                    onClick={() => clearTimeInput(index)}
                    title="Clear time"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <span className="max-time">Max: {getMaxTimeForArea(index, sampleEntry)}</span>
            </div>
          ))}
        </div>

        {/* Result Buttons */}
        <ResultChoiceChips
          selectedResult={
            qualifying === 'Qualified' ? 'Qualified' :
            qualifying === 'Absent' ? 'Absent' :
            qualifying === 'Excused' ? 'Excused' :
            null
          }
          onResultChange={(result) => {
            if (result === 'Qualified') {
              setQualifying('Qualified');
            } else if (result === 'Absent') {
              setQualifying('Absent');
              setNonQualifyingReason('Absent');
            } else if (result === 'Excused') {
              setQualifying('Excused');
              setNonQualifyingReason('Excused');
            }
          }}
          showNQ={true}
          showWD={true}
          showEX={true}
          onNQClick={() => {
            setQualifying('NQ');
            setNonQualifyingReason('Incorrect Call');
          }}
          onWDClick={() => {
            setQualifying('WD');
            setNonQualifyingReason('In Season');
          }}
          onEXClick={() => {
            setQualifying('EX');
            setNonQualifyingReason('Dog Eliminated');
          }}
          isNationalsMode={isNationalsMode}
        />

        {/* Nationals Counters */}
        {isNationalsMode && (
          <NationalsCounterSimple
            correctCalls={alertsCorrect}
            onCorrectCallsChange={setAlertsCorrect}
            incorrectCalls={alertsIncorrect}
            onIncorrectCallsChange={setAlertsIncorrect}
            noFinishCalls={finishCallErrors}
            onNoFinishCallsChange={setFinishCallErrors}
            fringeCalls={0}
            onFringeCallsChange={() => {}}
          />
        )}

        {/* Action Buttons */}
        <div className="action-buttons-section">
          <button
            className="cancel-btn"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className="save-btn"
            onClick={() => {
              alert('Demo mode - Score would be saved!');
            }}
            disabled={!allAreasScored || !isResultSelected || isNQReasonRequired}
          >
            Save Score
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flutter-scoresheet-container app-container" data-theme="dark">
      <div className="flutter-scoresheet">
      {/* Header */}
      <header className="mobile-header">
        <HamburgerMenu
          backNavigation={{
            label: "Back to Entry List",
            action: handleNavigateWithRingCleanup
          }}
          currentPage="entries"
        />
        <div className="header-content">
          <h1>
            {isNationalsMode ? '🏆 AKC Nationals' : 'AKC Scent Work'}
          </h1>
          <div className="header-trial-info">
            <span>{trialDate}</span>
            <span className="trial-separator">•</span>
            <span>Trial {trialNumber}</span>
            <span className="trial-separator">•</span>
            <span>{currentEntry.element} {currentEntry.level}</span>
          </div>
        </div>
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>


      {/* Dog Info Card - Production Styling */}
      <div className="flutter-dog-info-card">
        <div className="flutter-armband">
          {currentEntry.armband}
        </div>
        <div className="flutter-dog-details">
          <div className="flutter-dog-name">{currentEntry.callName}</div>
          <div className="flutter-dog-breed">{currentEntry.breed}</div>
          <div className="flutter-dog-handler">Handler: {currentEntry.handler}</div>
        </div>
      </div>


      {/* Flutter-style Timer Section */}
      <div className="flutter-timer-card">
        <div className="timer-display-large">
          {formatStopwatchTime(stopwatchTime)}
        </div>
        <div className="timer-controls-flutter">
          <button
            className={`timer-btn-start ${isStopwatchRunning ? 'stop' : 'start'}`}
            onClick={isStopwatchRunning ? stopStopwatch : startStopwatch}
          >
            {isStopwatchRunning ? 'Stop' : 'Start'}
          </button>
          <button className="timer-btn-reset" onClick={resetStopwatch}>⟲</button>
        </div>
      </div>

      {/* Timer Warning Message */}
      {getTimerWarningMessage() && (
        <div className={`timer-warning ${getTimerWarningMessage() === 'Time Expired' ? 'expired' : 'warning'}`}>
          {getTimerWarningMessage()}
        </div>
      )}

      {/* Time Input - Conditional Badge Based on Area Count */}
      {areas.map((area, index) => (
        <div key={index} className="flutter-time-card">
          <div className="time-input-flutter">
            {/* Only show badge for multi-area elements/levels */}
            {areas.length > 1 && (
              <div className={`area-badge ${area.time ? 'completed' : 'pending'}`}>
                Area {index + 1}
              </div>
            )}
            <div className="flutter-time-input-wrapper">
              <input
                type="text"
                value={area.time || ''}
                onChange={(e) => handleSmartTimeInput(index, e.target.value)}
                onBlur={(e) => handleTimeInputBlur(index, e.target.value)}
                placeholder="Type: 12345 or 1:23.45"
                className={`flutter-time-input ${areas.length === 1 ? 'single-area' : ''}`}
              />
              {area.time && (
                <button
                  type="button"
                  className="flutter-time-clear-button"
                  onClick={() => clearTimeInput(index)}
                  title="Clear time"
                >
                  <X size={16} />
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
            isNationalsMode ? (
              qualifying as 'Qualified' | 'Absent' | 'Excused' | null
            ) : (
              // Map regular show results to choice chip format
              qualifying === 'Q' ? 'Qualified' :
              qualifying === 'ABS' ? 'Absent' :
              qualifying === 'EX' ? 'Excused' :
              null
            )
          }
          onResultChange={(result) => {
            if (isNationalsMode) {
              setQualifying(result);
            } else {
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
            }
          }}
          showNQ={!isNationalsMode}
          showWD={!isNationalsMode}
          showEX={true}
          onNQClick={() => {
            setQualifying('NQ');
            setNonQualifyingReason('Incorrect Call');
          }}
          onWDClick={() => {
            setQualifying('WD');
            setWithdrawnReason('In Season');
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
          withdrawnReason={withdrawnReason}
          onWithdrawnReasonChange={setWithdrawnReason}
          isNationalsMode={isNationalsMode}
        />


      </div>

      {/* Mobile Nationals Counters - Below timer and results */}
      {isNationalsMode && (
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
      )}

      {/* Flutter-style Action Buttons */}
      <div className="flutter-actions">
        <button className="flutter-btn-cancel" onClick={handleNavigateWithRingCleanup}>
          Cancel
        </button>
        <button
          className="flutter-btn-save"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting || !qualifying}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

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
              <div className={`result-time-grid ${isNationalsMode ? 'nationals-mode' : ''}`}>
                <div className="score-item">
                  <span className="item-label">Result</span>
                  <span className={`item-value result-${qualifying?.toLowerCase()}`}>
                    {qualifying === 'Q' ? 'Qualified' :
                     qualifying === 'NQ' ? 'NQ' :
                     qualifying === 'ABS' || qualifying === 'Absent' ? 'Absent' :
                     qualifying === 'E' || qualifying === 'EX' || qualifying === 'Excused' ? 'Excused' :
                     qualifying === 'WD' || qualifying === 'Withdrawn' ? 'Withdrawn' : qualifying}
                  </span>
                </div>
                <div className="score-item time-container">
                  <span className="item-label">Time</span>
                  <span className="item-value time-value">{areas[0]?.time || totalTime || calculateTotalTime()}</span>
                </div>

                {!isNationalsMode && faultCount > 0 && (
                  <div className="score-item">
                    <span className="item-label">Faults</span>
                    <span className="item-value negative">{faultCount}</span>
                  </div>
                )}

                {!isNationalsMode && nonQualifyingReason && (qualifying === 'NQ' || qualifying === 'EX') && (
                  <div className="score-item">
                    <span className="item-label">{qualifying === 'EX' ? 'Excused' : 'NQ'} Reason</span>
                    <span className="item-value">{nonQualifyingReason}</span>
                  </div>
                )}

                {!isNationalsMode && withdrawnReason && qualifying === 'WD' && (
                  <div className="score-item">
                    <span className="item-label">Withdrawn Reason</span>
                    <span className="item-value">{withdrawnReason}</span>
                  </div>
                )}
              </div>

              {isNationalsMode && (
                <>
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
                </>
              )}

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
  );
};

export default AKCScentWorkScoresheetEnhanced;