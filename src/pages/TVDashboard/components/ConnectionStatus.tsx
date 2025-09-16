import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastUpdated,
  error
}) => {
  const getStatusColor = () => {
    if (error) return '#FF4444';
    if (isConnected) return '#34C759';
    return '#FF9500';
  };

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isConnected) return 'Live';
    return 'Connecting...';
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <div className="connection-status">
      <div 
        className="status-dot"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">{getStatusText()}</span>
      {lastUpdated && !error && (
        <span className="last-updated">
          • {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;