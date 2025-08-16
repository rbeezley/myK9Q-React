/**
 * Haptic Feedback Simulation for Dog Show Trial Interfaces
 * Provides visual feedback for touch interactions when haptic feedback is not available
 */

export const simulateHapticFeedback = (element: HTMLElement, duration: number = 100) => {
  // Check if reduced motion is preferred
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Apply scale transform
  element.style.transform = 'scale(0.98)';
  element.style.transition = 'transform 0.1s ease-out';

  // Reset after duration
  setTimeout(() => {
    element.style.transform = '';
  }, duration);
};

export const addHapticFeedbackListeners = (element: HTMLElement, duration?: number) => {
  const handleTouchStart = () => {
    simulateHapticFeedback(element, duration);
  };

  const handleTouchEnd = () => {
    // Additional cleanup if needed
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// React hook for haptic feedback
export const useHapticFeedback = () => {
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    simulateHapticFeedback(e.currentTarget);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    // Reset handled by simulateHapticFeedback timeout
  };

  const impact = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    // Simulate haptic feedback based on type
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
      }
    }
  };

  const success = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    impact,
    success,
  };
};