import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore, markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import '../../../styles/apple-design-system.css';

import { QualifyingResult } from '../../../stores/scoringStore';

interface AreaScore {
  areaName: string;
  time: string;
  found: boolean;
  correct: boolean;
}

export const AKCScentWorkScoresheet: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext, role } = useAuth();
  
  // Store hooks
  const {
    isScoring: _isScoring,
    startScoringSession,
    submitScore: _addScoreToSession,
    moveToNextEntry,
    moveToPreviousEntry,
    endScoringSession
  } = useScoringStore();
  
  const {
    currentClassEntries,
    currentEntry,
    setEntries,
    setCurrentClassEntries,
    setCurrentEntry,
    markAsScored,
    getPendingEntries
  } = useEntryStore();
  
  const { addToQueue, isOnline } = useOfflineQueueStore();
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Theme effect
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
      return [
        { areaName: element || 'Search Area', time: '', found: false, correct: false }
      ];
    }
  };

  // Local state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult>('Q');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  
  // Central stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchInterval, setStopwatchInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);

  // Initialize scoring session
  useEffect(() => {
    if (classId && entryId && showContext) {
      loadClassEntries();
    }
  }, [classId, entryId, showContext]);

  // Initialize areas when current entry changes
  useEffect(() => {
    if (currentEntry) {
      const initialAreas = initializeAreas(currentEntry.element || '', currentEntry.level || '');
      setAreas(initialAreas);
      setCurrentAreaIndex(0);
    }
  }, [currentEntry]);

  // Clear in-ring status when leaving scoresheet
  useEffect(() => {
    return () => {
      if (currentEntry?.id) {
        markInRing(currentEntry.id, false).catch(error => {
          console.error('Failed to clear in-ring status on unmount:', error);
        });
      }
    };
  }, []); // Fixed: removed currentEntry?.id dependency

  const loadClassEntries = async () => {
    try {
      const entries = await getClassEntries(parseInt(classId!), showContext!.licenseKey);
      setEntries(entries);
      setCurrentClassEntries(parseInt(classId!));
      
      // Find and set current entry
      let targetEntry;
      if (entryId !== '0') {
        targetEntry = entries.find(e => e.id === parseInt(entryId!));
      } else {
        targetEntry = entries.find(e => !e.isScored);
      }
      
      if (targetEntry) {
        setCurrentEntry(targetEntry);
        // Get the first entry to determine class name and judge
        const firstEntry = entries[0];
        if (firstEntry) {
          startScoringSession(
            parseInt(classId!), 
            firstEntry.className || 'AKC Scent Work',
            'AKC_SCENT_WORK',
            role || 'judge',
            entries.length
          );
        }
      }
    } catch (error) {
      console.error('Error loading class entries:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startStopwatch = () => {
    if (!isStopwatchRunning) {
      setIsStopwatchRunning(true);
      const interval = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
      setStopwatchInterval(interval);
    }
  };

  const stopStopwatch = () => {
    if (isStopwatchRunning && stopwatchInterval) {
      setIsStopwatchRunning(false);
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
  };

  const resetStopwatch = () => {
    stopStopwatch();
    setStopwatchTime(0);
  };

  const captureTime = () => {
    const timeStr = formatTime(stopwatchTime);
    setTotalTime(timeStr);
    
    // Update current area time
    if (currentAreaIndex < areas.length) {
      const newAreas = [...areas];
      newAreas[currentAreaIndex].time = timeStr;
      setAreas(newAreas);
    }
  };

  const updateAreaScore = (index: number, field: keyof AreaScore, value: any) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], [field]: value };
    setAreas(newAreas);
  };

  const handleSubmitScore = async () => {
    if (!currentEntry) return;

    setIsSubmitting(true);
    
    try {
      const scoreData = {
        resultText: qualifying || 'NQ',
        searchTime: totalTime,
        faultCount,
        nonQualifyingReason: qualifying === 'NQ' ? nonQualifyingReason || undefined : undefined,
        areas: areas.reduce((acc, area) => {
          acc[area.areaName] = area.time;
          return acc;
        }, {} as { [key: string]: string })
      };

      if (isOnline) {
        await submitScore(currentEntry.id, scoreData);
      } else {
        addToQueue({
          entryId: currentEntry.id,
          armband: currentEntry.armband,
          classId: parseInt(classId!),
          className: currentEntry.className,
          scoreData
        });
      }

      // Mark entry as scored
      markAsScored(currentEntry.id, qualifying || 'NQ');

      // Move to next entry or show confirmation
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        moveToNextEntry();
        resetStopwatch();
        setQualifying('Q');
        setNonQualifyingReason('');
        setTotalTime('');
        setFaultCount(0);
        setCurrentAreaIndex(0);
      } else {
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishScoring = () => {
    endScoringSession();
    navigate(`/class/${classId}/entries`);
  };

  if (!currentEntry) {
    return (
      <div className="apple-page-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          fontSize: '1.125rem',
          fontWeight: '500'
        }}>
          Loading entry...
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="apple-page-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div className="apple-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ 
              width: '4rem',
              height: '4rem',
              background: 'var(--brand-gradient)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
            </div>
            
            <h2 className="apple-text-title" style={{ margin: '0 0 0.5rem 0' }}>
              Scoring Complete!
            </h2>
            <p className="apple-text-body" style={{ margin: '0 0 2rem 0', color: 'var(--muted-foreground)' }}>
              All entries have been scored for this class.
            </p>
            
            <button
              className="apple-button-primary"
              onClick={handleFinishScoring}
              style={{ width: '100%' }}
            >
              Return to Class
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-page-container">
      {/* Theme Toggle */}
      <button className="apple-theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Header */}
      <header className="apple-header">
        <button 
          className="apple-button-secondary"
          onClick={() => navigate(`/class/${classId}/entries`)}
          style={{ padding: '0.75rem', borderRadius: '0.75rem', minWidth: '44px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        
        <div style={{ textAlign: 'center', flex: 1, margin: '0 1rem' }}>
          <h1 className="apple-text-heading" style={{ margin: 0 }}>AKC Scent Work</h1>
        </div>
        
        <button 
          className="apple-button-primary"
          onClick={handleSubmitScore}
          disabled={isSubmitting}
          style={{ fontSize: '0.875rem', padding: '0.75rem 1rem' }}
        >
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
      </header>

      {/* Dog Info Card */}
      <div style={{ padding: '1.5rem' }}>
        <div className="apple-card apple-card-pending" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="apple-armband-badge">
              {currentEntry.armband}
            </div>
            
            <div style={{ flex: 1 }}>
              <h2 className="apple-text-title" style={{ margin: '0 0 0.25rem 0' }}>
                {currentEntry.callName}
              </h2>
              <p className="apple-text-body" style={{ margin: '0 0 0.25rem 0' }}>
                {currentEntry.breed}
              </p>
              <p className="apple-text-caption" style={{ margin: 0 }}>
                Handler: {currentEntry.handler}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
            <div>
              <p className="apple-text-caption" style={{ margin: '0 0 0.25rem 0' }}>
                Element
              </p>
              <p className="apple-text-body" style={{ margin: 0, fontWeight: '600' }}>
                {currentEntry.element}
              </p>
            </div>
            
            <div>
              <p className="apple-text-caption" style={{ margin: '0 0 0.25rem 0' }}>
                Level
              </p>
              <p className="apple-text-body" style={{ margin: 0, fontWeight: '600' }}>
                {currentEntry.level}
              </p>
            </div>
            
            <div>
              <p className="apple-text-caption" style={{ margin: '0 0 0.25rem 0' }}>
                Section
              </p>
              <p className="apple-text-body" style={{ margin: 0, fontWeight: '600' }}>
                {currentEntry.section}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stopwatch Card */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="apple-card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 className="apple-text-heading" style={{ margin: '0 0 1rem 0' }}>
            Timer
          </h3>
          
          <div style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            fontFamily: 'var(--font-family)',
            color: 'var(--primary)',
            marginBottom: '1.5rem'
          }}>
            {formatTime(stopwatchTime)}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              className={isStopwatchRunning ? "apple-button-secondary" : "apple-button-primary"}
              onClick={isStopwatchRunning ? stopStopwatch : startStopwatch}
              style={{ minWidth: '100px' }}
            >
              {isStopwatchRunning ? 'Stop' : 'Start'}
            </button>
            
            <button
              className="apple-button-secondary"
              onClick={resetStopwatch}
            >
              Reset
            </button>
            
            <button
              className="apple-button-primary"
              onClick={captureTime}
              disabled={stopwatchTime === 0}
            >
              Capture
            </button>
          </div>
        </div>
      </div>

      {/* Areas Scoring */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h3 className="apple-text-heading" style={{ margin: '0 0 1rem 0' }}>
          Areas
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {areas.map((area, index) => (
            <div 
              key={index} 
              className={`apple-card ${index === currentAreaIndex ? 'apple-card-pending' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 className="apple-text-heading" style={{ margin: 0 }}>
                  {area.areaName}
                </h4>
                
                <button
                  className="apple-button-secondary"
                  onClick={() => setCurrentAreaIndex(index)}
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                >
                  {index === currentAreaIndex ? 'Current' : 'Select'}
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="apple-text-caption" style={{ display: 'block', margin: '0 0 0.5rem 0' }}>
                    Time
                  </label>
                  <input
                    type="text"
                    value={area.time}
                    onChange={(e) => updateAreaScore(index, 'time', e.target.value)}
                    placeholder="0:00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      color: 'var(--foreground)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label className="apple-text-caption" style={{ display: 'block', margin: '0 0 0.5rem 0' }}>
                    Found
                  </label>
                  <div 
                    className="apple-tabs-container"
                    style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                  >
                    <button
                      className="apple-tab-trigger"
                      data-state={area.found ? 'active' : 'inactive'}
                      onClick={() => updateAreaScore(index, 'found', true)}
                    >
                      Yes
                    </button>
                    <button
                      className="apple-tab-trigger"
                      data-state={!area.found ? 'active' : 'inactive'}
                      onClick={() => updateAreaScore(index, 'found', false)}
                    >
                      No
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="apple-text-caption" style={{ display: 'block', margin: '0 0 0.5rem 0' }}>
                    Correct
                  </label>
                  <div 
                    className="apple-tabs-container"
                    style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                  >
                    <button
                      className="apple-tab-trigger"
                      data-state={area.correct ? 'active' : 'inactive'}
                      onClick={() => updateAreaScore(index, 'correct', true)}
                    >
                      Yes
                    </button>
                    <button
                      className="apple-tab-trigger"
                      data-state={!area.correct ? 'active' : 'inactive'}
                      onClick={() => updateAreaScore(index, 'correct', false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Card */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="apple-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="apple-text-heading" style={{ margin: '0 0 1rem 0' }}>
            Results
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="apple-text-caption" style={{ display: 'block', margin: '0 0 0.5rem 0' }}>
                Total Time
              </label>
              <input
                type="text"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                placeholder="0:00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-family)',
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  color: 'var(--foreground)',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label className="apple-text-caption" style={{ display: 'block', margin: '0 0 0.5rem 0' }}>
                Result
              </label>
              <div 
                className="apple-tabs-container"
                style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
              >
                <button
                  className="apple-tab-trigger"
                  data-state={qualifying === 'Q' ? 'active' : 'inactive'}
                  onClick={() => setQualifying('Q')}
                >
                  Qualified
                </button>
                <button
                  className="apple-tab-trigger"
                  data-state={qualifying === 'NQ' ? 'active' : 'inactive'}
                  onClick={() => setQualifying('NQ')}
                >
                  NQ
                </button>
                <button
                  className="apple-tab-trigger"
                  data-state={qualifying === 'ABS' ? 'active' : 'inactive'}
                  onClick={() => setQualifying('ABS')}
                >
                  Absent
                </button>
              </div>
            </div>
            
            {qualifying === 'NQ' && (
              <div>
                <label className="apple-text-caption" style={{ display: 'block', margin: '0 0 0.5rem 0' }}>
                  Reason for NQ
                </label>
                <input
                  type="text"
                  value={nonQualifyingReason}
                  onChange={(e) => setNonQualifyingReason(e.target.value)}
                  placeholder="Enter reason..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-family)',
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    color: 'var(--foreground)',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '0 1.5rem 100px' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="apple-button-secondary"
            onClick={() => {
              moveToPreviousEntry();
              resetStopwatch();
            }}
            disabled={!currentClassEntries || currentClassEntries.findIndex(e => e.id === currentEntry.id) === 0}
            style={{ flex: 1 }}
          >
            Previous
          </button>
          
          <button
            className="apple-button-primary"
            onClick={handleSubmitScore}
            disabled={isSubmitting || !totalTime}
            style={{ flex: 2 }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Next'}
          </button>
        </div>
      </div>
    </div>
  );
};