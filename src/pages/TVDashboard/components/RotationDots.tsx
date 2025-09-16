import React from 'react';
import './RotationDots.css';

interface RotationDotsProps {
  items: Array<{ id: string; label: string }>;
  currentIndex: number;
  isRotationEnabled: boolean;
  onItemSelect?: (index: number) => void;
  onToggleRotation: () => void;
  className?: string;
}

export const RotationDots: React.FC<RotationDotsProps> = ({
  items,
  currentIndex,
  isRotationEnabled,
  onItemSelect,
  onToggleRotation,
  className = ''
}) => {
  if (items.length <= 1) return null;

  return (
    <div className={`rotation-dots ${className}`}>
      {items.map((item, index) => (
        <div 
          key={item.id}
          className={`progress-dot ${index === currentIndex ? 'active' : ''}`}
          onClick={() => onItemSelect?.(index)}
          title={`${item.label} (${index + 1}/${items.length})`}
        />
      ))}
      <button 
        className="rotation-pause-btn"
        onClick={onToggleRotation}
        title={isRotationEnabled ? 'Pause rotation' : 'Resume rotation'}
      >
        {isRotationEnabled ? '⏸' : '▶'}
      </button>
    </div>
  );
};

export default RotationDots;