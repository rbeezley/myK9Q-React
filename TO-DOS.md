# Outstanding Tasks


## Test Pull-to-Refresh Mobile UX - 2025-11-20 ✅ COMPLETE

- **VERIFIED:** PTR improvements working correctly on production mobile. 20px activation threshold and increased trigger distance successfully prevent accidental activation during scrolling while still allowing intentional pull-to-refresh gestures.

## Scoresheet Refactoring - 2025-11-25 ✅ COMPLETE

**Status:** All phases complete

**Summary:**
- ✅ Phase 1: Created `useScoresheetCore` and `useEntryNavigation` shared hooks
- ✅ Phase 3a: Refactored `AKCScentWorkScoresheet.tsx` (1,118 → 692 lines, **38% reduction**)
- ✅ Phase 3b: Deleted `AKCScentWorkScoresheet-Enhanced.tsx` (redundant dual-mode file)
- ✅ Phase 3c: Refactored `AKCNationalsScoresheet.tsx` (1,175 → 847 lines, **28% reduction**)

**Results:** Reduced 3 files to 2 files, **~1,550 lines deleted** (43% total reduction).

**Files:** See `docs/SCORESHEET_REFACTORING_PLAN.md` for full details. Hooks at `src/pages/scoresheets/hooks/`.

## Monetization Strategy Research - 2025-11-23 19:30 ✅ COMPLETE

**Status:** Strategy document completed at [docs/monetization-strategy.md](docs/monetization-strategy.md)

**Summary:**
- Recommended freemium model with Pro tier at $4.99/mo or $39.99/year
- Key Pro features: Cloud favorites sync, historical analytics, email notifications, advanced export
- No existing premium code in codebase - greenfield opportunity
- Competitive analysis shows unique B2C position (most competitors are B2B)
- Break-even at ~12 Pro subscribers

## Consolidate IndexedDB Databases - 2025-11-28 ✅ COMPLETE

**Status:** All files migrated to consolidated `myK9Q_Replication` database.

**Summary:**
- ✅ Created `prefetch_cache` store in myK9Q_Replication (DB_VERSION 4)
- ✅ Created [PrefetchCacheManager.ts](src/services/replication/PrefetchCacheManager.ts) with same API as legacy cache
- ✅ Created [MutationQueueManager.ts](src/services/replication/MutationQueueManager.ts) for offline queue
- ✅ Migrated all 5 remaining files:
  - `offlineQueueStore.ts` → uses `MutationQueueManager`
  - `offlineRouter.ts` → uses `PrefetchCacheManager`
  - `useClassListData.ts` → uses `PrefetchCacheManager`
  - `preloadService.ts` → uses `PrefetchCacheManager`
  - `autoDownloadService.ts` → uses `PrefetchCacheManager`
- ✅ Deleted legacy `indexedDB.ts`
- ✅ Tracked in [DEBT_REGISTER.md](DEBT_REGISTER.md) as DEBT-016

## Hide Debug Functions in Production - 2025-11-28 15:43 ✅ COMPLETE

- **FIXED:** Wrapped `initializeDebugFunctions()` in `if (!import.meta.env.DEV) return;` check at [entryDebug.ts:342-345](src/services/entryDebug.ts#L342-L345). Debug functions no longer register or log in production builds.

## Investigate Memory Leak Warning - 2025-11-28 ✅ FALSE POSITIVE

- **RESOLVED:** Heap growth (29MB → 44MB) is expected Vite HMR behavior in development mode. Memory detector only runs in dev mode. All ClassList hooks and useEffects have proper cleanup. No action needed - this is normal for active React development with HMR.

## Reduce Entries Sync Log Verbosity - 2025-11-28 15:46 ✅ COMPLETE

- **FIXED:** Wrapped sync log in `if (remoteEntries && remoteEntries.length > 0)` check at [ReplicatedEntriesTable.ts:148-150](src/services/replication/tables/ReplicatedEntriesTable.ts#L148-L150). No longer logs when 0 entries found.

## Fix MutationManager VersionError - 2025-11-28 15:49 ✅ COMPLETE

- **FIXED:** Root cause was `SyncEngine.ts` defining its own `DB_VERSION = 1` while `replicationConstants.ts` had `DB_VERSION = 3`. Updated [SyncEngine.ts:25](src/services/replication/SyncEngine.ts#L25) to import from `replicationConstants.ts` instead of using local constants.

## Reduce Individual Entry Cache Logging - 2025-11-28 15:49 ✅ COMPLETE

- **FIXED:** Replaced 647+ individual log lines with single summary: `logger.log(\`[${this.tableName}] ✅ Cached ${entriesToCache.length} entries\`)` at [ReplicatedEntriesTable.ts:189-190](src/services/replication/tables/ReplicatedEntriesTable.ts#L189-L190).

## Class Card Progress Bar Divider - 2025-11-28 21:19

- **Convert class card divider to progress bar** - Replace the static dividing line on class cards with a progress bar that shows class completion progress. **Problem:** The dividing line is purely decorative and takes up space without providing value. A progress bar would serve dual-purpose: visual separation AND status information at a glance. **Files:** `src/pages/ClassList/ClassCard.tsx`, `src/pages/ClassList/ClassList.css`. **Solution:** Replace `<hr>` or border divider with a thin progress bar (2-4px height) showing `scoredCount / totalEntries` percentage. Use existing entry data already available in the component.

## Dog Details Check-In All Button - 2025-11-28 21:22 ✅ COMPLETE

- **IMPLEMENTED:** Added "Check In All" button to Dog Details page header row.

**Features:**
- Button appears in the "Class Entries" header row (Option A placement)
- Shows count of pending classes: "Check In All (3)"
- Disabled state when no pending entries (grayed out with 60% opacity)
- Loading state with spinner during check-in
- Success toast shows "✓ Checked in to X classes" for 3 seconds
- Handles partial failures gracefully

**Files Modified:**
- [DogDetails.tsx:61-70](src/pages/DogDetails/DogDetails.tsx#L61-L70) - Added state and pendingEntries calculation
- [DogDetails.tsx:198-233](src/pages/DogDetails/DogDetails.tsx#L198-L233) - Added handleCheckInAll function
- [DogDetails.tsx:369-397](src/pages/DogDetails/DogDetails.tsx#L369-L397) - Added button and toast UI
- [DogDetails.css:250-331](src/pages/DogDetails/DogDetails.css#L250-L331) - Added header row, button, and toast styles

