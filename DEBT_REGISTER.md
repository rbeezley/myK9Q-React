# Technical Debt Register

**Project:** myK9Qv3
**Last Updated:** 2025-11-27
**Maintained By:** Development Team

## Summary

- **Total Debt Items:** 13 (9 resolved)
- **Critical:** 2 ✅ (2 resolved)
- **High:** 4 ✅ (4 resolved)
- **Medium:** 6 (2 resolved ✅)
- **Low:** 2
- **Estimated Total Effort:** 1-2 days (reduced from 15-20)

---

## Active Debt Items

### DEBT-008: High Complexity Functions (PARTIALLY RESOLVED)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Resolved (4 files):** 2025-11-26

**Location:**
- ~~`src/components/ui/OfflineIndicator.tsx` - complexity 45~~ ✅ REFACTORED
- ~~`src/hooks/usePrefetch.ts` - complexity 44~~ ✅ REFACTORED
- ~~`src/pages/Stats/hooks/useStatsData.ts` - complexity **86**~~ ✅ REFACTORED (extracted to statsDataHelpers.ts)
- ~~`src/pages/EntryList/SortableEntryCard.tsx` - complexity **64**~~ ✅ REFACTORED (extracted to sortableEntryCardUtils.ts + SortableEntryCardComponents.tsx)
- `src/pages/EntryList/hooks/useEntryListData.ts` - complexity 59 (worse than originally estimated)
- `src/pages/EntryList/hooks/useEntryListFilters.ts` - complexity 41
- `src/pages/scoresheets/AKC/AKCScentWorkScoresheet.tsx` - complexity 42
- Component/Module: Various

**Description:**
Multiple functions have cyclomatic complexity exceeding 15 (recommended max). Some reach **86**, indicating extremely complex branching logic.

**Impact:**
- **Business Impact:** Bugs in complex code are hard to reproduce and fix
- **Technical Impact:** Untestable, unmaintainable, error-prone
- **Risk:** Edge cases not covered, regressions likely

**Root Cause:**
Growing requirements without refactoring, lack of complexity linting.

**Solution Applied (Partial):**
1. ✅ Added ESLint complexity rule: `"complexity": ["error", 90]` (prevents worse)
2. ✅ Added ESLint max-depth rule: `"max-depth": ["error", 8]` (prevents deeper nesting)
3. ✅ Refactored `OfflineIndicator.tsx` - extracted helper and render functions
4. ✅ Refactored `usePrefetch.ts` - extracted cache helper functions
5. ✅ Refactored `useStatsData.ts` (complexity 86 → manageable) - extracted 430 lines to `statsDataHelpers.ts`
6. ✅ Refactored `SortableEntryCard.tsx` (complexity 64 → manageable) - extracted to `sortableEntryCardUtils.ts` + `SortableEntryCardComponents.tsx`
7. 🔄 Remaining 3 files need refactoring in future sprints

**Effort Estimate:** 1-2 days remaining for remaining files

**Priority Justification:**
Medium - important for maintainability. Worst offender (useStatsData.ts at 86) has been resolved.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: DEBT-009

**Status:** Partially Resolved (4 of 7 files)

**Assignee:** Unassigned

**Target Resolution:** Q2 2026

**Notes:**
- ESLint rules now prevent new code from being worse than current max
- TODO in eslint.config.js: Lower thresholds gradually: 90 → 50 → 30 → 15
- ~~`useStatsData.ts` with complexity 86 is critical to refactor next~~ ✅ DONE
- ~~`SortableEntryCard.tsx` with complexity 64 is next priority~~ ✅ DONE
- `useEntryListData.ts` with complexity 59 is next priority
- Consider using state machines for complex state logic

---

### DEBT-009: Deep Nesting (up to 11 levels)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/stores/announcementStore.ts` - 11 levels
  - `src/pages/EntryList/hooks/useEntryListData.ts` - 11 levels
  - `src/pages/Home/hooks/useHomeDashboardData.ts` - 9 levels
  - `src/pages/Stats/components/CleanSweepDiagnostic.tsx` - 9 levels
