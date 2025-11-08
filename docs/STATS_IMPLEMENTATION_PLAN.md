# Stats Feature Implementation Plan

## Overview
Build a hierarchical stats dashboard with drill-down navigation (Show → Trial → Class) featuring visually stunning charts using Recharts. All roles can access. Stats show completed classes only, with persistent breed AND judge filtering across all levels.

**Estimated Time**: 10-12 days
**Complexity**: Medium-High
**Dependencies**: Recharts chart library

---

## Phase 1: Foundation & Database Setup ⚡ CRITICAL

### Database Migration & Optimization
- [ ] Create new migration file `044_stats_views_and_indexes.sql`
- [ ] Add indexes for performance:
  ```sql
  CREATE INDEX idx_entries_breed_scored ON entries(dog_breed, is_scored);
  CREATE INDEX idx_entries_time_qualified ON entries(search_time_seconds)
    WHERE result_status = 'qualified';
  ```
- [ ] Create optimized stats view:
  ```sql
  CREATE OR REPLACE VIEW view_stats_summary AS
  SELECT
    t.id as trial_id,
    t.trial_date,
    c.id as class_id,
    c.element,
    c.level,
    c.judge_name,
    e.dog_breed,
    e.armband_number,
    e.dog_call_name,
    e.handler_name,
    e.result_status,
    e.is_scored,
    e.search_time_seconds,
    e.total_faults,
    e.final_placement
  FROM trials t
  JOIN classes c ON c.trial_id = t.id
  JOIN entries e ON e.class_id = c.id
  WHERE e.is_scored = true;
  ```
- [ ] Test migration locally
- [ ] Deploy to Supabase

### Install Dependencies
- [ ] Run `npm install recharts`
- [ ] Run `npm install --save-dev @types/recharts`
- [ ] Verify bundle size impact (should be ~95KB gzipped)

### Create File Structure
- [ ] Create `src/pages/Stats/` directory
- [ ] Create `src/pages/Stats/Stats.tsx`
- [ ] Create `src/pages/Stats/Stats.css`
- [ ] Create `src/pages/Stats/hooks/` directory
- [ ] Create `src/pages/Stats/hooks/useStatsData.ts`
- [ ] Create `src/pages/Stats/components/` directory
- [ ] Create `src/pages/Stats/types/stats.types.ts`

### Add Routing
- [ ] Update `src/App.tsx` with lazy-loaded Stats component
- [ ] Add route `/stats`
- [ ] Add route `/stats/trial/:trialId`
- [ ] Add route `/stats/trial/:trialId/class/:classId`
- [ ] Wrap routes in `<ProtectedRoute>` and `<Suspense>`

---

## Phase 2: Data Layer

### TypeScript Interfaces
- [ ] Create `StatsData` interface with all metrics
- [ ] Create `BreedStat` interface
- [ ] Create `JudgeStat` interface (note: judge_name from classes table)
- [ ] Create `CleanSweepDog` interface with armband/handler for disambiguation
- [ ] Create `FastestTimeEntry` interface with tie-handling fields

### Data Fetching Hook
- [ ] Create `useStatsData` hook with React Query
- [ ] Add proper JOIN to get judge_name from classes table:
  ```typescript
  .select(`
    *,
    classes!inner(
      judge_name,
      element,
      level
    )
  `)
  ```
- [ ] Implement breed filtering (persistent via URL params)
- [ ] Implement judge filtering (persistent via URL params)
- [ ] Handle null/zero times in calculations
- [ ] Implement median calculation for robust averages
- [ ] Add tie-handling logic for fastest times
- [ ] Limit data fetching (top 10 breeds/judges, paginate times)
- [ ] Add error handling for no scored entries

### Clean Sweep Calculation
- [ ] Query dogs with multiple class entries
- [ ] Filter for 100% qualification rate
- [ ] Include armband + handler for same-name disambiguation
- [ ] Respect breed and judge filters

---

## Phase 3: Core UI Components

### Main Stats Component
- [ ] Create `Stats.tsx` with proper routing params
- [ ] Read breed/judge from URL search params for persistence
- [ ] Update URL when filters change (for bookmarkable links)
- [ ] Implement proper back button behavior with filters
- [ ] Add loading skeleton states
- [ ] Add empty state for no scored entries
- [ ] Add error boundary

### Navigation Components
- [ ] Create `StatsBreadcrumbs.tsx` with filter-aware navigation
- [ ] Add "Statistics" menu item to `HamburgerMenu.tsx` (all roles)
- [ ] Add stats button to Home page trial cards
- [ ] Add "View Class Stats" button to ClassList header

