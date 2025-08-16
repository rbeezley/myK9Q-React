import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, Button } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { RefreshCw, Home as HomeIcon, MessageSquare, Calendar, Settings, Download, Heart, User, Hash, Users } from 'lucide-react';
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
  const { showContext, logout, role } = useAuth();
  const { hasPermission: _hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<'armband' | 'name' | 'handler' | 'favorites'>('armband');
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [_isLoading, _setIsLoading] = useState(true);
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
            .eq('trialid_fk', trial.trialid);

          // Get completed class counts (assuming classes with all entries scored)
          const { count: completedClasses } = await supabase
            .from('tbl_class_queue')
            .select('*', { count: 'exact', head: true })
            .eq('mobile_app_lic_key', showContext?.licenseKey)
            .eq('trial_id', trial.id)
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
      _setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.impact('medium');
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleFavorite = (armband: number) => {
    hapticFeedback.impact('light');
    setEntries(prev => prev.map(entry => 
      entry.armband === armband 
        ? { ...entry, is_favorite: !entry.is_favorite }
        : entry
    ));
  };
  
  const handleDogClick = (armband: number) => {
    hapticFeedback.impact('light');
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-background'}`}>
      {/* Header with outdoor-ready contrast */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-11 w-11 rounded-xl transition-all duration-300 hover:bg-muted/20 active:scale-95"
          >
            <HomeIcon className="h-5 w-5 text-foreground" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Dashboard
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-11 w-11 rounded-xl transition-all duration-300 hover:bg-muted/20 active:scale-95"
          >
            <RefreshCw className={`h-5 w-5 text-foreground transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Show Info Card with Glass Morphism */}
      <div className="p-4">
        <Card className="backdrop-blur-xl bg-card/80 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-500">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {showContext?.clubName}
            </h2>
            <p className="text-base text-muted-foreground mb-1">
              {showContext?.showName}
            </p>
            <p className="text-sm text-muted-foreground/80">
              Logged in as: <span className="font-medium text-foreground">{role}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Cards with Orange Glow for Active */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Active Trials
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trials.map((trial) => {
            const hasActiveClasses = trial.classes_total > trial.classes_completed;
            return (
              <Card 
                key={trial.id}
                className={`min-w-[280px] cursor-pointer group transition-all duration-500 backdrop-blur-xl border border-border/30 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 active:scale-98 ${
                  hasActiveClasses 
                    ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 shadow-orange-500/20' 
                    : 'bg-card/80'
                }`}
                onClick={() => {
                  hapticFeedback.impact('medium');
                  navigate(`/trial/${trial.trialid}/classes`);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {trial.trial_name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        {trial.trial_date}
                      </p>
                      <p className="text-xs text-muted-foreground/80 uppercase tracking-wide">
                        {trial.trial_type}
                      </p>
                    </div>
                    {hasActiveClasses && (
                      <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
                        Classes
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {trial.classes_completed} / {trial.classes_total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
                        Entries
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {trial.entries_completed} / {trial.entries_total}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Entry Tabs with Apple-inspired Design */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1 grid grid-cols-4 gap-1">
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'armband'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setActiveTab('armband');
            }}
          >
            <Hash className="h-4 w-4" />
            <span className="hidden sm:inline">Armband</span>
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'name'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setActiveTab('name');
            }}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Name</span>
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'handler'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setActiveTab('handler');
            }}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Handler</span>
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setActiveTab('favorites');
            }}
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>
      </div>

      {/* Entry List with Glass Morphism */}
      <div className="px-4 pb-24">
        {activeTab === 'favorites' && getFilteredEntries().length === 0 ? (
          <Card className="backdrop-blur-xl bg-card/80 border border-border/30">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Favorites Yet
              </h3>
              <p className="text-muted-foreground">
                Tap the heart icon on any dog to add them to your favorites
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Dogs Entered
              </h3>
              <span className="text-sm font-medium text-muted-foreground bg-muted/20 px-3 py-1 rounded-full">
                {getFilteredEntries().length}
              </span>
            </div>
            
            <div className="space-y-3">
              {getFilteredEntries().map((entry) => {
                const hasScore = entry.is_scored;
                return (
                  <Card 
                    key={entry.armband}
                    className={`cursor-pointer group transition-all duration-300 backdrop-blur-xl border border-border/30 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 ${
                      hasScore 
                        ? 'bg-gradient-to-br from-green-500/10 to-green-600/5' 
                        : 'bg-card/80'
                    }`}
                    onClick={() => handleDogClick(entry.armband)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Prominent Armband */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {entry.armband}
                            </span>
                          </div>
                        </div>
                        
                        {/* Dog Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {entry.call_name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-0.5">
                            {entry.breed}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            {entry.handler}
                          </p>
                          {entry.class_name && (
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {entry.class_name}
                            </p>
                          )}
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex items-center gap-3">
                          {hasScore && (
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(entry.armband);
                            }}
                            className="h-11 w-11 rounded-xl hover:bg-muted/20 active:scale-95"
                          >
                            <Heart 
                              className={`h-5 w-5 transition-colors ${
                                entry.is_favorite 
                                  ? 'text-red-500 fill-red-500' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`} 
                            />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation with Outdoor-Ready Design */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-t border-border/30">
        <div className="flex items-center justify-around h-20 px-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl bg-primary/10 text-primary"
            onClick={() => navigate('/home')}
          >
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/announcements')}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs font-medium">News</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs font-medium">Calendar</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs font-medium">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};