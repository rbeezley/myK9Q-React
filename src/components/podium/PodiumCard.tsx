// src/components/podium/PodiumCard.tsx
import { PodiumPosition, PodiumPositionProps } from './PodiumPosition';
import './podium.css';

export interface PodiumCardProps {
  className: string;
  element: string;
  level: string;
  section?: string;
  placements: Omit<PodiumPositionProps, 'animate'>[];
  variant?: 'compact' | 'full';
  animate?: boolean;
}

const ELEMENT_ICONS: Record<string, string> = {
  'Container': '📦',
  'Interior': '🏠',
  'Exterior': '🌲',
  'Buried': '🦴',
  'Handler Discrimination': '🎯',
};

export function PodiumCard({
  className,
  element,
  placements,
  animate = false,
}: PodiumCardProps) {
  const icon = ELEMENT_ICONS[element] || '🏆';
  const animateClass = animate ? 'podium-card--animate' : '';

  // Sort placements by position
  const sortedPlacements = [...placements].sort((a, b) => a.placement - b.placement);

  return (
    <div className={`podium-card ${animateClass}`.trim()}>
      <div className="podium-card__header">
        <span className="podium-card__icon">{icon}</span>
        <span className="podium-card__title">{className}</span>
      </div>
      <div className="podium-card__podium">
        {sortedPlacements.map((placement) => (
          <PodiumPosition key={placement.placement} {...placement} animate={animate} />
        ))}
      </div>
    </div>
  );
}
