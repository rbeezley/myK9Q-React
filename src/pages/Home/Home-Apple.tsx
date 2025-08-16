import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import '../../styles/apple-design-system.css';

interface EntryData {
  id: number;
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
  is_favorite?: boolean;
  class_name?: string;
  is_scored?: boolean;
}

interface TrialData {
  id: number;
  trialid: number;
  trial_name: string;
  trial_date: string;
  trial_type: string;
  classes_completed: number;
  classes_total: number;
  entries_completed: number;
  entries_total: number;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { showContext, logout, role } = useAuth();
  const { hasPermission: _hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState<'armband' | 'name' | 'handler' | 'favorites'>('armband');
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (showContext) {
      loadDashboardData();
    }
  }, [showContext]);

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

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load trials with progress
      const { data: trialsData, error: trialsError } = await supabase
        .from('tbl_trial_queue')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey);

      if (trialsError) {
        console.error('Error loading trials:', trialsError);
      }

      // Load entries from the view
      const { data: entriesData, error: entriesError } = await supabase
        .from('view_entry_class_join_distinct')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .order('armband', { ascending: true });

      if (entriesError) {
        console.error('Error loading entries:', entriesError);
      }

      // Process trials with counts
      if (trialsData) {
        const processedTrials = await Promise.all(trialsData.map(async (trial) => {
          // Get class counts for this trial
          const { count: totalClasses } = await supabase
            .from('tbl_class_queue')
            .select('*', { count: 'exact', head: true })
            .eq('mobile_app_lic_key', showContext?.licenseKey)
            .eq('trialid_fk', trial.trialid);

          const { count: completedClasses } = await supabase
            .from('tbl_class_queue')
            .select('*', { count: 'exact', head: true })
            .eq('mobile_app_lic_key', showContext?.licenseKey)
            .eq('trial_id', trial.id)
            .eq('is_completed', true);

          const { count: totalEntries } = await supabase
            .from('tbl_entry_queue')
            .select('*', { count: 'exact', head: true })
            .eq('mobile_app_lic_key', showContext?.licenseKey);

          const { count: completedEntries } = await supabase
            .from('tbl_entry_queue')
            .select('*', { count: 'exact', head: true })
            .eq('mobile_app_lic_key', showContext?.licenseKey)
            .eq('is_scored', true);

          return {
            ...trial,
            classes_completed: completedClasses || 0,
            classes_total: totalClasses || 0,
            entries_completed: completedEntries || 0,
            entries_total: totalEntries || 0
          };
        }));
        setTrials(processedTrials);
      }

      // Process entries - get unique dogs by armband
      if (entriesData) {
        const uniqueDogs = new Map<number, EntryData>();
        
        entriesData.forEach(entry => {
          if (!uniqueDogs.has(entry.armband)) {
            uniqueDogs.set(entry.armband, {
              id: entry.id,
              armband: entry.armband,
              call_name: entry.call_name,
              breed: entry.breed,
              handler: entry.handler,
              is_favorite: false, // TODO: Persist favorites in localStorage or database
              class_name: entry.class_name,
              is_scored: entry.is_scored
            });
          }
        });
        
        setEntries(Array.from(uniqueDogs.values()));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleFavorite = (armband: number) => {
    setEntries(prev => prev.map(entry => 
      entry.armband === armband 
        ? { ...entry, is_favorite: !entry.is_favorite }
        : entry
    ));
  };
  
  const handleDogClick = (armband: number) => {
    navigate(`/dog/${armband}`);
  };

  const getFilteredEntries = () => {
    if (activeTab === 'favorites') {
      return entries.filter(e => e.is_favorite);
    }
    
    const sorted = [...entries];
    switch (activeTab) {
      case 'name':
        return sorted.sort((a, b) => a.call_name.localeCompare(b.call_name));
      case 'handler':
        return sorted.sort((a, b) => a.handler.localeCompare(b.handler));
      case 'armband':
      default:
        return sorted.sort((a, b) => a.armband - b.armband);
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
          onClick={logout}
          style={{ padding: '0.75rem', borderRadius: '0.75rem', minWidth: '44px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>
        
        <div style={{ textAlign: 'center', flex: 1, margin: '0 1rem' }}>
          <h1 className="apple-text-heading" style={{ margin: 0 }}>Home</h1>
        </div>
        
        <button 
          className="apple-button-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ padding: '0.75rem', borderRadius: '0.75rem', minWidth: '44px' }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              transformOrigin: 'center'
            }}
          >
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </header>

      {/* Show Info Card */}
      <div style={{ padding: '1.5rem' }}>
        <div className="apple-card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 className="apple-text-title" style={{ margin: '0 0 0.5rem 0' }}>
            {showContext?.clubName}
          </h2>
          <p className="apple-text-body" style={{ margin: '0 0 0.5rem 0' }}>
            {showContext?.showName}
          </p>
          <p className="apple-text-caption" style={{ margin: 0 }}>
            Logged in as: {role}
          </p>
        </div>
      </div>

      {/* Trial Cards - Horizontal Scroll */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h3 className="apple-text-heading" style={{ margin: '0 0 1rem 0' }}>Trials</h3>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem',
          scrollbarWidth: 'thin'
        }}>
          {trials.map((trial) => (
            <div 
              key={trial.id} 
              className="apple-card"
              onClick={() => navigate(`/trial/${trial.trialid}/classes`)}
              style={{ 
                minWidth: '280px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {/* Trial Image Placeholder */}
              <div style={{
                width: '100%',
                height: '120px',
                background: 'linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-purple) 100%)',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem'
              }}>
                🏆
              </div>
              
              <div>
                <h4 className="apple-text-heading" style={{ margin: '0 0 0.5rem 0' }}>
                  {trial.trial_name}
                </h4>
                <p className="apple-text-caption" style={{ margin: '0 0 0.5rem 0' }}>
                  {trial.trial_date}
                </p>
                <p className="apple-text-body" style={{ margin: '0 0 1rem 0' }}>
                  {trial.trial_type}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="apple-status-badge completed">
                    {trial.classes_completed} of {trial.classes_total} Classes
                  </div>
                  <div className="apple-status-badge pending">
                    {trial.entries_completed} of {trial.entries_total} Entries
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entry Tabs */}
      <div style={{ padding: '0 1.5rem' }}>
        <div 
          className="apple-tabs-container"
          style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
        >
          {(['armband', 'name', 'handler', 'favorites'] as const).map((tab) => (
            <button
              key={tab}
              className="apple-tab-trigger"
              data-state={activeTab === tab ? 'active' : 'inactive'}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Entry List */}
      <div style={{ padding: '1.5rem', paddingBottom: '100px' }}>
        {activeTab === 'favorites' && getFilteredEntries().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="apple-text-body" style={{ margin: 0 }}>
              [0] Dogs Entered
            </p>
          </div>
        ) : (
          <>
            <p className="apple-text-caption" style={{ margin: '0 0 1rem 0' }}>
              [{getFilteredEntries().length}] Dogs Entered
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {getFilteredEntries().map((entry) => (
                <div key={entry.armband} className="apple-card" style={{ position: 'relative' }}>
                  <div 
                    onClick={() => handleDogClick(entry.armband)}
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div className="apple-armband-badge">
                      {entry.armband}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 className="apple-text-heading" style={{ margin: '0 0 0.25rem 0' }}>
                        {entry.call_name}
                      </h4>
                      <p className="apple-text-body" style={{ margin: '0 0 0.25rem 0' }}>
                        {entry.breed}
                      </p>
                      <p className="apple-text-caption" style={{ margin: 0 }}>
                        Handler: {entry.handler}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(entry.armband);
                    }}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      color: entry.is_favorite ? '#ff4757' : 'var(--muted-foreground)',
                      transition: 'all 0.2s var(--apple-ease)'
                    }}
                    aria-label={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="apple-bottom-nav">
        <button className="apple-nav-button active" onClick={() => navigate('/home')}>
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
      </nav>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};