import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompetitorCard } from '../../../components/scoring/CompetitorCard';
import { MultiTimer } from '../../../components/scoring/MultiTimer';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import { useOptimisticScoring } from '../../../hooks/useOptimisticScoring';
import { HamburgerMenu } from '../../../components/ui/HamburgerMenu';
import { SyncIndicator } from '../../../components/ui';
import { ClipboardCheck } from 'lucide-react';
import { ensureReplicationManager } from '../../../utils/replicationHelper';
import type { Entry as ReplicatedEntry } from '../../../services/replication/tables/ReplicatedEntriesTable';
import type { Class } from '../../../services/replication/tables/ReplicatedClassesTable';
import type { Entry } from '../../../stores/entryStore';
import './ASCAScentDetectionScoresheet.css';

type QualifyingResult = 'Q' | 'NQ' | 'E';

interface SearchArea {
  areaName: string;
  time: string;
  found: boolean;
  alert: boolean;
}

export const ASCAScentDetectionScoresheet: React.FC = () => {
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

  const { addToQueue: _addToQueue, isOnline } = useOfflineQueueStore();

  // Optimistic scoring hook
  const { submitScoreOptimistically, isSyncing, hasError } = useOptimisticScoring();

  // Local state - ASCA typically has single search areas
  const [searchAreas, setSearchAreas] = useState<SearchArea[]>([
    { areaName: 'Search Area', time: '', found: false, alert: false }
  ]);
  const [qualifying, setQualifying] = useState<QualifyingResult>('Q');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Timer configuration - ASCA typically allows more time
  const timerAreas = searchAreas.map(area => ({
    name: area.areaName,
    maxTime: 4 * 60 * 1000 // 4 minutes in milliseconds
  }));

  // Load entries function - defined before useEffect
  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;

    try {
      // Load from replicated cache (direct replacement, no feature flags)
      console.log('[REPLICATION] 🔍 Loading ASCA Scent Detection scoresheet for class:', classId);

      // Ensure replication manager is initialized (handles recovery scenarios)
      const manager = await ensureReplicationManager();

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
            'ASCA_SCENT_DETECTION',
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
  }, []); // Fixed: removed currentEntry?.id dependency
  
  const handleAreaUpdate = (areaIndex: number, field: keyof SearchArea, value: any) => {
    setSearchAreas(prev => prev.map((area, index) => 
      index === areaIndex ? { ...area, [field]: value } : area
    ));
  };
  
  const calculateTotalTime = () => {
    const times = searchAreas
      .filter(area => area.time && area.found)
      .map(area => {
        const [minutes, seconds] = area.time.split(':').map(parseFloat);
        return (minutes * 60) + seconds;
      });
    
    if (times.length === 0) return '';
    
    const total = times.reduce((sum, time) => sum + time, 0);
    const totalMinutes = Math.floor(total / 60);
    const totalSeconds = (total % 60).toFixed(2);
    
    return `${totalMinutes}:${totalSeconds.padStart(5, '0')}`;
  };
  
  const calculateQualifying = (): QualifyingResult => {
    const foundCount = searchAreas.filter(area => area.found && area.alert).length;
    
    // ASCA Scent Detection qualifying logic
    if (foundCount >= 1) return 'Q'; // Need at least 1 correct find and alert
    return 'NQ';
  };
  
  const handleSubmit = () => {
    const calculatedTotal = calculateTotalTime();
    setTotalTime(calculatedTotal);
    
    const calculatedQualifying = qualifying === 'Q' ? calculateQualifying() : qualifying;
    setQualifying(calculatedQualifying);
    
    setShowConfirmation(true);
  };
  
  const confirmSubmit = async () => {
    if (!currentEntry) return;

    setShowConfirmation(false);

    const finalQualifying = qualifying === 'Q' ? calculateQualifying() : qualifying;
    const finalTotalTime = totalTime || calculateTotalTime();

    // Prepare area results
    const areaResults: Record<string, string> = {};
    searchAreas.forEach(area => {
      areaResults[area.areaName.toLowerCase()] = `${area.time}${area.found ? ' FOUND' : ' NOT FOUND'}${area.alert ? ' ALERT' : ' NO ALERT'}`;
    });

    // Submit score optimistically
    await submitScoreOptimistically({
      entryId: currentEntry.id,
      classId: parseInt(classId!),
      armband: currentEntry.armband,
      className: currentEntry.className,
      scoreData: {
        resultText: finalQualifying,
        searchTime: finalTotalTime,
        nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
        areas: areaResults,
      },
      onSuccess: async () => {
        console.log('✅ ASCA Scent Detection score saved');

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
          setSearchAreas([
            { areaName: 'Search Area', time: '', found: false, alert: false }
          ]);
          setQualifying('Q');
          setNonQualifyingReason('');
          setTotalTime('');
        } else {
          // All entries scored
          endScoringSession();
          navigate(-1);
        }
      },
      onError: (error) => {
        console.error('❌ ASCA Scent Detection score submission failed:', error);
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
    }
  };
  
  const handleNext = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex < currentClassEntries.length - 1) {
      setCurrentEntry(currentClassEntries[currentIndex + 1]);
      moveToNextEntry();
    }
  };
  
  if (!currentEntry) {
    return (
      <div className="scoresheet-container">
        <div className="no-entries">
          <h2>No pending entries</h2>
          <button onClick={() => navigate(-1)}>Back to Class List</button>
        </div>
      </div>
    );
  }
  
  const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry.id) + 1;
  const allAreasScored = searchAreas.every(area => area.time && area.time !== '');
  
  return (
    <div className="scoresheet-container asca-scent-detection">
      <header className="page-header scoresheet-header">
        <HamburgerMenu />
        <h1>
          <ClipboardCheck className="title-icon" />
          ASCA Scent Detection
        </h1>
        <div className="sync-status">
          {isOnline ? (
            <span className="online">● Online</span>
          ) : (
            <span className="offline">● Offline</span>
          )}
        </div>
      </header>
      
      <div className="scoresheet-content">
        <CompetitorCard
          entry={currentEntry}
          currentPosition={currentIndex}
          totalEntries={currentClassEntries.length}
        />
        
        {/* Multi-Area Timer */}
        <div className="timer-section">
          <MultiTimer
            areas={timerAreas}
            layout="horizontal"
            showGlobalControls={true}
          />
        </div>
        
        {/* Area Scoring */}
        <div className="area-scoring">
          <h3>Search Results</h3>
          {searchAreas.map((area, index) => (
            <div key={area.areaName} className="area-card">
              <div className="area-header">
                <h4>{area.areaName}</h4>
              </div>
              
              <div className="area-inputs">
                <div className="time-input">
                  <label>Time</label>
                  <input
                    type="text"
                    placeholder="M:SS.ms"
                    value={area.time}
                    onChange={(e) => handleAreaUpdate(index, 'time', e.target.value)}
                  />
                </div>
                
                <div className="result-controls">
                  <label>
                    <input
                      type="checkbox"
                      checked={area.found}
                      onChange={(e) => handleAreaUpdate(index, 'found', e.target.checked)}
                    />
                    Target Found
                  </label>
                  
                  {area.found && (
                    <label>
                      <input
                        type="checkbox"
                        checked={area.alert}
                        onChange={(e) => handleAreaUpdate(index, 'alert', e.target.checked)}
                      />
                      Proper Alert
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total Time Display */}
        <div className="total-time-section">
          <h3>Total Time: {calculateTotalTime()}</h3>
          <p>Automatic calculation based on search times</p>
        </div>
        
        {/* Qualifying Section */}
        <div className="qualifying-section">
          <label>Qualifying Result</label>
          <div className="qualifying-buttons">
            <button
              className={`qual-button ${qualifying === 'Q' ? 'active' : ''}`}
              onClick={() => setQualifying('Q')}
            >
              Q
            </button>
            <button
              className={`qual-button ${qualifying === 'NQ' ? 'active' : ''}`}
              onClick={() => setQualifying('NQ')}
            >
              NQ
            </button>
            <button
              className={`qual-button ${qualifying === 'E' ? 'active' : ''}`}
              onClick={() => setQualifying('E')}
            >
              E
            </button>
          </div>
        </div>
        
        {qualifying !== 'Q' && (
          <div className="reason-section">
            <label htmlFor="reason">Non-Qualifying Reason</label>
            <textarea
              id="reason"
              value={nonQualifyingReason}
              onChange={(e) => setNonQualifyingReason(e.target.value)}
              placeholder="Enter reason for NQ/E..."
              rows={3}
            />
          </div>
        )}
        
        <div className="action-buttons">
          <button
            className="nav-button"
            onClick={handlePrevious}
            disabled={currentIndex === 1}
          >
            Previous
          </button>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!allAreasScored || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </button>
            {isSyncing && <SyncIndicator status="syncing" />}
            {hasError && <SyncIndicator status="error" />}
          </div>

          <button
            className="nav-button"
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
              <p><strong>Dog:</strong> {currentEntry.callName} (#{currentEntry.armband})</p>
              <p><strong>Total Time:</strong> {totalTime}</p>
              <p><strong>Result:</strong> {qualifying}</p>
              {searchAreas.filter(a => a.found).map((area, index) => (
                <p key={index}>
                  <strong>{area.areaName}:</strong> {area.time} 
                  {area.alert ? ' ✓ Alert' : ' ✗ No Alert'}
                </p>
              ))}
              {nonQualifyingReason && (
                <p><strong>Reason:</strong> {nonQualifyingReason}</p>
              )}
            </div>
            <div className="confirmation-buttons">
              <button onClick={() => setShowConfirmation(false)}>Cancel</button>
              <button onClick={confirmSubmit} className="confirm-button">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};