import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login/Login';
import { Home } from './pages/Home/Home';
import { DogDetails } from './pages/DogDetails/DogDetails';
import { ClassList } from './pages/ClassList/ClassList';
import { EntryList } from './pages/EntryList/EntryList';
import { UKCObedienceScoresheet } from './pages/scoresheets/UKC/UKCObedienceScoresheet';
import { UKCRallyScoresheet } from './pages/scoresheets/UKC/UKCRallyScoresheet';
import { AKCScentWorkScoresheet } from './pages/scoresheets/AKC/AKCScentWorkScoresheet';
import { AKCFastCatScoresheet } from './pages/scoresheets/AKC/AKCFastCatScoresheet';
import { ASCAScentDetectionScoresheet } from './pages/scoresheets/ASCA/ASCAScentDetectionScoresheet';
import { TestScoresheet } from './components/TestScoresheet';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dog/:armband" 
            element={
              <ProtectedRoute>
                <DogDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trial/:trialId/classes" 
            element={
              <ProtectedRoute>
                <ClassList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/class/:classId/entries" 
            element={
              <ProtectedRoute>
                <EntryList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scoresheet/ukc-obedience/:classId/:entryId" 
            element={
              <ProtectedRoute>
                <UKCObedienceScoresheet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scoresheet/ukc-rally/:classId/:entryId" 
            element={
              <ProtectedRoute>
                <UKCRallyScoresheet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scoresheet/akc-scent-work/:classId/:entryId" 
            element={
              <ProtectedRoute>
                <AKCScentWorkScoresheet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test/scoresheet" 
            element={<TestScoresheet />} 
          />
          <Route 
            path="/scoresheet/akc-fastcat/:classId/:entryId" 
            element={
              <ProtectedRoute>
                <AKCFastCatScoresheet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scoresheet/asca-scent-detection/:classId/:entryId" 
            element={
              <ProtectedRoute>
                <ASCAScentDetectionScoresheet />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;