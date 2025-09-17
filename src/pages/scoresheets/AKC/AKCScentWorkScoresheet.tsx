import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore, markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet.css';
import './AKCScentWorkScoresheet-Flutter.css';
import './AKCScentWorkScoresheet-JudgeDialog.css';

import { QualifyingResult } from '../../../stores/scoringStore';

type NationalsResult = 'Qualified' | 'Absent' | 'Excused';

interface AreaScore {
  areaName: string;
  time: string;
  found: boolean;
  correct: boolean;
}

export const AKCScentWorkScoresheet: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  
  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: addScoreToSession,
    moveToNextEntry,
    moveToPreviousEntry,
    endScoringSession
  } = useScoringStore();
  
  const {
    currentClassEntries,
    currentEntry,
    setCurrentClassEntries,
    setCurrentEntry,
    markAsScored,
    getPendingEntries
  } = useEntryStore();
  
  const { addToQueue, isOnline } = useOfflineQueueStore();
  
  // Initialize areas based on element and level
  const initializeAreas = (element: string, level: string): AreaScore[] => {
    const elementLower = element?.toLowerCase() || '';
    const levelLower = level?.toLowerCase() || '';
    
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
        // Novice and Advanced have single area
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
        // Novice, Advanced, and Excellent have single area
        return [
          { areaName: 'Handler Discrimination', time: '', found: false, correct: false }
        ];
      }
    } else {
      // Container, Exterior, Buried - single area for all levels
      return [
        { areaName: element || 'Search Area', time: '', found: false, correct: false }
      ];
    }
  };

  // Local state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult | ''>('');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  // Central stopwatch state
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
  
  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Central stopwatch handlers
  const startStopwatch = () => {
    setIsStopwatchRunning(true);
    const startTime = Date.now() - stopwatchTime;
    const interval = setInterval(() => {
      setStopwatchTime(Date.now() - startTime);
    }, 10);
    setStopwatchInterval(interval);
  };
  
  const stopStopwatch = () => {
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    
    // Auto-populate current area time field
    const formattedTime = formatStopwatchTime(stopwatchTime);
    if (currentAreaIndex < areas.length) {
      handleAreaUpdate(currentAreaIndex, 'time', formattedTime);
      
      // Move to next area if available, otherwise stay on current
      if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex(prev => prev + 1);
        // Reset stopwatch for next area (multi-area workflow)
        resetStopwatch();
      }
    }
  };
  
  const pauseStopwatch = () => {
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    // Just pause without moving to next area or resetting
  };
  
  const resetStopwatch = () => {
    setStopwatchTime(0);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    setIsStopwatchRunning(false);
  };
  
  const formatStopwatchTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };
  
  // Helper functions for time input formatting
  const isDetectiveSearch = (entry?: any): boolean => {
    const targetEntry = entry || currentEntry;
    return targetEntry?.element?.toLowerCase() === 'detective' || 
           targetEntry?.className?.toLowerCase().includes('detective');
  };
  
  const getMaxDigits = (entry?: any): number => {
    return isDetectiveSearch(entry) ? 6 : 5; // Detective: MM:SS.SS (6), Others: M:SS.SS (5)
  };
  
  const formatTimeInput = (input: string, entry?: any): string => {
    // Remove all non-digit characters
    const digits = input.replace(/[^\d]/g, '');
    const maxDigits = getMaxDigits(entry);
    
    // Limit to max digits
    const limitedDigits = digits.substring(0, maxDigits);
    
    if (limitedDigits.length === 0) return '';
    
    // Format based on length
    if (limitedDigits.length <= 2) {
      // Just seconds: "12" -> "12"
      return limitedDigits;
    } else if (limitedDigits.length <= 4) {
      // Seconds with decimals: "1234" -> "12.34"
      const seconds = limitedDigits.substring(0, limitedDigits.length - 2);
      const centiseconds = limitedDigits.substring(limitedDigits.length - 2);
      return `${seconds}.${centiseconds}`;
    } else {
      // Minutes and seconds: "12345" -> "1:23.45" or "123456" -> "12:34.56"
      const isDetective = maxDigits === 6;
      const minutesLength = isDetective ? 2 : 1;
      
      const minutes = limitedDigits.substring(0, minutesLength);
      const seconds = limitedDigits.substring(minutesLength, minutesLength + 2);
      const centiseconds = limitedDigits.substring(minutesLength + 2);
      
      return `${minutes}:${seconds}.${centiseconds}`;
    }
  };
  
  const handleTimeInputChange = (index: number, value: string, sampleEntry?: any) => {
    const entryToUse = sampleEntry || currentEntry;
    const formattedTime = formatTimeInput(value, entryToUse);
    handleAreaUpdate(index, 'time', formattedTime);
  };
  
  // Load class entries on mount or set test data
  useEffect(() => {
    console.log('🔍 AKC Scent Work useEffect triggered:', { classId, licenseKey: showContext?.licenseKey, entryId });
    if (classId && showContext?.licenseKey) {
      console.log('📞 Calling loadEntries()...');
      loadEntries();
    } else if (!classId) {
      console.log('🧪 Test mode: initializing sample areas');
      // For test route without parameters, initialize sample areas
      const sampleAreas = initializeAreas("Interior", "Masters");
      setAreas(sampleAreas);
    } else {
      console.log('❌ Missing required params:', { classId: !!classId, licenseKey: !!showContext?.licenseKey });
    }
  }, [classId, entryId, showContext]);

  // Cleanup stopwatch and clear in-ring status on unmount
  useEffect(() => {
    return () => {
      const currentEntryAtCleanup = currentEntryRef.current;
      const stopwatchIntervalAtCleanup = stopwatchIntervalRef.current;
      
      console.log('🧹 Cleanup running - currentEntry:', currentEntryAtCleanup?.id, 'stopwatchInterval:', !!stopwatchIntervalAtCleanup);
      
      if (stopwatchIntervalAtCleanup) {
        console.log('🕐 Clearing stopwatch interval');
        clearInterval(stopwatchIntervalAtCleanup);
      }
      
      // Always clear in-ring status when leaving scoresheet
      // This handles both cases: confirming score OR clicking back to classes
      if (currentEntryAtCleanup?.id) {
        console.log('🐕 Clearing dog', currentEntryAtCleanup.id, 'from ring');
        markInRing(currentEntryAtCleanup.id, false).catch(error => {
          console.error('Failed to clear in-ring status on unmount:', error);
        });
      } else {
        console.log('❌ No currentEntry.id found during cleanup');
      }
    };
  }, []); // Empty dependency array - only run on unmount
  
  // Auto-stop stopwatch when time expires
  useEffect(() => {
    if (isTimeExpired() && isStopwatchRunning) {
      setIsStopwatchRunning(false);
      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        setStopwatchInterval(null);
      }
    }
  }, [stopwatchTime, isStopwatchRunning, stopwatchInterval]);
  
  const loadEntries = async () => {
    console.log('🔍 Loading entries with:', { classId, entryId, licenseKey: showContext?.licenseKey ? 'present' : 'missing' });
    
    if (!classId || !showContext?.licenseKey) {
      console.error('❌ Missing required data:', { classId, licenseKey: !!showContext?.licenseKey });
      return;
    }
    
    try {
      console.log('📡 Calling getClassEntries...');
      const entries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      console.log('✅ Entries loaded:', { count: entries.length, entries: entries.slice(0, 3) });
      setCurrentClassEntries(parseInt(classId));
      
      // Find and set the specific entry that was clicked
      let targetEntry;
      if (entryId && entryId !== '0') {
        // Look for specific entry ID
        targetEntry = entries.find(e => e.id === parseInt(entryId));
      }
      
      // Fallback to first pending entry if specific entry not found or entryId is '0'
      if (!targetEntry) {
        const pending = entries.filter(e => !e.isScored);
        targetEntry = pending.length > 0 ? pending[0] : entries[0];
      }
      
      if (targetEntry) {
        setCurrentEntry(targetEntry);
        
        // Mark dog as in-ring when scoresheet opens
        if (targetEntry.id) {
          markInRing(targetEntry.id, true).catch(error => {
            console.error('Failed to mark dog in-ring on scoresheet open:', error);
          });
        }
        
        // Initialize areas based on element and level
        const initialAreas = initializeAreas(targetEntry.element || '', targetEntry.level || '');
        setAreas(initialAreas);
        
        // Start scoring session if not already started
        if (!isScoring) {
          startScoringSession(
            parseInt(classId),
            currentEntry?.className || 'Unknown Class',
            'AKC_SCENT_WORK',
            showContext.licenseKey,
            entries.length
          );
        }
      }
    } catch (error) {
      console.error('❌ Error loading entries:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        classId,
        licenseKey: showContext?.licenseKey ? 'present' : 'missing'
      });
    }
  };
  
  const handleAreaUpdate = (areaIndex: number, field: keyof AreaScore, value: any) => {
    setAreas(prev => prev.map((area, index) => 
      index === areaIndex ? { ...area, [field]: value } : area
    ));
  };
  
  const calculateTotalTime = () => {
    // For AKC Scent Work, sum ALL area times (regardless of found status)
    // This matches AKC rules where total search time includes all areas
    const times = areas
      .filter(area => area.time && area.time.trim() !== '')
      .map(area => {
        const timeStr = area.time.trim();
        if (timeStr.includes(':')) {
          const [minutes, seconds] = timeStr.split(':').map(parseFloat);
          return (minutes * 60) + seconds;
        } else {
          // Handle seconds-only format
          return parseFloat(timeStr) || 0;
        }
      });
    
    if (times.length === 0) return '';
    
    const total = times.reduce((sum, time) => sum + time, 0);
    const totalMinutes = Math.floor(total / 60);
    const totalSeconds = (total % 60).toFixed(2);
    
    return `${totalMinutes}:${totalSeconds.padStart(5, '0')}`;
  };
  
  const _calculateQualifying = (): QualifyingResult => {
    const foundCount = areas.filter(area => area.found && area.correct).length;
    
    // Basic AKC Scent Work qualifying logic (simplified)
    if (foundCount >= 2) return 'Q'; // Need at least 2 correct finds
    return 'NQ';
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
        return targetEntry.timeLimit || '';
      case 1:
        return targetEntry.timeLimit2 || '';
      case 2:
        return targetEntry.timeLimit3 || '';
      default:
        return '';
    }
  };
  
  const shouldShow30SecondWarning = (): boolean => {
    if (!isStopwatchRunning) return false;
    
    // Get max time for current area (Area 1 for simplicity)
    const maxTimeStr = getMaxTimeForArea(currentAreaIndex);
    if (!maxTimeStr) return false;
    
    // Parse max time string (format: "3:00") to milliseconds
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;
    
    // Show warning if less than 30 seconds remaining
    const remainingMs = maxTimeMs - stopwatchTime;
    return remainingMs > 0 && remainingMs <= 30000; // 30 seconds
  };
  
  const isTimeExpired = (): boolean => {
    const maxTimeStr = getMaxTimeForArea(currentAreaIndex);
    if (!maxTimeStr) return false;
    
    // Parse max time string (format: "3:00") to milliseconds
    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;
    
    // Time is expired if current time equals or exceeds max time
    // Show expired message even when stopwatch is stopped
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
  
  const handleSubmit = () => {
    const calculatedTotal = calculateTotalTime();
    setTotalTime(calculatedTotal);
    
    // Respect the user's manual selection instead of overriding with calculation
    // const calculatedQualifying = qualifying === 'Q' ? calculateQualifying() : (qualifying || 'NQ');
    // setQualifying(calculatedQualifying);
    
    setShowConfirmation(true);
  };
  
  const confirmSubmit = async () => {
    if (!currentEntry) {
      // In sample mode, just simulate success
      setIsSubmitting(true);
      setShowConfirmation(false);
      
      // Simulate a brief delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert('Sample score recorded! (This is demo mode)');
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    // Use the user's selected qualification directly
    const finalQualifying = qualifying || 'NQ';
    
    // Result is already in full word format
    const finalResultText = finalQualifying;
    const finalTotalTime = totalTime || calculateTotalTime() || '0.00';
    
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
      nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
    };
    
    try {
      // Add to scoring session
      addScoreToSession(scoreData);
      
      // Update entry store
      markAsScored(currentEntry.id, finalQualifying || 'NQ');
      
      if (isOnline) {
        // Submit directly if online
        await submitScore(currentEntry.id, {
          resultText: finalResultText,
          searchTime: finalTotalTime,
          nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
        });
      } else {
        // Add to offline queue
        addToQueue({
          entryId: currentEntry.id,
          armband: currentEntry.armband,
          classId: parseInt(classId!),
          className: currentEntry.className,
          scoreData: {
            resultText: finalResultText,
            searchTime: finalTotalTime,
            nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
            areas: areaResults
          }
        });
      }
      
      // Move to next entry
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        setCurrentEntry(pendingEntries[0]);
        moveToNextEntry();
        
        // Reset form with areas for next entry
        const nextEntryAreas = initializeAreas(pendingEntries[0].element || '', pendingEntries[0].level || '');
        setAreas(nextEntryAreas);
        setQualifying('');
        setNonQualifyingReason('');
        setFaultCount(0);
        setTotalTime('');
      } else {
        // All entries scored
        endScoringSession();
        navigate(-1);
      }
      
    } catch (error) {
      console.error('Error submitting score:', error);
      console.error('Error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        currentEntry: currentEntry?.id,
        scoreData: {
          resultText: finalResultText,
          searchTime: finalTotalTime,
          nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
        },
        isOnline
      });
      alert(`Failed to submit score: ${error instanceof Error ? error.message : 'Unknown error'}. It has been saved offline.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const _handlePrevious = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex > 0) {
      const prevEntry = currentClassEntries[currentIndex - 1];
      setCurrentEntry(prevEntry);
      // Update areas for previous entry
      const prevAreas = initializeAreas(prevEntry.element || '', prevEntry.level || '');
      setAreas(prevAreas);
      moveToPreviousEntry();
    }
  };
  
  const _handleNext = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex < currentClassEntries.length - 1) {
      const nextEntry = currentClassEntries[currentIndex + 1];
      setCurrentEntry(nextEntry);
      // Update areas for next entry
      const nextAreas = initializeAreas(nextEntry.element || '', nextEntry.level || '');
      setAreas(nextAreas);
      moveToNextEntry();
    }
  };
  
  // Handle missing entry data properly instead of sample mode
  if (!currentEntry) {
    // Show helpful error message instead of confusing sample mode
    console.log('❌ No current entry found. Showing error state.');
    
    // Always show error state instead of sample mode
    // eslint-disable-next-line no-constant-condition
    if (false) { // Disabled sample mode - dead code to be removed
      // For testing purposes, create sample data
    const sampleEntry = {
      id: 1,
      armband: 10,
      callName: "Call Name",
      breed: "Breed",
      handler: "Handler",
      element: "Interior", 
      level: "Masters",
      section: "A",
      className: "AKC Scent Work",
      timeLimit: "3:00",
      timeLimit2: "3:00", 
      timeLimit3: "3:00",
      areas: 3
    };
    
    const sampleTrial = {
      trialDate: "2025-01-15",
      trialNumber: "1",
      shortDate: "01/15"
    };
    
    // Set sample data for testing
    if (areas.length === 0) {
      const sampleAreas = initializeAreas("Interior", "Masters");
      setAreas(sampleAreas);
    }
    
    const allAreasScored = qualifying !== 'Q' || areas.every(area => area.time && area.time !== '');
    const isResultSelected = qualifying !== '';
    const isNQReasonRequired = (qualifying === 'NQ' || qualifying === 'EX' || qualifying === 'WD') && nonQualifyingReason === '';
    
    
    return (
      <div className="mobile-scoresheet app-container-narrow" data-theme={darkMode ? 'dark' : 'light'}>
        {/* Development Sample Mode Banner */}
        <div style={{
          backgroundColor: '#ff6b35',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          🚧 DEVELOPMENT MODE - Sample Data 🚧
        </div>
        
        {/* Compact Header */}
        <header className="mobile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>AKC Scent Work</h1>
          <button className="theme-btn" onClick={toggleTheme}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>
        
        {/* Compact Dog & Trial Info */}
        <div className="dog-info-compact">
          <div className="armband">#{sampleEntry.armband}</div>
          <div className="dog-details">
            <div className="dog-name">{sampleEntry.callName}</div>
            <div className="dog-breed">{sampleEntry.breed}</div>
            <div className="dog-handler">Handler: {sampleEntry.handler}</div>
          </div>
          <div className="trial-details">
            <div className="class-info">{sampleTrial.shortDate}</div>
            <div className="class-info">Trial {sampleTrial.trialNumber}</div>
            <div className="class-info">{sampleEntry.element} {sampleEntry.level}{sampleEntry.section !== '-' ? ` ${sampleEntry.section}` : ''}</div>
          </div>
        </div>
        
        {/* Integrated Timer & Areas */}
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
                <button className="timer-btn-secondary" onClick={pauseStopwatch} title="Pause without moving to next area">⏸️</button>
              )}
            </div>
          </div>
        </div>
        
        {/* Area Time Inputs */}
        <div className="areas-input">
          {areas.map((area, index) => {
            // Only show Area button if areas > 1
            const shouldShowAreaButton = sampleEntry.areas ? sampleEntry.areas > 1 : true;
            
            return (
              <div key={area.areaName} className="area-input-row">
                {shouldShowAreaButton && (
                  <button className={`area-btn ${index === currentAreaIndex ? 'active' : ''}`}>
                    Area {index + 1}
                  </button>
                )}
                <div className="time-input-wrapper">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder={isDetectiveSearch(sampleEntry) ? "Enter 6 Digits Only (00:00.00)" : "Enter 5 Digits Only (0:00.00)"}
                    value={area.time}
                    onChange={(e) => handleTimeInputChange(index, e.target.value, sampleEntry)}
                    onFocus={(e) => e.target.select()}
                    className="area-time-input"
                    maxLength={isDetectiveSearch(sampleEntry) ? 8 : 7}
                  />
                  {area.time && (
                    <button 
                      className="clear-time-btn"
                      onClick={() => handleAreaUpdate(index, 'time', '')}
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
                <span className="max-time">Max: {getMaxTimeForArea(index)}</span>
              </div>
            );
          })}
        </div>
        
        {/* Result Buttons */}
        <div className="result-section">
          <div className="result-row">
            <button
              className={`result-btn ${qualifying === 'Q' ? 'active' : ''}`}
              onClick={() => setQualifying('Q')}
            >
              Qualified (Q)
            </button>
            <button
              className={`result-btn ${qualifying === 'NQ' ? 'active' : ''}`}
              onClick={() => {
                setQualifying('NQ');
                setNonQualifyingReason('Incorrect Call');
              }}
            >
              NQ
            </button>
            <button
              className={`result-btn ${qualifying === 'ABS' ? 'active' : ''}`}
              onClick={() => setQualifying('ABS')}
            >
              Absent (ABS)
            </button>
            <button
              className={`result-btn ${qualifying === 'EX' ? 'active' : ''}`}
              onClick={() => {
                setQualifying('EX');
                setNonQualifyingReason('Dog Eliminated');
              }}
            >
              EX
            </button>
            <button
              className={`result-btn ${qualifying === 'WD' ? 'active' : ''}`}
              onClick={() => {
                setQualifying('WD');
                setNonQualifyingReason('In Season');
              }}
            >
              WD
            </button>
          </div>
        </div>
        
        {/* Faults Count Section - Only show for Qualified */}
        {qualifying === 'Q' && (
          <div className="faults-section">
            <h3>Faults Count</h3>
            <div className="fault-counter">
              <button 
                className="fault-btn-counter" 
                onClick={() => setFaultCount(Math.max(0, faultCount - 1))}
                disabled={faultCount === 0}
              >
                -
              </button>
              <span className="fault-count-display">{faultCount}</span>
              <button 
                className="fault-btn-counter" 
                onClick={() => setFaultCount(faultCount + 1)}
              >
                +
              </button>
            </div>
          </div>
        )}
        
        {/* NQ Reason Section - Only show for NQ */}
        {qualifying === 'NQ' && (
          <div className="nq-reason-section">
            <h3>Non-Qualifying Reason</h3>
            <div className="nq-reasons-grid">
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Incorrect Call' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Incorrect Call')}
              >
                Incorrect Call
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Max Time' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Max Time')}
              >
                Max Time
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Point to Hide' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Point to Hide')}
              >
                Point to Hide
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Harsh Correction' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Harsh Correction')}
              >
                Harsh Correction
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Significant Disruption' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Significant Disruption')}
              >
                Significant Disruption
              </button>
            </div>
          </div>
        )}
        
        {/* EX Reason Section - Only show for EX */}
        {qualifying === 'EX' && (
          <div className="nq-reason-section">
            <h3>Excused Reason</h3>
            <div className="nq-reasons-grid">
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Dog Eliminated' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Dog Eliminated')}
              >
                Dog Eliminated
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Handler Request' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Handler Request')}
              >
                Handler Request
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Out of Control' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Out of Control')}
              >
                Out of Control
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Overly Stressed' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Overly Stressed')}
              >
                Overly Stressed
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Other' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Other')}
              >
                Other
              </button>
            </div>
          </div>
        )}
        
        {/* WD Reason Section - Only show for WD */}
        {qualifying === 'WD' && (
          <div className="nq-reason-section">
            <h3>Withdrawn Reason</h3>
            <div className="nq-reasons-grid">
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'In Season' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('In Season')}
              >
                In Season
              </button>
              <button 
                className={`nq-reason-btn ${nonQualifyingReason === 'Judge Change' ? 'selected' : ''}`}
                onClick={() => setNonQualifyingReason('Judge Change')}
              >
                Judge Change
              </button>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="submit-section">
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!allAreasScored || !isResultSelected || isNQReasonRequired || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>
        </div>
        
        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            <span className="status-online">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className="status-center">
            <span>Total: {calculateTotalTime()}</span>
          </div>
          <div className="status-right">
          </div>
        </div>
      </div>
      );
    }
    
    // In production, show proper error state
    return (
      <div className="mobile-scoresheet app-container-narrow" data-theme={darkMode ? 'dark' : 'light'}>
        <header className="mobile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>Entry Not Found</h1>
          <button className="theme-btn" onClick={toggleTheme}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>
        
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <h2>No Entry Data Available</h2>
          <p>Unable to load entry information for this scoresheet.</p>
          <p>Please check your connection and try again.</p>
          
          <button 
            className="submit-btn"
            onClick={() => navigate(-1)}
            style={{ marginTop: '20px' }}
          >
            ← Back to Entry List
          </button>
        </div>
      </div>
    );
  }
  
  const _currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry.id) + 1;
  const allAreasScored = qualifying !== 'Q' || areas.every(area => area.time && area.time !== '');
  const isResultSelected = qualifying !== '';
  const isNQReasonRequired = (qualifying === 'NQ' || qualifying === 'EX' || qualifying === 'WD') && nonQualifyingReason === '';
  
  return (
    <div className="mobile-scoresheet" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Compact Header */}
      <header className="mobile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>AKC Scent Work</h1>
        <button className="theme-btn" onClick={toggleTheme}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>
      
      {/* Compact Dog & Trial Info */}
      <div className="dog-info-compact">
        <div className="armband">#{currentEntry.armband}</div>
        <div className="dog-details">
          <div className="dog-name">{currentEntry.callName}</div>
          <div className="dog-breed">{currentEntry.breed}</div>
          <div className="dog-handler">Handler: {currentEntry.handler}</div>
        </div>
        <div className="trial-details">
          <div className="class-info">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</div>
          <div className="class-info">Trial 1</div>
          <div className="class-info">{currentEntry.element || 'Interior'} {currentEntry.level || 'Masters'}{(currentEntry.section && currentEntry.section !== '-') ? ` ${currentEntry.section}` : ''}</div>
        </div>
      </div>
      
      {/* Integrated Timer & Areas */}
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
              <button className="timer-btn-secondary" onClick={pauseStopwatch} title="Pause without moving to next area">⏸️</button>
            )}
          </div>
        </div>
      </div>
      
      {/* Area Time Inputs */}
      <div className="areas-input">
        {areas.map((area, index) => {
          // Only show Area button if areas > 1
          const shouldShowAreaButton = currentEntry?.areas ? currentEntry.areas > 1 : true;
          
          return (
            <div key={area.areaName} className="area-input-row">
              {shouldShowAreaButton && (
                <button className={`area-btn ${index === currentAreaIndex ? 'active' : ''}`}>
                  Area {index + 1}
                </button>
              )}
              <div className="time-input-wrapper">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder={isDetectiveSearch() ? "Enter 6 Digits Only (00:00.00)" : "Enter 5 Digits Only (0:00.00)"}
                  value={area.time}
                  onChange={(e) => handleTimeInputChange(index, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="area-time-input"
                  maxLength={isDetectiveSearch() ? 8 : 7}
                />
                {area.time && (
                  <button 
                    className="clear-time-btn"
                    onClick={() => handleAreaUpdate(index, 'time', '')}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="max-time">Max: {getMaxTimeForArea(index)}</span>
            </div>
          );
        })}
      </div>
      
      {/* Result Choice Chips */}
      <ResultChoiceChips
        selectedResult={
          qualifying === 'Q' ? 'Qualified' :
          qualifying === 'ABS' ? 'Absent' :
          qualifying === 'EX' ? 'Excused' :
          undefined
        }
        onResultChange={(result: NationalsResult) => {
          if (result === 'Qualified') {
            setQualifying('Q');
          } else if (result === 'Absent') {
            setQualifying('ABS');
            setNonQualifyingReason('Absent');
          } else if (result === 'Excused') {
            setQualifying('EX');
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
      />
      
      {/* Faults Count Section - Only show for Qualified */}
      {qualifying === 'Q' && (
        <div className="faults-section">
          <h3>Faults Count</h3>
          <div className="fault-counter">
            <button 
              className="fault-btn-counter" 
              onClick={() => setFaultCount(Math.max(0, faultCount - 1))}
              disabled={faultCount === 0}
            >
              -
            </button>
            <span className="fault-count-display">{faultCount}</span>
            <button 
              className="fault-btn-counter" 
              onClick={() => setFaultCount(faultCount + 1)}
            >
              +
            </button>
          </div>
        </div>
      )}
      
      {/* NQ Reason Section - Only show for NQ */}
      {qualifying === 'NQ' && (
        <div className="nq-reason-section">
          <h3>Non-Qualifying Reason</h3>
          <div className="nq-reasons-grid">
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Incorrect Call' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Incorrect Call')}
            >
              Incorrect Call
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Max Time' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Max Time')}
            >
              Max Time
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Point to Hide' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Point to Hide')}
            >
              Point to Hide
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Harsh Correction' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Harsh Correction')}
            >
              Harsh Correction
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Significant Disruption' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Significant Disruption')}
            >
              Significant Disruption
            </button>
          </div>
        </div>
      )}
      
      {/* EX Reason Section - Only show for EX */}
      {qualifying === 'EX' && (
        <div className="nq-reason-section">
          <h3>Excuse Reason</h3>
          <div className="nq-reasons-grid">
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Dog Eliminated' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Dog Eliminated')}
            >
              Dog Eliminated
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Handler Request' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Handler Request')}
            >
              Handler Request
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Out of Control' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Out of Control')}
            >
              Out of Control
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Overly Stressed' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Overly Stressed')}
            >
              Overly Stressed
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Other' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Other')}
            >
              Other
            </button>
          </div>
        </div>
      )}
      
      {/* WD Reason Section - Only show for WD */}
      {qualifying === 'WD' && (
        <div className="nq-reason-section">
          <h3>Withdrawn Reason</h3>
          <div className="nq-reasons-grid">
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'In Season' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('In Season')}
            >
              In Season
            </button>
            <button 
              className={`nq-reason-btn ${nonQualifyingReason === 'Judge Change' ? 'selected' : ''}`}
              onClick={() => setNonQualifyingReason('Judge Change')}
            >
              Judge Change
            </button>
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <div className="submit-section">
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!allAreasScored || !isResultSelected || isNQReasonRequired || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </div>
      
      
      {/* Judge Confirmation Dialog */}
      {showConfirmation && (
        <div className="judge-confirmation-overlay">
          <div className="judge-confirmation-dialog">
            <div className="dialog-header">
              <h2>Score Confirmation</h2>
              <div className="trial-info">
                <span className="trial-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="trial-class">Trial 1 {currentEntry.element} {currentEntry.level}</span>
              </div>
            </div>

            <div className="dog-summary">
              <div className="armband-large">#{currentEntry.armband}</div>
              <div className="dog-info-summary">
                <div className="dog-name-large">{currentEntry.callName}</div>
                <div className="dog-breed">{currentEntry.breed}</div>
                <div className="handler-name">Handler: {currentEntry.handler}</div>
              </div>
            </div>

            <div className="score-details">
              <div className="score-row">
                <span className="score-label">Result</span>
                <span className={`score-value result-${qualifying?.toLowerCase() || ''}`}>
                  {qualifying === 'Q' ? 'Qualified' :
                   qualifying === 'NQ' ? 'Non-Qualifying' :
                   qualifying === 'ABS' ? 'Absent' :
                   qualifying === 'EX' ? 'Excused' :
                   qualifying === 'WD' ? 'Withdrawn' : qualifying}
                </span>
              </div>

              <div className="score-row">
                <span className="score-label">Time</span>
                <span className="score-value">{calculateTotalTime() || '0:00.00'}</span>
              </div>

              {qualifying === 'Q' && (
                <div className="score-row">
                  <span className="score-label">Faults</span>
                  <span className="score-value">{faultCount}</span>
                </div>
              )}

              {nonQualifyingReason && (
                <div className="score-row">
                  <span className="score-label">Reason</span>
                  <span className="score-value">{nonQualifyingReason}</span>
                </div>
              )}
            </div>

            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={() => setShowConfirmation(false)}>Cancel</button>
              <button className="dialog-btn confirm" onClick={confirmSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Confirm Score'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};