# Codebase Quality Improvement Plan

**Created:** 2025-12-02
**Approach:** Incremental phases, minimal breaking changes
**Estimated Total Duration:** 4-6 weeks (can be done alongside feature work)

---

## Executive Summary

This plan addresses codebase quality issues in priority order:
1. **Quick wins** - Use existing abstractions that are already built
2. **High-risk fixes** - Scoring constants and test re-enablement
3. **Documentation** - Offline patterns and feature flows
4. **Ongoing** - Complexity reduction and monitoring

---

## Phase 1: Quick Wins (2-3 hours)
**Goal:** Use existing abstractions that were built but never integrated

### 1.1 Use `useAppInitialization()` Hook
**Risk:** LOW | **Impact:** HIGH | **Files:** 1

The hook already exists at `src/hooks/useAppInitialization.ts` but App.tsx duplicates its logic.

**Changes to `src/App.tsx`:**
- Remove lines 249-315 (initialization useEffect block)
- Add single line: `useAppInitialization();`
- Remove duplicate `initializeSettings()` call (line 255)
- Remove duplicate `startPerformanceMonitoring()` call

**Result:** ~67 lines removed from AppWithAuth

### 1.2 Use `MainLayout` Component
**Risk:** LOW | **Impact:** HIGH | **Files:** 1

The component exists at `src/components/layout/MainLayout.tsx` but isn't used.

**Changes to `src/App.tsx`:**
- Replace lines 318-347 (all monitoring/debug component JSX) with:
  ```tsx
  <MainLayout autoLogout={autoLogout}>
    <Routes>...</Routes>
  </MainLayout>
  ```

**Result:** ~28 lines of JSX simplified to 1 component

### 1.3 Clean Up Stale Test Exclusions
**Risk:** TRIVIAL | **Impact:** LOW | **Files:** 1

Two test files in `vite.config.ts` exclusion list don't exist:
- `src/__tests__/offline-first-pattern-consistency.test.ts`
- `src/pages/EntryList/__tests__/EntryList.persistence.test.tsx`

**Change:** Remove these 2 entries from `vite.config.ts` line ~35

---

## Phase 2: Scoring Constants Extraction (1-2 days)
**Goal:** Eliminate magic number duplication in scoring logic

### 2.1 Create Nationals Constants
**Risk:** LOW | **Impact:** HIGH | **Files:** 3

**Create:** `src/constants/nationalsConstants.ts`
```typescript
export const NATIONALS_SCORING = {
  CORRECT_ALERT_POINTS: 10,
  INCORRECT_ALERT_PENALTY: 5,
  FAULT_PENALTY: 2,
  FINISH_CALL_ERROR_PENALTY: 5,
  EXCUSED_DOG_POINTS: 0,
  MAX_TIME_EXCUSED_SECONDS: 120,
  TOP_QUALIFIERS_DAY3: 100,
} as const;

export const NATIONALS_VALIDATION = {
  ALERTS_MIN: 0,
  ALERTS_MAX: 10,
  FAULTS_MIN: 0,
  FAULTS_MAX: 20,
} as const;
```

**Update files:**
- `src/services/nationalsScoring.ts` (lines 130-145) - import constants
- `src/pages/scoresheets/AKC/AKCNationalsScoresheet.tsx` (lines 150-168) - import same constants

### 2.2 Create FastCat Constants
**Risk:** LOW | **Impact:** MEDIUM | **Files:** 2

**Create:** `src/constants/fastcatConstants.ts`
```typescript
export const FASTCAT_COURSE = {
  LENGTH_YARDS: 100,
  YARDS_PER_MILE: 1760,
  SECONDS_PER_HOUR: 3600,
  POINTS_MULTIPLIER: 2,
} as const;

// TODO: Document full AKC formula vs simplified version
```

**Update:** `src/pages/scoresheets/AKC/AKCFastCatScoresheet.tsx` (lines 61, 91, 96)

### 2.3 Add Cross-File Consistency Test
**Risk:** TRIVIAL | **Files:** 1

**Create:** `src/constants/__tests__/scoringConstants.test.ts`
- Import constants from both files
- Verify values match expected business rules
- Acts as documentation and regression protection

---

## Phase 3: Test Re-enablement (1-2 weeks)
**Goal:** Re-enable excluded tests systematically

