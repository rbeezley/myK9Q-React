/**
 * UKC Nosework Scoresheet
 *
 * Scoring system: Time + Faults
 * - Single search time (not multi-area like AKC)
 * - Fault counting
 * - Q/NQ based on faults and time
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompetitorCard } from '../../../components/scoring/CompetitorCard';
import { Timer } from '../../../components/scoring/Timer';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import { useOptimisticScoring } from '../../../hooks/useOptimisticScoring';
import { HamburgerMenu } from '../../../components/ui/HamburgerMenu';
import { SyncIndicator } from '../../../components/ui';
import { ClipboardCheck } from 'lucide-react';
import { getReplicationManager } from '../../../services/replication/initReplication';
import type { Entry as ReplicatedEntry } from '../../../services/replication/tables/ReplicatedEntriesTable';
import type { Class } from '../../../services/replication/tables/ReplicatedClassesTable';
import type { Entry } from '../../../stores/entryStore';
import '../BaseScoresheet.css';
import './UKCNoseworkScoresheet.css';

type QualifyingResult = 'Q' | 'NQ' | 'ABS' | 'E';

export const UKCNoseworkScoresheet: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();

  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: _addScoreToSession,
    moveToNextEntry,
    moveToPreviousEntry,
    endScoringSession
  } = useScoringStore();

  const {
    currentClassEntries,
    currentEntry,
    setCurrentClassEntries,
    setCurrentEntry,
    markAsScored: _markAsScored,
    getPendingEntries
  } = useEntryStore();

  const { addToQueue: _addToQueue, isOnline: _isOnline } = useOfflineQueueStore();

  // Optimistic scoring hook
  const { submitScoreOptimistically, isSyncing, hasError } = useOptimisticScoring();

  // Local state
  const [searchTime, setSearchTime] = useState<string>('');
  const [faults, setFaults] = useState<number>(0);
  const [qualifying, setQualifying] = useState<QualifyingResult>('Q');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

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

  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;

    try {
      // Load from replicated cache (direct replacement, no feature flags)
      console.log('[REPLICATION] 🔍 Loading UKC Nosework scoresheet for class:', classId);

      const manager = getReplicationManager();
      if (!manager) {
        throw new Error('Replication manager not initialized');
      }

      const entriesTable = manager.getTable('entries');
      const classesTable = manager.getTable('classes');

      if (!entriesTable || !classesTable) {
        throw new Error('Required tables not registered');
      }

      // Get class information
      const classData = await classesTable.get(classId) as Class | undefined;
      if (!classData) {
        throw new Error(`Class ${classId} not found in cache`);
      }

      // Get all entries for this class
      const allEntries = await entriesTable.getAll() as ReplicatedEntry[];
      const classEntries = allEntries.filter(entry => entry.class_id === classId);

      console.log(`[REPLICATION] ✅ Loaded ${classEntries.length} entries for class ${classId}`);

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
      }));

      setCurrentClassEntries(parseInt(classId));

      // Set first pending entry as current
      const pending = transformedEntries.filter(e => !e.isScored);
      if (pending.length > 0) {
        setCurrentEntry(pending[0]);

        // Mark dog as in-ring when scoresheet opens
        if (pending[0].id) {
          markInRing(pending[0].id, true).catch(error => {
            console.error('Failed to mark dog in-ring on scoresheet open:', error);
          });
        }

        // Start scoring session if not already started
        if (!isScoring) {
          startScoringSession(
            parseInt(classId),
            pending[0].className,
            'UKC_NOSEWORK',
            showContext.licenseKey,
            transformedEntries.length
          );
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  // Load class entries on mount
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, showContext, loadEntries]);

  // Clear in-ring status when leaving scoresheet
  useEffect(() => {
    return () => {
      if (currentEntry?.id) {
        markInRing(currentEntry.id, false).catch(error => {
          console.error('Failed to clear in-ring status on unmount:', error);
        });
      }
    };
  }, []);

  const calculateQualifying = (): QualifyingResult => {
    // UKC Nosework typically allows up to 2-3 faults to still qualify
    // This is a simplified rule - adjust based on actual UKC rules
    if (faults === 0) return 'Q';
    if (faults <= 2) return 'Q'; // Still qualifying with minor faults
    return 'NQ'; // 3+ faults = NQ
  };

  const handleTimeChange = (time: string) => {
    setSearchTime(time);
  };

  const incrementFaults = () => {
    setFaults(prev => prev + 1);
  };

  const decrementFaults = () => {
    setFaults(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = () => {
    if (!searchTime) {
      alert('Please enter a search time');
      return;
    }

    const calculatedQualifying = calculateQualifying();
    setQualifying(calculatedQualifying);
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!currentEntry) return;

    setShowConfirmation(false);

    const finalQualifying = qualifying === 'Q' ? calculateQualifying() : qualifying;

    // Submit score optimistically
    await submitScoreOptimistically({
      entryId: currentEntry.id,
      classId: parseInt(classId!),
      armband: currentEntry.armband,
      className: currentEntry.className,
      scoreData: {
        resultText: finalQualifying,
        searchTime: searchTime,
        faultCount: faults,
        nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
      },
      onSuccess: async () => {
        console.log('✅ UKC Nosework score saved');

        // Remove from ring
        if (currentEntry?.id) {
          try {
            await markInRing(currentEntry.id, false);
            console.log(`✅ Removed dog ${currentEntry.armband} from ring`);
          } catch (error) {
            console.error('❌ Failed to remove dog from ring:', error);
          }
        }

        // Move to next entry
        const pendingEntries = getPendingEntries();
        if (pendingEntries.length > 0) {
          setCurrentEntry(pendingEntries[0]);
          moveToNextEntry();

          // Reset form
          setSearchTime('');
          setFaults(0);
          setQualifying('Q');
          setNonQualifyingReason('');
        } else {
          // All entries scored
          endScoringSession();
          navigate(-1);
        }
      },
      onError: (error) => {
        console.error('❌ UKC Nosework score submission failed:', error);
        alert(`Failed to submit score: ${error.message}`);
        setIsSubmitting(false);
      }
    });
  };

  const handlePrevious = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex > 0) {
      setCurrentEntry(currentClassEntries[currentIndex - 1]);
      moveToPreviousEntry();

      // Reset form
      setSearchTime('');
      setFaults(0);
      setQualifying('Q');
      setNonQualifyingReason('');
    }
  };

  const handleNext = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex < currentClassEntries.length - 1) {
      setCurrentEntry(currentClassEntries[currentIndex + 1]);
      moveToNextEntry();

      // Reset form
      setSearchTime('');
      setFaults(0);
      setQualifying('Q');
      setNonQualifyingReason('');
    }
  };

  if (!currentEntry) {
    return (
      <div className="scoresheet-container">
        <div className="loading">Loading entries...</div>
      </div>
    );
  }

  const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry.id) + 1;

  return (
    <div className="scoresheet-container ukc-nosework-scoresheet">
      <header className="page-header scoresheet-header">
        <HamburgerMenu />
        <h1>
          <ClipboardCheck className="title-icon" />
          UKC Nosework
        </h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="scoresheet-content">
        {/* Competitor Info */}
        <CompetitorCard
          entry={currentEntry}
          currentPosition={currentIndex}
          totalEntries={currentClassEntries.length}
        />

        {/* Search Time */}
        <div className="score-section">
          <h3>Search Time</h3>
          <Timer
            areaName="Search Time"
            onTimeUpdate={handleTimeChange}
          />
          {searchTime && (
            <div className="time-display">{searchTime}</div>
          )}
        </div>

        {/* Fault Counter */}
        <div className="score-section fault-section">
          <h3>Faults</h3>
          <div className="fault-counter">
            <button
              className="fault-btn decrement"
              onClick={decrementFaults}
              disabled={faults === 0}
            >
              -
            </button>
            <div className="fault-count">{faults}</div>
            <button
              className="fault-btn increment"
              onClick={incrementFaults}
            >
              +
            </button>
          </div>
          <div className="fault-info">
            {faults === 0 && <span className="info-text">No faults</span>}
            {faults === 1 && <span className="info-text">1 fault</span>}
            {faults === 2 && <span className="info-text">2 faults (still qualifying)</span>}
            {faults >= 3 && <span className="info-text warning">3+ faults (NQ)</span>}
          </div>
        </div>

        {/* Qualifying Status */}
        <div className="score-section">
          <h3>Result</h3>
          <div className="qualifying-options">
            <button
              className={`result-chip ${qualifying === 'Q' ? 'selected' : ''}`}
              onClick={() => setQualifying('Q')}
            >
              Qualified
            </button>
            <button
              className={`result-chip ${qualifying === 'NQ' ? 'selected' : ''}`}
              onClick={() => setQualifying('NQ')}
            >
              Not Qualified
            </button>
            <button
              className={`result-chip ${qualifying === 'ABS' ? 'selected' : ''}`}
              onClick={() => setQualifying('ABS')}
            >
              Absent
            </button>
            <button
              className={`result-chip ${qualifying === 'E' ? 'selected' : ''}`}
              onClick={() => setQualifying('E')}
            >
              Excused
            </button>
          </div>

          {qualifying === 'NQ' && (
            <div className="nq-reason">
              <label>NQ Reason:</label>
              <input
                type="text"
                value={nonQualifyingReason}
                onChange={(e) => setNonQualifyingReason(e.target.value)}
                placeholder="e.g., False alert, Exceeded time limit"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="nav-button btn-secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 1}
          >
            Previous
          </button>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="submit-button btn-primary"
              onClick={handleSubmit}
              disabled={!searchTime || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </button>
            {isSyncing && <SyncIndicator status="syncing" />}
            {hasError && <SyncIndicator status="error" />}
          </div>

          <button
            className="nav-button btn-secondary"
            onClick={handleNext}
            disabled={currentIndex === currentClassEntries.length}
          >
            Next
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h2>Confirm Score</h2>
            <div className="confirmation-details">
              <p><strong>Dog:</strong> {currentEntry.armband} - {currentEntry.callName}</p>
              <p><strong>Time:</strong> {searchTime}</p>
              <p><strong>Faults:</strong> {faults}</p>
              <p><strong>Result:</strong> {qualifying}</p>
              {qualifying === 'NQ' && nonQualifyingReason && (
                <p><strong>Reason:</strong> {nonQualifyingReason}</p>
              )}
            </div>
            <div className="confirmation-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={confirmSubmit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
