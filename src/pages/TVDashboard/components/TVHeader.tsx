import React from 'react';
import type { ShowInfo } from '../hooks/useTVData';
import { ConnectionStatus } from './ConnectionStatus';

interface TVHeaderProps {
  currentTime: Date;
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
  showInfo?: ShowInfo | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export const TVHeader: React.FC<TVHeaderProps> = ({ currentTime, formatTime, formatDate, showInfo, isConnected, lastUpdated, error }) => {
  return (
    <header className="tv-header">
      <div className="tv-header-left">
        {showInfo?.showtype === 'Master National' && <div className="inaugural-badge inaugural-badge-enhanced">INAUGURAL</div>}
        <h1 className="event-title event-title-enhanced">{showInfo?.showname || 'AKC Scent Work Master National'}</h1>
        {showInfo?.startdate && <div className="event-year">{new Date(showInfo.startdate).getFullYear()}</div>}
      </div>

      <div className="tv-header-center">
        <div className="venue-info">
          <div className="venue-name">
            {showInfo?.sitename || 'Venue TBD'}
          </div>
          <div className="venue-location">
            {showInfo?.sitecity && showInfo?.sitestate
              ? `${showInfo.sitecity}, ${showInfo.sitestate}`
              : ''
            }
          </div>
        </div>
      </div>
      
      <div className="tv-header-right">
        <ConnectionStatus
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          error={error}
        />
        <div className="current-time">{formatTime(currentTime)}</div>
        <div className="current-date">{formatDate(currentTime)}</div>
      </div>
    </header>
  );
};

export default TVHeader;