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

---

## Future Consideration: Dog Performance Analytics - 2025-11-29

**Status:** Infrastructure exists, needs database table and UI

**Context:**
A `ReplicatedEventStatisticsTable` class exists at [src/services/replication/tables/ReplicatedEventStatisticsTable.ts](src/services/replication/tables/ReplicatedEventStatisticsTable.ts) but is currently **dormant** (table doesn't exist in database).

**What it could enable:**
- Dog history lookup by AKC registration number
- Public leaderboards and statistics
- Breed performance analytics
- Q rate tracking across shows
- Results release control (`results_released` flag)

**Authentication consideration:**
Current passcode model (shared codes like `aa260`, `jf472`) works for per-show access but **cannot identify individual users** for "My Dogs" features. Options:
1. **Dog registration lookup** (simplest) - Anyone can look up any dog by AKC#
2. **Individual user accounts** - Add email/password auth (significant change)
3. **Exhibitor-specific passcodes** - Generate unique codes at registration

**To implement:**
1. Create `event_statistics` database migration
2. Add trigger/batch job to populate from scored entries
3. Build lookup UI (by registration number)
4. Remove "dormant" check from ReplicatedEventStatisticsTable.sync()

**Priority:** Low - nice-to-have analytics feature, not core functionality

## Show Details Page with Contact Links - 2025-11-30 08:00

- **Create Show Details page with contact and location links** - Add a dedicated page showing show information with actionable links for secretary email and show site address. **Problem:** Users currently have no way to view show details like secretary contact info, location on a map, or other show metadata. This information is available in the database but not exposed in the UI. **Files:** `src/pages/ShowDetails/ShowDetails.tsx` (new), `src/pages/ShowDetails/ShowDetails.css` (new), `src/App.tsx` (routing), `src/services/replication/tables/ReplicatedShowsTable.ts:18-35` (Show interface with secretary email, phone, location fields). **Solution:** Create new page accessible from ClassList or navigation. Display: show_name, club_name, start_date/end_date, show_secretary_name with `mailto:` link for email, show_secretary_phone with `tel:` link, location field with Google Maps link (`https://maps.google.com/?q={encoded_location}`), website link if available.

## Fix Rules Assistant Dark Mode - 2025-11-30 09:08

- **Fix Rules Assistant dark mode styling** - Replace hardcoded colors with CSS variables to ensure proper dark mode support. **Problem:** Rules Assistant panel has several hardcoded colors that don't adapt to dark mode, causing poor contrast and readability in dark theme. **Files:** `src/components/rules/RulesAssistant.css:124` (beta disclaimer amber background), `src/components/rules/RulesAssistant.css:140` (hardcoded #d97706), `src/components/rules/RulesAssistant.css:317` (hardcoded #dc2626 for report button), `src/components/rules/RulesAssistant.css:230` (search instruction background), `src/components/rules/RulesAssistant.css:326` (report button hover). **Solution:** Replace hardcoded hex colors with CSS custom properties from the design system that respond to `:root.dark` theme selector.

## Fix Announcements Page UX Issues - 2025-11-30 09:10

- **Fix header background color** - Match announcements header to other pages. **Problem:** Page header background doesn't match ClassList and other pages. **Files:** `src/pages/Announcements/Announcements.tsx:112`, `src/pages/Announcements/Announcements.css:14-17`. **Solution:** Update `announcements-header` to use same background styling as other page headers.

- **Convert to slide-out filter panel** - Replace inline filters with reusable FilterPanel component. **Problem:** Announcements uses its own inline filter/search UI instead of the consistent slide-out FilterPanel used elsewhere. **Files:** `src/pages/Announcements/Announcements.tsx:55` (showFilters state), `src/pages/Announcements/Announcements.tsx:264-271` (inline AnnouncementFilters), `src/components/ui/FilterPanel.tsx` (reusable component). **Solution:** Replace `AnnouncementFilters` with `FilterPanel` slide-out component, move search into the panel.

- **Remove "Connected to" banner** - Delete the show context banner with license key and live updates status. **Problem:** This information is redundant/not needed on announcements page. **Files:** `src/pages/Announcements/Announcements.tsx:211-235` (banner JSX), `src/pages/Announcements/Announcements.css:176-241` (banner styles). **Solution:** Remove the `show-context-banner` section entirely.

- **Move search to filter panel** - Relocate search input into the slide-out filter panel. **Problem:** Search is currently inline below header, inconsistent with other pages. **Files:** `src/pages/Announcements/Announcements.tsx:242-262` (search section), `src/pages/Announcements/Announcements.css:243-300` (search styles). **Solution:** Move search input into the FilterPanel component.

- **Navigate to Settings for notifications** - Change notification settings to navigate to Settings page. **Problem:** Clicking "Notification Settings" displays inline settings instead of navigating to the Settings page. **Files:** `src/pages/Announcements/Announcements.tsx:195-204` (menu item), `src/pages/Announcements/Announcements.tsx:237-240` (inline NotificationSettings). **Solution:** Use `navigate('/settings')` and remove inline `NotificationSettings` component.

- **Close 3-dot menu on outside click** - Add click-outside handler for dropdown menu. **Problem:** Menu stays open when clicking elsewhere on screen. **Files:** `src/pages/Announcements/Announcements.tsx:128-207` (menu container and dropdown). **Solution:** Add `useEffect` with click-outside listener to close `showMenuDropdown` when clicking outside `.menu-container`.

