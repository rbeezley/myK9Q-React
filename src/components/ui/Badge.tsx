import React from 'react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
};

interface ArmbandBadgeProps {
  number: string | number;
  className?: string;
}

export const ArmbandBadge: React.FC<ArmbandBadgeProps> = ({ number, className = '' }) => (
  <div className={`armband-badge ${className}`}>
    #{number}
  </div>
);

interface StatusIndicatorProps {
  status: 'scored' | 'pending';
  text?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  text,
  className = '' 
}) => {
  if (status === 'scored') {
    return (
      <div className={`status-indicator scored ${className}`}>
        <span className="status-icon">✓</span>
        <span className="status-text">{text || 'SCORED'}</span>
      </div>
    );
  }
  
  return (
    <div className={`status-indicator pending ${className}`}>
      <span className="status-text">{text || 'PENDING'}</span>
    </div>
  );
};