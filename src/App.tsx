import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScoresheetErrorBoundary } from './components/ScoresheetErrorBoundary';
import { PageLoader, ScoresheetLoader } from './components/LoadingSpinner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OfflineIndicator, OfflineQueueStatus, AutoLogoutWarning } from './components/ui';
import { MonitoringDashboard, PerformanceMonitor, NetworkInspector, StateInspector } from './components/monitoring';
import { SubscriptionMonitor } from './components/debug/SubscriptionMonitor';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ToastContainer } from './components/notifications/ToastContainer';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { applyDeviceClasses, startPerformanceMonitoring } from './utils/deviceDetection';
import developerModeService from './services/developerMode';
import { initializeSettings } from './stores/settingsStore';
import { performanceMonitor } from './services/performanceMonitor';
import { analyticsService } from './services/analyticsService';
import { metricsApiService } from './services/metricsApiService';
import { useSettingsStore } from './stores/settingsStore';
import { useOneHandedMode } from './hooks/useOneHandedMode';
import { useAutoLogout } from './hooks/useAutoLogout';
import { usePushNotificationAutoSwitch } from './hooks/usePushNotificationAutoSwitch';
import { useOfflineQueueProcessor } from './hooks/useOfflineQueueProcessor';
import { useServiceWorkerMessages } from './hooks/useServiceWorkerMessages';
import { useAuth } from './contexts/AuthContext';
import { notificationIntegration } from './services/notificationIntegration';
import { scheduleAutoCleanup } from './utils/cacheManager';
import { subscriptionCleanup } from './services/subscriptionCleanup';
import { DatabaseRecovery } from './components/diagnostics/DatabaseRecovery';
import './utils/quickRecovery'; // Auto-setup recovery functions
// memoryLeakDetector auto-starts via its module initialization (dev mode only)

// Import unified container system
import './styles/containers.css';

// Eager load critical components
import { Login } from './pages/Login/Login';
import { Landing } from './pages/Landing/Landing';
import { DatabaseTest } from './components/DatabaseTest';
import { TestConnections } from './pages/TestConnections'; // Temporary for Phase 1.3
import { MigrationTest } from './pages/MigrationTest/MigrationTest'; // Migration testing

// Lazy load pages for code splitting
const Home = React.lazy(() => import('./pages/Home/Home').then(module => ({ default: module.Home })));
const DogDetails = React.lazy(() => import('./pages/DogDetails/DogDetails').then(module => ({ default: module.DogDetails })));
const ClassList = React.lazy(() => import('./pages/ClassList/ClassList').then(module => ({ default: module.ClassList })));
const EntryList = React.lazy(() => import('./pages/EntryList/EntryList'));
const CombinedEntryList = React.lazy(() => import('./pages/EntryList/CombinedEntryList'));
const Announcements = React.lazy(() => import('./pages/Announcements/Announcements').then(module => ({ default: module.Announcements })));
const TVRunOrder = React.lazy(() => import('./pages/TVRunOrder/TVRunOrder').then(module => ({ default: module.TVRunOrder })));
const CompetitionAdmin = React.lazy(() => import('./pages/Admin/CompetitionAdmin').then(module => ({ default: module.CompetitionAdmin })));
const StatusPopupDemo = React.lazy(() => import('./demo/StatusPopupDemo'));

// Lazy load scoresheets (grouped by organization for better chunking)
const UKCObedienceScoresheet = React.lazy(() =>
  import('./pages/scoresheets/UKC/UKCObedienceScoresheet').then(module => ({
    default: module.UKCObedienceScoresheet
  }))
);
const UKCRallyScoresheet = React.lazy(() =>
  import('./pages/scoresheets/UKC/UKCRallyScoresheet').then(module => ({
    default: module.UKCRallyScoresheet
  }))
);
const UKCNoseworkScoresheet = React.lazy(() =>
  import('./pages/scoresheets/UKC/UKCNoseworkScoresheet').then(module => ({
    default: module.UKCNoseworkScoresheet
  }))
);
const AKCScentWorkScoresheetRouter = React.lazy(() =>
  import('./pages/scoresheets/AKC/AKCScentWorkScoresheetRouter').then(module => ({
    default: module.AKCScentWorkScoresheetRouter
  }))
);
const AKCFastCatScoresheet = React.lazy(() =>
  import('./pages/scoresheets/AKC/AKCFastCatScoresheet').then(module => ({
    default: module.AKCFastCatScoresheet
  }))
);
const ASCAScentDetectionScoresheet = React.lazy(() =>
  import('./pages/scoresheets/ASCA/ASCAScentDetectionScoresheet').then(module => ({
    default: module.ASCAScentDetectionScoresheet
  }))
);
const TestScoresheet = React.lazy(() =>
  import('./components/TestScoresheet').then(module => ({
    default: module.TestScoresheet
  }))
);
const NationalsWireframe = React.lazy(() =>
  import('./components/wireframes/NationalsWireframe').then(module => ({
    default: module.NationalsWireframe
  }))
);
const Settings = React.lazy(() =>
  import('./pages/Settings/Settings').then(module => ({
    default: module.Settings
  }))
);
const Stats = React.lazy(() =>
  import('./pages/Stats/Stats').then(module => ({
    default: module.Stats
  }))
);
const PerformanceMetricsAdmin = React.lazy(() =>
  import('./pages/Admin/PerformanceMetricsAdmin').then(module => ({
    default: module.PerformanceMetricsAdmin
  }))
);
const AuditLog = React.lazy(() =>
  import('./pages/Admin/AuditLog').then(module => ({
    default: module.default
  }))
);

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
      retry: 1,                  // Retry once on failure
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      networkMode: 'always',     // Always run queries, even when offline (will use cached data)
    },
  },
});

