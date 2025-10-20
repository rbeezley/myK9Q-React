/**
 * Haptic Feedback Hook
 *
 * Provides vibration feedback for mobile devices to enhance touch interactions.
 * Falls back gracefully on devices/browsers that don't support vibration API.
 *
 * Usage:
 * ```tsx
 * const haptic = useHapticFeedback();
 *
 * <button onClick={() => {
 *   haptic.light();
 *   // ... handle click
 * }}>Click Me</button>
 * ```
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

interface HapticFeedbackAPI {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  error: () => void;
  warning: () => void;
  custom: (pattern: number | number[]) => void;
  isSupported: boolean;
}

/**
 * Haptic feedback patterns (in milliseconds)
 * Designed for dog show environment - quick, distinct, not annoying
 */
const HAPTIC_PATTERNS = {
  light: 10,        // Quick tap - status changes, menu items
  medium: 20,       // Button press - save, submit
  heavy: 30,        // Important action - delete, reset
  success: [10, 50, 10] as number[],  // Double pulse - score saved, check-in complete
  error: [20, 50, 20, 50, 20] as number[],  // Triple pulse - validation error, failed sync
  warning: [15, 100, 15] as number[],  // Pause pulse - time warning, conflict
};

/**
 * Check if vibration API is supported
 */
function isVibrationSupported(): boolean {
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
}

/**
 * Trigger vibration with fallback
 */
function vibrate(pattern: number | number[]): boolean {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch (error) {
    // Silent fail - haptic is enhancement, not requirement
    console.debug('Haptic feedback failed:', error);
    return false;
  }
}

/**
 * Hook for haptic feedback
 *
 * Provides methods for different vibration patterns.
 * Safe to call on all devices - gracefully degrades.
 */
export function useHapticFeedback(): HapticFeedbackAPI {
  const isSupported = isVibrationSupported();

  return {
    /**
     * Light haptic - 10ms
     * Use for: menu items, status badge taps, filter chips
     */
    light: () => vibrate(HAPTIC_PATTERNS.light),

    /**
     * Medium haptic - 20ms
     * Use for: button presses, card taps, navigation
     */
    medium: () => vibrate(HAPTIC_PATTERNS.medium),

    /**
     * Heavy haptic - 30ms
     * Use for: important actions, confirmations, drag start
     */
    heavy: () => vibrate(HAPTIC_PATTERNS.heavy),

    /**
     * Success haptic - double pulse
     * Use for: score saved, check-in complete, sync success
     */
    success: () => vibrate(HAPTIC_PATTERNS.success),

    /**
     * Error haptic - triple pulse
     * Use for: validation errors, failed sync, conflicts
     */
    error: () => vibrate(HAPTIC_PATTERNS.error),

    /**
     * Warning haptic - pause pulse
     * Use for: time warnings, max time approaching, conflicts
     */
    warning: () => vibrate(HAPTIC_PATTERNS.warning),

    /**
     * Custom haptic pattern
     * @param pattern - Single duration or array of [vibrate, pause, vibrate, ...]
     */
    custom: (pattern: number | number[]) => vibrate(pattern),

    /**
     * Whether haptic feedback is supported on this device
     */
    isSupported,
  };
}

/**
 * Standalone haptic feedback functions (for use outside React components)
 */
export const haptic = {
  light: () => vibrate(HAPTIC_PATTERNS.light),
  medium: () => vibrate(HAPTIC_PATTERNS.medium),
  heavy: () => vibrate(HAPTIC_PATTERNS.heavy),
  success: () => vibrate(HAPTIC_PATTERNS.success),
  error: () => vibrate(HAPTIC_PATTERNS.error),
  warning: () => vibrate(HAPTIC_PATTERNS.warning),
  custom: (pattern: number | number[]) => vibrate(pattern),
  isSupported: isVibrationSupported(),
};