### 3.1 Track as Technical Debt
**Create DEBT-017 in `DEBT_REGISTER.md`:**
```markdown
## DEBT-017: Excluded Test Files

**Status:** Open
**Priority:** High
**Opened:** 2025-12-02

**Issue:** 18 test files (4,975 lines) excluded in vite.config.ts due to Vitest collection issues.

**Files affected:**
- Entry services (6 files, 2,635 lines) - CRITICAL
- Settings components (7 files, 1,813 lines) - HIGH
- Scoresheet components (3 files, 916 lines) - HIGH

**Root causes:**
1. Multiple nested vi.mock() calls causing module resolution conflicts
2. Browser API mocking (Notification, ServiceWorker) not properly configured
3. Complex test fixtures conflicting with Vitest collection phase
```

### 3.2 Re-enable Entry Service Tests (Highest Priority)
**Risk:** MEDIUM | **Impact:** HIGH | **Files:** 6

These test core business logic:
- `src/services/entryReplication.test.ts`
- `src/services/entry/classCompletionService.test.ts`
- `src/services/entry/entryBatchOperations.test.ts`
- `src/services/entry/entryDataLayer.test.ts`
- `src/services/entry/entryStatusManagement.test.ts`
- `src/services/entry/scoreSubmission.test.ts`

**Approach:**
1. Extract shared Supabase mocks to `src/test-utils/supabaseMocks.ts`
2. Replace inline vi.mock() calls with imported helpers
3. Run each test file individually to identify specific failures
4. Fix collection issues one file at a time

### 3.3 Re-enable Scoresheet Component Tests
**Risk:** MEDIUM | **Impact:** MEDIUM | **Files:** 3

- `src/pages/scoresheets/components/AreaInputs.test.tsx`
- `src/pages/scoresheets/components/NationalsPointsDisplay.test.tsx`
- `src/pages/scoresheets/components/TimerDisplay.test.tsx`

### 3.4 Re-enable Settings Component Tests
**Risk:** MEDIUM | **Impact:** LOW | **Files:** 5 (after removing stale refs)

Lower priority - settings are less critical than scoring/entries.

---

## Phase 4: Documentation (3-5 days)
**Goal:** Document complex flows for maintainability

### 4.1 Offline-First Pattern Guide
**Create:** `docs/OFFLINE_FIRST_PATTERNS.md`

Document:
- When to use replication cache vs Supabase fallback
- Standard pattern for data access hooks
- How to surface offline/online states in UI
- Error handling for network failures

### 4.2 Scoring Flow Documentation
**Create:** `docs/SCORING_ARCHITECTURE.md`

Document:
- Entry lifecycle (check-in → score → placement)
- Autosave behavior and recovery
- Replication and conflict handling
- Offline queue processing

### 4.3 Notification System Documentation
**Create:** `docs/NOTIFICATION_SYSTEM.md`

Document:
- Browser notification permissions
- Service worker integration
- Push subscription management
- DND/quiet hours logic

---

## Phase 5: Ongoing Improvements
**Goal:** Continuous quality improvement

### 5.1 Complexity Threshold Reduction - Progress Update (2025-12-03)
**Starting:** max complexity = 90 (very permissive)
**Current:** max complexity = 30 ✅ (lowered three times: 90 → 50 → 40 → 30)

**Work completed (Phase 1 - 90 → 50):**
- Extracted ShowDetails.tsx components to ShowDetailsComponents.tsx (323 lines)
- Extracted utilities to showDetailsUtils.ts (108 lines)
- ShowDetails.tsx reduced from 455 lines to 137 lines

**Work completed (Phase 2 - 50 → 40):**
- Extracted useEntryNavigation helpers to useEntryNavigationHelpers.ts
- Extracted AKCNationalsScoresheet helpers to AKCNationalsScoresheetHelpers.ts
- Extracted preloadService helpers to preloadServiceHelpers.ts
- Extracted CreateAnnouncementModal helpers to createAnnouncementHelpers.ts
- Extracted useDogDetailsData helpers to dogDetailsDataHelpers.ts
- ESLint threshold lowered from 50 → 40 in eslint.config.js

**Work completed (Phase 3 - 40 → 30) ✅ COMPLETE (2025-12-03):**
- Extracted NationalsTimerSection.tsx from AKCNationalsScoresheet (timer display, controls)
- Extracted NationalsConfirmationDialog.tsx from AKCNationalsScoresheet (score confirmation)
- Refactored dogDetailsDataHelpers.ts (extractDerivedFields, buildClassEntry helpers)
- Extracted createAnnouncementComponents.tsx (AccessDeniedModal, OfflineBanner, PreviewContent, etc.)
- Extracted DogDetailsClassCard.tsx from DogDetails (class card rendering)
- Extracted entryListHeaderHelpers.tsx (ActionsDropdownMenu, TrialInfo, badges)
- Extracted subscriptionMonitorComponents.tsx (HealthSummary, LeakAlert, SubscriptionsList)
- Extracted notificationServiceHelpers.ts (generateAnnouncementText, vibration patterns)
- ESLint threshold lowered from 40 → 30 in eslint.config.js
- **All 7 files now below complexity 30!**

