import React from 'react';
import { ArmbandBadge } from './ui';
import './DogCard.css';

interface DogCardProps {
  armband: number;
  callName: string;
  breed: string;
  handler: string;
  onClick?: () => void;
  className?: string;
  statusBorder?: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'scored' | 'placement-1' | 'placement-2' | 'placement-3';
  actionButton?: React.ReactNode; // Heart icon for Home, Status badge for EntryList
  resultBadges?: React.ReactNode; // For scored entries
}

export const DogCard = React.memo<DogCardProps>(({
  armband,
  callName,
  breed,
  handler,
  onClick,
  className = '',
  statusBorder = 'none',
  actionButton,
  resultBadges,
}) => {
  return (
    <div
      className={`dog-card ${statusBorder} ${className}`}
      onClick={onClick}
    >
      <div className="dog-card-content">
        <div className="dog-card-armband">
          <ArmbandBadge number={armband} />
        </div>

        <div className="dog-card-details">
          <h4 className="dog-card-name">{callName}</h4>
          <p className="dog-card-breed">{breed}</p>
          <p className="dog-card-handler">{handler}</p>
          {resultBadges && (
            <div className="dog-card-results">
              {resultBadges}
            </div>
          )}
        </div>

        {actionButton && (
          <div className="dog-card-action">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if key props change
  return (
    prevProps.armband === nextProps.armband &&
    prevProps.callName === nextProps.callName &&
    prevProps.statusBorder === nextProps.statusBorder &&
    prevProps.className === nextProps.className
  );
});