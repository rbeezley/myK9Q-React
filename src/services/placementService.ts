/**
 * Placement Calculation Service
 *
 * Calculates placements for Regular shows and Nationals based on:
 * - Regular: Qualified > Lowest Faults > Fastest Time
 * - Nationals: Qualified > Highest Points > Fastest Time
 */

import { supabase } from '../lib/supabase';

/**
 * Recalculate all placements for one or more classes using database function
 *
 * @param classIds - Single class ID or array of class IDs to recalculate placements for
 * @param licenseKey - The license key for tenant isolation (unused but kept for API compatibility)
 * @param isNationals - Whether this is a Nationals competition
 */
export async function recalculatePlacementsForClass(
  classIds: number | number[],
  licenseKey: string,
  isNationals: boolean = false
): Promise<void> {
  try {
    // Normalize to array for consistent handling
    const classIdArray = Array.isArray(classIds) ? classIds : [classIds];

    // Call the database function to recalculate placements for each class
    // Note: Placements are calculated separately per class, even for combined Novice A & B
    // This is much faster than the old client-side approach as it:
    // 1. Uses SQL window functions for efficient ranking
    // 2. Updates all placements in batch operations
    // 3. Avoids N+1 queries
    const { error } = await supabase.rpc('recalculate_class_placements', {
      p_class_ids: classIdArray,
      p_is_nationals: isNationals
    });

    if (error) {
      console.error('Error recalculating placements:', error);
      throw error;
    }

    console.log(`✅ Recalculated placements for class(es) ${classIdArray.join(', ')}`);

  } catch (error) {
    console.error('Error recalculating placements:', error);
    throw error;
  }
}

/**
 * Get the current placement for a specific entry
 */
export async function getEntryPlacement(
  entryId: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('final_placement')
      .eq('entry_id', entryId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.final_placement;
  } catch (error) {
    console.error('Error getting entry placement:', error);
    return null;
  }
}