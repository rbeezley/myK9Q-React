/**
 * Novice Class Grouping Utilities
 *
 * Pure utility functions for grouping Novice A/B classes together.
 * Extracted from ClassList.tsx for better testability and reusability.
 */

import type { ClassEntry } from '../hooks/useClassListData';

/**
 * Find the paired Novice class for a given class entry
 *
 * For Novice level classes, finds the matching class with the opposite section:
 * - Novice A pairs with Novice B
 * - Novice B pairs with Novice A
 *
 * @param clickedClass - The class entry to find a pair for
 * @param allClasses - Complete list of all classes to search within
 * @returns The paired class entry, or null if no pair exists
 *
 * @example
 * ```typescript
 * const noviceA = { element: 'Interiors', level: 'Novice', section: 'A', ... };
 * const paired = findPairedNoviceClass(noviceA, classes);
 * // Returns the matching Novice B class if it exists
 * ```
 */
export function findPairedNoviceClass(
  clickedClass: ClassEntry,
  allClasses: ClassEntry[]
): ClassEntry | null {
  // Only proceed if this is a Novice level class
  if (clickedClass.level !== 'Novice') {
    return null;
  }

  // Determine the paired section (A <-> B)
  const pairedSection = clickedClass.section === 'A' ? 'B' : 'A';

  // Find the matching class with same element, level, but different section
  const paired = allClasses.find(c =>
    c.element === clickedClass.element &&
    c.level === clickedClass.level &&
    c.section === pairedSection
  );

  return paired || null;
}

/**
 * Group Novice A/B classes into combined entries
 *
 * Processes a list of classes and combines matching Novice A/B pairs into
 * single "A & B" entries with aggregated data. This reduces visual clutter
 * and provides a unified view of related classes.
 *
 * **Combination rules:**
 * - Only Novice level classes with section 'A' or 'B' are combined
 * - Classes must match on `element` and `level`
 * - Combined entry uses section 'A' as primary ID
 * - Entry counts, completion counts, and dog arrays are merged
 * - Favorite status is true if either class is favorited
 *
 * @param classList - Original list of class entries
 * @param findPaired - Optional custom function to find paired classes (defaults to findPairedNoviceClass)
 * @returns New array with Novice A/B classes combined, other classes unchanged
 *
 * @example
 * ```typescript
 * const classes = [
 *   { id: 1, element: 'Interiors', level: 'Novice', section: 'A', entry_count: 10, ... },
 *   { id: 2, element: 'Interiors', level: 'Novice', section: 'B', entry_count: 8, ... },
 *   { id: 3, element: 'Containers', level: 'Advanced', section: 'A', entry_count: 5, ... }
 * ];
 *
 * const grouped = groupNoviceClasses(classes);
 * // Returns:
 * // [
 * //   { id: 1, element: 'Interiors', level: 'Novice', section: 'A & B', entry_count: 18, ... },
 * //   { id: 3, element: 'Containers', level: 'Advanced', section: 'A', entry_count: 5, ... }
 * // ]
 * ```
 */
export function groupNoviceClasses(
  classList: ClassEntry[],
  findPaired: (classEntry: ClassEntry, allClasses: ClassEntry[]) => ClassEntry | null = findPairedNoviceClass
): ClassEntry[] {
  const grouped: ClassEntry[] = [];
  const processedIds = new Set<number>();

  for (const classEntry of classList) {
    // Skip if already processed as part of a pair
    if (processedIds.has(classEntry.id)) continue;

    // Check if this is a Novice class with section A or B
    if (classEntry.level === 'Novice' && (classEntry.section === 'A' || classEntry.section === 'B')) {
      // Find the paired class
      const paired = findPaired(classEntry, classList);

      if (paired) {
        // Mark both as processed
        processedIds.add(classEntry.id);
        processedIds.add(paired.id);

        // Determine which class comes first (use class_order or section)
        const first = classEntry.section === 'A' ? classEntry : paired;
        const second = classEntry.section === 'A' ? paired : classEntry;

        // Create combined entry
        const combined: ClassEntry = {
          ...first, // Use first class as base
          id: first.id, // Primary ID for navigation
          section: 'A & B', // Combined section label
          class_name: `${first.element} ${first.level} A & B`, // Combined name
          entry_count: first.entry_count + second.entry_count, // Sum entries
          completed_count: first.completed_count + second.completed_count, // Sum completed
          dogs: [...first.dogs, ...second.dogs], // Merge dogs array
          is_favorite: first.is_favorite || second.is_favorite, // Favorite if either is favorited
          // Store paired ID for navigation
          pairedClassId: second.id
        };

        grouped.push(combined);
      } else {
        // No pair found, add as-is
        grouped.push(classEntry);
      }
    } else {
      // Not a Novice A/B class, add as-is
      grouped.push(classEntry);
    }
  }

  return grouped;
}

/**
 * Check if a class entry is a combined Novice A & B entry
 *
 * @param classEntry - The class entry to check
 * @returns True if this is a combined entry with section 'A & B'
 *
 * @example
 * ```typescript
 * const combined = { section: 'A & B', pairedClassId: 123, ... };
 * const single = { section: 'A', ... };
 *
 * isCombinedNoviceEntry(combined); // true
 * isCombinedNoviceEntry(single);   // false
 * ```
 */
export function isCombinedNoviceEntry(classEntry: ClassEntry): boolean {
  return classEntry.section === 'A & B' && !!classEntry.pairedClassId;
}

/**
 * Get all class IDs from a potentially combined entry
 *
 * If the entry is a combined Novice A & B class, returns both IDs.
 * Otherwise returns just the single class ID.
 *
 * @param classEntry - The class entry to extract IDs from
 * @returns Array of class IDs (length 1 for single, length 2 for combined)
 *
 * @example
 * ```typescript
 * const combined = { id: 1, pairedClassId: 2, section: 'A & B', ... };
 * const single = { id: 3, section: 'A', ... };
 *
 * getClassIds(combined); // [1, 2]
 * getClassIds(single);   // [3]
 * ```
 */
export function getClassIds(classEntry: ClassEntry): number[] {
  if (isCombinedNoviceEntry(classEntry)) {
    return [classEntry.id, classEntry.pairedClassId!];
  }
  return [classEntry.id];
}
