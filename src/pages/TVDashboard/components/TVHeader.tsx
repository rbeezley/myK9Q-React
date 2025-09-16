import React from 'react';

interface TVHeaderProps {
  currentTime: Date;
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
}

export const TVHeader: React.FC<TVHeaderProps> = ({ currentTime, formatTime, formatDate }) => {
  return (
    <header className="tv-header">
      <div className="tv-header-left">
        <div className="inaugural-badge">INAUGURAL</div>
        <h1 className="event-title">AKC Scent Work Master National</h1>
        <div className="event-year">2025</div>
      </div>
      
      <div className="tv-header-center">
        <div className="venue-info">
          <div className="venue-name">Roberts Centre</div>
          <div className="venue-location">Wilmington, OH</div>
        </div>
      </div>
      
      <div className="tv-header-right">
        <div className="current-time">{formatTime(currentTime)}</div>
        <div className="current-date">{formatDate(currentTime)}</div>
      </div>
    </header>
  );
};

export default TVHeader;