- Component/Module: Various

**Description:**
275 instances of code nested more than 4 levels deep. Worst cases reach 11 levels of nesting.

**Impact:**
- **Business Impact:** Slower development velocity
- **Technical Impact:** Extremely hard to read and maintain, difficult to test
- **Risk:** Logic errors hidden in deep branches

**Root Cause:**
Complex conditional logic, nested callbacks, nested JSX.

**Proposed Solution:**
1. Early returns to reduce nesting
2. Extract nested logic into helper functions
3. Use guard clauses
4. Flatten promise chains with async/await
5. Extract nested JSX into sub-components

**Effort Estimate:** 2-3 days

**Priority Justification:**
Medium - readability issue that compounds over time.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: DEBT-008

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Q2 2026

---

### DEBT-010: Magic Numbers (887 occurrences)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Location:**
- File(s): Throughout codebase
- Component/Module: Various

**Description:**
887 hardcoded numeric values found in the codebase without named constants.

**Impact:**
- **Business Impact:** Harder to adjust business rules
- **Technical Impact:** Unclear meaning, duplicated values, inconsistencies
- **Risk:** Changing a value in one place but not others

**Root Cause:**
Quick implementations without extracting constants.

**Proposed Solution:**
1. Identify business-critical magic numbers first
2. Create constants files by domain:
   - `src/constants/timing.ts` - timeouts, intervals
   - `src/constants/limits.ts` - max values, thresholds
   - `src/constants/scoring.ts` - scoring-related values
3. Replace magic numbers incrementally

**Effort Estimate:** 2-3 days

**Priority Justification:**
Medium - maintainability issue, fix opportunistically.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: None

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Ongoing

---

### DEBT-011: Weak TypeScript Typing (PARTIALLY RESOLVED)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Updated:** 2025-11-27

**Location:**
- File(s): Throughout codebase (~417 in production code, many in tests)
- Component/Module: Various

**Description:**
`any` type usage bypassing TypeScript's type safety. Actual count: ~417 in production code, many in test files (mocking).

**Impact:**
- **Business Impact:** Runtime errors that could be caught at compile time
- **Technical Impact:** Lost IDE support, no refactoring safety
- **Risk:** Type-related bugs in production

**Root Cause:**
Quick fixes, complex external types, migration from JavaScript.

**Progress (2025-11-27):**
Fixed 6 `any` types in core production files:
| File | Before | After | Change |
|------|--------|-------|--------|
| `useScoresheetCore.ts` | 2 `any` | 0 | `AreaScore[keyof AreaScore]` |
| `useAreaManagement.ts` | 2 `any` | 0 | `AreaScore[keyof AreaScore]` |
| `CreateAnnouncementModal.tsx` | 1 `any` | 0 | `'normal' \| 'high' \| 'urgent'` |
| `MaxTimeDialog.tsx` | 1 `any` | 0 | Inline interface |

**Remaining Categories:**
- **Test files (~150):** Keep - mocking requires `as any`
- **Debug/diagnostic (~30):** Low priority
- **Generic utilities (~50):** May need `any` for flexibility
- **Core business logic (~50):** High priority for future fixes

**Proposed Solution:**
1. ~~Enable `noImplicitAny` in tsconfig.json~~ (too aggressive for existing codebase)
2. ✅ Replace `any` with proper types incrementally
3. Use `unknown` for truly dynamic values
4. Create proper interfaces for complex objects
5. Use generics where appropriate

**Effort Estimate:** 2-3 days remaining

**Priority Justification:**
Medium - type safety is important but most `any` usage is in non-critical paths.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: None

**Status:** In Progress (6 fixed, ~50 high-priority remaining)

**Assignee:** Unassigned

**Target Resolution:** Ongoing

---

