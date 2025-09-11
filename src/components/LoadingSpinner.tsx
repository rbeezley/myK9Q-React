import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 
          className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto mb-4`}
        />
        {message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

// Specialized loading components for different contexts
export const PageLoader: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <LoadingSpinner message={message} size="lg" fullScreen />
);

export const ScoresheetLoader: React.FC = () => (
  <LoadingSpinner 
    message="Loading scoresheet..." 
    size="lg" 
    fullScreen 
  />
);

export const ComponentLoader: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <LoadingSpinner message={message} size="md" />
);