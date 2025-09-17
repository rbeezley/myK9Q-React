import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './TVDashboard.css';
import './styles/glassmorphism.css';
import './styles/animations.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardSkeleton, LoadingSpinner as _LoadingSpinner } from './components/LoadingStates';
import { TVHeader } from './components/TVHeader';
import { TVTicker } from './components/TVTicker';
import { ElementProgress as _ElementProgress } from './components/ElementProgress';
import { ElementProgressEnhanced } from './components/ElementProgress-Enhanced';
import { ConnectionStatus } from './components/ConnectionStatus';
import { CurrentStatus } from './components/CurrentStatus';
import { YesterdayHighlights as _YesterdayHighlights } from './components/YesterdayHighlights';
import { YesterdayHighlightsEnhanced } from './components/YesterdayHighlights-Enhanced';
import { JudgeSpotlight } from './components/JudgeSpotlight';
// import { BreedStatistics } from './components/BreedStatistics'; // Temporarily disabled due to syntax error
import { ChampionshipChase as _ChampionshipChase } from './components/ChampionshipChase';
import { ChampionshipChaseEnhanced } from './components/ChampionshipChase-Enhanced';
import { StateParticipation } from './components/StateParticipation';
import { DailyResults } from './components/DailyResults';
import { RotationDots } from './components/RotationDots';
import { useTVData } from './hooks/useTVData';
import { rotationScheduler, ROTATION_CONFIGS } from './utils/rotationScheduler';
import './components/YesterdayHighlights.css';
import './components/JudgeSpotlight.css';
// import './components/BreedStatistics.css'; // Temporarily disabled due to syntax error
import './components/ChampionshipChase.css';
import './components/StateParticipation.css';
import './components/SmartRotation.css';
import './components/RotationDots.css';
import './components/DailyResults.css';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TVDashboardProps {
  // Future: May add props for customization
}

type ContentPanel = 'highlights' | 'judges' | 'breeds' | 'championship' | 'states' | 'daily';