### DEBT-012: Long Parameter Lists (30 functions with >5 params)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/components/DogCard.tsx` - 12 parameters
  - `src/components/ui/CollapsibleSection.tsx` - 10 parameters
  - `src/components/ui/SettingsSearch.tsx` - 10 parameters
  - `src/pages/scoresheets/components/AreaInputs.tsx` - 9 parameters
  - `src/pages/scoresheets/components/TimerDisplay.tsx` - 9 parameters
- Component/Module: Various

**Description:**
30 functions/components have more than 5 parameters, making them hard to use and maintain.

**Impact:**
- **Business Impact:** Harder to use components correctly
- **Technical Impact:** Parameter order confusion, hard to test
- **Risk:** Wrong parameters passed, subtle bugs

**Root Cause:**
Organic growth of components without refactoring.

**Proposed Solution:**
1. Group related parameters into objects
2. Create proper TypeScript interfaces for props
3. Use React context for deeply-passed props
4. Consider component composition over configuration

**Effort Estimate:** 1-2 days

**Priority Justification:**
Medium - improves developer experience.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: DEBT-011

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Q2 2026

**Notes:**
- `DogCard` with 12 parameters is highest priority
- Example refactor:
  ```typescript
  // Before
  function DogCard(name, breed, status, score, time, ...)
  // After
  interface DogCardProps { dog: Dog; scoring: ScoringInfo; display: DisplayOptions; }
  function DogCard({ dog, scoring, display }: DogCardProps)
  ```

---

### DEBT-014: Missing TODO Implementation (6 TODOs Remaining)

**Category:** Code Quality

**Severity:** Low

**Created:** 2025-11-26

**Audited:** 2025-11-27

**Cleaned:** 2025-11-27

**Location (6 TODOs remaining):**
| File | TODO | Category | Status |
|------|------|----------|--------|
| `announcementStore.ts:268` | Remove once Edge Function working | Cleanup | Keep until confirmed |
| `Home-Apple.tsx:142` | Persist favorites | Feature | Low priority backlog |
| `settingsCloudSync.ts:36` | Integrate auth system | Architecture | Keep until decision |
| `performanceMonitoring.ts:311` | Analytics integration | Enhancement | Backlog if needed |
| `dataExportService.ts:116` | IndexedDB collection | Enhancement | Keep as reference |
| `ReplicatedEventStatisticsTable.ts:212` | Remove dormant table check | Cleanup | Keep until migration |

**Removed (2025-11-27):**
| File | TODO | Reason |
|------|------|--------|
| ~~`oneHandedMode.ts:212`~~ | ML tap detection | Too complex - users can set preference manually |
| ~~`DogDetails-Apple.tsx:482`~~ | Status update logic | Display-only page - updates via EntryList |

**Description:**
6 TODO comments remaining after cleanup. All are valid placeholders waiting for dependencies.

**Impact:**
- **Business Impact:** Minor - most are enhancements
- **Technical Impact:** Code clarity
- **Risk:** Low - no critical functionality missing

**Proposed Solution:**
1. ✅ Audited all 8 TODOs - categorized above
2. ✅ Removed 2 unnecessary TODOs (2025-11-27)
3. Keep remaining 6 TODOs until dependencies resolved

**Effort Estimate:** Complete - remaining TODOs are valid

**Priority Justification:**
Low - remaining TODOs are valid placeholders.

**Dependencies:**
- Blocks: None
- Blocked By: Edge Function deployment, event_statistics migration
- Related: None

**Status:** Audited - Actionable items identified

**Assignee:** Unassigned

**Target Resolution:** Ongoing

---

### DEBT-015: Large Files (500-1000 lines) - 22 files

**Category:** Code Quality

