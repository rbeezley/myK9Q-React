import React from 'react';
import './StatusBadge.css';

export interface StatusBadgeProps {
  /** The display label for the status */
  label: string;
  /** Optional time to display (e.g., "2:30 PM") */
  time?: string | null;
  /** CSS class name for the status color (e.g., 'completed', 'in-progress') */
  statusColor: string;
  /** Whether the badge is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Render as button instead of div */
  asButton?: boolean;
}

/**
 * Reusable status badge component
 * Used for displaying class status, entry status, check-in status, etc.
 *
 * @example
 * // Class status with time
 * <StatusBadge
 *   label="Briefing"
 *   time="2:30 PM"
 *   statusColor="briefing"
 *   clickable
 *   onClick={handleClick}
 * />
 *
 * @example
 * // Entry status with icon
 * <StatusBadge
 *   label="Qualified"
 *   statusColor="qualified"
 *   icon={<ThumbsUp />}
 *   asButton
 * />
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  time,
  statusColor,
  clickable = false,
  onClick,
  icon,
  className = '',
  asButton = false
}) => {
  const baseClassName = `status-badge ${statusColor} ${clickable ? 'clickable' : ''} ${className}`.trim();

  const content = (
    <div className="status-badge-content">
      <span className="status-text">{label}</span>
      {time && <span className="status-time">{time}</span>}
    </div>
  );

  if (asButton || (clickable && onClick)) {
    return (
      <button
        type="button"
        className={baseClassName}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={baseClassName}
      onClick={clickable && onClick ? onClick : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      {content}
    </div>
  );
};
