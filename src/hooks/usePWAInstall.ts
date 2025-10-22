/**
 * PWA Installation Hook
 *
 * Detects if the app is installed as a PWA and provides methods to prompt installation.
 * This is critical for push notifications to work reliably, especially on iOS.
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  /**
   * Whether the app is currently installed as a PWA
   */
  isInstalled: boolean;

  /**
   * Whether the browser supports PWA installation and has a prompt available
   */
  canInstall: boolean;

  /**
   * Whether the user previously dismissed the install prompt
   */
  isDismissed: boolean;

  /**
   * Trigger the browser's native install prompt
   * @returns Promise that resolves to true if user accepted, false if dismissed
   */
  promptInstall: () => Promise<boolean>;

  /**
   * Mark the install prompt as dismissed (won't show again for 7 days)
   */
  dismissInstallPrompt: () => void;

  /**
   * Clear the dismissed state (for testing or user-initiated reset)
   */
  clearDismissed: () => void;

  /**
   * Get platform-specific installation instructions
   */
  getInstallInstructions: () => string;
}

const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWAInstall(): UsePWAInstallReturn {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  /**
   * Detect if app is already installed
   */
  useEffect(() => {
    // Check if running in standalone mode (installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true || // iOS Safari
      document.referrer.includes('android-app://'); // Android

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInstalled(isStandalone);

    console.log('📱 PWA Install Status:', {
      isStandalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      iosStandalone: (window.navigator as any).standalone,
      referrer: document.referrer
    });
  }, []);

  /**
   * Check if user previously dismissed the prompt
   */
  useEffect(() => {
    try {
      const dismissedData = localStorage.getItem(DISMISS_KEY);
      if (dismissedData) {
        const { timestamp } = JSON.parse(dismissedData);
        const now = Date.now();
        const timeSinceDismissed = now - timestamp;

        if (timeSinceDismissed < DISMISS_DURATION) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsDismissed(true);
          console.log('📱 Install prompt dismissed, will show again in',
            Math.round((DISMISS_DURATION - timeSinceDismissed) / (1000 * 60 * 60)), 'hours');
        } else {
          // Dismiss period expired, clear it
          localStorage.removeItem(DISMISS_KEY);
          setIsDismissed(false);
        }
      }
    } catch (error) {
      console.error('Error checking dismiss state:', error);
    }
  }, []);

  /**
   * Capture the beforeinstallprompt event
   */
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault();

      console.log('📱 beforeinstallprompt event captured');
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  /**
   * Listen for successful installation
   */
  useEffect(() => {
    const handler = () => {
      console.log('📱 App was installed successfully!');
      setIsInstalled(true);
      setInstallPrompt(null);

      // Clear dismissed state on successful install
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  /**
   * Mark the install prompt as dismissed
   */
  const dismissInstallPrompt = useCallback(() => {
    try {
      const dismissData = {
        timestamp: Date.now()
      };
      localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissData));
      setIsDismissed(true);

      console.log('📱 Install prompt dismissed for 7 days');
    } catch (error) {
      console.error('Error saving dismiss state:', error);
    }
  }, []);

  /**
   * Prompt the user to install the PWA
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('📱 Install prompt not available');
      return false;
    }

    try {
      // Show the browser's install prompt
      await installPrompt.prompt();

      // Wait for user choice
      const result = await installPrompt.userChoice;

      console.log('📱 User install choice:', result.outcome);

      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      } else {
        // User dismissed, mark as dismissed
        dismissInstallPrompt();
        return false;
      }
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }, [installPrompt, dismissInstallPrompt]);

  /**
   * Clear the dismissed state
   */
  const clearDismissed = useCallback(() => {
    try {
      localStorage.removeItem(DISMISS_KEY);
      setIsDismissed(false);
      console.log('📱 Install prompt dismiss state cleared');
    } catch (error) {
      console.error('Error clearing dismiss state:', error);
    }
  }, []);

  /**
   * Get platform-specific installation instructions
   */
  const getInstallInstructions = useCallback((): string => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'Tap the Share button, then tap "Add to Home Screen"';
    } else if (/android/.test(userAgent)) {
      return 'Tap the menu icon (⋮) and select "Add to Home Screen" or "Install App"';
    } else if (/mac/.test(userAgent)) {
      return 'Click the install icon in the address bar or use the menu';
    } else {
      return 'Click the install icon in the address bar';
    }
  }, []);

  return {
    isInstalled,
    canInstall: !!installPrompt && !isInstalled,
    isDismissed,
    promptInstall,
    dismissInstallPrompt,
    clearDismissed,
    getInstallInstructions
  };
}