**Updated schedule:**
| Quarter | Target | Status |
|---------|--------|--------|
| Q4 2025 | 30 | ✅ COMPLETE |
| Q1-Q2 2026 | 20 | Target level |

### 5.2 Bundle Analysis ✅ COMPLETE (2025-12-03)
- Added `build:analyze` script with rollup-plugin-visualizer
- Installed cross-env for Windows compatibility
- Bundle analysis findings:
  - react-vendor chunk: 159KB gzip (React, React-DOM)
  - services chunk: 62KB gzip (main business logic)
  - Total build size healthy
  - Lazy loading working correctly for scoresheets
  - No dev tools in production bundle

---

## Files to Modify (Summary)

| Phase | Files | Risk |
|-------|-------|------|
| **Phase 1** | `App.tsx`, `vite.config.ts` | LOW |
| **Phase 2** | New constants files + 3 existing | LOW |
| **Phase 3** | 16 test files + test utils | MEDIUM |
| **Phase 4** | New docs only | NONE |
| **Phase 5** | `.eslintrc.cjs`, various | LOW |

---

## Dependencies & Order

```
Phase 1 (Quick Wins)
    ↓ No dependencies
Phase 2 (Constants)
    ↓ No dependencies
Phase 3 (Tests)
    ↓ Phase 2 should complete first (constants used in tests)
Phase 4 (Docs)
    ↓ Can run parallel to Phase 3
Phase 5 (Ongoing)
    → Continuous, no blockers
```

---

## What's NOT in This Plan

Intentionally deferred:
- **Service modularization** - High risk, low immediate value
- **Route config extraction** - YAGNI until route list grows significantly
- **State management audit** - No evidence of problems
- **ProviderStack extraction** - Nice-to-have, not necessary

---

## Success Criteria

- [x] Phase 1: App.tsx reduced by ~100 lines ✅ Already complete:
  - `useAppInitialization()` hook integrated (App.tsx:238)
  - `MainLayout` component wraps all routes (App.tsx:241)
  - No stale test exclusions in vite.config.ts
- [x] Phase 2: Zero duplicated scoring constants ✅ (nationalsConstants.ts, fastcatConstants.ts created)
- [x] Phase 3: At least 6 entry service test files re-enabled ✅ **EXCEEDED** - 15 test files re-enabled:
  - Entry services (7): entryReplication, classCompletionService, entryBatchOperations, entryDataLayer, entryStatusManagement, entrySubscriptions, scoreSubmission
  - Scoresheet (3): AreaInputs, NationalsPointsDisplay, TimerDisplay
  - Settings (5): AdminNameDialog, DataManagementSection, DeveloperToolsSection, PushNotificationSettings, VoiceSettingsSection
  - **Final count: 1,884 tests (75 files) - up from ~1,600 before Phase 3**
- [x] Phase 4: 3 architecture docs created ✅ (1,719 lines total):
  - `docs/OFFLINE_FIRST_PATTERNS.md` (299 lines) - Replication cache patterns, fallback strategies
  - `docs/SCORING_ARCHITECTURE.md` (661 lines) - Entry lifecycle, autosave, conflict handling
  - `docs/NOTIFICATION_SYSTEM.md` (759 lines) - Permissions, service worker, push subscriptions
- [x] Phase 5: Complexity threshold at 30 ✅ COMPLETE (ahead of schedule!):
  - ESLint complexity threshold lowered 90 → 50 → 40 → 30
  - ShowDetails.tsx refactored (extracted to 3 files)
  - 7 additional files refactored to bring complexity under 30
  - Bundle analysis tooling added (`build:analyze` script)
  - **Final test count: 1,884 tests (75 files)**

---

## 🎉 PLAN COMPLETE

All 5 phases of this codebase quality improvement plan have been successfully completed as of 2025-12-03.

**Future work (not in this plan):**
- Continue lowering complexity threshold to 20 (Q1-Q2 2026)
- Monitor bundle size over time
- Address any new high-complexity functions as they arise
