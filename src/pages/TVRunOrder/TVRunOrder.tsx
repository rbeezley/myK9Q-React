import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HeaderTicker, HamburgerMenu } from '../../components/ui';
import { useTVData } from './hooks/useTVData';
import { ClassRunOrder } from './components/ClassRunOrder';
import './TVRunOrder.css';

export const TVRunOrder: React.FC = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const [currentPage, setCurrentPage] = useState(0);

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

  // Reset page when class count changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(0);
  }, [inProgressClasses.length]);

  // Auto-rotation if more than 4 classes in progress
  useEffect(() => {
    if (inProgressClasses.length <= 4) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentPage(prev => {
        const totalPages = Math.ceil(inProgressClasses.length / 4);
        return (prev + 1) % totalPages;
      });
    }, 45000); // 45 seconds per page

    return () => clearInterval(interval);
  }, [inProgressClasses.length]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 TV Run Order - inProgressClasses:', inProgressClasses);
    console.log('🔍 TV Run Order - inProgressClasses.length:', inProgressClasses.length);
    console.log('🔍 TV Run Order - entriesByClass keys:', entriesByClass ? Object.keys(entriesByClass) : 'undefined');
    console.log('🔍 TV Run Order - entriesByClass:', entriesByClass);
  }, [inProgressClasses, entriesByClass]);

  // Get visible classes for current page (max 4)
  const visibleClasses = inProgressClasses.slice(
    currentPage * 4,
    currentPage * 4 + 4
  );

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

  // Empty state
  if (inProgressClasses.length === 0) {
    return (
      <div className="tv-runorder-container">
        <div className="tv-runorder-header-bar">
          <div className="tv-runorder-menu">
            <HamburgerMenu currentPage="tv" />
          </div>
          <div className="tv-runorder-ticker">
            <HeaderTicker />
          </div>
        </div>
        <div className="tv-runorder-empty">
          <h1>No Classes Available</h1>
          <p>Classes will appear here when they are about to start or in progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-runorder-container">
      {/* Header bar with hamburger menu and announcement ticker */}
      <div className="tv-runorder-header-bar">
        <div className="tv-runorder-menu">
          <HamburgerMenu currentPage="tv" />
        </div>
        <div className="tv-runorder-ticker">
          <HeaderTicker />
        </div>
      </div>

      {/* 2x2 grid of in-progress classes */}
      <div className="tv-runorder-grid">
        {visibleClasses.map((classInfo) => (
          <ClassRunOrder
            key={classInfo.id}
            classInfo={classInfo}
            entries={entriesByClass?.[`${classInfo.trial_date}-${classInfo.trial_number}-${classInfo.element_type}-${classInfo.level}`] || []}
          />
        ))}
      </div>

      {/* Page indicator if rotating */}
      {inProgressClasses.length > 4 && (
        <div className="tv-runorder-pagination">
          Page {currentPage + 1} of {Math.ceil(inProgressClasses.length / 4)}
        </div>
      )}
    </div>
  );
};
