import React from 'react';
import './LoadingStates.css';

// Generic skeleton loader
interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = ''
}) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Dashboard loading state
export const DashboardSkeleton: React.FC = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-header">
      <Skeleton height="60px" borderRadius="12px" />
    </div>
    
    <div className="skeleton-main">
      <div className="skeleton-current-status">
        <Skeleton height="40px" width="200px" className="skeleton-title" />
        <div className="skeleton-content">
          <Skeleton height="120px" borderRadius="16px" />
          <div className="skeleton-queue">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height="60px" borderRadius="8px" />
            ))}
          </div>
        </div>
      </div>
      
      <div className="skeleton-rotation-panel">
        <Skeleton height="40px" width="300px" className="skeleton-title" />
        <Skeleton height="400px" borderRadius="20px" />
      </div>
    </div>
    
    <div className="skeleton-progress">
      <div className="skeleton-progress-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-progress-item">
            <Skeleton height="24px" width="120px" />
            <Skeleton height="12px" borderRadius="6px" />
            <Skeleton height="16px" width="80px" />
          </div>
        ))}
      </div>
    </div>
    
    <div className="skeleton-ticker">
      <Skeleton height="30px" borderRadius="15px" />
    </div>
  </div>
);

// Current status loading
export const CurrentStatusSkeleton: React.FC = () => (
  <div className="current-status-skeleton">
    <div className="skeleton-element-info">
      <Skeleton height="36px" width="150px" className="skeleton-element-name" />
      <Skeleton height="24px" width="200px" />
      <Skeleton height="20px" width="120px" />
    </div>
    
    <div className="skeleton-current-dog">
      <Skeleton height="28px" width="180px" className="skeleton-dog-header" />
      <div className="skeleton-dog-info">
        <Skeleton height="48px" width="60px" borderRadius="8px" className="skeleton-armband" />
        <div className="skeleton-dog-details">
          <Skeleton height="24px" width="140px" />
          <Skeleton height="20px" width="100px" />
          <Skeleton height="18px" width="200px" />
        </div>
      </div>
    </div>
    
    <div className="skeleton-next-dogs">
      <Skeleton height="24px" width="160px" className="skeleton-next-header" />
      <div className="skeleton-dog-queue">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-queue-dog">
            <Skeleton height="32px" width="32px" borderRadius="50%" />
            <div className="skeleton-queue-info">
              <Skeleton height="16px" width="80px" />
              <Skeleton height="14px" width="120px" />
              <Skeleton height="12px" width="100px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Element progress loading
export const ElementProgressSkeleton: React.FC = () => (
  <div className="element-progress-skeleton">
    <Skeleton height="32px" width="180px" className="skeleton-section-title" />
    <div className="skeleton-progress-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-progress-item">
          <div className="skeleton-progress-header">
            <Skeleton height="24px" width="100px" />
            <Skeleton height="20px" width="40px" />
          </div>
          <Skeleton height="12px" borderRadius="6px" className="skeleton-progress-bar" />
          <Skeleton height="16px" width="120px" />
        </div>
      ))}
    </div>
    <div className="skeleton-checkin">
      <Skeleton height="20px" width="200px" />
    </div>
  </div>
);

// Judge spotlight loading
export const JudgeSpotlightSkeleton: React.FC = () => (
  <div className="judge-spotlight-skeleton">
    <div className="skeleton-judge-header">
      <Skeleton height="32px" width="160px" />
      <Skeleton height="18px" width="100px" />
    </div>
    
    <div className="skeleton-judge-content">
      <div className="skeleton-judge-photo">
        <Skeleton height="120px" width="120px" borderRadius="50%" />
      </div>
      
      <div className="skeleton-judge-info">
        <Skeleton height="28px" width="180px" className="skeleton-judge-name" />
        <Skeleton height="20px" width="140px" />
        <Skeleton height="18px" width="160px" />
        
        <div className="skeleton-judge-details">
          <Skeleton height="16px" width="200px" />
          <Skeleton height="16px" width="180px" />
          <Skeleton height="16px" width="220px" />
        </div>
        
        <div className="skeleton-specialties">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="24px" width="80px" borderRadius="12px" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Yesterday highlights loading
export const YesterdayHighlightsSkeleton: React.FC = () => (
  <div className="yesterday-highlights-skeleton">
    <div className="skeleton-highlights-header">
      <Skeleton height="32px" width="200px" />
      <Skeleton height="18px" width="150px" />
    </div>
    
    <div className="skeleton-highlights-grid">
      <div className="skeleton-top-performers">
        <Skeleton height="24px" width="140px" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-performer">
            <Skeleton height="32px" width="32px" borderRadius="50%" />
            <div className="skeleton-performer-info">
              <Skeleton height="18px" width="120px" />
              <Skeleton height="16px" width="100px" />
              <Skeleton height="14px" width="80px" />
            </div>
            <Skeleton height="24px" width="60px" borderRadius="12px" />
          </div>
        ))}
      </div>
      
      <div className="skeleton-statistics">
        <Skeleton height="24px" width="120px" />
        <div className="skeleton-stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-stat">
              <Skeleton height="32px" width="48px" />
              <Skeleton height="16px" width="80px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Connection loading indicator
export const ConnectionLoader: React.FC = () => (
  <div className="connection-loader">
    <div className="connection-spinner">
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
    <span className="connection-text">Connecting...</span>
  </div>
);

// Generic loading spinner
export const LoadingSpinner: React.FC<{ size?: 'small' | 'medium' | 'large'; color?: string }> = ({ 
  size = 'medium', 
  color = 'var(--akc-blue)' 
}) => (
  <div className={`loading-spinner spinner-${size}`} style={{ borderTopColor: color }}>
    <div className="spinner-inner" style={{ borderColor: `${color}20` }}></div>
  </div>
);

// Pulsing dots loader
export const DotsLoader: React.FC = () => (
  <div className="dots-loader">
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
  </div>
);

// Error state with retry
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Something went wrong', 
  onRetry 
}) => (
  <div className="error-state">
    <div className="error-icon">⚠️</div>
    <div className="error-message">{message}</div>
    {onRetry && (
      <button className="error-retry" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);

// No data state
interface NoDataStateProps {
  message?: string;
  icon?: string;
}

export const NoDataState: React.FC<NoDataStateProps> = ({ 
  message = 'No data available', 
  icon = '📊' 
}) => (
  <div className="no-data-state">
    <div className="no-data-icon">{icon}</div>
    <div className="no-data-message">{message}</div>
  </div>
);