/**
 * Floating Action Button (FAB)
 *
 * Material Design-inspired FAB for one-handed mode.
 * Positioned based on hand preference (left/right/auto).
 */

import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import './shared-ui.css';

export interface FloatingActionButtonProps {
  /** Icon to display in the FAB */
  icon: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Accessible label */
  ariaLabel: string;
  /** Optional CSS class */
  className?: string;
  /** Whether to show the FAB (default: true) */
  visible?: boolean;
}

/**
 * Floating Action Button component
 *
 * Automatically positions based on settings.handPreference:
 * - 'left': Bottom left corner
 * - 'right': Bottom right corner
 * - 'auto': Bottom right (default for right-handed majority)
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  className = '',
  visible = true,
}) => {
  const { settings } = useSettingsStore();
  const haptic = useHapticFeedback();

  // Don't render if one-handed mode is disabled or FAB is hidden
  if (!settings.oneHandedMode || !visible) {
    return null;
  }

  const handleClick = () => {
    haptic.medium();
    onClick();
  };

  return (
    <button
      className={`floating-action-button hand-${settings.handPreference} ${className}`}
      onClick={handleClick}
      aria-label={ariaLabel}
      type="button"
    >
      {icon}
    </button>
  );
};
