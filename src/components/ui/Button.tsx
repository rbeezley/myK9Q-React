import React from 'react';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import './Button.css';

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
  ...props 
}) => {
  const hapticFeedback = useHapticFeedback();
  
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={disabled}
      {...(!disabled ? hapticFeedback : {})}
      {...props}
    >
      {children}
    </button>
  );
};