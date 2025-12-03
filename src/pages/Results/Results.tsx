// src/pages/Results/Results.tsx
import { useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useResultsData } from './hooks/useResultsData';
import { ResultsFilters } from './components/ResultsFilters';
import { PodiumCard } from '../../components/podium';
import { HamburgerMenu } from '../../components/ui';
import './Results.css';

export function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { licenseKey: urlLicenseKey } = useParams<{ licenseKey: string }>();
  const { showContext, role } = useAuth();

  // Use URL param or fall back to auth context
  const licenseKey = urlLicenseKey || showContext?.licenseKey || '';

  // Get trialId from URL if provided
  const trialIdParam = searchParams.get('trialId');
  const trialId = trialIdParam ? parseInt(trialIdParam, 10) : 0;

  const {
    completedClasses,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
  } = useResultsData({
    trialId,
    licenseKey,
    userRole: role || 'exhibitor',
  });

  // Sync filters with URL
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    const params = new URLSearchParams(searchParams);
    if (newFilters.element) {
      params.set('element', newFilters.element);
    } else {
      params.delete('element');
    }
    if (newFilters.level) {
      params.set('level', newFilters.level);
    } else {
      params.delete('level');
    }
    setSearchParams(params);
  };

  // Initialize filters from URL
  const initialElement = searchParams.get('element');
  const initialLevel = searchParams.get('level');
  if (
    (initialElement && filters.element !== initialElement) ||
    (initialLevel && filters.level !== initialLevel)
  ) {
    setFilters({
      element: initialElement,
      level: initialLevel,
    });
  }

  if (!licenseKey) {
    return (
      <div className="results-page results-page--empty">
        <div className="tv-runorder-header-bar">
          <div className="tv-runorder-menu">
            <HamburgerMenu currentPage="results" />
          </div>
        </div>
        <div className="results-page__empty">
          <span className="results-page__empty-icon">🔐</span>
          <h2>Authentication Required</h2>
          <p>Please log in to view results.</p>
        </div>
      </div>
    );
  }

  if (!trialId) {
    return (
      <div className="results-page results-page--empty">
        <div className="tv-runorder-header-bar">
          <div className="tv-runorder-menu">
            <HamburgerMenu currentPage="results" />
          </div>
        </div>
        <div className="results-page__empty">
          <span className="results-page__empty-icon">📋</span>
          <h2>Select a Trial</h2>
          <p>Please select a trial to view results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <header className="results-page__header">
        <div className="tv-runorder-menu">
          <HamburgerMenu currentPage="results" />
        </div>
        <h1>Class Results</h1>
      </header>

      <ResultsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={completedClasses.length}
      />

      <main className="results-page__content">
        {isLoading && (
          <div className="results-page__loading">Loading results...</div>
        )}

        {error && (
          <div className="results-page__error">
            Error loading results. <button onClick={refetch}>Retry</button>
          </div>
        )}

        {!isLoading && !error && completedClasses.length === 0 && (
          <div className="results-page__empty">
            <span className="results-page__empty-icon">🏁</span>
            <h2>No results available yet</h2>
            <p>Results will appear here as classes complete scoring.</p>
          </div>
        )}

        {!isLoading && !error && completedClasses.length > 0 && (
          <div className="results-page__grid">
            {completedClasses.map((cls) => (
              <PodiumCard
                key={cls.classId}
                className={cls.className}
                element={cls.element}
                level={cls.level}
                section={cls.section}
                placements={cls.placements}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
