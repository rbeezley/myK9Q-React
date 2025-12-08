import React from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import './shared-ui.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'clickable' | 'scored' | 'unscored';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick
}) => {
  const isClickable = variant === 'clickable' || !!onClick;
  const haptic = useHapticFeedback();

  const handleClick = () => {
    if (isClickable) {
      haptic.light();
      onClick?.();
    }
  };

  return (
    <div
      className={`card ${variant} ${isClickable ? 'clickable' : ''} ${className}`}
      onClick={handleClick}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`card-content ${className}`}>
    {children}
  </div>
);

interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const CardActions: React.FC<CardActionsProps> = ({ children, className = '' }) => (
  <div className={`card-actions ${className}`}>
    {children}
  </div>
);