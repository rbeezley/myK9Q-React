/**
 * usePushNotificationAutoSwitch Hook
 *
 * Automatically switches push notification subscription when user opens a different show.
 * Monitors license_key and favorite dogs (localStorage) changes.
 *
 * Usage in App.tsx or top-level component:
 *   usePushNotificationAutoSwitch(showContext?.licenseKey);
 */

import { useEffect, useRef } from 'react';
import PushNotificationService from '@/services/pushNotificationService';

export function usePushNotificationAutoSwitch(licenseKey: string | undefined) {
  const previousLicenseKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    const handleShowSwitch = async () => {
      // Skip if no license key
      if (!licenseKey) {
        return;
      }

      // Skip if license key hasn't changed
      if (licenseKey === previousLicenseKey.current) {
        return;
      }

      // Update the ref
      previousLicenseKey.current = licenseKey;

      // Check if user is subscribed to push notifications
      const isSubscribed = await PushNotificationService.isSubscribed();

      if (!isSubscribed) {
        console.log('[Push Auto-Switch] Not subscribed - skipping show switch');
        return;
      }

      // Get favorite dogs for this show from localStorage
      const favoritesKey = `dog_favorites_${licenseKey}`;
      const savedFavorites = localStorage.getItem(favoritesKey);
      let favoriteArmbands: number[] = [];

      if (savedFavorites) {
        try {
          const parsed = JSON.parse(savedFavorites);
          if (Array.isArray(parsed) && parsed.every(id => typeof id === 'number')) {
            favoriteArmbands = parsed;
          }
        } catch (error) {
          console.error('[Push Auto-Switch] Error parsing favorites:', error);
        }
      }

      // Switch subscription to new show
      console.log('[Push Auto-Switch] Switching to show:', licenseKey);
      const success = await PushNotificationService.switchToShow(licenseKey, favoriteArmbands);

      if (success) {
        console.log('[Push Auto-Switch] ✓ Successfully switched to show:', licenseKey);
      } else {
        console.error('[Push Auto-Switch] Failed to switch to show:', licenseKey);
      }
    };

    handleShowSwitch();
  }, [licenseKey]);

  // Note: Favorite changes are handled directly in toggleFavorite() in Home.tsx
  // The storage event listener below only catches changes from OTHER tabs/windows
  useEffect(() => {
    if (!licenseKey) {
      return;
    }

    const handleFavoriteChange = async () => {
      const isSubscribed = await PushNotificationService.isSubscribed();

      if (!isSubscribed) {
        return;
      }

      // Get updated favorites
      const favoritesKey = `dog_favorites_${licenseKey}`;
      const savedFavorites = localStorage.getItem(favoritesKey);
      let favoriteArmbands: number[] = [];

      if (savedFavorites) {
        try {
          const parsed = JSON.parse(savedFavorites);
          if (Array.isArray(parsed)) {
            favoriteArmbands = parsed;
          }
        } catch (error) {
          console.error('[Push Auto-Switch] Error parsing favorites:', error);
        }
      }

      // Update favorites for current show
      await PushNotificationService.updateFavoriteArmbands(favoriteArmbands);
    };

    // Listen for localStorage changes from OTHER tabs/windows
    // (Changes in current tab are handled directly in toggleFavorite)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `dog_favorites_${licenseKey}`) {
        console.log('[Push Auto-Switch] Favorites changed in other tab');
        handleFavoriteChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [licenseKey]);
}

export default usePushNotificationAutoSwitch;
