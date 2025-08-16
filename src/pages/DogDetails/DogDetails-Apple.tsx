import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import '../../styles/apple-design-system.css';

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
  const { hasPermission } = usePermission();
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (armband && showContext) {
      loadDogDetails();
    }
  }, [armband, showContext]);

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

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-popup') && !target.closest('.status-button')) {
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

        // Process all classes
        setClasses(data.map((entry, index) => {
          let check_in_status: ClassEntry['check_in_status'] = 'none';
          
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
            default:
              check_in_status = 'none';
          }

          return {
            id: entry.id,
            class_name: `${entry.element} ${entry.level} ${entry.section}`.trim(),
            class_type: entry.class_type || 'Regular',
            trial_name: entry.trial_name || 'Trial',
            trial_date: entry.trial_date || '',
            search_time: entry.search_time,
            fault_count: entry.fault_count,
            result_text: entry.result_text,
            is_scored: entry.is_scored || false,
            checked_in: entry.checked_in || false,
            check_in_status,
            position: index + 1
          };
        }));
      }
    } catch (error) {
      console.error('Error loading dog details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ClassEntry['check_in_status']) => {
    switch (status) {
      case 'checked-in': return '✅';
      case 'conflict': return '⚠️';
      case 'pulled': return '❌';
      case 'at-gate': return '🚪';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: ClassEntry['check_in_status']) => {
    switch (status) {
      case 'checked-in': return '#34C759';
      case 'conflict': return '#FF9500';
      case 'pulled': return '#FF3B30';
      case 'at-gate': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: ClassEntry['check_in_status']) => {
    switch (status) {
      case 'checked-in': return 'Checked In';
      case 'conflict': return 'Conflict';
      case 'pulled': return 'Pulled';
      case 'at-gate': return 'At Gate';
      default: return 'Not Set';
    }
  };

  const getResultIcon = (resultText: string | null) => {
    if (!resultText) return '⏳';
    switch (resultText.toLowerCase()) {
      case 'qualified':
      case 'q': return '✅';
      case 'nq':
      case 'not qualified': return '❌';
      case 'abs':
      case 'absent': return '⚪';
      default: return '⏳';
    }
  };

  const getResultColor = (resultText: string | null) => {
    if (!resultText) return '#8E8E93';
    switch (resultText.toLowerCase()) {
      case 'qualified':
      case 'q': return '#34C759';
      case 'nq':
      case 'not qualified': return '#FF3B30';
      case 'abs':
      case 'absent': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

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

  if (!dogInfo) {
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
          Dog not found
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
          <h1 className="apple-text-heading" style={{ margin: 0 }}>Dog Details</h1>
        </div>
        
        <button 
          className="apple-button-secondary"
          onClick={loadDogDetails}
          style={{ padding: '0.75rem', borderRadius: '0.75rem', minWidth: '44px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </header>

      {/* Dog Info Card */}
      <div style={{ padding: '1.5rem' }}>
        <div className="apple-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div className="apple-armband-badge" style={{ 
            margin: '0 auto 1rem auto',
            width: '4rem',
            height: '4rem',
            fontSize: '1.5rem'
          }}>
            {dogInfo.armband}
          </div>
          
          <h2 className="apple-text-title" style={{ margin: '0 0 0.5rem 0' }}>
            {dogInfo.call_name}
          </h2>
          <p className="apple-text-body" style={{ margin: '0 0 0.5rem 0' }}>
            {dogInfo.breed}
          </p>
          <p className="apple-text-caption" style={{ margin: 0 }}>
            Handler: {dogInfo.handler}
          </p>
        </div>
      </div>

      {/* Classes List */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h3 className="apple-text-heading" style={{ margin: '0 0 1rem 0' }}>
          Classes ({classes.length})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '100px' }}>
          {classes.map((classEntry) => (
            <div 
              key={classEntry.id} 
              className={`apple-card ${!classEntry.is_scored ? 'apple-card-pending' : ''}`}
              style={{ position: 'relative' }}
            >
              {/* Class Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 className="apple-text-heading" style={{ margin: '0 0 0.5rem 0' }}>
                    {classEntry.class_name}
                  </h4>
                  <p className="apple-text-caption" style={{ margin: '0 0 0.5rem 0' }}>
                    {classEntry.trial_name} • {classEntry.trial_date}
                  </p>
                  <p className="apple-text-caption" style={{ margin: 0 }}>
                    {classEntry.class_type}
                  </p>
                </div>
                
                {/* Position Badge */}
                <div style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  borderRadius: '50%',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  #{classEntry.position}
                </div>
              </div>

              {/* Status Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>
                    {getStatusIcon(classEntry.check_in_status)}
                  </span>
                  <div 
                    className="apple-status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(classEntry.check_in_status)}20`,
                      color: getStatusColor(classEntry.check_in_status),
                      border: `1px solid ${getStatusColor(classEntry.check_in_status)}40`
                    }}
                  >
                    {getStatusLabel(classEntry.check_in_status)}
                  </div>
                </div>
                
                {hasPermission('canCheckInDogs') && !classEntry.is_scored && (
                  <button 
                    className="apple-button-secondary status-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopup(activePopup === classEntry.id ? null : classEntry.id);
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    Change Status
                  </button>
                )}
              </div>

              {/* Results Section */}
              {classEntry.is_scored ? (
                <div style={{ 
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  border: '1px solid rgba(52, 199, 89, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {getResultIcon(classEntry.result_text)}
                    </span>
                    <div 
                      className="apple-status-badge"
                      style={{ 
                        backgroundColor: `${getResultColor(classEntry.result_text)}20`,
                        color: getResultColor(classEntry.result_text),
                        border: `1px solid ${getResultColor(classEntry.result_text)}40`
                      }}
                    >
                      {classEntry.result_text?.toUpperCase() || 'PENDING'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {classEntry.search_time && (
                      <div>
                        <p className="apple-text-caption" style={{ margin: '0 0 0.25rem 0' }}>
                          Time
                        </p>
                        <p className="apple-text-body" style={{ margin: 0, fontWeight: '600' }}>
                          {classEntry.search_time}
                        </p>
                      </div>
                    )}
                    
                    {classEntry.fault_count !== null && (
                      <div>
                        <p className="apple-text-caption" style={{ margin: '0 0 0.25rem 0' }}>
                          Faults
                        </p>
                        <p className="apple-text-body" style={{ margin: 0, fontWeight: '600' }}>
                          {classEntry.fault_count}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  backgroundColor: 'rgba(255, 149, 0, 0.1)',
                  border: '1px solid rgba(255, 149, 0, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <p className="apple-text-body" style={{ margin: 0 }}>
                    ⏳ Awaiting Results
                  </p>
                </div>
              )}

              {/* Actions */}
              {hasPermission('canScore') && !classEntry.is_scored && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    className="apple-button-primary"
                    onClick={() => {
                      // Navigate to scoresheet for this specific entry
                      navigate(`/class/${classEntry.id}/entries`);
                    }}
                  >
                    Start Scoring
                  </button>
                </div>
              )}
              
              {/* Status Change Popup */}
              {activePopup === classEntry.id && (
                <div 
                  className="status-popup"
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
                    minWidth: '180px',
                    backdropFilter: 'blur(20px)',
                    zIndex: 100
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="apple-text-caption" style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
                    Check-in Status
                  </div>
                  
                  {(['none', 'checked-in', 'conflict', 'pulled', 'at-gate'] as const).map((status) => (
                    <button 
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement status update logic
                        setActivePopup(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
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
                      <span>{getStatusIcon(status)}</span>
                      {getStatusLabel(status)}
                    </button>
                  ))}
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
        <button className="apple-nav-button active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.58 10.76C10.21 11.13 10 11.62 10 12.14V16H8V22H16V16H14V12.14L18.83 7.31L21 9Z"/>
          </svg>
          <span>Dog</span>
        </button>
      </nav>
    </div>
  );
};