export const TVDashboard: React.FC<TVDashboardProps> = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPanel, setCurrentPanel] = useState<ContentPanel>('highlights');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [_eventDay, setEventDay] = useState<number>(1);
  const [isContentRotationEnabled, setIsContentRotationEnabled] = useState(true);
  const currentPanelRef = useRef<ContentPanel>('highlights');

  // Keep ref in sync with state
  useEffect(() => {
    currentPanelRef.current = currentPanel;
  }, [currentPanel]);

  // Content panels configuration
  const contentPanels = [
    { id: 'highlights', label: 'Today\'s Competition', component: 'YesterdayHighlights' },
    { id: 'daily', label: 'Daily Results', component: 'DailyResults' },
    { id: 'judges', label: 'Judge Spotlight', component: 'JudgeSpotlight' },
    { id: 'championship', label: 'Championship Chase', component: 'ChampionshipChase' },
    { id: 'states', label: 'State Participation', component: 'StateParticipation' }
  ];

  const currentContentIndex = contentPanels.findIndex(panel => panel.id === currentPanel);

  // Content rotation control handlers
  const handleContentPanelSelect = (index: number) => {
    const selectedPanel = contentPanels[index];
    if (selectedPanel) {
      setCurrentPanel(selectedPanel.id as ContentPanel);
      currentPanelRef.current = selectedPanel.id as ContentPanel;
    }
  };

  const handleToggleContentRotation = () => {
    const newState = !isContentRotationEnabled;
    setIsContentRotationEnabled(newState);
    if (newState) {
      rotationScheduler.start();
    } else {
      rotationScheduler.stop();
    }
  };
  
  // Get real-time TV dashboard data
  const {
    classes,
    entries,
    inProgressClasses,
    currentClass,
    currentEntry,
    nextEntries,
    showInfo,
    isConnected,
    lastUpdated,
    error,
  } = useTVData({
    licenseKey: licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604',
    enablePolling: true,
    pollingInterval: 30000
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize smart rotation scheduler
  useEffect(() => {
    // Determine event day (for demo purposes, cycle through days)
    const currentHour = new Date().getHours();
    const dayOfEvent = currentHour < 8 ? 1 : currentHour < 16 ? 2 : 3;
    setEventDay(dayOfEvent);

    // Select appropriate rotation configuration
    const config = dayOfEvent === 3 ? ROTATION_CONFIGS.finals : 
                  currentHour >= 18 ? ROTATION_CONFIGS.evening : 
                  ROTATION_CONFIGS.preliminary;

    // Initialize rotation scheduler with mutable array
    rotationScheduler.initialize([...config]);

    // Subscribe to rotation changes
    const unsubscribe = rotationScheduler.subscribe((state) => {
      if (state.currentItem) {
        const componentMap: Record<string, ContentPanel> = {
          'YesterdayHighlights': 'highlights',
          'DailyResults': 'daily',
          'JudgeSpotlight': 'judges',
          'BreedStatistics': 'breeds',
          'ChampionshipChase': 'championship',
          'StateParticipation': 'states'
        };
        
        const newPanel = componentMap[state.currentItem.component];
        const currentPanelValue = currentPanelRef.current;
        if (newPanel && newPanel !== currentPanelValue) {
          currentPanelRef.current = newPanel;
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentPanel(newPanel);
            setIsTransitioning(false);
          }, 300);
        }
      }
    });

    // Start rotation
    rotationScheduler.start();

    return () => {
      unsubscribe();
      rotationScheduler.stop();
    };
  }, [licenseKey]); // Remove currentPanel dependency to avoid infinite re-renders

  // Auto-hide cursor after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const hideCursor = () => {
      document.body.style.cursor = 'none';
    };
    
    const showCursor = () => {
      document.body.style.cursor = 'default';
      clearTimeout(timeout);
      timeout = setTimeout(hideCursor, 3000);
    };

    // Initial setup
    showCursor();

    // Event listeners for mouse movement
    document.addEventListener('mousemove', showCursor);
    document.addEventListener('keydown', showCursor);

    return () => {
      document.removeEventListener('mousemove', showCursor);
      document.removeEventListener('keydown', showCursor);
      clearTimeout(timeout);
      document.body.style.cursor = 'default';
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading state while data is being fetched
  if (!isConnected && !error && classes.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="tv-dashboard animate-fade-in-blur app-container-wide">

      <div className="glass-header animate-slide-in-top">
        <TVHeader
          currentTime={currentTime}
          formatTime={formatTime}
          formatDate={formatDate}
          showInfo={showInfo}
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          error={error}
        />
      </div>

      {/* Main Content Area */}
      <main className="tv-main">
        <div className="tv-content-grid">
          <div className="glass-panel animate-slide-in-left">
            <CurrentStatus 
              currentClass={currentClass}
              currentEntry={currentEntry}
              nextEntries={nextEntries}
              classes={classes}
              inProgressClasses={inProgressClasses}
              entries={entries}
            />
          </div>


          {/* Dynamic Content Panel with Smart Rotation */}
          <section className={`content-panel glass-panel animate-slide-in-right ${isTransitioning ? 'transitioning animate-panel-fade-out' : 'animate-panel-fade-in'}`}>
            {/* Content Rotation Dots */}
            <RotationDots
              items={contentPanels}
              currentIndex={currentContentIndex}
              isRotationEnabled={isContentRotationEnabled}
              onItemSelect={handleContentPanelSelect}
              onToggleRotation={handleToggleContentRotation}
            />
            {currentPanel === 'highlights' && (
              <YesterdayHighlightsEnhanced
                licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
                allowLiveScores={false}
              />
            )}
            {currentPanel === 'daily' && (
              <DailyResults
                licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
              />
            )}
            {currentPanel === 'judges' && (
              <JudgeSpotlight
                licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
                rotationInterval={30000}
              />
            )}
            {/* currentPanel === 'breeds' && (
              <BreedStatistics 
                licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
                showTopCount={8}
              />
            ) */}
            {currentPanel === 'championship' && (
              <ChampionshipChaseEnhanced
                licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
                showCount={20}
                allowLiveScores={false}
              />
            )}
            {currentPanel === 'states' && (
              <StateParticipation 
                licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
                showMapView={true}
              />
            )}
          </section>
        </div>
      </main>

      <div className="glass-card animate-slide-in-bottom">
        <ElementProgressEnhanced
          licenseKey={licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}
          layout="grid"
          allowLiveScores={false}
        />
      </div>

      <TVTicker />
      </div>
    </ErrorBoundary>
  );
};

export default TVDashboard;