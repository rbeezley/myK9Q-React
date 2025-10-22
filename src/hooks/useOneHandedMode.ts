/**
 * One-Handed Mode Hook
 *
 * Applies one-handed mode classes to the document based on settings.
 * Integrates with hand preference detection.
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { startHandPreferenceDetection, detectHandPreference } from '@/utils/handPreferenceDetection';

/**
 * Hook to apply one-handed mode classes to the document
 *
 * Automatically:
 * - Adds/removes `.one-handed-mode` class based on settings
 * - Adds hand preference class (`.hand-left`, `.hand-right`, `.hand-auto`)
 * - Starts touch tracking for hand preference detection
 */
export function useOneHandedMode() {
  const { settings, updateSettings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Apply one-handed mode class
    if (settings.oneHandedMode) {
      root.classList.add('one-handed-mode');
    } else {
      root.classList.remove('one-handed-mode');
    }

    // Apply hand preference class
    root.classList.remove('hand-left', 'hand-right', 'hand-auto');
    root.classList.add(`hand-${settings.handPreference}`);

    // Auto-detect hand preference if set to 'auto'
    if (settings.oneHandedMode && settings.handPreference === 'auto') {
      const detected = detectHandPreference();
      if (detected !== 'auto') {
        // Detected a preference, but don't force it - just suggest it
        console.log(`Hand preference detected: ${detected}`);
        // User can still override in settings
      }
    }

    // Start hand preference detection
    const cleanup = startHandPreferenceDetection();

    return () => {
      cleanup();
    };
  }, [settings.oneHandedMode, settings.handPreference, updateSettings]);
}
