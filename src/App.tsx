import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScoresheetErrorBoundary } from './components/ScoresheetErrorBoundary';
import { PageLoader, ScoresheetLoader } from './components/LoadingSpinner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
const TVDashboard = React.lazy(() => import('./pages/TVDashboard/TVDashboard').then(module => ({ default: module.TVDashboard })));
const CompetitionAdmin = React.lazy(() => import('./pages/Admin/CompetitionAdmin').then(module => ({ default: module.CompetitionAdmin })));
const StatusPopupDemo = React.lazy(() => import('./demo/StatusPopupDemo'));
const TestClassProgressCards = React.lazy(() => import('./pages/TestClassProgressCards').then(module => ({ default: module.TestClassProgressCards })));

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
const AKCScentWorkScoresheet = React.lazy(() =>
  import('./pages/scoresheets/AKC/AKCScentWorkScoresheet-Enhanced').then(module => ({
    default: module.AKCScentWorkScoresheetEnhanced
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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/test-cards"
            element={
              <Suspense fallback={<PageLoader message="Loading test cards..." />}>
                <TestClassProgressCards />
              </Suspense>
            }
          />
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
              <Suspense fallback={<PageLoader message="Loading TV Dashboard..." />}>
                <TVDashboard />
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;