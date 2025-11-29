# Outstanding Tasks


## Test Pull-to-Refresh Mobile UX - 2025-11-20 20:02

- **Verify PTR improvements on production mobile** - Test pull-to-refresh activation threshold and scrolling behavior on app.myk9q.com after deployment. **Problem:** Pull-to-refresh was interfering with scrolling through long dog lists on mobile home page. Changes deployed (20px activation threshold, increased trigger distance) need real-world mobile testing to confirm they solve the issue. **Files:** `src/components/ui/PullToRefresh.tsx:85-101` (activation threshold logic), `src/pages/Home/Home.tsx:367-372` (PTR configuration). **Solution:** Test on actual mobile device: (1) Verify normal scrolling works smoothly without triggering PTR, (2) Verify intentional pull-down from top triggers refresh after deliberate gesture, (3) If still problematic, consider increasing activation threshold to 30-40px or adding user setting to disable PTR.

## Scoresheet Refactoring - 2025-11-25 ✅ COMPLETE

**Status:** All phases complete

**Summary:**
- ✅ Phase 1: Created `useScoresheetCore` and `useEntryNavigation` shared hooks
- ✅ Phase 3a: Refactored `AKCScentWorkScoresheet.tsx` (1,118 → 692 lines, **38% reduction**)
- ✅ Phase 3b: Deleted `AKCScentWorkScoresheet-Enhanced.tsx` (redundant dual-mode file)
- ✅ Phase 3c: Refactored `AKCNationalsScoresheet.tsx` (1,175 → 847 lines, **28% reduction**)

**Results:** Reduced 3 files to 2 files, **~1,550 lines deleted** (43% total reduction).

**Files:** See `docs/SCORESHEET_REFACTORING_PLAN.md` for full details. Hooks at `src/pages/scoresheets/hooks/`.

## Monetization Strategy Research - 2025-11-23 19:30

- **Research exhibitor monetization opportunities** - Brainstorm premium features and services that exhibitors would be willing to pay for to ensure app sustainability and growth. **Problem:** Need to identify viable revenue streams from the exhibitor user segment while maintaining value proposition. Current app is free but needs to explore sustainable monetization models that align with user needs and willingness to pay. **Files:** Consider researching competitive apps, analyzing user feedback in existing features (`src/pages/Home/`, `src/pages/EntryList/`, `src/pages/Settings/`), and documenting findings in new `docs/monetization-strategy.md`. **Solution:** Analyze exhibitor pain points throughout their show workflow, research competitive pricing models in dog show management space, evaluate premium feature opportunities (advanced analytics, training history, performance tracking, premium notifications, ad-free experience, priority support), and assess subscription vs one-time payment models.

## Consolidate IndexedDB Databases - 2025-11-28 15:39 🔄 IN PROGRESS

- **Phase 1-4 Complete:** Main prefetch cache migrated to consolidated database.
  - ✅ Created `prefetch_cache` store in myK9Q_Replication (DB_VERSION 4)
  - ✅ Created [PrefetchCacheManager.ts](src/services/replication/PrefetchCacheManager.ts) with same API as legacy cache
  - ✅ Migrated [usePrefetch.ts](src/hooks/usePrefetch.ts) to use consolidated database
  - ✅ Updated cache clearing to handle both databases during transition
  - ✅ Added deprecation notice to [indexedDB.ts](src/utils/indexedDB.ts)
  - ✅ Tracked in [DEBT_REGISTER.md](DEBT_REGISTER.md) as DEBT-016

- **Remaining (5 files):** Low priority - app works with backward compatibility
  - `offlineQueueStore.ts` - uses mutations store (needs MutationManager)
  - `offlineRouter.ts` - uses cache store
  - `useClassListData.ts` - uses cache store
  - `preloadService.ts` - uses cache + metadata stores
  - `autoDownloadService.ts` - uses cache store

## Hide Debug Functions in Production - 2025-11-28 15:43 ✅ COMPLETE

- **FIXED:** Wrapped `initializeDebugFunctions()` in `if (!import.meta.env.DEV) return;` check at [entryDebug.ts:342-345](src/services/entryDebug.ts#L342-L345). Debug functions no longer register or log in production builds.

## Investigate Memory Leak Warning - 2025-11-28 15:46

- **Investigate memory leak warning on Classes page** - Heap growing 50% in 5 minutes (29MB to 44MB) reported by memoryLeakDetector. **Problem:** memoryLeakDetector.ts:228 reports rapid heap growth when navigating to Classes page. Could be Vite HMR false positive in dev mode, or could indicate a real memory leak (uncleared subscriptions, event listeners, or timers). **Files:** `src/utils/memoryLeakDetector.ts:187-228` (detection logic), `src/pages/ClassList/` (page being viewed when warning appeared). **Solution:** Test in production build to rule out HMR false positive. If persists, use Chrome DevTools Memory tab to take heap snapshots and identify retained objects.

## Reduce Entries Sync Log Verbosity - 2025-11-28 15:46 ✅ COMPLETE

- **FIXED:** Wrapped sync log in `if (remoteEntries && remoteEntries.length > 0)` check at [ReplicatedEntriesTable.ts:148-150](src/services/replication/tables/ReplicatedEntriesTable.ts#L148-L150). No longer logs when 0 entries found.

## Fix MutationManager VersionError - 2025-11-28 15:49 ✅ COMPLETE

- **FIXED:** Root cause was `SyncEngine.ts` defining its own `DB_VERSION = 1` while `replicationConstants.ts` had `DB_VERSION = 3`. Updated [SyncEngine.ts:25](src/services/replication/SyncEngine.ts#L25) to import from `replicationConstants.ts` instead of using local constants.

## Reduce Individual Entry Cache Logging - 2025-11-28 15:49 ✅ COMPLETE

- **FIXED:** Replaced 647+ individual log lines with single summary: `logger.log(\`[${this.tableName}] ✅ Cached ${entriesToCache.length} entries\`)` at [ReplicatedEntriesTable.ts:189-190](src/services/replication/tables/ReplicatedEntriesTable.ts#L189-L190).

