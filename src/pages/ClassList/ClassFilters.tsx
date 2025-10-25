import React from 'react';
import { Search, X, ArrowUpDown, ChevronDown, Clock, Heart, CheckCircle } from 'lucide-react';
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
  class_status: 'none' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
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
  return (
    <>
      {/* Search and Sort Header */}
      <div className="search-controls-header">
        <button
          className={`search-toggle-icon ${!isSearchCollapsed ? 'active' : ''}`}
          onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}
          aria-label={isSearchCollapsed ? "Show search and sort options" : "Hide search and sort options"}
          title={isSearchCollapsed ? "Show search and sort options" : "Hide search and sort options"}
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        <span className="search-controls-label">
          {searchTerm ? `Found ${filteredClasses.length} of ${classes.length} classes` : 'Search & Sort'}
        </span>
      </div>

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="search-results-header">
          <div className="search-results-summary">
            {filteredClasses.length} of {classes.length} classes
          </div>
        </div>
      )}

      {/* Collapsible Search and Sort Container */}
      <div className={`search-sort-container ${isSearchCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18}  style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search class name, element, level, judge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-full"
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            </button>
          )}
        </div>

        <div className="sort-controls">
          <button
            className={`sort-btn ${sortOrder === 'class_order' ? 'active' : ''}`}
            onClick={() => setSortOrder('class_order')}
          >
            <ArrowUpDown size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            Class Order
          </button>
          <button
            className={`sort-btn ${sortOrder === 'element_level' ? 'active' : ''}`}
            onClick={() => setSortOrder('element_level')}
          >
            <ArrowUpDown size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            Element
          </button>
          <button
            className={`sort-btn ${sortOrder === 'level_element' ? 'active' : ''}`}
            onClick={() => setSortOrder('level_element')}
          >
            <ArrowUpDown size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            Level
          </button>
        </div>
      </div>

      {/* Combined Class Filter Tabs */}
      <div className="status-tabs">
        <button
          className={`tab-button ${combinedFilter === 'pending' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.light();
            setCombinedFilter('pending');
          }}
        >
          <Clock className="tab-icon" />
          <span className="tab-text">
            Pending ({classes.filter(c => getClassDisplayStatus(c) !== 'completed').length})
          </span>
        </button>
        <button
          className={`tab-button ${combinedFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.light();
            setCombinedFilter('favorites');
          }}
        >
          <Heart className="tab-icon" />
          <span className="tab-text">
            Favorites ({classes.filter(c => c.is_favorite).length})
          </span>
        </button>
        <button
          className={`tab-button ${combinedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.light();
            setCombinedFilter('completed');
          }}
        >
          <CheckCircle className="tab-icon" />
          <span className="tab-text">
            Completed ({classes.filter(c => getClassDisplayStatus(c) === 'completed').length})
          </span>
        </button>
      </div>
    </>
  );
};
