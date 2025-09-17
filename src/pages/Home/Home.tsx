import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { RefreshCw, Heart, User, Hash, Users, Award, Clock as _Clock, CheckCircle, Dog } from 'lucide-react';
import './Home.css';

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
  const { showContext, logout: _logout, role: _role } = useAuth();
  const { hasPermission: _hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<'armband' | 'name' | 'handler' | 'favorites'>('armband');
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [_isLoading, _setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteDogs, setFavoriteDogs] = useState<Set<number>>(new Set());
  const [dogFavoritesLoaded, setDogFavoritesLoaded] = useState(false);

  // Load dog favorites from localStorage
  useEffect(() => {
    const loadDogFavorites = () => {
      try {
        const favoritesKey = `dog_favorites_${showContext?.licenseKey || 'default'}`;
        console.log('🐕 Loading dog favorites with key:', favoritesKey);
        const savedFavorites = localStorage.getItem(favoritesKey);
        console.log('🐕 Raw localStorage value for dog favorites:', savedFavorites);
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites) as number[];
          // Validate the data is an array of numbers
          if (Array.isArray(favoriteIds) && favoriteIds.every(id => typeof id === 'number')) {
            console.log('🐕 Setting favoriteDogs from localStorage:', favoriteIds);
            setFavoriteDogs(new Set(favoriteIds));
          } else {
            console.warn('🐕 Invalid dog favorites data in localStorage, clearing it');
            localStorage.removeItem(favoritesKey);
            setFavoriteDogs(new Set());
          }
        } else {
          console.log('🐕 No saved dog favorites found');
          setFavoriteDogs(new Set());
        }
        setDogFavoritesLoaded(true);
      } catch (error) {
        console.error('Error loading dog favorites from localStorage:', error);
        // Clear corrupted data
        const favoritesKey = `dog_favorites_${showContext?.licenseKey || 'default'}`;
        localStorage.removeItem(favoritesKey);
        setFavoriteDogs(new Set());
        setDogFavoritesLoaded(true);
      }
    };
    
    if (showContext?.licenseKey) {
      loadDogFavorites();
    }
  }, [showContext?.licenseKey]);

  // Save dog favorites to localStorage whenever favoriteDogs changes (but only after initial load)
  useEffect(() => {
    if (dogFavoritesLoaded) {
      try {
        const favoritesKey = `dog_favorites_${showContext?.licenseKey || 'default'}`;
        const favoriteIds = Array.from(favoriteDogs);
        console.log('🐕 Saving dog favorites to localStorage:', favoritesKey, favoriteIds);
        localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds));
        console.log('🐕 Saved dog favorites successfully');
      } catch (error) {
        console.error('Error saving dog favorites to localStorage:', error);
      }
    } else {
      console.log('🐕 Not saving dog favorites - not loaded yet:', { licenseKey: showContext?.licenseKey, dogFavoritesLoaded, size: favoriteDogs.size });
    }
  }, [favoriteDogs, showContext?.licenseKey, dogFavoritesLoaded]);

  // Update entries' is_favorite property when favoriteDogs changes
  useEffect(() => {
    if (entries.length > 0 && dogFavoritesLoaded) {
      console.log('🐕 Updating entries is_favorite based on favoriteDogs:', Array.from(favoriteDogs));
      console.log('🐕 Current entries armbands:', entries.map(e => e.armband));
      setEntries(prevEntries => {
        const updatedEntries = prevEntries.map(entry => {
          const shouldBeFavorite = favoriteDogs.has(entry.armband);
          console.log(`🐕 Entry ${entry.armband} (${entry.call_name}): favorite=${shouldBeFavorite}`);
          return {
            ...entry,
            is_favorite: shouldBeFavorite
          };
        });
        console.log('🐕 Updated entries with favorites:', updatedEntries.map(e => `${e.armband}:${e.is_favorite}`));
        return updatedEntries;
      });
    }
  }, [favoriteDogs, dogFavoritesLoaded]);

  useEffect(() => {
    if (showContext && dogFavoritesLoaded) {
      loadDashboardData();
    }
  }, [showContext, dogFavoritesLoaded]);

  const loadDashboardData = async () => {
    _setIsLoading(true);
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
            .eq('trialid_fk', trial.id);

          // Get completed class counts (assuming classes with all entries scored)
          const { count: completedClasses } = await supabase
            .from('tbl_class_queue')
            .select('*', { count: 'exact', head: true })
            .eq('mobile_app_lic_key', showContext?.licenseKey)
            .eq('trialid_fk', trial.id)
            .eq('is_completed', true);

          // Get entry counts
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
              is_favorite: favoriteDogs.has(entry.armband), // Use current favoriteDogs state
              class_name: entry.class_name,
              is_scored: entry.is_scored
            });
          }
        });
        
        const newEntries = Array.from(uniqueDogs.values());
        console.log('🐕 Setting new entries with armbands:', newEntries.map(e => e.armband));
        console.log('🐕 Entries with favorites:', newEntries.map(e => `${e.armband}:${e.is_favorite}`));
        setEntries(newEntries);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      _setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.impact('medium');
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleFavorite = useCallback((armband: number) => {
    console.log('🐕 toggleFavorite called for armband:', armband);
    hapticFeedback.impact('light');
    
    // Update the favoriteDogs set for localStorage persistence
    setFavoriteDogs(prev => {
      const newFavorites = new Set(prev);
      const wasAlreadyFavorite = newFavorites.has(armband);
      
      if (wasAlreadyFavorite) {
        newFavorites.delete(armband);
        console.log('🐕 Removing from dog favorites:', armband);
      } else {
        newFavorites.add(armband);
        console.log('🐕 Adding to dog favorites:', armband);
      }
      console.log('🐕 New dog favorites set:', Array.from(newFavorites));
      return newFavorites;
    });
  }, [hapticFeedback]);
  
  const handleDogClick = (armband: number) => {
    hapticFeedback.impact('light');
    navigate(`/dog/${armband}`);
  };

  const formatTrialDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const shortDate = date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${dayName} ${shortDate}`;
    } catch {
      return dateString; // Fallback to original if parsing fails
    }
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

  return (
    <div className="home-container app-container">
      {/* Enhanced Header with Glass Morphism */}
      <header className="home-header">
        <HamburgerMenu currentPage="home" />
        
        <div className="header-center">
          <h1>Dashboard</h1>
        </div>
        
        <button
          className={`icon-button ${refreshing ? 'rotating' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </header>

      {/* Show info moved to hamburger menu for maximum screen space */}

      {/* Enhanced Active Trials Section */}
      <div className="trials-section">
        <h3>Active Trials</h3>
        <div className="trials-scroll">
          {trials.map((trial, index) => {
            const hasActiveClasses = trial.classes_total > trial.classes_completed;
            return (
              <div 
                key={trial.id}
                className={`trial-card ${hasActiveClasses ? 'active' : ''}`}
                onClick={() => {
                  hapticFeedback.impact('medium');
                  console.log('Navigating to trial:', trial.id, 'trialid:', trial.trialid);
                  navigate(`/trial/${trial.trialid}/classes`);
                }}
              >
                <div className="trial-content">
                  <div className="trial-details">
                    {/* Trial Name and Number */}
                    <div className="trial-title">
                      <span className="trial-name-number">
                        {trial.trial_name} 
                        <Award className="trial-icon" size={14} />
                        Trial {index + 1}
                      </span>
                    </div>
                    
                    {/* Date and Type */}
                    <p className="trial-date-line">{formatTrialDate(trial.trial_date)}</p>
                    
                    {/* Progress - Each on separate row */}
                    <div className="trial-progress">
                      <div className="progress-row">
                        <CheckCircle className="progress-icon" size={12} />
                        <span>Classes judged: {trial.classes_completed} of {trial.classes_total}</span>
                      </div>
                      <div className="progress-row">
                        <Dog className="progress-icon" size={12} />
                        <span>Dogs scored: {trial.entries_completed} of {trial.entries_total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Entry Tabs with Apple Design */}
      <div className="entry-tabs">
        <button
          className={`tab-button ${activeTab === 'armband' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setActiveTab('armband');
          }}
        >
          <Hash className="tab-icon" />
          <span className="tab-text">Armband</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'name' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setActiveTab('name');
          }}
        >
          <User className="tab-icon" />
          <span className="tab-text">Name</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'handler' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setActiveTab('handler');
          }}
        >
          <Users className="tab-icon" />
          <span className="tab-text">Handler</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setActiveTab('favorites');
          }}
        >
          <Heart className="tab-icon" />
          <span className="tab-text">Favorites</span>
        </button>
      </div>

      {/* Enhanced Entry List Section */}
      <div className="entry-list">
        {activeTab === 'favorites' && getFilteredEntries().length === 0 ? (
          <div className="no-favorites">
            <Heart className="no-favorites-icon" />
            <h3>No Favorites Yet</h3>
            <p>Tap the heart icon on any dog to add them to your favorites</p>
          </div>
        ) : (
          <>
            <div className="entry-list-header">
              <h3 className="entry-list-title">Dogs Entered</h3>
              <span className="entry-count">
                {getFilteredEntries().length}
              </span>
            </div>
            
            <div className="entry-grid">
              {getFilteredEntries().map((entry) => {
                return (
                  <div 
                    key={entry.armband}
                    className="entry-card"
                    onClick={() => handleDogClick(entry.armband)}
                  >
                    <div className="entry-content">
                      {/* Prominent Armband */}
                      <div className="entry-armband">
                        <div className="armband-badge">
                          {entry.armband}
                        </div>
                      </div>
                      
                      {/* Dog Details */}
                      <div className="entry-details">
                        <h4 className="entry-name">{entry.call_name}</h4>
                        <p className="entry-breed">{entry.breed}</p>
                        <p className="entry-handler">{entry.handler}</p>
                        {entry.class_name && (
                          <p className="entry-class">{entry.class_name}</p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="entry-actions">
                        <button
                          type="button"
                          className={`favorite-button ${entry.is_favorite ? 'favorited' : ''}`}
                          onClick={(e) => {
                            console.log('🚨 Dog heart button clicked! Armband:', entry.armband, 'Target:', e.target);
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            toggleFavorite(entry.armband);
                            return false;
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          style={{ zIndex: 15 }}
                        >
                          <Heart className="favorite-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
};