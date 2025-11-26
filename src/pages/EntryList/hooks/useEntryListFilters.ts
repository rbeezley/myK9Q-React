import { useState, useMemo, useCallback } from 'react';
import { Entry } from '../../../stores/entryStore';

export type TabType = 'pending' | 'completed';
export type SortType = 'armband' | 'name' | 'handler' | 'breed' | 'manual' | 'run' | 'placement';
export type SectionFilter = 'all' | 'A' | 'B';

interface UseEntryListFiltersOptions {
  entries: Entry[];
  /** Enable manual sort option (default: false) */
  supportManualSort?: boolean;
  /** Enable section filter for combined views (default: false) */
  supportSectionFilter?: boolean;
  /** Sort in-ring dogs first (default: false) */
  prioritizeInRing?: boolean;
  /** Sort pulled dogs last (default: false) */
  deprioritizePulled?: boolean;
  /** External manual order array (for drag-and-drop state) */
  manualOrder?: Entry[];
  /** Default sort type (default: 'armband') */
  defaultSort?: SortType;
}

/**
 * Shared hook for filtering, sorting, and searching entries.
 * Supports both single class and combined class views.
 *
 * **Sorting Features:**
 * - **armband**: Sort by armband number
 * - **name**: Sort by call name alphabetically
 * - **handler**: Sort by handler name alphabetically
 * - **breed**: Sort by breed alphabetically
 * - **run**: Sort by exhibitor order (run order)
 * - **placement**: Sort by placement (scored entries only)
 * - **manual**: Sort by external manualOrder array (for drag-and-drop)
 *
 * **Priority Sorting:**
 * - **prioritizeInRing**: In-ring dogs always appear first
 * - **deprioritizePulled**: Pulled dogs always appear last
 *
 * @example
 * ```tsx
 * // Basic usage (CombinedEntryList)
 * const { filteredEntries, searchTerm, setSearchTerm } = useEntryListFilters({
 *   entries: localEntries,
 *   supportSectionFilter: true
 * });
 *
 * // Full usage (EntryList with drag-and-drop)
 * const { filteredEntries, sortBy, setSortBy } = useEntryListFilters({
 *   entries: localEntries,
 *   prioritizeInRing: true,
 *   deprioritizePulled: true,
 *   manualOrder: manualOrder,
 *   defaultSort: 'run'
 * });
 * ```
 */
