# Technical Debt Register

**Project:** myK9Qv3
**Last Updated:** 2025-11-26
**Maintained By:** Development Team

## Summary

- **Total Debt Items:** 13 (4 resolved)
- **Critical:** 2 ✅ (1 resolved)
- **High:** 3 ✅ (3 resolved)
- **Medium:** 6
- **Low:** 2
- **Estimated Total Effort:** 6-10 days (reduced from 15-20)

---

## Active Debt Items

### DEBT-002: Legacy localStateManager Not Fully Removed

**Category:** Architecture

**Severity:** Critical

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/stores/offlineQueueStore.ts`
  - `src/hooks/useOptimisticScoring.ts`
  - `src/pages/EntryList/hooks/useEntryListSubscriptions.ts`
  - `src/pages/EntryList/hooks/useEntryListActions.ts`
- Component/Module: Offline/Replication System

**Description:**
The codebase has migrated from `localStateManager` to a new replication system, but legacy code remains. Multiple TODO comments state: "Remove legacy localStateManager - replaced by replication system"

**Impact:**
- **Business Impact:** Potential data inconsistencies between old and new systems
- **Technical Impact:** Two parallel systems increase complexity, harder to debug, duplicated logic
- **Risk:** Edge cases where systems disagree could cause data loss or corruption

**Root Cause:**
Phased migration approach - new system built alongside old for safety, but cleanup not completed.

**Proposed Solution:**
1. Audit all `localStateManager` references
2. Verify replication system handles all use cases
3. Remove legacy code paths
4. Update tests to use new system only

**Effort Estimate:** 2-3 days

**Priority Justification:**
Critical because dual systems create confusion and potential data issues. Migration is essentially complete - just needs cleanup.

**Dependencies:**
- Blocks: Future offline improvements
- Blocked By: None
- Related: DEBT-003, DEBT-004

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Next Sprint

**Notes:**
- Search for `localStateManager` to find all references
- Files with TODO markers are the primary targets

---

### DEBT-004: ReplicationManager.ts Excessive Size (1,089 lines)

**Category:** Architecture

**Severity:** High

**Created:** 2025-11-26

**Location:**
- File(s): `src/services/replication/ReplicationManager.ts`
- Component/Module: Replication System

**Description:**
Replication manager has grown to 1,089 lines with multiple responsibilities including connection management, sync orchestration, and error handling.

**Impact:**
- **Business Impact:** Difficult to add new replication features
- **Technical Impact:** Complex interdependencies, hard to unit test
- **Risk:** Changes may have unintended side effects

**Root Cause:**
Feature additions without architectural review.

**Proposed Solution:**
Extract into separate concerns:
- `ConnectionManager.ts` - Connection lifecycle
- `SyncOrchestrator.ts` - Sync coordination
- `ReplicationErrorHandler.ts` - Error handling and recovery

**Effort Estimate:** 2-3 days

**Priority Justification:**
High due to complexity in critical offline functionality.

**Dependencies:**
- Blocks: None
- Blocked By: ~~DEBT-003~~ (resolved)
- Related: DEBT-005

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Q1 2026

---

### DEBT-005: SyncEngine.ts Excessive Size (1,010 lines)

**Category:** Architecture

**Severity:** High

**Created:** 2025-11-26

**Location:**
- File(s): `src/services/replication/SyncEngine.ts`
- Component/Module: Replication System

**Description:**
Sync engine implementation exceeds 1,000 lines with mixed concerns.

**Impact:**
- **Business Impact:** Sync bugs are hard to diagnose and fix
- **Technical Impact:** Tightly coupled components, difficult to test in isolation
- **Risk:** Sync issues could cause data loss

**Root Cause:**
Incremental feature additions without refactoring.

**Proposed Solution:**
Decompose into:
- `SyncScheduler.ts` - Timing and scheduling
- `SyncExecutor.ts` - Actual sync operations
- `SyncStateManager.ts` - State tracking

**Effort Estimate:** 2-3 days

**Priority Justification:**
High because sync reliability is critical for offline-first functionality.

**Dependencies:**
- Blocks: None
- Blocked By: ~~DEBT-003~~ (resolved)
- Related: DEBT-004

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Q1 2026

---

### DEBT-008: High Complexity Functions

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/components/ui/OfflineIndicator.tsx` - complexity 45
  - `src/hooks/usePrefetch.ts` - complexity 44
  - `src/pages/EntryList/hooks/useEntryListData.ts` - complexity 33
  - `src/hooks/useOptimisticScoring.ts` - complexity 32
  - `src/services/notificationService.ts` - complexity 30
- Component/Module: Various

**Description:**
Multiple functions have cyclomatic complexity exceeding 10 (recommended max). Some reach 45, indicating extremely complex branching logic.

**Impact:**
- **Business Impact:** Bugs in complex code are hard to reproduce and fix
- **Technical Impact:** Untestable, unmaintainable, error-prone
- **Risk:** Edge cases not covered, regressions likely

