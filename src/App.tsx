import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScoresheetErrorBoundary } from './components/ScoresheetErrorBoundary';
import { PageLoader, ScoresheetLoader } from './components/LoadingSpinner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OfflineIndicator, DeviceDebugPanel, DeviceTierToast, AutoLogoutWarning } from './components/ui';
import { MonitoringDashboard, PerformanceMonitor, NetworkInspector, StateInspector } from './components/monitoring';
import { applyDeviceClasses, startPerformanceMonitoring } from './utils/deviceDetection';
import developerModeService from './services/developerMode';
import { initializeSettings } from './stores/settingsStore';
import { performanceMonitor } from './services/performanceMonitor';
import { analyticsService } from './services/analyticsService';
import { metricsApiService } from './services/metricsApiService';
import { useSettingsStore } from './stores/settingsStore';
import { useOneHandedMode } from './hooks/useOneHandedMode';
import { useAutoLogout } from './hooks/useAutoLogout';
import { notificationIntegration } from './services/notificationIntegration';

// Import unified container system
import './styles/containers.css';

// Eager load critical components
import { Login } from './pages/Login/Login';
import { DatabaseTest } from './components/DatabaseTest';

// Lazy load pages for code splitting
const Home = React.lazy(() => import('./pages/Home/Home').then(module => ({ default: module.Home })));
const DogDetails = React.lazy(() => import('./pages/DogDetails/DogDetails').then(module => ({ default: module.DogDetails })));
const ClassList = React.lazy(() => import('./pages/ClassList/ClassList').then(module => ({ default: module.ClassList })));
const EntryList = React.lazy(() => import('./pages/EntryList/EntryList').then(module => ({ default: module.EntryList })));
const CombinedEntryList = React.lazy(() => import('./pages/EntryList/CombinedEntryList').then(module => ({ default: module.CombinedEntryList })));
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
const AKCScentWorkScoresheet = React.lazy(() =>
  import('./pages/scoresheets/AKC/AKCScentWorkScoresheet-Enhanced')
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
const PerformanceMetricsAdmin = React.lazy(() =>
  import('./pages/Admin/PerformanceMetricsAdmin').then(module => ({
    default: module.PerformanceMetricsAdmin
  }))
);

// Component that needs to be inside AuthProvider to use auth context
function AppWithAuth() {
  // Apply one-handed mode globally
  useOneHandedMode();

  // Apply auto-logout timer
  const autoLogout = useAutoLogout();

  // Initialize device detection and performance monitoring
  useEffect(() => {
    // Initialize user settings (theme, font size, density, etc.)
    initializeSettings();

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
      stopMonitoring();
      notificationIntegration.destroy();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <>
      {/* Auto-logout warning modal */}
      {autoLogout.showWarning && (
        <AutoLogoutWarning
          secondsRemaining={autoLogout.secondsRemaining}
          onExtend={autoLogout.extendSession}
          onLogoutNow={autoLogout.logoutNow}
          onDismiss={autoLogout.dismissWarning}
        />
      )}
      <OfflineIndicator />
      <DeviceTierToast />
      <DeviceDebugPanel position="bottom-right" />
      <MonitoringDashboard />

      {/* Developer Tools (only in development mode) */}
      <PerformanceMonitor />
      <NetworkInspector />
      <StateInspector />

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
                    <AKCScentWorkScoresheet />
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;