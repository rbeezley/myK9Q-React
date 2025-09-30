/**
 * Placement Calculation Service
 *
 * Calculates placements for Regular shows and Nationals based on:
 * - Regular: Qualified > Lowest Faults > Fastest Time
 * - Nationals: Qualified > Highest Points > Fastest Time
 */

import { supabase } from '../lib/supabase';

interface ResultForPlacement {
  id: number;
  entry_id: number;
  armband_number: number;
  result_status: string;
  total_faults: number;
  search_time_seconds: number;
  points_earned?: number;
  is_excused: boolean;
}

/**
 * Convert time in seconds to comparable number
 * Time is already stored as seconds in the database
 */
function getTimeForComparison(timeSeconds: number): number {
  if (!timeSeconds || timeSeconds <= 0) return Infinity; // No time = slowest
  return timeSeconds;
}

/**
 * Calculate placements for Regular shows
 * Sort by: Qualified > Lowest Faults > Fastest Time
 */
function calculateRegularPlacements(results: ResultForPlacement[]): Map<number, number> {
  // Filter to only qualified dogs
  const qualified = results.filter(r =>
    (r.result_status === 'qualified' || r.result_status === 'Q') &&
    !r.is_excused
  );

  // Sort by: lowest faults first, then fastest time
  qualified.sort((a, b) => {
    // First: lowest faults wins
    if (a.total_faults !== b.total_faults) {
      return a.total_faults - b.total_faults;
    }

    // Second: fastest time wins
    const timeA = getTimeForComparison(a.search_time_seconds);
    const timeB = getTimeForComparison(b.search_time_seconds);
    return timeA - timeB;
  });

  // Assign placements
  const placements = new Map<number, number>();
  qualified.forEach((result, index) => {
    placements.set(result.id, index + 1); // 1-indexed placement
  });

  return placements;
}

/**
 * Calculate placements for Nationals
 * Sort by: Qualified > Highest Points > Fastest Time
 */
function calculateNationalsPlacements(results: ResultForPlacement[]): Map<number, number> {
  // Filter to only qualified dogs
  const qualified = results.filter(r =>
    (r.result_status === 'qualified' || r.result_status === 'Q') &&
    !r.is_excused
  );

  // Sort by: highest points first, then fastest time
  qualified.sort((a, b) => {
    // First: highest points wins
    const pointsA = a.points_earned || 0;
    const pointsB = b.points_earned || 0;
    if (pointsA !== pointsB) {
      return pointsB - pointsA; // Descending (highest first)
    }

    // Second: fastest time wins
    const timeA = getTimeForComparison(a.search_time_seconds);
    const timeB = getTimeForComparison(b.search_time_seconds);
    return timeA - timeB;
  });

  // Assign placements
  const placements = new Map<number, number>();
  qualified.forEach((result, index) => {
    placements.set(result.id, index + 1); // 1-indexed placement
  });

  return placements;
}

/**
 * Recalculate all placements for a specific class
 *
 * @param classId - The class to recalculate placements for
 * @param licenseKey - The license key for tenant isolation
 * @param isNationals - Whether this is a Nationals competition
 */
export async function recalculatePlacementsForClass(
  classId: number,
  licenseKey: string,
  isNationals: boolean = false
): Promise<void> {
  try {
    // Get all results for this class
    // Note: We filter by class_id which already ensures tenant isolation
    // since classes belong to a specific show (via trial -> show -> license_key)
    const { data: results, error: fetchError } = await supabase
      .from('results')
      .select(`
        id,
        entry_id,
        result_status,
        total_faults,
        search_time_seconds,
        points_earned,
        entries!inner(
          armband_number,
          class_id,
          is_excused,
          classes!inner(
            trial_id,
            trials!inner(
              show_id,
              shows!inner(
                license_key
              )
            )
          )
        )
      `)
      .eq('entries.class_id', classId)
      .eq('entries.classes.trials.shows.license_key', licenseKey);

    if (fetchError) {
      console.error('Error fetching results for placement calculation:', fetchError);
      return;
    }

    if (!results || results.length === 0) {
      console.log('No results to calculate placements for');
      return;
    }

    // Transform data for placement calculation
    const resultsForPlacement: ResultForPlacement[] = results.map((r: any) => ({
      id: r.id,
      entry_id: r.entry_id,
      armband_number: r.entries.armband_number,
      result_status: r.result_status,
      total_faults: r.total_faults || 0,
      search_time_seconds: r.search_time_seconds || 0,
      points_earned: r.points_earned || 0,
      is_excused: r.entries.is_excused || false
    }));

    // Calculate placements based on competition type
    const placements = isNationals
      ? calculateNationalsPlacements(resultsForPlacement)
      : calculateRegularPlacements(resultsForPlacement);

    // Update all results with their placements
    const updates = Array.from(placements.entries()).map(([resultId, placement]) => ({
      id: resultId,
      final_placement: placement
    }));

    // Clear placements for non-qualified dogs
    const nonQualifiedIds = resultsForPlacement
      .filter(r => !placements.has(r.id))
      .map(r => r.id);

    // Batch update placements
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('results')
          .update({ final_placement: update.final_placement })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating placement for result ${update.id}:`, updateError);
        }
      }

      console.log(`✅ Updated ${updates.length} placements for class ${classId}`);
    }

    // Clear placements for non-qualified
    if (nonQualifiedIds.length > 0) {
      const { error: clearError } = await supabase
        .from('results')
        .update({ final_placement: null })
        .in('id', nonQualifiedIds);

      if (clearError) {
        console.error('Error clearing placements:', clearError);
      }
    }

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