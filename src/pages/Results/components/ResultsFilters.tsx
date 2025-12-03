// src/pages/Results/components/ResultsFilters.tsx
import type { ResultsFilters as Filters } from '../hooks/useResultsData';
import './ResultsFilters.css';

const ELEMENTS = ['Container', 'Interior', 'Exterior', 'Buried', 'Handler Discrimination'];
const LEVELS = ['Novice A', 'Novice B', 'Advanced', 'Excellent', 'Masters'];

interface ResultsFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  resultCount: number;
}

export function ResultsFilters({ filters, onFilterChange, resultCount }: ResultsFiltersProps) {
  return (
    <div className="results-filters">
      <div className="results-filters__group">
        <label htmlFor="element-filter">Element</label>
        <select
          id="element-filter"
          value={filters.element || ''}
          onChange={(e) => onFilterChange({ ...filters, element: e.target.value || null })}
        >
          <option value="">All Elements</option>
          {ELEMENTS.map((el) => (
            <option key={el} value={el}>{el}</option>
          ))}
        </select>
      </div>

      <div className="results-filters__group">
        <label htmlFor="level-filter">Level</label>
        <select
          id="level-filter"
          value={filters.level || ''}
          onChange={(e) => onFilterChange({ ...filters, level: e.target.value || null })}
        >
          <option value="">All Levels</option>
          {LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
      </div>

      <div className="results-filters__count">
        Showing {resultCount} class{resultCount !== 1 ? 'es' : ''}
      </div>
    </div>
  );
}