### Filter Components
- [ ] Create `StatsFilters.tsx` with breed AND judge dropdowns
- [ ] For mobile: Use bottom sheet/drawer pattern instead of dropdowns:
  ```typescript
  // Mobile: Bottom sheet
  // Desktop: Inline dropdowns
  const FilterComponent = isMobile ? BottomSheetFilters : InlineFilters;
  ```
- [ ] Add "Clear All Filters" button
- [ ] Ensure filter persistence via URL params
- [ ] Add filter count indicator

### Summary Cards
- [ ] Create `StatsCards.tsx` with key metrics
- [ ] Total entries / Scored entries
- [ ] Qualification rate percentage
- [ ] Fastest time with dog name
- [ ] Average/median time
- [ ] Mobile: 2 columns, Desktop: 4 columns grid

---

## Phase 4: Chart Components

### Qualification Pie Chart
- [ ] Create `QualificationChart.tsx` using Recharts PieChart
- [ ] Show Q/NQ/Excused/Absent/Withdrawn distribution
- [ ] Use CSS variable colors for theming
- [ ] Add percentage labels
- [ ] Implement click-to-filter functionality
- [ ] Add ARIA labels for accessibility
- [ ] Provide text alternative for screen readers

### Breed Performance Bar Chart
- [ ] Create `BreedPerformanceChart.tsx` using Recharts BarChart
- [ ] Limit to top 10 breeds + "Other" category
- [ ] Color gradient based on qualification rate
- [ ] Click bar to filter by breed
- [ ] Rotate labels on mobile (-45 degrees)
- [ ] Add tooltip with detailed stats
- [ ] Mobile: Max 8 categories

### Judge Performance Bar Chart
- [ ] Create `JudgePerformanceChart.tsx` using Recharts BarChart
- [ ] Show qualification rate by judge
- [ ] Include classes judged count in tooltip
- [ ] Click bar to filter by judge
- [ ] Handle null judge names ("TBD")
- [ ] Mobile-optimized label rotation

### Fastest Times Table
- [ ] Create `FastestTimesTable.tsx` component
- [ ] Implement pagination (mobile: 10/page, desktop: 20/page)
- [ ] Handle ties properly (same rank, skip next)
- [ ] Horizontal scroll on mobile
- [ ] Show armband, dog name, handler, breed, time
- [ ] Add rank column with tie indicators

### Clean Sweep Section (Show-level only)
- [ ] Create `CleanSweepSection.tsx` component
- [ ] Display dogs with 100% qualification across all elements
- [ ] Show armband + handler for disambiguation
- [ ] Click to navigate to `/dog/:armband`
- [ ] Respect breed and judge filters
- [ ] "Perfect Record" badge styling

---

## Phase 5: Mobile Optimization

### Touch Targets
- [ ] All interactive elements minimum 44x44px
- [ ] Filter buttons use `--min-touch-target`
- [ ] Chart bars/segments are tappable

### Responsive Layouts
- [ ] Mobile: Stack all charts vertically
- [ ] Tablet: 2-column chart grid
- [ ] Desktop: Side-by-side charts
- [ ] Implement chart container with proper aspect ratios

### Mobile-Specific Features
- [ ] Bottom sheet for filters (not dropdowns)
- [ ] Swipe gestures between stat categories
- [ ] Tap to expand charts to full screen
- [ ] Loading skeletons matching chart shapes
- [ ] Horizontal scroll for data tables

---

## Phase 6: Advanced Features

### Export Functionality
- [ ] Add export button (admin/judge only via `usePermission`)
- [ ] Implement CSV export with proper formatting
- [ ] Implement PDF export using existing `reportService` pattern
- [ ] Include all active filters in export
- [ ] Add timestamp to exported files

### Real-Time Updates
- [ ] Integrate with Supabase subscriptions
- [ ] Subscribe to entries table changes
- [ ] Refresh stats when new scores come in
- [ ] Show refresh indicator when updating
- [ ] Debounce rapid updates (2-second delay)

### Performance Optimizations
- [ ] Code-split Recharts (dynamic import)
- [ ] Memoize expensive calculations
- [ ] Virtual scrolling for long breed/judge lists
- [ ] Implement 5-minute cache with React Query
- [ ] Lazy load Clean Sweep section

### Accessibility
- [ ] Color-blind friendly chart colors (use patterns)
- [ ] Keyboard navigation for all interactions
- [ ] ARIA labels on all chart elements
- [ ] Screen reader announcements for filters
- [ ] Focus management on drill-down
- [ ] High contrast mode support

---

