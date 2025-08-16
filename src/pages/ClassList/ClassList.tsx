import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import './ClassList.css';

interface ClassEntry {
  id: number;
  element: string;
  level: string;
  section: string;
  class_name: string;
  judge_name: string;
  entry_count: number;
  completed_count: number;
  class_status: 'none' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
  is_favorite: boolean;
  dogs: {
    id: number;
    armband: number;
    call_name: string;
    breed: string;
    handler: string;
    in_ring: boolean;
    checkin_status: number;
    is_scored: boolean;
  }[];
}

interface TrialInfo {
  trial_name: string;
  trial_date: string;
  total_classes: number;
  pending_classes: number;
  completed_classes: number;
}

export const ClassList: React.FC = () => {
  const { trialId } = useParams<{ trialId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'favorites' | 'in_progress'>('all');
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (trialId && showContext) {
      loadClassList();
    }
  }, [trialId, showContext]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.class-popup') && !target.closest('.class-menu-button')) {
        setActivePopup(null);
      }
    };

    if (activePopup !== null) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

  const loadClassList = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load trial info
      const { data: trialData, error: trialError } = await supabase
        .from('tbl_trial_queue')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .eq('trialid', parseInt(trialId!))
        .single();

      if (trialError) {
        console.error('Error loading trial:', trialError);
        return;
      }

      // Load classes for this trial
      const { data: classData, error: classError } = await supabase
        .from('tbl_class_queue')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .eq('trialid_fk', parseInt(trialId!));

      if (classError) {
        console.error('Error loading classes:', classError);
        return;
      }

      if (trialData && classData) {
        // Set trial info
        setTrialInfo({
          trial_name: trialData.trial_name,
          trial_date: trialData.trial_date,
          total_classes: classData.length,
          pending_classes: classData.filter(c => c.class_status !== 'completed').length,
          completed_classes: classData.filter(c => c.class_status === 'completed').length
        });


        // Load ALL entries for this trial using natural keys (not foreign keys)
        const { data: allTrialEntries, error: trialEntriesError } = await supabase
          .from('view_entry_class_join_distinct')
          .select('*')
          .eq('mobile_app_lic_key', showContext?.licenseKey)
          .eq('trial_date', trialData.trial_date)
          .eq('trial_number', trialData.trial_number)
          .order('in_ring', { ascending: false }) // In ring first
          .order('checkin_status', { ascending: false }) // Then by checkin status
          .order('armband', { ascending: true }); // Then by armband

        if (trialEntriesError) {
          console.error('Error loading trial entries:', trialEntriesError);
        }

        console.log(`Found ${allTrialEntries?.length || 0} entries for trial ${trialData.trial_date} - ${trialData.trial_number}`);

        // Process classes with entry data
        const processedClasses = classData.map((cls: any) => {
          // Filter entries for this specific class using natural keys
          const entryData = (allTrialEntries || []).filter(entry => 
            entry.element === cls.element && 
            entry.level === cls.level && 
            entry.section === cls.section
          );
          
          console.log(`Class ${cls.id} (${cls.element} ${cls.level} ${cls.section}): ${entryData.length} entries`);

          // Process dog entries with status priorities
          const dogs = (entryData || []).map(entry => ({
            id: entry.id,
            armband: entry.armband,
            call_name: entry.call_name,
            breed: entry.breed,
            handler: entry.handler,
            in_ring: entry.in_ring || false,
            checkin_status: entry.checkin_status || 0,
            is_scored: entry.is_scored || false
          }));

          // Count totals
          const entryCount = dogs.length;
          const completedCount = dogs.filter(dog => dog.is_scored).length;

          // Construct class name from element, level, and section
          const className = `${cls.element} ${cls.level} ${cls.section}`.trim();
          
          return {
            id: cls.id,
            element: cls.element,
            level: cls.level,
            section: cls.section,
            class_name: className,
            class_type: cls.class_type,
            judge_name: cls.judge_name || 'TBA',
            entry_count: entryCount,
            completed_count: completedCount,
            class_status: cls.class_status || 'pending',
            is_favorite: false, // TODO: Load from user preferences
            dogs: dogs
          };
        });

        setClasses(processedClasses);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showContext?.licenseKey, trialId]);


  const parseOrganizationData = (orgString: string) => {
    // Parse organization string like "UKC Obedience", "AKC Scent Work"
    const parts = orgString.split(' ');
    return {
      organization: parts[0], // "UKC", "AKC", "ASCA"
      activity_type: parts.slice(1).join(' '), // "Obedience", "Scent Work", "FastCat"
    };
  };

  const handleViewEntries = (classEntry: ClassEntry) => {
    navigate(`/class/${classEntry.id}/entries`);
  };

  const _handleStartScoring = (classEntry: ClassEntry) => {
    // Implement improved 4-tier scoresheet selection hierarchy
    const orgData = parseOrganizationData(showContext?.org || '');
    const competition_type = showContext?.competition_type || 'Regular'; // Regular, Regional, National
    const _trial_type = ''; // Will come from tbl_trial_queue.trial_type when implemented
    const element = classEntry.element || '';
    const level = classEntry.level || '';
    
    console.log('Scoresheet selection:', { 
      organization: orgData.organization,
      activity_type: orgData.activity_type,
      competition_type,
      element,
      level
    });
    
    // Organization-based routing
    if (orgData.organization === 'AKC') {
      if (orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork') {
        // AKC Scent Work - could have National variant in future
        navigate(`/scoresheet/akc-scent-work/${classEntry.id}/0`); // 0 means auto-select first entry
      } else if (orgData.activity_type === 'FastCat' || orgData.activity_type === 'Fast Cat') {
        navigate(`/scoresheet/akc-fastcat/${classEntry.id}/0`);
      } else {
        // Default AKC fallback
        navigate(`/scoresheet/akc-scent-work/${classEntry.id}/0`);
      }
    } else if (orgData.organization === 'UKC') {
      if (orgData.activity_type === 'Obedience' || element === 'Obedience') {
        navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
      } else if (element === 'Rally' || orgData.activity_type === 'Rally') {
        navigate(`/scoresheet/ukc-rally/${classEntry.id}/0`);
      } else if (orgData.activity_type === 'Nosework') {
        // UKC Nosework - using ASCA for now as placeholder
        navigate(`/scoresheet/asca-scent-detection/${classEntry.id}/0`);
      } else {
        // Default UKC fallback based on element
        if (element === 'Obedience') {
          navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
        } else {
          navigate(`/scoresheet/ukc-rally/${classEntry.id}/0`);
        }
      }
    } else if (orgData.organization === 'ASCA') {
      if (orgData.activity_type === 'ScentDetection' || orgData.activity_type.includes('Scent')) {
        navigate(`/scoresheet/asca-scent-detection/${classEntry.id}/0`);
      } else {
        navigate(`/scoresheet/asca-scent-detection/${classEntry.id}/0`);
      }
    } else {
      // Default fallback - try to infer from element
      if (element === 'Obedience') {
        navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
      } else if (element === 'Rally') {
        navigate(`/scoresheet/ukc-rally/${classEntry.id}/0`);
      } else {
        // Ultimate fallback
        navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
      }
    }
  };

  const handleClassStatusChange = async (classId: number, status: ClassEntry['class_status']) => {
    // Update local state
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, class_status: status } : c
    ));
    setActivePopup(null);

    // Update database
    try {
      const { error } = await supabase
        .from('tbl_class_queue')
        .update({ class_status: status })
        .eq('id', classId);

      if (error) {
        console.error('Error updating class status:', error);
        // Revert on error
        loadClassList();
      } else {
        console.log('Class status updated successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      loadClassList();
    }
  };

  const toggleFavorite = async (classId: number) => {
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, is_favorite: !c.is_favorite } : c
    ));
    
    // TODO: Update user preferences
  };

  const getStatusColor = (status: ClassEntry['class_status']) => {
    switch (status) {
      case 'setup': return 'setup';
      case 'briefing': return 'briefing';
      case 'break': return 'break';
      case 'start_time': return 'start-time';
      case 'in_progress': return 'in-progress';
      case 'completed': return 'completed';
      default: return 'none';
    }
  };

  const getStatusLabel = (status: ClassEntry['class_status']) => {
    switch (status) {
      case 'setup': return 'Setup';
      case 'briefing': return 'Briefing';
      case 'break': return 'Break';
      case 'start_time': return 'Start Time';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'None';
    }
  };

  const getDogStatusIcon = (dog: ClassEntry['dogs'][0]) => {
    if (dog.is_scored) return '✅';
    if (dog.in_ring) return '🏃';
    if (dog.checkin_status === 4) return '🚪'; // At gate
    if (dog.checkin_status === 1) return '✅'; // Checked in
    if (dog.checkin_status === 2) return '⚠️'; // Conflict
    if (dog.checkin_status === 3) return '❌'; // Pulled
    return '⏳'; // Not checked in
  };

  const getDogStatusColor = (dog: ClassEntry['dogs'][0]) => {
    if (dog.is_scored) return 'completed';
    if (dog.in_ring) return 'in-ring';
    if (dog.checkin_status === 4) return 'at-gate';
    if (dog.checkin_status === 1) return 'checked-in';
    if (dog.checkin_status === 2) return 'conflict';
    if (dog.checkin_status === 3) return 'pulled';
    return 'not-checked-in';
  };

  const getVisibleDogs = (dogs: ClassEntry['dogs'], classId: number) => {
    const isExpanded = expandedClasses.has(classId);
    if (isExpanded) return dogs;
    
    // Show first 5 dogs, prioritizing in-ring and at-gate
    return dogs.slice(0, 5);
  };

  const toggleClassExpansion = (classId: number) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const filteredClasses = classes.filter(classEntry => {
    // Status filter
    if (statusFilter === 'pending' && classEntry.class_status === 'completed') return false;
    if (statusFilter === 'completed' && classEntry.class_status !== 'completed') return false;
    
    // Type filter
    if (typeFilter === 'favorites' && !classEntry.is_favorite) return false;
    if (typeFilter === 'in_progress' && classEntry.class_status !== 'in_progress') return false;
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="class-list-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!trialInfo) {
    return (
      <div className="class-list-container">
        <div className="error">Trial not found</div>
      </div>
    );
  }

  return (
    <div className="class-list-container">
      <header className="class-list-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1>Select Class</h1>
        <button className="refresh-button" onClick={loadClassList}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </header>

      <div className="trial-info">
        <div className="trial-details">
          <h2>{trialInfo.trial_date}</h2>
          <p>{trialInfo.trial_name}</p>
        </div>
        <div className="class-count">
          {trialInfo.total_classes} Classes
        </div>
      </div>

      <div className="status-tabs">
        <button 
          className={`status-tab ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <span className="status-icon">⏳</span>
          {trialInfo.pending_classes} Pending
        </button>
        <button 
          className={`status-tab ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('completed')}
        >
          <span className="status-icon">✅</span>
          {trialInfo.completed_classes} Completed
        </button>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-tab ${typeFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => setTypeFilter('favorites')}
        >
          Favorites
        </button>
        <button 
          className={`filter-tab ${typeFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setTypeFilter('in_progress')}
        >
          In-Progress
        </button>
      </div>

      <div className="classes-list">
        {filteredClasses.map((classEntry) => (
          <div 
            key={classEntry.id} 
            className="class-card clickable"
            onClick={() => handleViewEntries(classEntry)}
          >
            <div className="class-header">
              <div className="class-info">
                <h3>{classEntry.class_name}</h3>
                <p className="judge-name">Judge: {classEntry.judge_name}</p>
                <p className="entry-stats">
                  {classEntry.completed_count} of {classEntry.entry_count} Remaining
                </p>
              </div>
              <div className="class-actions">
                <button 
                  className="favorite-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(classEntry.id);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={classEntry.is_favorite ? "#ff4757" : "none"} stroke="white">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="class-content">
              <div className="class-entries">
                {classEntry.dogs.length > 0 ? (
                  <>
                    {getVisibleDogs(classEntry.dogs, classEntry.id).map((dog) => (
                      <div 
                        key={dog.id} 
                        className={`entry-item ${getDogStatusColor(dog)}`}
                        onClick={() => navigate(`/dog/${dog.armband}`)}
                      >
                        <span className="entry-status">{getDogStatusIcon(dog)}</span>
                        <span className="entry-armband">{dog.armband}</span>
                        <span className="entry-name">{dog.call_name}</span>
                      </div>
                    ))}
                    
                    {!expandedClasses.has(classEntry.id) && classEntry.dogs.length > 5 && (
                      <button 
                        className="show-all-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassExpansion(classEntry.id);
                        }}
                      >
                        ▼ Show all {classEntry.dogs.length} remaining
                      </button>
                    )}
                    
                    {expandedClasses.has(classEntry.id) && classEntry.dogs.length > 5 && (
                      <button 
                        className="show-less-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassExpansion(classEntry.id);
                        }}
                      >
                        ▲ Show less
                      </button>
                    )}
                  </>
                ) : (
                  <div className="no-entries">
                    <p>No dogs entered yet</p>
                    <span className="entry-count-text">Entries will appear here when dogs are registered</span>
                  </div>
                )}
              </div>
            </div>

            <div className="class-status-section">
              <div className="class-status-actions">
                <button 
                  className={`status-button ${getStatusColor(classEntry.class_status)}`}
                >
                  {getStatusLabel(classEntry.class_status)}
                </button>
                
                {classEntry.entry_count > 0 && (
                  <button
                    className="view-entries-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewEntries(classEntry);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    View Entries
                  </button>
                )}
                
                {hasPermission('canScore') && classEntry.entry_count > 0 && (
                  <button
                    className="score-class-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewEntries(classEntry); // Navigate to entries instead of direct scoring
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    Score Class
                  </button>
                )}
                
                {hasPermission('canManageClasses') && (
                  <div className="menu-container">
                    <button 
                      className="class-menu-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopup(activePopup === classEntry.id ? null : classEntry.id);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                      </svg>
                    </button>
                    
                    {activePopup === classEntry.id && (
                      <div className="class-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-section">
                          <div className="popup-section-title">Class Status</div>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'none');
                            }}
                          >
                            <span className="popup-icon">⚪</span> None
                          </button>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'setup');
                            }}
                          >
                            <span className="popup-icon">🔧</span> Setup
                          </button>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'briefing');
                            }}
                          >
                            <span className="popup-icon">📋</span> Briefing
                          </button>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'break');
                            }}
                          >
                            <span className="popup-icon">☕</span> Break
                          </button>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'start_time');
                            }}
                          >
                            <span className="popup-icon">⏰</span> Start Time
                          </button>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'in_progress');
                            }}
                          >
                            <span className="popup-icon">🏃</span> In Progress
                          </button>
                          <button 
                            className="popup-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassStatusChange(classEntry.id, 'completed');
                            }}
                          >
                            <span className="popup-icon">✅</span> Completed
                          </button>
                        </div>
                        
                        <div className="popup-divider"></div>
                        
                        <div className="popup-section">
                          <button className="popup-option">
                            <span className="popup-icon">📋</span> Class Requirements
                          </button>
                          <button className="popup-option">
                            <span className="popup-icon">⚙️</span> Class Settings
                          </button>
                          <button className="popup-option">
                            <span className="popup-icon">📊</span> Class Statistics
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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