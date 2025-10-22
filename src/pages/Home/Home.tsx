import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import { useStaleWhileRevalidate } from '../../hooks/useStaleWhileRevalidate';
import { usePrefetch } from '@/hooks/usePrefetch';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu, HeaderTicker, ArmbandBadge, TrialDateBadge, RefreshIndicator, ErrorState, PullToRefresh, FloatingActionButton, InstallPrompt } from '../../components/ui';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { RefreshCw, Heart, Calendar, Users2, ChevronDown, Search, X, ArrowUpDown, ArrowUp } from 'lucide-react';
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
  show_id: number;
  trial_name: string;
  trial_date: string;
  trial_number: number;
  trial_type: string;
  classes_completed: number;
  classes_total: number;
  entries_completed: number;
  entries_total: number;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { showContext, logout: _logout, role } = useAuth();
  const { hasPermission: _hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const { prefetch } = usePrefetch();
  const { settings } = useSettingsStore();

  // Search, sort, and filter state
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'armband' | 'name' | 'handler'>('armband');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites'>('all');

  // Use stale-while-revalidate for instant loading from cache
  const {
    data: cachedData,
    isStale: _isStale,
    isRefreshing,
    error: fetchError,
    refresh
  } = useStaleWhileRevalidate<{
    entries: EntryData[];
    trials: TrialData[];
  }>(
    `home-dashboard-${showContext?.licenseKey}`,
    async () => {
      return await fetchDashboardData();
    },
    {
      ttl: 60000, // 1 minute cache
      fetchOnMount: true,
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  // Local state for data (synced from cache)
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [favoriteDogs, setFavoriteDogs] = useState<Set<number>>(new Set());
  const [dogFavoritesLoaded, setDogFavoritesLoaded] = useState(false);

  // Virtual scrolling ref
  const parentRef = useRef<HTMLDivElement>(null);

  // Optimistic update hook for favorites
  const { update: _performOptimisticUpdate } = useOptimisticUpdate();

  // Calculate number of columns based on viewport width
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setColumnCount(3); // Desktop: 3 columns
      } else if (width >= 768) {
        setColumnCount(2); // Tablet: 2 columns
      } else {
        setColumnCount(1); // Mobile: 1 column
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Sync cached data with local state
  useEffect(() => {
    if (cachedData) {
      setTrials(cachedData.trials);

      // Apply favorites to entries before setting state
      const entriesWithFavorites = cachedData.entries.map(entry => ({
        ...entry,
        is_favorite: favoriteDogs.has(entry.armband)
      }));

      setEntries(entriesWithFavorites);
    }
  }, [cachedData, favoriteDogs]);

  // Load dog favorites from localStorage
  useEffect(() => {
    const loadDogFavorites = () => {
      try {
        const favoritesKey = `dog_favorites_${showContext?.licenseKey || 'default'}`;
        logger.log('🐕 Loading dog favorites with key:', favoritesKey);
        const savedFavorites = localStorage.getItem(favoritesKey);
        logger.log('🐕 Raw localStorage value for dog favorites:', savedFavorites);
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites) as number[];
          // Validate the data is an array of numbers
          if (Array.isArray(favoriteIds) && favoriteIds.every(id => typeof id === 'number')) {
            logger.log('🐕 Setting favoriteDogs from localStorage:', favoriteIds);
            setFavoriteDogs(new Set(favoriteIds));
          } else {
            logger.warn('🐕 Invalid dog favorites data in localStorage, clearing it');
            localStorage.removeItem(favoritesKey);
            setFavoriteDogs(new Set());
          }
        } else {
          logger.log('🐕 No saved dog favorites found');
          setFavoriteDogs(new Set());
        }
        setDogFavoritesLoaded(true);
      } catch (error) {
        logger.error('Error loading dog favorites from localStorage:', error);
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
        logger.log('🐕 Saving dog favorites to localStorage:', favoritesKey, favoriteIds);
        localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds));
        logger.log('🐕 Saved dog favorites successfully');
      } catch (error) {
        logger.error('Error saving dog favorites to localStorage:', error);
      }
    } else {
      logger.log('🐕 Not saving dog favorites - not loaded yet:', { licenseKey: showContext?.licenseKey, dogFavoritesLoaded, size: favoriteDogs.size });
    }
  }, [favoriteDogs, showContext?.licenseKey, dogFavoritesLoaded]);

  const fetchDashboardData = useCallback(async (): Promise<{ entries: EntryData[]; trials: TrialData[] }> => {
    try {
      logger.log('🔍 Show context:', showContext);
      logger.log('🔍 Show ID:', showContext?.showId);
      logger.log('🔍 License key:', showContext?.licenseKey);

      // Load trials with progress
      const { data: trialsData, error: trialsError } = await supabase
        .from('trials')
        .select('*')
        .eq('show_id', showContext?.showId);

      if (trialsError) {
        logger.error('❌ Error loading trials:', trialsError);
        logger.error('❌ Show ID used:', showContext?.showId);
        logger.error('❌ License key:', showContext?.licenseKey);
      } else {
        logger.log('✅ Trials data loaded:', trialsData);
        logger.log('✅ Number of trials found:', trialsData?.length || 0);
      }

      // Load entries from the normalized view
      const { data: entriesData, error: entriesError } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', showContext?.licenseKey)
        .order('armband', { ascending: true });

      if (entriesError) {
        logger.error('Error loading entries:', entriesError);
      }

      let processedTrials: TrialData[] = [];

      // Process trials with counts - OPTIMIZED to reduce database queries
      if (trialsData && trialsData.length > 0) {
        const trialIds = trialsData.map(t => t.id);

        // Fetch all classes for all trials in ONE query
        const { data: allClasses } = await supabase
          .from('classes')
          .select('id, trial_id, is_completed')
          .in('trial_id', trialIds);

        // Group classes by trial_id
        const classesByTrial = new Map<number, typeof allClasses>();
        allClasses?.forEach(cls => {
          if (!classesByTrial.has(cls.trial_id)) {
            classesByTrial.set(cls.trial_id, []);
          }
          classesByTrial.get(cls.trial_id)!.push(cls);
        });

        // Get all class IDs for entry counting
        const allClassIds = allClasses?.map(c => c.id) || [];

        // Fetch entry counts for all classes in ONE query
        const { data: allEntries } = await supabase
          .from('entries')
          .select('id, class_id')
          .in('class_id', allClassIds);

        // Fetch scored results for all entries in ONE query
        const entryIds = allEntries?.map(e => e.id) || [];
        const { data: scoredResults } = entryIds.length > 0 ? await supabase
          .from('results')
          .select('entry_id')
          .in('entry_id', entryIds)
          .eq('is_scored', true) : { data: [] };

        const scoredEntryIds = new Set(scoredResults?.map(r => r.entry_id) || []);

        // Process trials with the data we already have
        processedTrials = trialsData.map(trial => {
          const trialClasses = classesByTrial.get(trial.id) || [];
          const totalClasses = trialClasses.length;
          const completedClasses = trialClasses.filter(c => c.is_completed).length;

          const classIds = trialClasses.map(c => c.id);
          const trialEntries = allEntries?.filter(e => classIds.includes(e.class_id)) || [];
          const totalEntries = trialEntries.length;
          const completedEntries = trialEntries.filter(e => scoredEntryIds.has(e.id)).length;

          return {
            ...trial,
            classes_completed: completedClasses,
            classes_total: totalClasses,
            entries_completed: completedEntries,
            entries_total: totalEntries
          };
        });
      }

      // Process entries - get unique dogs by armband
      let processedEntries: EntryData[] = [];
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
              is_favorite: false, // Will be updated by useEffect after favorites load
              class_name: entry.class_name,
              is_scored: entry.is_scored
            });
          }
        });

        processedEntries = Array.from(uniqueDogs.values());
        logger.log('🐕 Processed entries with armbands:', processedEntries.map(e => e.armband));
        logger.log('🐕 Entries with favorites:', processedEntries.map(e => `${e.armband}:${e.is_favorite}`));
      }

      return { entries: processedEntries, trials: processedTrials };
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
      return { entries: [], trials: [] };
    }
  }, [showContext?.showId, showContext?.licenseKey]);

  // Data is loaded via useStaleWhileRevalidate hook - no manual loading needed

  const handleRefresh = useCallback(async () => {
    hapticFeedback.medium();
    await refresh();
  }, [refresh, hapticFeedback]);

  const toggleFavorite = useCallback((armband: number) => {
    logger.log('🐕 toggleFavorite called for armband:', armband);
    hapticFeedback.light();
    
    // Update the favoriteDogs set for localStorage persistence
    setFavoriteDogs(prev => {
      const newFavorites = new Set(prev);
      const wasAlreadyFavorite = newFavorites.has(armband);
      
      if (wasAlreadyFavorite) {
        newFavorites.delete(armband);
        logger.log('🐕 Removing from dog favorites:', armband);
      } else {
        newFavorites.add(armband);
        logger.log('🐕 Adding to dog favorites:', armband);
      }
      logger.log('🐕 New dog favorites set:', Array.from(newFavorites));
      return newFavorites;
    });
  }, [hapticFeedback]);
  
  const handleDogClick = (armband: number) => {
    hapticFeedback.light();
    navigate(`/dog/${armband}`);
  };

  // Prefetch trial class data when hovering/touching trial card
  const handleTrialPrefetch = useCallback(async (trialId: number) => {
    if (!showContext?.showId || !showContext?.licenseKey) return;

    await prefetch(
      `trial-classes-${trialId}`,
      async () => {
        // Fetch classes for this trial
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('trial_id', trialId)
          .order('class_order');

        logger.log('📡 Prefetched trial classes:', trialId, classData?.length || 0);
        return classData || [];
      },
      {
        ttl: 60, // 1 minute cache
        priority: 2 // Medium priority
      }
    );
  }, [showContext?.showId, showContext?.licenseKey, prefetch]);

  const getFilteredEntries = () => {
    // First filter by favorites if needed
    let filtered = entries;
    if (filterBy === 'favorites') {
      filtered = entries.filter(e => e.is_favorite);
    }

    // Then filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.call_name.toLowerCase().includes(search) ||
        entry.breed.toLowerCase().includes(search) ||
        entry.handler.toLowerCase().includes(search)
      );
    }

    // Finally sort by selected method
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.call_name.localeCompare(b.call_name));
      case 'handler':
        return sorted.sort((a, b) => a.handler.localeCompare(b.handler));
      case 'armband':
      default:
        return sorted.sort((a, b) => a.armband - b.armband);
    }
  };

  // Get filtered entries for virtualization
  const filteredEntries = getFilteredEntries();

  // Calculate row count based on columns
  const rowCount = Math.ceil(filteredEntries.length / columnCount);

  // Virtual scrolling setup - virtualize ROWS, not individual items
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual intentionally returns functions that cannot be memoized
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 105, // Estimated height of each ROW (card height + gap)
    overscan: 5, // Render 5 extra rows above/below viewport for smoother scrolling
  });

  return (
    <div className="home-container page-container">
      {/* Enhanced Header with Glass Morphism */}
      <header className="home-header">
        <HamburgerMenu currentPage="home" />

        <div className="header-center">
          <h1>Home</h1>
        </div>

        <div className="header-buttons">
          {/* Background refresh indicator */}
          {isRefreshing && <RefreshIndicator isRefreshing={isRefreshing} />}

          <button
            className={`icon-button ${isRefreshing ? 'rotating' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION START ===== */}
      <HeaderTicker />
      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION END ===== */}

      {/* PWA Install Prompt - Only shown to exhibitors with favorited dogs */}
      {role === 'exhibitor' && favoriteDogs.size > 0 && settings.enableNotifications && (
        <div style={{ padding: '0 1rem', marginTop: '0.5rem' }}>
          <InstallPrompt
            mode="banner"
            showNotificationBenefit={true}
            favoritedCount={favoriteDogs.size}
          />
        </div>
      )}

      {/* Show info moved to hamburger menu for maximum screen space */}

      {/* Pull to Refresh Wrapper */}
      <PullToRefresh
        onRefresh={handleRefresh}
        enabled={settings.pullToRefresh}
        threshold={settings.pullSensitivity === 'easy' ? 60 : settings.pullSensitivity === 'firm' ? 100 : 80}
      >
      {/* Enhanced Active Trials Section */}
      <div className="trials-section">
        <div className="trials-scroll">
          {trials.map((trial, index) => {
            const _hasActiveClasses = trial.classes_total > trial.classes_completed;

            // Determine trial status based on entry scoring (consistent with class statuses)
            const getTrialStatus = () => {
              if (trial.entries_completed === trial.entries_total && trial.entries_total > 0) {
                return 'completed'; // All entries scored
              } else if (trial.entries_completed > 0) {
                return 'active'; // Some entries scored = in-progress
              } else if (trial.entries_total > 0) {
                return 'upcoming'; // No entries scored yet but entries exist
              } else {
                return 'upcoming'; // No entries exist
              }
            };

            const trialStatus = getTrialStatus();

            return (
              <div
                key={trial.id}
                className={`trial-card ${trialStatus}`}
                onMouseEnter={() => handleTrialPrefetch(trial.id)}
                onTouchStart={() => handleTrialPrefetch(trial.id)}
                onClick={() => {
                  hapticFeedback.medium();
                  logger.log('Navigating to trial:', trial.id, 'id:', trial.id);
                  navigate(`/trial/${trial.id}/classes`);
                }}
              >
                <div className="trial-content">
                  {/* Trial Date and Number */}
                  <div className="trial-title">
                    <div className="trial-name-number">
                      <TrialDateBadge
                        date={trial.trial_date}
                        trialNumber={index + 1}
                        className="trial-icon"
                      />
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="trial-progress">
                    <div className="progress-row">
                      <Calendar size={14} />
                      <span>Classes Completed: {trial.classes_completed} of {trial.classes_total}</span>
                    </div>
                    <div className="progress-row">
                      <Users2 size={14} />
                      <span>Entries Scored: {trial.entries_completed} of {trial.entries_total}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Controls Header */}
      <div className="search-controls-header">
        <button
          className={`search-toggle-icon ${!isSearchCollapsed ? 'active' : ''}`}
          onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}
          aria-label={isSearchCollapsed ? "Show search and sort options" : "Hide search and sort options"}
          title={isSearchCollapsed ? "Show search and sort options" : "Hide search and sort options"}
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        <span className="search-controls-label">
          {searchTerm ? `Found ${getFilteredEntries().length} of ${entries.length} dogs` : 'Search, Sort & Favorites'}
        </span>
      </div>

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="search-results-header">
          <div className="search-results-summary">
            {getFilteredEntries().length} of {entries.length} dogs
          </div>
        </div>
      )}

      {/* Collapsible Search and Sort Container */}
      <div className={`search-sort-container ${isSearchCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search dog name, breed, handler..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-full"
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === 'armband' ? 'active' : ''}`}
            onClick={() => setSortBy('armband')}
          >
            <ArrowUpDown size={16} />
            Armband
          </button>
          <button
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => setSortBy('name')}
          >
            <ArrowUpDown size={16} />
            Dog
          </button>
          <button
            className={`sort-btn ${sortBy === 'handler' ? 'active' : ''}`}
            onClick={() => setSortBy('handler')}
          >
            <ArrowUpDown size={16} />
            Handler
          </button>
          <button
            className={`sort-btn favorites-btn ${filterBy === 'favorites' ? 'active' : ''}`}
            onClick={() => {
              hapticFeedback.light();
              setFilterBy(filterBy === 'favorites' ? 'all' : 'favorites');
            }}
            title="Favorites"
            aria-label="Favorites"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>

      {/* Enhanced Entry List Section */}
      <div className="entry-list">
        {fetchError ? (
          <ErrorState
            message={`Failed to load dashboard: ${fetchError.message || 'Please check your connection and try again.'}`}
            onRetry={handleRefresh}
            isRetrying={isRefreshing}
          />
        ) : !cachedData ? (
          <div className="loading-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-text skeleton-title"></div>
            </div>
            <div className="skeleton-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-card-content">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-info">
                      <div className="skeleton-text skeleton-name"></div>
                      <div className="skeleton-text skeleton-breed"></div>
                      <div className="skeleton-text skeleton-handler"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filterBy === 'favorites' && getFilteredEntries().length === 0 ? (
          <div className="no-favorites">
            <Heart className="no-favorites-icon" />
            <h3>No Favorites Yet</h3>
            <p>Tap the heart icon on any dog to add them to your favorites</p>
          </div>
        ) : (
          <>
            <div className="entry-list-header">
              <h3 className="entry-list-title">
                <span className="entry-count">
                  Dogs Entered: {filteredEntries.length}
                  {filteredEntries.length !== entries.length && ` (of ${entries.length} total)`}
                </span>
              </h3>
              <button
                className={`favorites-filter-btn ${filterBy === 'favorites' ? 'active' : ''}`}
                onClick={() => {
                  hapticFeedback.light();
                  setFilterBy(filterBy === 'favorites' ? 'all' : 'favorites');
                }}
                title={filterBy === 'favorites' ? 'Show all dogs' : 'Show only favorites'}
                aria-label={filterBy === 'favorites' ? 'Show all dogs' : 'Show only favorites'}
              >
                <Heart size={18} fill={filterBy === 'favorites' ? 'currentColor' : 'none'} />
                {filterBy === 'favorites' ? 'All Dogs' : 'Favorites'}
              </button>
            </div>

            {/* Virtual Scrolling Container */}
            <div
              ref={parentRef}
              className="entry-grid-virtual"
              style={{
                height: '600px',
                overflow: 'auto',
                contain: 'strict',
              }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  // Calculate which entries belong in this row
                  const startIndex = virtualRow.index * columnCount;
                  const endIndex = Math.min(startIndex + columnCount, filteredEntries.length);
                  const rowEntries = filteredEntries.slice(startIndex, endIndex);

                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                        gap: '1rem',
                        padding: '0.5rem 1rem 0.5rem 1rem',
                      }}
                    >
                      {rowEntries.map((entry) => (
                        <div
                          key={entry.armband}
                          className="entry-card"
                          onClick={() => handleDogClick(entry.armband)}
                        >
                          <div className="entry-content">
                            {/* Prominent Armband */}
                            <div className="entry-armband">
                              <ArmbandBadge number={entry.armband} />
                            </div>

                            {/* Dog Details */}
                            <div className="entry-details">
                              <h4 className="entry-name">{entry.call_name}</h4>
                              <p className="entry-breed">{entry.breed}</p>
                              <p className="entry-handler">{entry.handler}</p>
                            </div>

                            {/* Actions */}
                            <div className="entry-actions">
                              <button
                                type="button"
                                className={`favorite-button ${entry.is_favorite ? 'favorited' : ''}`}
                                onClick={(e) => {
                                  logger.log('🚨 Dog heart button clicked! Armband:', entry.armband, 'Target:', e.target);
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
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      </PullToRefresh>

      {/* Floating Action Button - Scroll to Top */}
      <FloatingActionButton
        icon={<ArrowUp />}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        ariaLabel="Scroll to top"
      />
    </div>
  );
};