export const useEntryListFilters = ({
  entries,
  supportManualSort = false,
  supportSectionFilter = false,
  prioritizeInRing = false,
  deprioritizePulled = false,
  manualOrder,
  defaultSort = 'armband'
}: UseEntryListFiltersOptions) => {
  // Filter and sort state
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [sortBy, setSortBy] = useState<SortType>(defaultSort);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');

  /**
   * Filter entries by tab (pending/completed)
   */
  const filterByTab = useCallback((entry: Entry, tab: TabType): boolean => {
    if (tab === 'completed') {
      return entry.isScored;
    }
    return !entry.isScored;
  }, []);

  /**
   * Filter entries by section (for combined view)
   */
  const filterBySection = useCallback((entry: Entry, section: SectionFilter): boolean => {
    if (!supportSectionFilter || section === 'all') return true;
    return entry.section === section;
  }, [supportSectionFilter]);

  /**
   * Filter entries by search term
   */
  const filterBySearch = useCallback((entry: Entry, term: string): boolean => {
    if (!term) return true;
    const searchLower = term.toLowerCase();
    return (
      entry.armband?.toString().includes(searchLower) ||
      entry.callName?.toLowerCase().includes(searchLower) ||
      entry.breed?.toLowerCase().includes(searchLower) ||
      entry.handler?.toLowerCase().includes(searchLower)
    );
  }, []);

  /**
   * Sort entries based on sort type with priority handling
   */
  const sortEntries = useCallback((a: Entry, b: Entry, sortType: SortType): number => {
    // PRIORITY 1: In-ring dogs ALWAYS come first (if enabled)
    if (prioritizeInRing) {
      const aIsInRing = a.inRing || a.status === 'in-ring';
      const bIsInRing = b.inRing || b.status === 'in-ring';
      if (aIsInRing && !bIsInRing) return -1;
      if (!aIsInRing && bIsInRing) return 1;
    }

    // PRIORITY 2: Pulled dogs go to the end (if enabled)
    if (deprioritizePulled) {
      const aIsPulled = a.status === 'pulled';
      const bIsPulled = b.status === 'pulled';
      if (aIsPulled && !bIsPulled) return 1;
      if (!aIsPulled && bIsPulled) return -1;
    }

    // PRIORITY 3: Apply normal sorting
    switch (sortType) {
      case 'manual':
        // Manual sort uses external manualOrder array if provided
        if (manualOrder && manualOrder.length > 0) {
          const aIndex = manualOrder.findIndex(entry => entry.id === a.id);
          const bIndex = manualOrder.findIndex(entry => entry.id === b.id);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
        }
        // Fallback to exhibitorOrder from database
        return (a.exhibitorOrder || 0) - (b.exhibitorOrder || 0);

      case 'run': {
        // Run order uses exhibitorOrder, fallback to armband
        const aOrder = a.exhibitorOrder || a.armband;
        const bOrder = b.exhibitorOrder || b.armband;
        return aOrder - bOrder;
      }

      case 'placement': {
        // Sort by placement, entries without placement go last
        const aPlacement = a.placement || 999;
        const bPlacement = b.placement || 999;
        if (aPlacement !== bPlacement) {
          return aPlacement - bPlacement;
        }
        // Tie-breaker: armband
        return (a.armband || 0) - (b.armband || 0);
      }

      case 'armband':
        return (a.armband || 0) - (b.armband || 0);

      case 'name':
        return (a.callName || '').localeCompare(b.callName || '');

      case 'handler':
        return (a.handler || '').localeCompare(b.handler || '');

      case 'breed':
        return (a.breed || '').localeCompare(b.breed || '');

      default:
        return 0;
    }
  }, [prioritizeInRing, deprioritizePulled, manualOrder]);

  /**
   * Filtered and sorted entries
   */
  const filteredEntries = useMemo(() => {
    const filtered = entries.filter((entry) => {
      return (
        filterByTab(entry, activeTab) &&
        filterBySection(entry, sectionFilter) &&
        filterBySearch(entry, searchTerm)
      );
    });

    // Sort the filtered entries (create copy to avoid mutating)
    return [...filtered].sort((a, b) => sortEntries(a, b, sortBy));
  }, [entries, activeTab, sectionFilter, searchTerm, sortBy, filterByTab, filterBySection, filterBySearch, sortEntries]);

  /**
   * Count entries by tab
   */
  const entryCounts = useMemo(() => {
    const pending = entries.filter((e) => filterByTab(e, 'pending')).length;
    const completed = entries.filter((e) => filterByTab(e, 'completed')).length;
    return { pending, completed };
  }, [entries, filterByTab]);

  /**
   * Pending and completed entries (filtered by tab, search, section)
   */
  const pendingEntries = useMemo(() => filteredEntries.filter(e => !e.isScored), [filteredEntries]);
  const completedEntries = useMemo(() => filteredEntries.filter(e => e.isScored), [filteredEntries]);

  /**
   * Count entries by section (for combined view)
   */
  const sectionCounts = useMemo(() => {
    if (!supportSectionFilter) return null;
    return {
      all: entries.length,
      A: entries.filter((e) => e.section === 'A').length,
      B: entries.filter((e) => e.section === 'B').length
    };
  }, [entries, supportSectionFilter]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSortBy(defaultSort);
    setSectionFilter('all');
  }, [defaultSort]);

  return {
    // State
    activeTab,
    sortBy,
    searchTerm,
    sectionFilter,

    // Setters
    setActiveTab,
    setSortBy,
    setSearchTerm,
    setSectionFilter,

    // Computed
    filteredEntries,
    pendingEntries,
    completedEntries,
    entryCounts,
    sectionCounts,

    // Actions
    resetFilters,

    // Helpers
    supportManualSort,
    supportSectionFilter
  };
};