// Create persister for React Query cache (stores to localStorage)
// This enables offline access to all React Query data
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'myK9Q-react-query-cache',
});

// Hook to handle route changes and cleanup subscriptions
function useRouteChangeCleanup() {
  const location = useLocation();
  const previousLocation = React.useRef(location.pathname);

  useEffect(() => {
    const fromRoute = previousLocation.current;
    const toRoute = location.pathname;

    if (fromRoute !== toRoute) {
      // Clean up stale subscriptions on route change
      subscriptionCleanup.cleanupOnRouteChange(fromRoute, toRoute);

      // Track navigation for intelligent prefetching
      (async () => {
        const { getReplicationManager } = await import('./services/replication');
        const manager = getReplicationManager();
        if (manager) {
          manager.trackNavigation(toRoute);
        }
      })();

      previousLocation.current = toRoute;
    }
  }, [location.pathname]);
}

// Component that needs to be inside AuthProvider to use auth context
function AppWithAuth() {
  const { showContext } = useAuth();

  // Apply one-handed mode globally
  useOneHandedMode();

  // Apply auto-logout timer
  const autoLogout = useAutoLogout();

  // Auto-switch push notification subscription when license key changes
  usePushNotificationAutoSwitch(showContext?.licenseKey);

  // Handle service worker messages (notification clicks)
  useServiceWorkerMessages();

  // 🚀 OFFLINE-FIRST: Process offline queue when network returns
  // Automatically syncs pending scores to server when coming back online
  useOfflineQueueProcessor();

  // Clean up subscriptions on route changes
  useRouteChangeCleanup();

  // Initialize device detection and performance monitoring
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    let cancelled = false;

    if (!cancelled) {
      // Initialize user settings (theme, font size, density, etc.)
      initializeSettings();

      // Replication handles all data caching and pending changes
    }

    // Apply device-specific CSS classes
    applyDeviceClasses();

    // Start monitoring performance and auto-adjust if needed
    const stopMonitoring = startPerformanceMonitoring();

    // Initialize performance and analytics monitoring
    performanceMonitor.setEnabled(true);
    analyticsService.setEnabled(true);

    // Track initial page view
    analyticsService.trackPageView(window.location.pathname);

    // Initialize notification integration
    notificationIntegration.initialize();

    // Initialize developer tools
    developerModeService.initialize();

    // Schedule auto-cleanup of old cached data (runs daily)
    scheduleAutoCleanup();

    // Replication handles garbage collection of pending mutations

    // 🧹 Start auto-cleanup for subscriptions (checks every 30 minutes)
    const stopAutoCleanup = subscriptionCleanup.startAutoCleanup(30);

    // 🔍 Start memory leak detection (development only, auto-starts via memoryLeakDetector.ts)
    // The detector will warn in console if memory grows abnormally

    // Send performance report on page unload (if monitoring enabled and has problems)
    const handleBeforeUnload = async () => {
      const { settings } = useSettingsStore.getState();

      if (settings.enablePerformanceMonitoring) {
        // Smart batching: only send if there are errors or poor performance
        if (performanceMonitor.hasProblems()) {
          const report = performanceMonitor.generateReport();
          // Note: License key would need to come from auth context for proper implementation
          // For now, send with generic ID
          await metricsApiService.sendPerformanceReport(report, 'unknown');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      stopMonitoring();
      stopAutoCleanup();
      notificationIntegration.destroy();
      subscriptionCleanup.cleanupAll(); // Final cleanup on app unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <>
      {/* PWA Install Banner - Smart banner that auto-hides when installed */}
      <PWAInstallBanner />

      {/* Database recovery component (shows only when corruption detected) */}
      <DatabaseRecovery />

      {/* Auto-logout warning modal */}
      {autoLogout.showWarning && (
        <AutoLogoutWarning
          secondsRemaining={autoLogout.secondsRemaining}
          onExtend={autoLogout.extendSession}
          onLogoutNow={autoLogout.logoutNow}
          onDismiss={autoLogout.dismissWarning}
        />
      )}

      {/* In-App Notifications */}
      <ToastContainer />
      <NotificationCenter />

      <OfflineIndicator />
      <OfflineQueueStatus />
      <MonitoringDashboard />

      {/* Developer Tools (only in development mode) */}
      <PerformanceMonitor />
      <NetworkInspector />
      <StateInspector />
      <SubscriptionMonitor />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
                <Home />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dog/:armband"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading dog details..." />}>
                <DogDetails />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trial/:trialId/classes"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading classes..." />}>
                <ClassList />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class/:classId/entries"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading entries..." />}>
                <EntryList />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class/:classIdA/:classIdB/entries/combined"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading combined entries..." />}>
                <CombinedEntryList />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading announcements..." />}>
                <Announcements />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading settings..." />}>
                <Settings />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading statistics..." />}>
                <Stats />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats/trial/:trialId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading trial statistics..." />}>
                <Stats />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats/trial/:trialId/class/:classId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading class statistics..." />}>
                <Stats />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoresheet/ukc-obedience/:classId/:entryId"
          element={
            <ProtectedRoute>
              <ScoresheetErrorBoundary>
                <Suspense fallback={<ScoresheetLoader />}>
                  <UKCObedienceScoresheet />
                </Suspense>
              </ScoresheetErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoresheet/ukc-rally/:classId/:entryId"
          element={
            <ProtectedRoute>
              <ScoresheetErrorBoundary>
                <Suspense fallback={<ScoresheetLoader />}>
                  <UKCRallyScoresheet />
                </Suspense>
              </ScoresheetErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoresheet/ukc-nosework/:classId/:entryId"
          element={
            <ProtectedRoute>
              <ScoresheetErrorBoundary>
                <Suspense fallback={<ScoresheetLoader />}>
                  <UKCNoseworkScoresheet />
                </Suspense>
              </ScoresheetErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoresheet/akc-scent-work/:classId/:entryId"
          element={
            <ProtectedRoute>
              <ScoresheetErrorBoundary>
                <Suspense fallback={<ScoresheetLoader />}>
                  <AKCScentWorkScoresheetRouter />
                </Suspense>
              </ScoresheetErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/scoresheet"
          element={
            <ScoresheetErrorBoundary>
              <Suspense fallback={<ScoresheetLoader />}>
                <TestScoresheet />
              </Suspense>
            </ScoresheetErrorBoundary>
          }
        />
        <Route
          path="/wireframe/nationals"
          element={
            <Suspense fallback={<PageLoader message="Loading wireframe..." />}>
              <NationalsWireframe />
            </Suspense>
          }
        />
        <Route
          path="/scoresheet/akc-fastcat/:classId/:entryId"
          element={
            <ProtectedRoute>
              <ScoresheetErrorBoundary>
                <Suspense fallback={<ScoresheetLoader />}>
                  <AKCFastCatScoresheet />
                </Suspense>
              </ScoresheetErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoresheet/asca-scent-detection/:classId/:entryId"
          element={
            <ProtectedRoute>
              <ScoresheetErrorBoundary>
                <Suspense fallback={<ScoresheetLoader />}>
                  <ASCAScentDetectionScoresheet />
                </Suspense>
              </ScoresheetErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="/debug" element={<DatabaseTest />} />
        <Route path="/test-connections" element={<TestConnections />} />
        <Route path="/migration-test" element={<MigrationTest />} />
        <Route
          path="/demo/status-popup"
          element={
            <Suspense fallback={<PageLoader message="Loading demo..." />}>
              <StatusPopupDemo />
            </Suspense>
          }
        />
        <Route
          path="/tv/:licenseKey"
          element={
            <Suspense fallback={<PageLoader message="Loading TV Display..." />}>
              <TVRunOrder />
            </Suspense>
          }
        />
        <Route
          path="/admin/:licenseKey"
          element={
            <Suspense fallback={<PageLoader message="Loading Competition Admin..." />}>
              <CompetitionAdmin />
            </Suspense>
          }
        />
        <Route
          path="/admin/metrics"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading Performance Metrics..." />}>
                <PerformanceMetricsAdmin />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:licenseKey/audit-log"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading Audit Log..." />}>
                <AuditLog />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Landing />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <AppWithAuth />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;