**Severity:** Low

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/App.tsx` (556 lines)
  - `src/services/announcementService.ts` (664 lines)
  - `src/services/nationalsScoring.ts` (521 lines)
  - `src/services/notificationService.ts` (797 lines)
  - `src/services/performanceMonitor.ts` (569 lines)
  - `src/stores/announcementStore.ts` (668 lines)
  - And 16 others...
- Component/Module: Various

**Description:**
22 files between 500-1000 lines (in addition to the 6 files over 1000 lines tracked separately).

**Impact:**
- **Business Impact:** Slower development in these areas
- **Technical Impact:** Harder to navigate and understand
- **Risk:** Increasing complexity over time

**Root Cause:**
Organic growth without regular refactoring.

**Proposed Solution:**
1. Apply same refactoring patterns as high-severity items
2. Extract when making changes in these files
3. Don't let them grow larger

**Effort Estimate:** Ongoing

**Priority Justification:**
Low - address opportunistically when modifying these files.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: DEBT-003 through DEBT-007

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Ongoing

---

## Resolved Debt Items

### ✅ DEBT-013: BUG Comments Not Addressed (RESOLVED)

**Category:** Code Quality | **Severity:** Medium | **Resolved:** 2025-11-27

**Original Problem:** DEBT_REGISTER reported 23 BUG comments in the codebase indicating known issues.

**Audit Findings:**
- **0 BUG comments** found in source code (`src/`)
- Original count was from documentation files or `tech_debt_analysis.json`
- No actual BUG-tagged comments exist in production code

**Resolution:** Audit confirmed no BUG comments in source - marking as resolved.

---

### ✅ DEBT-002: Legacy localStateManager Not Fully Removed (RESOLVED)

**Category:** Architecture | **Severity:** Critical | **Resolved:** 2025-11-26

**Original Problem:** The codebase had migrated from `localStateManager` to a new replication system, but legacy code remained with TODO comments stating: "Remove legacy localStateManager - replaced by replication system"

**Solution Applied:**
- All `localStateManager` references removed from source files
- Replication system fully handles all offline/sync use cases
- Legacy code paths eliminated
- No dual systems remain

**Results:**
- **Before:** Multiple files with legacy `localStateManager` code
- **After:** 0 references to `localStateManager` in src/
- Clean single-system architecture for offline data management

**Key Improvements:**
- Eliminated confusion from dual systems
- Single source of truth for offline data
- No risk of data inconsistencies between systems
- Simplified debugging and maintenance

---

### ✅ DEBT-001: Excessive Console Statements (RESOLVED)

**Category:** Code Quality | **Severity:** Critical | **Resolved:** 2025-11-26

**Original Problem:** 1,468 console.log/console.warn/console.error statements found throughout the codebase, causing bloated bundle size and potential data exposure.

**Solution Applied:**
- Added ESLint `no-console` rule with `warn` level (allowing console.warn/error)
- Configured ESLint ignores for non-production files (tests, temp files, edge functions)
- Added `eslint-disable no-console` for legitimate debug utilities (logger.ts, entryDebug.ts, etc.)
- Removed all console.log statements from 24+ source files
- Restored `--max-warnings 0` for strict enforcement

**Results:**
- **Before:** 218 lint warnings from console statements
- **After:** 0 warnings, strict enforcement restored
- **Files cleaned:** 24 source files
- **Debug utilities preserved:** 5 files with explicit eslint-disable

**Prevention:** ESLint `no-console: warn` rule now enforced with `--max-warnings 0` on all commits via pre-commit hook.

---

### ✅ DEBT-003: ReplicatedTable.ts Excessive Size (RESOLVED)

**Category:** Architecture | **Severity:** High | **Resolved:** 2025-11-26

**Original Problem:** Core replication table implementation had grown to 1,254 lines, far exceeding the recommended 500-line limit. Contained multiple responsibilities that should be separated.

**Solution Applied:**
Used composition pattern to extract focused modules:
- `DatabaseManager.ts` - Shared DB singleton, init, retry, corruption recovery (390 lines)
- `ReplicatedTableCache.ts` - TTL, eviction, stats, subscriptions (448 lines)
- `ReplicatedTableBatch.ts` - Batch operations, chunked processing (150 lines)
- `ReplicatedTable.ts` - Core CRUD operations, delegates to managers (574 lines)

**Results:**
- **Before:** 1,254 lines in single file
- **After:** 574 lines in main file (54% reduction)
- **Each extracted module:** Under 500 lines, single responsibility
- **Total code:** Increased slightly due to proper modularization, but each file is focused and maintainable
- **Backward compatibility:** All 16 concrete table implementations continue to work unchanged

**Key Improvements:**
- Clear separation of concerns
- Each module has single responsibility
- Easier to test in isolation
- Reduced cognitive load when modifying replication logic
- Re-exported `REPLICATION_STORES` for backward compatibility

**PR:** GitHub Issue #3

---

### ✅ DEBT-004: ReplicationManager.ts Excessive Size (RESOLVED)

**Category:** Architecture | **Severity:** High | **Resolved:** 2025-11-26

**Original Problem:** Replication manager had grown to 1,089 lines with multiple responsibilities including connection management, sync orchestration, and error handling.

**Solution Applied:**
Used composition pattern to extract focused modules:
- `ConnectionManager.ts` - Real-time subscriptions, cross-tab sync, network events (297 lines)
- `SyncOrchestrator.ts` - Sync coordination, queue management, quota/LRU eviction (606 lines)
- `ReplicationManager.ts` - Facade with table registry, public API, cache listeners (594 lines)

**Results:**
- **Before:** 1,089 lines in single file with mixed concerns
- **After:** 594 lines in main file (45% reduction)
- **Each extracted module:** Focused on single responsibility
- **All 1,530 tests pass**
- **No breaking changes:** Public API unchanged

**Key Improvements:**
- Clear separation of concerns
- ConnectionManager handles all real-time and cross-tab sync
- SyncOrchestrator handles all sync coordination and queue management
- ReplicationManager remains thin facade for application code
- Easier to test each module in isolation
- Callback pattern used to avoid circular dependencies

**PR:** GitHub Issue #4

---

### ✅ DEBT-005: SyncEngine.ts Excessive Size (RESOLVED)

**Category:** Architecture | **Severity:** High | **Resolved:** 2025-11-26

**Original Problem:** Sync engine implementation exceeded 1,010 lines with mixed concerns including mutation management, sync execution, network state, and metadata tracking.

**Solution Applied:**
Used composition pattern to extract focused modules:
- `MutationManager.ts` - Offline mutation queue, topological sort, backup/restore, retry logic (432 lines)
- `SyncExecutor.ts` - Full/incremental sync, streaming fetch, quota management (536 lines)
- `SyncEngine.ts` - Thin facade with network state, metadata, delegation to modules (301 lines)

**Results:**
- **Before:** 1,010 lines in single file with mixed concerns
- **After:** 301 lines in main file (70% reduction)
- **Each extracted module:** Focused on single responsibility
- **All 1,530 tests pass**
- **No breaking changes:** Public API unchanged

**Key Improvements:**
- Clear separation of concerns
- MutationManager handles all offline mutation queue operations
- SyncExecutor handles all sync execution (full/incremental)
- SyncEngine remains thin facade for application code
- Callback pattern used to avoid circular dependencies
- Easier to test each module in isolation

**PR:** GitHub Issue #5

---

### ✅ DEBT-006: CompetitionAdmin.tsx Excessive Size (RESOLVED)

**Category:** Code Quality | **Severity:** High | **Resolved:** 2025-11-26

**Original Problem:** Admin page component had grown to 1,252 lines.

**Solution Applied:**
- Extracted `AdminHeader.tsx` component
- Extracted `ClassesList.tsx` component
- Extracted `ResultVisibilitySection.tsx` component
- Extracted `SelfCheckinSection.tsx` component
- Extracted `useAdminName.ts` hook

**Results:**
- **Before:** 1,252 lines
- **After:** 355 lines
- **Reduction:** 72% (897 lines removed)

**PR:** #9 (merged 2025-11-26)

---

### ✅ DEBT-007: EntryList Components Excessive Size (RESOLVED)

**Category:** Code Quality | **Severity:** High | **Resolved:** 2025-11-26

**Original Problem:** EntryList.tsx (1,029 lines) and CombinedEntryList.tsx (1,014 lines) both exceeded 1,000 lines.

**Solution Applied:**
- Extracted `EntryListHeader.tsx` component
- Extracted `EntryListContent.tsx` component
- Extracted `FloatingDoneButton.tsx` component
- Extracted `ResetConfirmDialog.tsx` component
- Extracted `ResetMenuPopup.tsx` component
- Extracted `SelfCheckinDisabledDialog.tsx` component
- Extracted `SuccessToast.tsx` component
- Extracted `useEntryNavigation.ts` hook
- Extracted `useResetScore.ts` hook

**Results:**
- **EntryList.tsx:** 1,029 → 609 lines (41% reduction)
- **CombinedEntryList.tsx:** 1,014 → 645 lines (36% reduction)
- **Total reduction:** 789 lines

**PR:** #10 (merged 2025-11-26)

---

## Won't Fix Items

*No items marked as won't fix.*

---

## Debt Trends

### By Category
- Code Quality: 10 items
- Architecture: 4 items
- Test: 0 items
- Documentation: 0 items
- Dependency: 0 items (clean!)
- Performance: 0 items
- Security: 0 items
- Infrastructure: 0 items
- Design: 0 items

### By Severity
- Critical: 2 items (2 resolved ✅)
- High: 4 items (4 resolved ✅)
- Medium: 6 items (1 resolved ✅)
- Low: 2 items (1 audited)

### Aging
- < 1 month: 15 items (all newly identified)
- 1-3 months: 0 items
- 3-6 months: 0 items
- 6-12 months: 0 items
- > 1 year: 0 items

---

## Review Schedule

- **Weekly:** Triage new items, update status
- **Monthly:** Review high priority items, plan fixes
- **Quarterly:** Full debt review, trend analysis

---

## Quick Reference: Priority Order

1. ~~**DEBT-001** - Console statements (Critical, 1-2 days)~~ ✅ **RESOLVED** (2025-11-26)
2. ~~**DEBT-002** - Legacy code removal (Critical, 2-3 days)~~ ✅ **RESOLVED** (2025-11-26)
3. **DEBT-008** - Complex functions (Medium, ongoing) - ⚡ **PARTIALLY RESOLVED** - 4/7 files done, ESLint rules added
4. ~~**DEBT-003** - ReplicatedTable refactor~~ ✅ **RESOLVED** (2025-11-26)
5. ~~**DEBT-004** - ReplicationManager refactor~~ ✅ **RESOLVED** (2025-11-26)
6. ~~**DEBT-005** - SyncEngine refactor~~ ✅ **RESOLVED** (2025-11-26)
7. ~~**DEBT-006/007** - UI component refactor~~ ✅ **RESOLVED** (2025-11-26)
8. ~~**DEBT-013** - BUG comments~~ ✅ **RESOLVED** (2025-11-27) - Audit found 0 in source
9. **DEBT-011** - `any` types - ⚡ **IN PROGRESS** - 6 fixed in core files (2025-11-27)
10. **DEBT-014** - TODO comments - ✅ **CLEANED** - 2 removed, 6 valid remaining (2025-11-27)
11. **Others** - Address opportunistically

---

## Guidelines

### When to Add Items

Add technical debt items when:
- Taking a shortcut to meet a deadline
- Discovering code smells during development
- Identifying architectural improvements
- Finding missing tests or documentation
- Detecting performance issues
- Discovering security concerns

### How to Prioritize

Use this framework:
1. **Critical:** Security issues, production blockers, data loss risks
2. **High:** Blocks features, significant performance issues, high-churn areas
3. **Medium:** Quality issues, missing tests, outdated dependencies
4. **Low:** Minor improvements, optimizations, nice-to-haves

### When to Fix

- **Critical:** Immediately
- **High:** Within current/next sprint
- **Medium:** Within quarter
- **Low:** When convenient or during refactoring

### How to Prevent

- Code review checklist
- Automated linting and testing
- Regular dependency updates
- Documentation requirements
- Architecture reviews
