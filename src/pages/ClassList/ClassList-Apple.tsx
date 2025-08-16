import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import '../../styles/apple-design-system.css';

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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (trialId && showContext) {
      loadClassList();
    }
  }, [trialId, showContext]);

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

        // Load ALL entries for this trial using natural keys
        const { data: allTrialEntries, error: trialEntriesError } = await supabase
          .from('view_entry_class_join_distinct')
          .select('*')
          .eq('mobile_app_lic_key', showContext?.licenseKey)
          .eq('trial_date', trialData.trial_date)
          .eq('trial_number', trialData.trial_number)
          .order('in_ring', { ascending: false })
          .order('checkin_status', { ascending: false })
          .order('armband', { ascending: true });

        if (trialEntriesError) {
          console.error('Error loading trial entries:', trialEntriesError);
        }

        // Process classes with entry data
        const processedClasses = classData.map((cls: any) => {
          const entryData = (allTrialEntries || []).filter(entry => 
            entry.element === cls.element && 
            entry.level === cls.level && 
            entry.section === cls.section
          );
          
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

          const entryCount = dogs.length;
          const completedCount = dogs.filter(dog => dog.is_scored).length;
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
            is_favorite: false,
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

  const handleViewEntries = (classEntry: ClassEntry) => {
    navigate(`/class/${classEntry.id}/entries`);
  };

  const handleClassStatusChange = async (classId: number, status: ClassEntry['class_status']) => {
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, class_status: status } : c
    ));
    setActivePopup(null);

    try {
      const { error } = await supabase
        .from('tbl_class_queue')
        .update({ class_status: status })
        .eq('id', classId);

      if (error) {
        console.error('Error updating class status:', error);
        loadClassList();
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
  };

  const getStatusColor = (status: ClassEntry['class_status']) => {
    switch (status) {
      case 'setup': return '#FF9500';
      case 'briefing': return '#007AFF';
      case 'break': return '#FF9500';
      case 'start_time': return '#FF9500';
      case 'in_progress': return '#FF9500';
      case 'completed': return '#34C759';
      default: return '#8E8E93';
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
    if (dog.checkin_status === 4) return '🚪';
    if (dog.checkin_status === 1) return '✅';
    if (dog.checkin_status === 2) return '⚠️';
    if (dog.checkin_status === 3) return '❌';
    return '⏳';
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
    if (statusFilter === 'pending' && classEntry.class_status === 'completed') return false;
    if (statusFilter === 'completed' && classEntry.class_status !== 'completed') return false;
    if (typeFilter === 'favorites' && !classEntry.is_favorite) return false;
    if (typeFilter === 'in_progress' && classEntry.class_status !== 'in_progress') return false;
    return true;
  });

  if (isLoading) {
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
          Loading...
        </div>
      </div>
    );
  }

  if (!trialInfo) {
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
          Trial not found
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
          onClick={() => navigate(-1)}
          style={{ padding: '0.75rem', borderRadius: '0.75rem', minWidth: '44px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        
        <div style={{ textAlign: 'center', flex: 1, margin: '0 1rem' }}>
          <h1 className="apple-text-heading" style={{ margin: 0 }}>Select Class</h1>
        </div>
        
        <button 
          className="apple-button-secondary"
          onClick={loadClassList}
          style={{ padding: '0.75rem', borderRadius: '0.75rem', minWidth: '44px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </header>

      {/* Trial Info Card */}
      <div style={{ padding: '1.5rem' }}>
        <div className="apple-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="apple-text-title" style={{ margin: '0 0 0.5rem 0' }}>
                {trialInfo.trial_date}
              </h2>
              <p className="apple-text-body" style={{ margin: 0 }}>
                {trialInfo.trial_name}
              </p>
            </div>
            <div className="apple-status-badge completed">
              {trialInfo.total_classes} Classes
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ padding: '0 1.5rem' }}>
        <div 
          className="apple-tabs-container"
          style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: '1rem' }}
        >
          <button
            className="apple-tab-trigger"
            data-state={statusFilter === 'pending' ? 'active' : 'inactive'}
            onClick={() => setStatusFilter('pending')}
          >
            <span style={{ marginRight: '0.5rem' }}>⏳</span>
            {trialInfo.pending_classes} Pending
          </button>
          <button
            className="apple-tab-trigger"
            data-state={statusFilter === 'completed' ? 'active' : 'inactive'}
            onClick={() => setStatusFilter('completed')}
          >
            <span style={{ marginRight: '0.5rem' }}>✅</span>
            {trialInfo.completed_classes} Completed
          </button>
        </div>

        {/* Filter Tabs */}
        <div 
          className="apple-tabs-container"
          style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
        >
          <button
            className="apple-tab-trigger"
            data-state={typeFilter === 'all' ? 'active' : 'inactive'}
            onClick={() => setTypeFilter('all')}
          >
            All
          </button>
          <button
            className="apple-tab-trigger"
            data-state={typeFilter === 'favorites' ? 'active' : 'inactive'}
            onClick={() => setTypeFilter('favorites')}
          >
            Favorites
          </button>
          <button
            className="apple-tab-trigger"
            data-state={typeFilter === 'in_progress' ? 'active' : 'inactive'}
            onClick={() => setTypeFilter('in_progress')}
          >
            In-Progress
          </button>
        </div>
      </div>

      {/* Classes List */}
      <div style={{ padding: '1.5rem', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredClasses.map((classEntry) => (
            <div 
              key={classEntry.id} 
              className={`apple-card ${classEntry.entry_count === 0 ? '' : 'apple-card-pending'}`}
              onClick={() => handleViewEntries(classEntry)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {/* Class Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="apple-text-heading" style={{ margin: '0 0 0.5rem 0' }}>
                    {classEntry.class_name}
                  </h3>
                  <p className="apple-text-caption" style={{ margin: '0 0 0.5rem 0' }}>
                    Judge: {classEntry.judge_name}
                  </p>
                  <p className="apple-text-body" style={{ margin: 0 }}>
                    {classEntry.completed_count} of {classEntry.entry_count} Remaining
                  </p>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(classEntry.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    color: classEntry.is_favorite ? '#ff4757' : 'var(--muted-foreground)',
                    transition: 'all 0.2s var(--apple-ease)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={classEntry.is_favorite ? "currentColor" : "none"} stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>

              {/* Dog Entries */}
              {classEntry.dogs.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {classEntry.dogs.slice(0, expandedClasses.has(classEntry.id) ? undefined : 5).map((dog) => (
                      <div 
                        key={dog.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dog/${dog.armband}`);
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{getDogStatusIcon(dog)}</span>
                        <div className="apple-armband-badge" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
                          {dog.armband}
                        </div>
                        <span className="apple-text-body">{dog.call_name}</span>
                      </div>
                    ))}
                    
                    {!expandedClasses.has(classEntry.id) && classEntry.dogs.length > 5 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassExpansion(classEntry.id);
                        }}
                        className="apple-button-secondary"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        ▼ Show all {classEntry.dogs.length} remaining
                      </button>
                    )}
                    
                    {expandedClasses.has(classEntry.id) && classEntry.dogs.length > 5 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassExpansion(classEntry.id);
                        }}
                        className="apple-button-secondary"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        ▲ Show less
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', marginBottom: '1rem' }}>
                  <p className="apple-text-caption" style={{ margin: 0 }}>
                    No dogs entered yet
                  </p>
                </div>
              )}

              {/* Status and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div 
                  className="apple-status-badge"
                  style={{ 
                    backgroundColor: `${getStatusColor(classEntry.class_status)}20`,
                    color: getStatusColor(classEntry.class_status),
                    border: `1px solid ${getStatusColor(classEntry.class_status)}40`
                  }}
                >
                  {getStatusLabel(classEntry.class_status)}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {classEntry.entry_count > 0 && (
                    <button
                      className="apple-button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEntries(classEntry);
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                    >
                      View Entries
                    </button>
                  )}
                  
                  {hasPermission('canScore') && classEntry.entry_count > 0 && (
                    <button
                      className="apple-button-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEntries(classEntry);
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                    >
                      Score Class
                    </button>
                  )}
                  
                  {hasPermission('canManageClasses') && (
                    <button 
                      className="apple-button-secondary class-menu-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopup(activePopup === classEntry.id ? null : classEntry.id);
                      }}
                      style={{ padding: '0.5rem', minWidth: '44px' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Status Popup */}
              {activePopup === classEntry.id && (
                <div 
                  className="class-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '1rem',
                    marginTop: '0.5rem',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    padding: '0.5rem',
                    minWidth: '200px',
                    backdropFilter: 'blur(20px)',
                    zIndex: 100
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div className="apple-text-caption" style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
                      Class Status
                    </div>
                    {(['none', 'setup', 'briefing', 'break', 'start_time', 'in_progress', 'completed'] as const).map((status) => (
                      <button 
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassStatusChange(classEntry.id, status);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textAlign: 'left',
                          color: 'var(--foreground)',
                          cursor: 'pointer',
                          transition: 'all 0.2s var(--apple-ease)',
                          marginBottom: '0.125rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="apple-bottom-nav">
        <button className="apple-nav-button" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </button>
        <button className="apple-nav-button" onClick={() => navigate('/announcements')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>
          </svg>
          <span>Announcements</span>
        </button>
        <button className="apple-nav-button" onClick={() => navigate('/calendar')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          <span>Calendar</span>
        </button>
        <button className="apple-nav-button" onClick={() => navigate('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
          <span>Settings</span>
        </button>
        <button className="apple-nav-button" onClick={() => {}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
          </svg>
          <span>Tools</span>
        </button>
      </nav>
    </div>
  );
};