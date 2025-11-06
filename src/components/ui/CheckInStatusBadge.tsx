import React from 'react';
import { Circle, Check, AlertTriangle, XCircle, Star, Bell } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { getCheckInStatusIcon } from '../../utils/statusUtils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface CheckInStatusBadgeProps {
  /** Check-in status: 'none', 'checked-in', 'conflict', 'pulled', 'at-gate', 'come-to-gate' */
  status?: string;
  /** Whether the badge is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Icon size (default: 16) */
  iconSize?: number;
  /** Additional CSS classes */
  className?: string;
  /** Render as button instead of div */
  asButton?: boolean;
}

/**
 * Standardized check-in status badge with Lucide icons
 * Uses centralized colors from design-tokens.css and StatusBadge component
 *
 * @example
 * <CheckInStatusBadge status="checked-in" clickable onClick={handleClick} />
 * <CheckInStatusBadge status="at-gate" iconSize={20} />
 */
export const CheckInStatusBadge: React.FC<CheckInStatusBadgeProps> = ({
  status = 'none',
  clickable = false,
  onClick,
  iconSize = 16,
  className = '',
  asButton = false
}) => {
  const haptic = useHapticFeedback();

  // Get label based on status
  const getLabel = (status: string): string => {
    switch (status) {
      case 'checked-in': return 'Checked-in';
      case 'conflict': return 'Conflict';
      case 'pulled': return 'Pulled';
      case 'at-gate': return 'At Gate';
      case 'come-to-gate': return 'At Gate'; // Same as at-gate (consolidated)
      default: return 'Not Checked In';
    }
  };

  // Get icon component based on status
  const getIcon = (status: string): React.ReactNode => {
    const iconName = getCheckInStatusIcon(status);
    const props = { size: iconSize, className: 'status-icon' };

    switch (iconName) {
      case 'Check': return <Check {...props} />;
      case 'AlertTriangle': return <AlertTriangle {...props} />;
      case 'XCircle': return <XCircle {...props} />;
      case 'Star': return <Star {...props} />;
      case 'Bell': return <Bell {...props} />;
      default: return <Circle {...props} />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      // Provide different haptic feedback based on status
      if (status === 'conflict') {
        haptic.warning(); // Warning pulse for conflicts
      } else {
        haptic.light(); // Quick tap for normal status changes
      }
      onClick(e);
    }
  };

  return (
    <StatusBadge
      label={getLabel(status)}
      statusColor={status}
      icon={getIcon(status)}
      clickable={clickable}
      onClick={handleClick}
      className={className}
      asButton={asButton}
    />
  );
};
