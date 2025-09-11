import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { getClassEntries, updateEntryCheckinStatus, subscribeToEntryUpdates, resetEntryScore } from '../../services/entryService';
import { Entry } from '../../stores/entryStore';
import { Card, CardContent, ArmbandBadge, HamburgerMenu } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { supabase } from '../../lib/supabase';
import './EntryList.css';

type TabType = 'pending' | 'completed';

export const EntryList: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [classInfo, setClassInfo] = useState<{
    className: string;
    element: string;
    level: string;
    section: string;
  } | null>(null);
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });

  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, showContext]);

  // Subscribe to real-time entry updates
  useEffect(() => {
    if (!classId || !showContext?.licenseKey) return;
    
    const unsubscribe = subscribeToEntryUpdates(
      parseInt(classId),
      showContext.licenseKey,
      (payload) => {
        console.log('Real-time entry update received:', payload);
        // Reload entries when changes occur
        loadEntries();
      }
    );
    
    return unsubscribe;
  }, [classId, showContext?.licenseKey]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-popup') && !target.closest('.checkin-status') && !target.closest('.reset-menu') && !target.closest('.reset-menu-button')) {
        setActiveStatusPopup(null);
        setPopupPosition(null);
        setActiveResetMenu(null);
        setResetMenuPosition(null);
      }
    };

    if (activeStatusPopup !== null || activeResetMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeStatusPopup, activeResetMenu]);


  const handleStatusChange = async (entryId: number, status: NonNullable<Entry['checkinStatus']>) => {
    // Store original state for potential rollback
    const originalEntries = entries;
    
    try {
      console.log('🚀 EntryList: handleStatusChange called with:', { entryId, status });
      console.log('🔍 EntryList: Target entry before update:', entries.find(e => e.id === entryId));
      
      // Update local state immediately for better UX
      setEntries(prev => {
        const newEntries = prev.map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                checkedIn: status !== 'none',
                checkinStatus: status,
                inRing: false, // Clear in-ring status when manually changing status
              } 
            : entry
        );
        console.log('💾 EntryList: Updated local state, entry after change:', newEntries.find(e => e.id === entryId));
        return newEntries;
      });
      
      // Close the popup
      setActiveStatusPopup(null);
      setPopupPosition(null);
      
      // Make API call to update database - always update, including 'none' status
      console.log('📡 EntryList: Making API call to update database...');
      const success = await updateEntryCheckinStatus(entryId, status);
      console.log('✅ EntryList: API call result:', success, 'for entry:', entryId);
      
    } catch (error) {
      console.error('❌ EntryList: Failed to update check-in status:', error);
      
      // Revert local state changes on error
      console.log('🔄 EntryList: Reverting local state changes due to error');
      setEntries(originalEntries);
      
      // Show error message to user
      alert(`Failed to update check-in status: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleStatusClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + 5,
      left: rect.left
    });
    setActiveStatusPopup(entryId);
  };

  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading entries for classId:', classId, 'licenseKey:', showContext.licenseKey);
      const classEntries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      console.log('Loaded entries:', classEntries);
      console.log('Check-in statuses:', classEntries.map(e => ({ id: e.id, armband: e.armband, checkinStatus: e.checkinStatus, checkedIn: e.checkedIn })));
      setEntries(classEntries);
      
      // Get class info from first entry
      if (classEntries.length > 0) {
        const firstEntry = classEntries[0];
        console.log('First entry:', firstEntry);
        setClassInfo({
          className: firstEntry.className,
          element: firstEntry.element || '',
          level: firstEntry.level || '',
          section: firstEntry.section || ''
        });
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      console.error('Error details:', err);
      setError(`Failed to load entries: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseOrganizationData = (orgString: string) => {
    console.log('🔍 parseOrganizationData DEBUG:');
    console.log('Input orgString:', JSON.stringify(orgString));
    console.log('orgString type:', typeof orgString);
    console.log('orgString length:', orgString?.length || 'undefined');
    
    if (!orgString || orgString.trim() === '') {
      console.log('⚠️ Empty orgString - defaulting to AKC Scent Work');
      // Default to AKC Scent Work for this show based on the user's report
      return {
        organization: 'AKC',
        activity_type: 'Scent Work'
      };
    }
    
    const parts = orgString.split(' ');
    const result = {
      organization: parts[0], // "AKC"
      activity_type: parts.slice(1).join(' ') // "Scent Work" (keep spaces)
    };
    console.log('Parsed organization data:', result);
    return result;
  };

  const getScoreSheetRoute = (entry: Entry): string => {
    const orgData = parseOrganizationData(showContext?.org || '');
    const _competition_type = showContext?.competition_type || 'Regular';
    const element = entry.element || '';
    const _level = entry.level || '';
    
    
    // Same routing logic as ClassList - now includes entry ID
    if (orgData.organization === 'AKC') {
      if (orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork') {
        return `/scoresheet/akc-scent-work/${classId}/${entry.id}`;
      } else if (orgData.activity_type === 'FastCat' || orgData.activity_type === 'Fast Cat') {
        return `/scoresheet/akc-fastcat/${classId}/${entry.id}`;
      } else {
        return `/scoresheet/akc-scent-work/${classId}/${entry.id}`;
      }
    } else if (orgData.organization === 'UKC') {
      if (orgData.activity_type === 'Obedience' || element === 'Obedience') {
        return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
      } else if (element === 'Rally' || orgData.activity_type === 'Rally') {
        return `/scoresheet/ukc-rally/${classId}/${entry.id}`;
      } else if (orgData.activity_type === 'Nosework') {
        return `/scoresheet/asca-scent-detection/${classId}/${entry.id}`;
      } else {
        if (element === 'Obedience') {
          return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
        } else {
          return `/scoresheet/ukc-rally/${classId}/${entry.id}`;
        }
      }
    } else if (orgData.organization === 'ASCA') {
      return `/scoresheet/asca-scent-detection/${classId}/${entry.id}`;
    } else {
      // Default fallback
      if (element === 'Obedience') {
        return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
      } else if (element === 'Rally') {
        return `/scoresheet/ukc-rally/${classId}/${entry.id}`;
      } else {
        return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
      }
    }
  };

  // Add database update function
  const setDogInRingStatus = async (dogId: number, inRing: boolean) => {
    try {
      console.log(`📂 Setting dog ${dogId} in_ring status to:`, inRing);
      const { error } = await supabase
        .from('tbl_entry_queue')
        .update({ in_ring: inRing })
        .eq('id', dogId)
        .eq('mobile_app_lic_key', showContext?.licenseKey);
      
      if (error) {
        console.error('Database error setting in_ring status:', error);
        return false;
      }
      
      console.log(`✅ Successfully set dog ${dogId} in_ring status to:`, inRing);
      return true;
    } catch (error) {
      console.error('Error setting dog ring status:', error);
      return false;
    }
  };

  const handleEntryClick = async (entry: Entry) => {
    console.log('🔍 EntryList handleEntryClick DEBUG:');
    console.log('Entry clicked:', entry);
    console.log('Entry ID:', entry.id);
    console.log('Entry armband:', entry.armband);
    console.log('Entry callName:', entry.callName);
    console.log('ShowContext:', showContext);
    console.log('ClassId:', classId);
    
    // Don't navigate if the entry is already scored
    if (entry.isScored) {
      console.log('Entry is already scored, not navigating to scoresheet');
      return;
    }
    
    if (!hasPermission('canScore')) {
      alert('You do not have permission to score entries.');
      return;
    }
    
    // Set dog status to in-ring when scoresheet opens
    if (entry.id && !entry.isScored) {
      console.log(`🔄 Setting dog ${entry.armband} (ID: ${entry.id}) to in-ring status before opening scoresheet...`);
      const success = await setDogInRingStatus(entry.id, true);
      if (success) {
        // Update local state to reflect the change immediately
        setEntries(prev => prev.map(e => 
          e.id === entry.id ? { ...e, inRing: true } : e
        ));
      }
    }
    
    const route = getScoreSheetRoute(entry);
    console.log('Generated route:', route);
    
    navigate(route);
  };

  const handleResetMenuClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setResetMenuPosition({
      top: rect.bottom + 5,
      left: rect.left - 100 // Offset left since menu is wider
    });
    setActiveResetMenu(entryId);
  };

  const handleResetScore = (entry: Entry) => {
    setActiveResetMenu(null);
    setResetMenuPosition(null);
    setResetConfirmDialog({ show: true, entry });
  };

  const confirmResetScore = async () => {
    if (!resetConfirmDialog.entry) return;
    
    try {
      await resetEntryScore(resetConfirmDialog.entry.id);
      
      // Update local state to move entry back to pending
      setEntries(prev => prev.map(entry => 
        entry.id === resetConfirmDialog.entry!.id 
          ? {
              ...entry,
              isScored: false,
              resultText: '',
              searchTime: '',
              faultCount: 0,
              placement: undefined,
              inRing: false
            }
          : entry
      ));
      
      // Switch to pending tab to show the reset entry
      setActiveTab('pending');
      
      console.log(`✅ Reset score for ${resetConfirmDialog.entry.callName} (${resetConfirmDialog.entry.armband})`);
    } catch (error) {
      console.error('Failed to reset score:', error);
      alert(`Failed to reset score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setResetConfirmDialog({ show: false, entry: null });
  };

  const cancelResetScore = () => {
    setResetConfirmDialog({ show: false, entry: null });
  };


  if (isLoading) {
    return (
      <div className="entry-list-container">
        <div className="loading">Loading entries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-list-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const scoredCount = entries.filter(e => e.isScored).length;
  const totalCount = entries.length;
  const pendingEntries = entries.filter(e => !e.isScored);
  const completedEntries = entries.filter(e => e.isScored);
  
  const currentEntries = activeTab === 'pending' ? pendingEntries : completedEntries;

  return (
    <div className="entry-list-container">
      <header className="entry-list-header">
        <HamburgerMenu
          backNavigation={{
            label: "Back to Classes",
            action: () => navigate(-1)
          }}
          currentPage="entries"
        />
        <div className="class-info">
          <h1>{classInfo?.className}</h1>
          <div className="class-subtitle">
            <span className="progress">{scoredCount}/{totalCount} Scored</span>
          </div>
        </div>
      </header>

      <div className="status-tabs">
        <button 
          className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          {...hapticFeedback}
        >
          <span className="status-icon">⏳</span>
          <span style={{fontSize: '0.75rem', marginRight: '0.25rem'}}>●</span>
          Pending ({pendingEntries.length})
        </button>
        <button 
          className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
          {...hapticFeedback}
        >
          <span className="status-icon">✓</span>
          <span style={{fontSize: '0.75rem', marginRight: '0.25rem'}}>♦</span>
          Completed ({completedEntries.length})
        </button>
      </div>

      <div className="entry-list-content">
        {currentEntries.length === 0 ? (
          <div className="no-entries">
            <h2>No {activeTab} entries</h2>
            <p>{activeTab === 'pending' ? 'All entries have been scored.' : 'No entries have been scored yet.'}</p>
          </div>
        ) : (
          <div className="entries-grid">
            {currentEntries.map((entry) => (
              <Card 
                key={entry.id} 
                variant={entry.isScored ? 'scored' : 'unscored'}
                onClick={() => hasPermission('canScore') && handleEntryClick(entry)}
                className={`entry-card ${
                  !entry.isScored ? 'unscored' : 'scored'
                } ${
                  !entry.isScored && !entry.checkinStatus ? 'checkin-none' : ''
                } ${
                  !entry.isScored && !entry.checkinStatus ? 'pending-entry' : ''
                } ${
                  !entry.isScored ? `checkin-${(entry.checkinStatus || 'none').replace(' ', '-')}` : ''
                } ${
                  entry.inRing ? 'in-ring' : ''
                } ${
                  hasPermission('canScore') && !entry.isScored ? 'clickable' : ''
                }`}
              >
                <ArmbandBadge number={entry.armband} />
                
                {!entry.isScored && (
                  <div 
                    className={`checkin-status ${
                      entry.inRing ? 'in-ring' : 
                      (entry.checkinStatus || 'none').toLowerCase().replace(' ', '-')
                    }`}
                    onClick={(e) => handleStatusClick(e, entry.id)}
                    title="Click to change check-in status"
                    {...hapticFeedback}
                  >
                    {(() => {
                      if (entry.inRing) {
                        return <><span className="status-icon">▶</span> In Ring</>;
                      }
                      const status = entry.checkinStatus || 'none';
                      switch(status) {
                        case 'none': return <><span className="status-icon">●</span> Not Checked-in</>;
                        case 'checked-in': return <><span className="status-icon">✓</span> Checked-in</>;
                        case 'conflict': return <><span className="status-icon">!</span> Conflict</>;
                        case 'pulled': return <><span className="status-icon">✕</span> Pulled</>;
                        case 'at-gate': return <><span className="status-icon">★</span> At Gate</>;
                        default: return status;
                      }
                    })()}
                  </div>
                )}
                
                {entry.isScored && (
                  <button
                    className="reset-menu-button"
                    onClick={(e) => handleResetMenuClick(e, entry.id)}
                    title="Reset score"
                    {...hapticFeedback}
                  >
                    ⋯
                  </button>
                )}
                
                <CardContent className="entry-content">
                  <div className="entry-info-compact">
                    <div className="dog-info">
                      <h3 className="dog-name">{entry.callName}</h3>
                      <p className="breed">{entry.breed}</p>
                    </div>
                    <div className="handler-info">
                      <span className="handler">{entry.handler}</span>
                      {entry.isScored && entry.resultText && (
                        <div className="result-inline">
                          <span className={`result-badge ${entry.resultText.toLowerCase()}`}>
                            {entry.resultText.toLowerCase() === 'q' ? 'QUALIFIED' : entry.resultText.toUpperCase()}
                          </span>
                          {entry.searchTime && (
                            <span className="time-badge">
                              {entry.searchTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Status Change Popup */}
      {activeStatusPopup !== null && popupPosition && (
        <div 
          className="status-popup"
          style={{
            position: 'fixed',
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 1000
          }}
        >
          <div className="status-popup-content">
            <button 
              className="status-option status-none"
              onClick={() => handleStatusChange(activeStatusPopup, 'none')}
              {...hapticFeedback}
            >
              <span className="popup-icon">●</span> Not Checked-in
            </button>
            <button 
              className="status-option status-checked-in"
              onClick={() => handleStatusChange(activeStatusPopup, 'checked-in')}
              {...hapticFeedback}
            >
              <span className="popup-icon">✓</span> Checked-in
            </button>
            <button 
              className="status-option status-conflict"
              onClick={() => handleStatusChange(activeStatusPopup, 'conflict')}
              {...hapticFeedback}
            >
              <span className="popup-icon">!</span> Conflict
            </button>
            <button 
              className="status-option status-pulled"
              onClick={() => handleStatusChange(activeStatusPopup, 'pulled')}
              {...hapticFeedback}
            >
              <span className="popup-icon">✕</span> Pulled
            </button>
            <button 
              className="status-option status-at-gate"
              onClick={() => handleStatusChange(activeStatusPopup, 'at-gate')}
              {...hapticFeedback}
            >
              <span className="popup-icon">★</span> At Gate
            </button>
          </div>
        </div>
      )}

      {/* Reset Menu Popup */}
      {activeResetMenu !== null && resetMenuPosition && (
        <div 
          className="reset-menu"
          style={{
            position: 'fixed',
            top: resetMenuPosition.top,
            left: resetMenuPosition.left,
            zIndex: 1000
          }}
        >
          <div className="reset-menu-content">
            <button 
              className="reset-option"
              onClick={() => {
                const entry = entries.find(e => e.id === activeResetMenu);
                if (entry) handleResetScore(entry);
              }}
              {...hapticFeedback}
            >
              🔄 Reset Score
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmDialog.show && resetConfirmDialog.entry && (
        <div className="reset-dialog-overlay">
          <div className="reset-dialog">
            <h3>Reset Score</h3>
            <p>
              Are you sure you want to reset the score for <strong>{resetConfirmDialog.entry.callName}</strong> (#{resetConfirmDialog.entry.armband})?
            </p>
            <p className="reset-dialog-warning">
              This will remove their current score and move them back to the pending list.
            </p>
            <div className="reset-dialog-buttons">
              <button 
                className="reset-dialog-cancel"
                onClick={cancelResetScore}
                {...hapticFeedback}
              >
                Cancel
              </button>
              <button 
                className="reset-dialog-confirm"
                onClick={confirmResetScore}
                {...hapticFeedback}
              >
                Reset Score
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};