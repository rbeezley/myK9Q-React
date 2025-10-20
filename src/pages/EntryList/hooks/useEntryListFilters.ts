import { useState, useMemo } from 'react';
import { Entry } from '../../../stores/entryStore';

export type TabType = 'pending' | 'completed';
export type SortType = 'armband' | 'name' | 'handler' | 'breed' | 'manual';
export type SectionFilter = 'all' | 'A' | 'B';

interface UseEntryListFiltersOptions {
  entries: Entry[];
  supportManualSort?: boolean;
  supportSectionFilter?: boolean;
}

/**
 * Shared hook for filtering, sorting, and searching entries.
 * Supports both single class and combined class views.
 */
export const useEntryListFilters = ({
  entries,
  supportManualSort = false,
  supportSectionFilter = false
}: UseEntryListFiltersOptions) => {
  // Filter and sort state
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [sortBy, setSortBy] = useState<SortType>('armband');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');

  /**
   * Filter entries by tab (pending/completed)
   */
  const filterByTab = (entry: Entry, tab: TabType): boolean => {
    if (tab === 'completed') {
      return entry.isScored;
    }
    return !entry.isScored;
  };

  /**
   * Filter entries by section (for combined view)
   */
  const filterBySection = (entry: Entry, section: SectionFilter): boolean => {
    if (!supportSectionFilter || section === 'all') return true;
    return entry.section === section;
  };

  /**
   * Filter entries by search term
   */
  const filterBySearch = (entry: Entry, term: string): boolean => {
    if (!term) return true;
    const searchLower = term.toLowerCase();
    return (
      entry.armband?.toString().includes(searchLower) ||
      entry.callName?.toLowerCase().includes(searchLower) ||
      entry.breed?.toLowerCase().includes(searchLower) ||
      entry.handler?.toLowerCase().includes(searchLower)
    );
  };

  /**
   * Sort entries based on sort type
   */
  const sortEntries = (a: Entry, b: Entry, sortType: SortType): number => {
    // Manual sort uses exhibitorOrder from database
    if (sortType === 'manual') {
      return (a.exhibitorOrder || 0) - (b.exhibitorOrder || 0);
    }

    // For all other sort types, sort by the selected field
    switch (sortType) {
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
  };

  /**
   * Filtered and sorted entries
   */
  const filteredEntries = useMemo(() => {
    let filtered = entries.filter((entry) => {
      return (
        filterByTab(entry, activeTab) &&
        filterBySection(entry, sectionFilter) &&
        filterBySearch(entry, searchTerm)
      );
    });

    // Sort the filtered entries
    filtered.sort((a, b) => sortEntries(a, b, sortBy));

    return filtered;
  }, [entries, activeTab, sectionFilter, searchTerm, sortBy, filterByTab, filterBySection, filterBySearch, sortEntries]);

  /**
   * Count entries by tab
   */
  const entryCounts = useMemo(() => {
    const pending = entries.filter((e) => filterByTab(e, 'pending')).length;
    const completed = entries.filter((e) => filterByTab(e, 'completed')).length;
    return { pending, completed };
  }, [entries]);

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
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('armband');
    setSectionFilter('all');
  };

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
    entryCounts,
    sectionCounts,

    // Actions
    resetFilters,

    // Helpers
    supportManualSort,
    supportSectionFilter
  };
};
