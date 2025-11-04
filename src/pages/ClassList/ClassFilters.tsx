import React, { useMemo } from 'react';
import { Clock, Heart, CheckCircle } from 'lucide-react';
import { TabBar, Tab, SearchSortControls } from '../../components/ui';
import type { SortOption } from '../../components/ui';
import { getClassDisplayStatus } from '../../utils/statusUtils';

interface ClassEntry {
  id: number;
  element: string;
  level: string;
  section: string;
  class_name: string;
  class_order: number;
  judge_name: string;
  entry_count: number;
  completed_count: number;
  class_status: 'no-status' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
  is_completed?: boolean;
  is_favorite: boolean;
  time_limit_seconds?: number;
  time_limit_area2_seconds?: number;
  time_limit_area3_seconds?: number;
  area_count?: number;
  start_time?: string;
  briefing_time?: string;
  break_until?: string;
  dogs: {
    id: number;
    armband: number;
    call_name: string;
    breed: string;
    handler: string;
    in_ring: boolean;
    checkin_status: number;
    is_scored: boolean;
  }[];
}

interface ClassFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: 'class_order' | 'element_level' | 'level_element';
  setSortOrder: (order: 'class_order' | 'element_level' | 'level_element') => void;
  combinedFilter: 'pending' | 'favorites' | 'completed';
  setCombinedFilter: (filter: 'pending' | 'favorites' | 'completed') => void;
  isSearchCollapsed: boolean;
  setIsSearchCollapsed: (collapsed: boolean) => void;
  classes: ClassEntry[];
  filteredClasses: ClassEntry[];
  hapticFeedback: {
    light: () => void;
    medium: () => void;
    heavy: () => void;
  };
}

export const ClassFilters: React.FC<ClassFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  combinedFilter,
  setCombinedFilter,
  isSearchCollapsed,
  setIsSearchCollapsed,
  classes,
  filteredClasses,
  hapticFeedback,
}) => {
  // Prepare tabs for TabBar component
  const tabs: Tab[] = useMemo(() => [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock className="tab-icon" size={16} />,
      count: classes.filter(c => getClassDisplayStatus(c) !== 'completed').length
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Heart className="tab-icon" size={16} />,
      count: classes.filter(c => c.is_favorite).length
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="tab-icon" size={16} />,
      count: classes.filter(c => getClassDisplayStatus(c) === 'completed').length
    }
  ], [classes]);

  // Prepare sort options for SearchSortControls component
  const sortOptions: SortOption[] = useMemo(() => [
    { value: 'class_order', label: 'Class Order' },
    { value: 'element_level', label: 'Element' },
    { value: 'level_element', label: 'Level' }
  ], []);

  const handleTabChange = (tabId: string) => {
    hapticFeedback.light();
    setCombinedFilter(tabId as 'pending' | 'favorites' | 'completed');
  };

  return (
    <>
      {/* Search and Sort Controls */}
      <SearchSortControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search class name, element, level, judge..."
        sortOptions={sortOptions}
        sortOrder={sortOrder}
        onSortChange={(value) => setSortOrder(value as 'class_order' | 'element_level' | 'level_element')}
        isCollapsed={isSearchCollapsed}
        onToggleCollapse={() => setIsSearchCollapsed(!isSearchCollapsed)}
        resultsLabel={`${filteredClasses.length} of ${classes.length} classes`}
      />

      {/* Combined Class Filter Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={combinedFilter}
        onTabChange={handleTabChange}
      />
    </>
  );
};
