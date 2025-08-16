import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import './DogDetails.css';

interface ClassEntry {
  id: number;
  class_name: string;
  class_type: string;
  trial_name: string;
  trial_date: string;
  search_time: string | null;
  fault_count: number | null;
  result_text: string | null;
  is_scored: boolean;
  checked_in: boolean;
  check_in_status?: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate';
  position?: number;
}

interface DogInfo {
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
}

export const DogDetails: React.FC = () => {
  const { armband } = useParams<{ armband: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission, isExhibitor: _isExhibitor } = usePermission();
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (armband && showContext) {
      loadDogDetails();
    }
  }, [armband, showContext]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-popup') && !target.closest('.status-button')) {
        setActivePopup(null);
      }
    };

    if (activePopup !== null) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

  const loadDogDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_entry_class_join_distinct')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .eq('armband', parseInt(armband!));

      if (error) {
        console.error('Error loading dog details:', error);
        return;
      }

      if (data && data.length > 0) {
        // Set dog info from first record
        const firstEntry = data[0];
        setDogInfo({
          armband: firstEntry.armband,
          call_name: firstEntry.call_name,
          breed: firstEntry.breed,
          handler: firstEntry.handler
        });

        // Process all classes - map integer checkin_status to our types
        setClasses(data.map((entry, index) => {
          let check_in_status: ClassEntry['check_in_status'] = 'none';
          
          // Map integer checkin_status codes to our status types
          switch (entry.checkin_status) {
            case 1:
              check_in_status = 'checked-in';
              break;
            case 2:
              check_in_status = 'conflict';
              break;
            case 3:
              check_in_status = 'pulled';
              break;
            case 4:
              check_in_status = 'at-gate';
              break;
            default: // 0 or null
              check_in_status = 'none';
              break;
          }
          
          return {
            id: entry.id,
            class_name: entry.class_name,
            class_type: entry.class_type,
            trial_name: entry.trial_name,
            trial_date: entry.trial_date,
            search_time: entry.search_time,
            fault_count: entry.fault_count,
            result_text: entry.result_text,
            is_scored: entry.is_scored || false,
            checked_in: check_in_status !== 'none',
            check_in_status,
            position: index === 1 ? 2 : undefined // Mark second entry as "2nd" for demo
          };
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (classId: number, status: ClassEntry['check_in_status']) => {
    try {
      console.log('Updating status:', classId, status);
      
      // Update local state immediately for better UX
      setClasses(prev => prev.map(c => 
        c.id === classId 
          ? { 
              ...c, 
              checked_in: status !== 'none',
              check_in_status: status,
              // Keep result_text unchanged - it's for scoring results only
            } 
          : c
      ));
      
      // Close popup
      setActivePopup(null);

      // Update database - use checkin_status column (not result_text)
      const updateData: any = {};
      
      // Update only checkin_status - use integer codes matching schema
      // in_ring should only be set when scoresheet is opened
      if (status === 'none') {
        updateData.checkin_status = 0; // 0 = none (default)
      } else if (status === 'checked-in') {
        updateData.checkin_status = 1; // 1 = checked-in
      } else if (status === 'conflict') {
        updateData.checkin_status = 2; // 2 = conflict
      } else if (status === 'pulled') {
        updateData.checkin_status = 3; // 3 = pulled
      } else if (status === 'at-gate') {
        updateData.checkin_status = 4; // 4 = at-gate
        // Don't set in_ring = true here - that should only happen when scoresheet opens
      }

      console.log('Updating database with:', updateData);
      
      const { error } = await supabase
        .from('tbl_entry_queue')
        .update(updateData)
        .eq('id', classId);

      if (error) {
        console.error('Database update error:', error);
        console.error('Update data was:', updateData);
        console.error('Class ID was:', classId);
        
        // Revert local state if database update fails
        await loadDogDetails();
      } else {
        console.log('Database update successful');
      }
    } catch (error) {
      console.error('Error:', error);
      // Reload to get correct state
      await loadDogDetails();
    }
  };

  const _handleGoToGate = (classId: number) => {
    navigate(`/scoresheet/${classId}`);
  };

  const handleOpenPopup = (event: React.MouseEvent<HTMLButtonElement>, classId: number) => {
    event.stopPropagation();
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Calculate position to show popup below the button
    // Adjust if too close to screen edges
    let left = rect.left;
    let top = rect.bottom + 8;
    
    // Check if popup would go off right edge
    if (left + 180 > window.innerWidth) {
      left = window.innerWidth - 190;
    }
    
    // Check if popup would go off bottom edge
    if (top + 250 > window.innerHeight) {
      // Show above button instead
      top = rect.top - 250;
    }
    
    setPopupPosition({ top, left });
    setActivePopup(activePopup === classId ? null : classId);
  };

  const getStatusColor = (entry: ClassEntry) => {
    if (entry.check_in_status === 'checked-in') return 'checked-in';
    if (entry.check_in_status === 'conflict') return 'conflict';
    if (entry.check_in_status === 'pulled') return 'pulled';
    if (entry.check_in_status === 'at-gate') return 'at-gate';
    
    if (entry.is_scored) {
      if (entry.result_text === 'Q' || entry.result_text === 'Qualified') {
        return 'qualified';
      } else if (entry.result_text === 'NQ' || entry.result_text === 'Not Qualified') {
        return 'not-qualified';
      } else if (entry.result_text === 'EX' || entry.result_text === 'Excused') {
        return 'excused';
      }
    }
    return 'pending';
  };

  const getStatusLabel = (entry: ClassEntry) => {
    if (entry.check_in_status === 'checked-in') return 'Checked-in';
    if (entry.check_in_status === 'conflict') return 'Conflict';
    if (entry.check_in_status === 'pulled') return 'Pulled';
    if (entry.check_in_status === 'at-gate') return 'At Gate';
    
    if (entry.is_scored && entry.result_text) {
      switch (entry.result_text) {
        case 'Q':
        case 'Qualified':
          return 'Qualified';
        case 'NQ':
        case 'Not Qualified':
          return 'Failed';
        case 'EX':
        case 'Excused':
          return 'Conflict';
        default:
          return entry.result_text;
      }
    }
    
    return 'Not Checked In';
  };

  const formatTime = (time: string | null) => {
    return time || '00:00.00';
  };

  if (isLoading) {
    return (
      <div className="dog-details-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!dogInfo) {
    return (
      <div className="dog-details-container">
        <div className="error">Dog not found</div>
      </div>
    );
  }

  return (
    <div className="dog-details-container">
      <header className="dog-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1>{dogInfo.call_name}</h1>
        <button className="refresh-button" onClick={loadDogDetails}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </header>

      <div className="dog-info-card">
        <div className="armband-display">{dogInfo.armband}</div>
        <div className="dog-details">
          <h2>{dogInfo.call_name}</h2>
          <p className="breed">{dogInfo.breed}</p>
          <p className="handler">{dogInfo.handler}</p>
        </div>
      </div>

      <p className="results-notice">Results below are Preliminary</p>

      <div className="classes-list">
        {classes.map((entry) => (
          <div key={entry.id} className={`class-card ${getStatusColor(entry)}`}>
            <div className="class-position">
              {entry.position ? (
                <span className="position-badge">{entry.position}nd</span>
              ) : (
                <span className="position-placeholder">--</span>
              )}
            </div>
            
            <div className="class-info">
              <div className="class-date">
                {entry.trial_date} - {entry.trial_name}
              </div>
              <div className="class-name">{entry.class_name}</div>
              <div className="class-stats">
                Time: {formatTime(entry.search_time)} &nbsp;&nbsp; 
                Faults: {entry.fault_count || 0}
              </div>
            </div>

            <div className="class-actions">
              <button 
                className={`status-button ${getStatusColor(entry)}`}
                onClick={(e) => !entry.is_scored && handleOpenPopup(e, entry.id)}
                disabled={entry.is_scored}
              >
                {getStatusLabel(entry)}
              </button>
              
            </div>
          </div>
        ))}
      </div>

      {/* Status Popup */}
      {activePopup !== null && popupPosition && (
        <div 
          className="status-popup" 
          style={{ 
            top: popupPosition.top, 
            left: popupPosition.left 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="popup-option none"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(activePopup, 'none');
            }}
          >
            <span className="popup-icon">⚪</span> Not Checked In
          </button>
          <button 
            className="popup-option checked-in"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(activePopup, 'checked-in');
            }}
          >
            <span className="popup-icon">✓</span> Check-in
          </button>
          <button 
            className="popup-option conflict"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(activePopup, 'conflict');
            }}
          >
            <span className="popup-icon">⚠</span> Conflict
          </button>
          <button 
            className="popup-option pulled"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(activePopup, 'pulled');
            }}
          >
            <span className="popup-icon">✕</span> Pulled
          </button>
          {hasPermission('canAccessScoresheet') && (
            <button 
              className="popup-option at-gate"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(activePopup, 'at-gate');
              }}
            >
              <span className="popup-icon">▶</span> At Gate
            </button>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>
        <button className="nav-button" onClick={() => navigate('/announcements')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>
          </svg>
        </button>
        <button className="nav-button" onClick={() => navigate('/calendar')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
        </button>
        <button className="nav-button" onClick={() => navigate('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
        <button className="nav-button" onClick={() => {}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
          </svg>
        </button>
      </nav>
    </div>
  );
};