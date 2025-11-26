/**
 * useFavoriteClasses Hook
 *
 * Manages favorite classes with localStorage persistence.
 * Handles loading, saving, and toggling favorites.
 *
 * Extracted from ClassList.tsx
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook return type
 */
export interface UseFavoriteClassesReturn {
  /** Set of favorite class IDs */
  favoriteClasses: Set<number>;
  /** Whether favorites have been loaded from localStorage */
  favoritesLoaded: boolean;
  /** Check if a class is a favorite */
  isFavorite: (classId: number) => boolean;
  /** Toggle favorite status for a class (handles paired classes) */
  toggleFavorite: (classId: number, pairedClassId?: number) => void;
}

/**
 * Custom hook for managing favorite classes
 *
 * Provides functionality for:
 * - **localStorage Persistence**: Saves favorites per license key + trial
 * - **Loading**: Loads favorites on mount from localStorage
 * - **Toggling**: Add/remove class IDs from favorites set
 * - **Paired Classes**: Automatically handles paired Novice A/B classes
 *
 * **Storage Key Pattern**: `favorites_{licenseKey}_{trialId}`
 * **Paired Classes**: When toggling a paired class, both IDs are updated together
 *
 * @param licenseKey - License key for storage key (undefined if not available)
 * @param trialId - Trial ID for storage key (undefined if not available)
 * @returns Favorites state and control methods
 *
 * @example
 * ```tsx
 * function ClassList() {
 *   const {
 *     favoriteClasses,
 *     favoritesLoaded,
 *     isFavorite,
 *     toggleFavorite
 *   } = useFavoriteClasses(licenseKey, trialId);
 *
 *   // Update classes with favorite status
 *   useEffect(() => {
 *     if (favoritesLoaded && classes.length > 0) {
 *       setClasses(prev => prev.map(c => ({
 *         ...c,
 *         is_favorite: isFavorite(c.id)
 *       })));
 *     }
 *   }, [favoriteClasses, favoritesLoaded]);
 *
 *   const handleToggle = (classId: number, pairedId?: number) => {
 *     hapticFeedback.medium();
 *     toggleFavorite(classId, pairedId);
 *   };
 *
 *   return (
 *     <div>
 *       {classes.map(cls => (
 *         <ClassCard
 *           key={cls.id}
 *           isFavorite={isFavorite(cls.id)}
 *           onToggleFavorite={() => handleToggle(cls.id, cls.pairedClassId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFavoriteClasses(
  licenseKey: string | undefined,
  trialId: string | undefined
): UseFavoriteClassesReturn {
  // State
  const [favoriteClasses, setFavoriteClasses] = useState<Set<number>>(() => {
    console.log('🔄 Initializing favoriteClasses state');
    return new Set();
  });
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const favoritesKey = `favorites_${licenseKey || 'default'}_${trialId}`;
        console.log('🔍 Loading with key:', favoritesKey);
        console.log('🗄️ All localStorage keys:', Object.keys(localStorage));
        console.log('🗄️ All localStorage favorites keys:', Object.keys(localStorage).filter(k => k.startsWith('favorites_')));
        const savedFavorites = localStorage.getItem(favoritesKey);
        console.log('💾 Raw localStorage value for key:', savedFavorites);
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites) as number[];
          console.log('📥 Setting favoriteClasses from localStorage:', favoriteIds);
          setFavoriteClasses(new Set(favoriteIds));
        } else {
          console.log('❌ No saved favorites found, setting empty set');
          setFavoriteClasses(new Set());
        }
        setFavoritesLoaded(true);
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    };

    if (licenseKey && trialId) {
      loadFavorites();
    }
  }, [licenseKey, trialId]);

  // Save favorites to localStorage whenever favoriteClasses changes (but only after initial load)
  useEffect(() => {
    if (licenseKey && trialId && favoritesLoaded) {
      try {
        const favoritesKey = `favorites_${licenseKey}_${trialId}`;
        const favoriteIds = Array.from(favoriteClasses);
        console.log('💾 Saving favorites to localStorage:', favoritesKey, favoriteIds);
        localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds));
        console.log('✅ Saved to localStorage successfully');
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    } else {
      console.log('⚠️ Not saving favorites - missing context, trialId, or not loaded yet:', {
        licenseKey,
        trialId,
        favoritesLoaded,
        size: favoriteClasses.size
      });
    }
  }, [favoriteClasses, licenseKey, trialId, favoritesLoaded]);

  /**
   * Check if a class is a favorite
   */
  const isFavorite = useCallback((classId: number): boolean => {
    return favoriteClasses.has(classId);
  }, [favoriteClasses]);

  /**
   * Toggle favorite status for a class
   * Handles paired Novice A/B classes by toggling both
   */
  const toggleFavorite = useCallback((classId: number, pairedClassId?: number) => {
    console.log('💖 Toggling favorite for class:', classId, 'Paired:', pairedClassId);

    const idsToToggle = pairedClassId ? [classId, pairedClassId] : [classId];

    setFavoriteClasses(prev => {
      const newFavorites = new Set(prev);
      const shouldAdd = !newFavorites.has(classId);

      idsToToggle.forEach(id => {
        if (shouldAdd) {
          newFavorites.add(id);
          console.log('⭐ Adding to favorites:', id);
        } else {
          newFavorites.delete(id);
          console.log('🗑️ Removing from favorites:', id);
        }
      });

      console.log('💾 New favorites set:', Array.from(newFavorites));
      return newFavorites;
    });
  }, []);

  return {
    favoriteClasses,
    favoritesLoaded,
    isFavorite,
    toggleFavorite,
  };
}