## Phase 7: CSS & Styling

### Follow CSS Architecture
- [ ] Use design tokens exclusively (no hardcoded values)
- [ ] Mobile-first approach
- [ ] One media query block per breakpoint
- [ ] Reference existing patterns from Home.css
- [ ] Create Stats.css following CLAUDE.md guidelines:
  ```css
  /* Base/Mobile */
  .stats-container {
    padding: 0 var(--token-space-lg);
  }

  /* Tablet */
  @media (min-width: 640px) {
    .stats-container {
      padding: 0 var(--token-space-xl);
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .stats-container {
      padding: 0 var(--token-space-3xl);
    }
  }
  ```

### Dark Mode Support
- [ ] Chart colors use CSS variables
- [ ] Gridlines adapt to theme
- [ ] Tooltips match theme
- [ ] Export maintains theme preference

---

## Phase 8: Testing

### Unit Tests (Vitest)
- [ ] Test stats calculation functions
- [ ] Test tie-handling logic
- [ ] Test median/average calculations
- [ ] Test breed grouping (top 10 + other)
- [ ] Test filter persistence
- [ ] Test empty state handling

### Integration Tests
- [ ] Test data fetching with mock Supabase
- [ ] Test real-time subscription updates
- [ ] Test filter interactions
- [ ] Test drill-down navigation
- [ ] Test export functionality

### E2E Tests (Playwright)
- [ ] Test full drill-down flow (Show → Trial → Class)
- [ ] Test filter persistence across navigation
- [ ] Test chart interactions
- [ ] Test mobile bottom sheet
- [ ] Test export and download

---

## Phase 9: Documentation

### User Documentation
- [ ] Add stats feature to user guide
- [ ] Document filter behavior
- [ ] Document export formats
- [ ] Add tooltips for complex metrics

### Developer Documentation
- [ ] Document stats calculation logic
- [ ] Document database views and indexes
- [ ] Document performance considerations
- [ ] Add JSDoc comments to functions

---

## Completion Checklist

### Critical Requirements
- [ ] ✅ All users can access stats
- [ ] ✅ Show/Trial/Class drill-down works
- [ ] ✅ Breed filter persists across navigation
- [ ] ✅ Judge filter persists across navigation
- [ ] ✅ URL params store both filters
- [ ] ✅ Charts are mobile-responsive
- [ ] ✅ Clean sweep shows 100% qualified dogs
- [ ] ✅ Fastest times handle ties correctly
- [ ] ✅ Export works for admin/judge roles

### Performance Metrics
- [ ] Initial load < 2 seconds
- [ ] Chart render < 500ms
- [ ] Filter update < 200ms
- [ ] Export generation < 3 seconds
- [ ] Bundle size increase < 150KB

### Quality Checks
- [ ] No TypeScript errors
- [ ] No hardcoded colors/spacing
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] Works offline (cached data)

---

## Risk Mitigation

### Known Issues to Address
1. **Judge data requires JOIN** - judge_name is in classes table, not entries
2. **Mobile dropdowns are poor UX** - use bottom sheet instead
3. **Large datasets need pagination** - limit to top 10/20 items
4. **Ties in times need special handling** - same rank, skip next
5. **Real-time updates add complexity** - debounce rapid changes

### Fallback Plans
1. If Recharts too heavy → Use CSS-only charts
2. If real-time too complex → Manual refresh button only
3. If export takes too long → Email download link
4. If filters too slow → Remove judge filter initially

---

## Timeline

### Week 1
- Days 1-2: Database setup, migrations, indexes
- Days 3-4: Core data layer and hooks
- Day 5: Main Stats component and routing

### Week 2
- Day 6: Chart components (Pie, Bar)
- Day 7: Tables and Clean Sweep
- Day 8: Mobile optimization and filters
- Day 9: Export and real-time features
- Day 10: Testing and bug fixes

### Week 3 (Buffer)
- Days 11-12: Polish, documentation, deployment

---

## Success Metrics

- [ ] 100% of users can view stats
- [ ] < 2% error rate in production
- [ ] > 50% of users apply at least one filter
- [ ] > 20% of admin/judges use export feature
- [ ] < 5 bug reports in first week

---

## Notes

- Judge filtering is more complex than initially planned due to database schema
- Mobile UX needs special attention - bottom sheets, not dropdowns
- Performance is critical - paginate and limit data
- Real-time updates should be debounced to prevent UI thrashing
- Export feature should follow existing reportService patterns

---

**Last Updated**: November 6, 2024
**Status**: Planning Complete - Ready for Implementation
**Assigned**: TBD