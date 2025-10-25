import React from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import './shared-ui.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  onClick,
  ...props
}) => {
  const haptic = useHapticFeedback();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      // Different haptic feedback based on button variant
      if (variant === 'primary' || variant === 'gradient') {
        haptic.medium(); // Medium haptic for primary actions
      } else {
        haptic.light(); // Light haptic for secondary actions
      }
      onClick?.(e);
    }
  };

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};