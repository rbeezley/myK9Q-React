import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ListOrdered, Trophy } from 'lucide-react';
import { HamburgerMenu } from '../../components/ui';
import { useTVData } from './hooks/useTVData';
import { useTVResultsData } from './hooks/useTVResultsData';
import { ClassRunOrder } from './components/ClassRunOrder';
import { TVResults } from './components/TVResults';
import './TVRunOrder.css';

type ViewMode = 'runorder' | 'results';

export const TVRunOrder: React.FC = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('runorder');

  // Get real-time TV dashboard data
  const {
    inProgressClasses,
    entriesByClass,
    isConnected: _isConnected,
    error
  } = useTVData({
    licenseKey: licenseKey || '',
    enablePolling: true,
    pollingInterval: 30000
  });

  // Get completed class results
  const {
    completedClasses,
    isLoading: _resultsLoading,
    error: _resultsError
  } = useTVResultsData({
    licenseKey: licenseKey || '',
    enablePolling: true,
    pollingInterval: 60000,
    maxResults: 8
  });

  // Auto-rotate between views (run order and results) every 30 seconds
  // Only if we have both run order data and results
  useEffect(() => {
    const hasRunOrder = inProgressClasses.length > 0;
    const hasResults = completedClasses.length > 0;

    if (hasRunOrder && hasResults) {
      const interval = setInterval(() => {
        setViewMode(prev => prev === 'runorder' ? 'results' : 'runorder');
      }, 30000); // 30 seconds per view

      return () => clearInterval(interval);
    }
  }, [inProgressClasses.length, completedClasses.length]);

  // Calculate total pages
  const totalPages = Math.ceil(inProgressClasses.length / 4);

  // Reset page when class count changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(0);
  }, [inProgressClasses.length]);

  // Navigation handlers
  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => (prev === 0 ? totalPages - 1 : prev - 1));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  // Auto-rotation if more than 4 classes in progress
  useEffect(() => {
    if (inProgressClasses.length <= 4) {
      return;
    }

    const interval = setInterval(() => {
      goToNextPage();
    }, 45000); // 45 seconds per page

    return () => clearInterval(interval);
  }, [inProgressClasses.length, goToNextPage]);

  // Get visible classes for current page (max 4)
  const visibleClasses = inProgressClasses.slice(
    currentPage * 4,
    currentPage * 4 + 4
  );

  // Toggle view mode handler (must be before early returns for hooks rules)
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'runorder' ? 'results' : 'runorder');
  }, []);

  // Error state
  if (error) {
    return (
      <div className="tv-runorder-container">
        <div className="tv-runorder-error">
          <h1>Error Loading Run Order</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state - show results if no run order
  if (inProgressClasses.length === 0) {
    // If we have results, show them instead of empty state
    if (completedClasses.length > 0) {
      return (
        <div className="tv-runorder-container">
          <div className="tv-runorder-header-bar">
            <div className="tv-runorder-menu">
              <HamburgerMenu currentPage="tv" />
            </div>
            <div className="tv-runorder-view-indicator">
              <Trophy size={20} />
              <span>Results</span>
            </div>
          </div>
          <TVResults classes={completedClasses} />
        </div>
      );
    }

    return (
      <div className="tv-runorder-container">
        <div className="tv-runorder-header-bar">
          <div className="tv-runorder-menu">
            <HamburgerMenu currentPage="tv" />
          </div>
        </div>
        <div className="tv-runorder-empty">
          <h1>No Classes Available</h1>
          <p>Classes will appear here when they are about to start or in progress.</p>
        </div>
      </div>
    );
  }

  // Determine if we should show view toggle
  const showViewToggle = completedClasses.length > 0;

  return (
    <div className="tv-runorder-container">
      {/* Header bar with hamburger menu and view toggle */}
      <div className="tv-runorder-header-bar">
        <div className="tv-runorder-menu">
          <HamburgerMenu currentPage="tv" />
        </div>

        {/* View mode indicator and toggle */}
        {showViewToggle && (
          <button
            className="tv-runorder-view-toggle"
            onClick={toggleViewMode}
            aria-label={viewMode === 'runorder' ? 'Switch to Results' : 'Switch to Run Order'}
          >
            {viewMode === 'runorder' ? (
              <>
                <ListOrdered size={20} />
                <span>Run Order</span>
              </>
            ) : (
              <>
                <Trophy size={20} />
                <span>Results</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* View content based on mode */}
      {viewMode === 'runorder' ? (
        <>
          {/* 2x2 grid of in-progress classes */}
          <div className="tv-runorder-grid">
            {visibleClasses.map((classInfo) => {
              // Build the lookup key - for combined Novice A & B, use "Novice" without section
              const lookupKey = `${classInfo.trial_date}-${classInfo.trial_number}-${classInfo.element_type}-${classInfo.level}`;
              return (
                <ClassRunOrder
                  key={classInfo.id}
                  classInfo={classInfo}
                  entries={entriesByClass?.[lookupKey] || []}
                />
              );
            })}
          </div>

          {/* Page navigation if rotating */}
          {inProgressClasses.length > 4 && (
            <div className="tv-runorder-pagination">
              <button
                className="pagination-nav-btn"
                onClick={goToPreviousPage}
                aria-label="Previous page"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="pagination-info">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                className="pagination-nav-btn"
                onClick={goToNextPage}
                aria-label="Next page"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </>
      ) : (
        <TVResults classes={completedClasses} />
      )}
    </div>
  );
};
