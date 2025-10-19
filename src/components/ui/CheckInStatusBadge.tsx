import React from 'react';
import { Circle, Check, AlertTriangle, XCircle, Star } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { getCheckInStatusIcon } from '../../utils/statusUtils';

export interface CheckInStatusBadgeProps {
  /** Check-in status: 'none', 'checked-in', 'conflict', 'pulled', 'at-gate' */
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
  // Get label based on status
  const getLabel = (status: string): string => {
    switch (status) {
      case 'checked-in': return 'Checked-in';
      case 'conflict': return 'Conflict';
      case 'pulled': return 'Pulled';
      case 'at-gate': return 'At Gate';
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
      default: return <Circle {...props} />;
    }
  };

  return (
    <StatusBadge
      label={getLabel(status)}
      statusColor={status}
      icon={getIcon(status)}
      clickable={clickable}
      onClick={onClick}
      className={className}
      asButton={asButton}
    />
  );
};