**Root Cause:**
Growing requirements without refactoring, lack of complexity linting.

**Proposed Solution:**
1. Add ESLint complexity rule: `"complexity": ["warn", 10]`
2. Refactor highest complexity functions first
3. Extract helper functions
4. Use strategy pattern for branching logic
5. Add comprehensive tests before refactoring

**Effort Estimate:** 3-5 days (spread across multiple sprints)

**Priority Justification:**
Medium - important for maintainability but not immediately urgent.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: DEBT-009

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Q2 2026

**Notes:**
- `OfflineIndicator` (45) and `usePrefetch` (44) are highest priority
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

### DEBT-011: Weak TypeScript Typing (212 `any` usages)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Location:**
- File(s): Throughout codebase
- Component/Module: Various

**Description:**
212 instances of `any` type usage, bypassing TypeScript's type safety.

**Impact:**
- **Business Impact:** Runtime errors that could be caught at compile time
- **Technical Impact:** Lost IDE support, no refactoring safety
- **Risk:** Type-related bugs in production

**Root Cause:**
Quick fixes, complex external types, migration from JavaScript.

**Proposed Solution:**
1. Enable `noImplicitAny` in tsconfig.json
2. Replace `any` with proper types incrementally
3. Use `unknown` for truly dynamic values
4. Create proper interfaces for complex objects
5. Use generics where appropriate

**Effort Estimate:** 3-4 days

**Priority Justification:**
Medium - type safety is important but most `any` usage is in non-critical paths.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: None

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Q2 2026

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

### DEBT-013: BUG Comments Not Addressed (23 occurrences)

**Category:** Code Quality

**Severity:** Medium

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/main.tsx`
  - `src/components/DatabaseTest.tsx`
  - `src/components/ScoresheetErrorBoundary.tsx`
  - `src/hooks/useOfflineQueueProcessor.ts`
  - `src/services/entryDataFetching.ts`
  - `src/services/entryDebug.ts`
  - `src/services/voiceAnnouncementService.ts`
  - And others...
- Component/Module: Various

**Description:**
23 BUG comments found in the codebase indicating known issues that haven't been fixed.

**Impact:**
- **Business Impact:** Known bugs affecting users
- **Technical Impact:** Technical debt accumulating
- **Risk:** Issues may worsen over time

**Root Cause:**
Bugs identified during development but deferred.

**Proposed Solution:**
1. Audit all BUG comments
2. Create tickets for each actual bug
3. Prioritize by user impact
4. Remove comments that are no longer relevant
5. Fix high-impact bugs immediately

**Effort Estimate:** Variable (depends on bugs)

**Priority Justification:**
Medium - need to assess individual bugs for actual severity.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: None

**Status:** Open

**Assignee:** Unassigned

**Target Resolution:** Audit in Next Sprint

---

### DEBT-014: Missing TODO Implementation

**Category:** Code Quality

**Severity:** Low

**Created:** 2025-11-26

**Location:**
- File(s):
  - `src/pages/DogDetails/DogDetails-Apple.tsx` - "TODO: Implement status update logic"
  - `src/utils/oneHandedMode.ts` - "TODO: Implement tap tracking and ML-based detection"
  - `src/utils/performanceMonitoring.ts` - "TODO: Implement analytics integration"
  - `src/services/dataExportService.ts` - "TODO: Add IndexedDB data collection"
  - `src/services/settingsCloudSync.ts` - "TODO: In production, integrate with actual auth system"
- Component/Module: Various

**Description:**
Multiple TODO comments indicating features that were planned but not implemented.

**Impact:**
- **Business Impact:** Missing features
- **Technical Impact:** Incomplete implementations
- **Risk:** Users may expect features that don't exist

**Root Cause:**
Features planned during development but deprioritized.

**Proposed Solution:**
1. Review each TODO for current relevance
2. Create backlog items for still-needed features
3. Remove TODOs that are no longer planned
4. Implement high-value features

**Effort Estimate:** Variable

**Priority Justification:**
Low - these are enhancements, not bugs.

**Dependencies:**
- Blocks: None
- Blocked By: None
- Related: None

**Status:** Open

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
- Critical: 2 items (1 resolved ✅)
- High: 3 items (3 resolved ✅)
- Medium: 6 items
- Low: 2 items

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
2. **DEBT-002** - Legacy code removal (Critical, 2-3 days) - Unblock future work
3. **DEBT-008** - Complex functions (Medium, ongoing) - Highest complexity first
4. ~~**DEBT-003** - ReplicatedTable refactor~~ ✅ **RESOLVED** (2025-11-26)
5. **DEBT-004/005** - ReplicationManager & SyncEngine refactor (High, 4-6 days total) - Plan together
6. ~~**DEBT-006/007** - UI component refactor~~ ✅ **RESOLVED** (2025-11-26)
7. **Others** - Address opportunistically

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
