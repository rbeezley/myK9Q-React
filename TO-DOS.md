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

## Fix Announcements Page UX Issues - 2025-11-30 09:10 ✅ COMPLETE

**Summary:**
- ✅ Removed "Connected to" banner (redundant info)
- ✅ Notification Settings now navigates to Settings page
- ✅ 3-dot menu closes on outside click
- ✅ Header uses shared `.page-header` styles correctly
- ✅ Replaced inline search/filters with slide-out FilterPanel
- ✅ Added sorting options: Newest, Oldest, Priority, Unread
- ✅ Fixed Create Announcement modal dark mode (white-on-white inputs)

**Files Modified:**
- [Announcements.tsx](src/pages/Announcements/Announcements.tsx) - Simplified UI, added FilterPanel with sort
- [Announcements.css](src/pages/Announcements/Announcements.css) - Removed unused banner/search CSS
- [AnnouncementComponents.css](src/components/announcements/AnnouncementComponents.css) - Fixed form inputs to use `--input-bg`/`--input-text`, added `.theme-dark` overrides for modal

## Standardize 3-Dot Menu Pattern - 2025-11-30 13:30 ✅ COMPLETE

- **Standardized 3-dot overflow menu across all pages** - Refresh is now first, followed by divider, then other actions.

**Pattern Applied To:**
- ✅ **Announcements** - Refresh → divider → Search/Sort, Mark All Read, Create, Settings
- ✅ **Settings** - Refresh → divider → Reset All
- ✅ **Entry List** - Refresh → divider → Run Order, Recalculate → divider → Print options

**Files Modified:**
- [Announcements.tsx:187-257](src/pages/Announcements/Announcements.tsx#L187-L257) - Reordered menu items
- [Announcements.css:186-191](src/pages/Announcements/Announcements.css#L186-L191) - Added `.dropdown-divider` style
- [Settings.tsx:98-127](src/pages/Settings/Settings.tsx#L98-L127) - Added divider after Refresh
- [Settings.css:150-154](src/pages/Settings/Settings.css#L150-L154) - Added `.dropdown-divider` style
- [EntryListHeader.tsx:166-232](src/pages/EntryList/components/EntryListHeader.tsx#L166-L232) - Added divider after Refresh

## Class Requirements Dialog Value Prominence - 2025-11-30 13:33 ✅ COMPLETE

- **Swapped visual hierarchy** - Values are now the hero (large, bold, prominent), labels are secondary (small, muted, uppercase).

**Before → After:**
| Element | Before | After |
|---------|--------|-------|
| **Label** | `0.75rem`, `600 weight`, `--foreground` | `0.6875rem`, `500 weight`, `--muted-foreground`, uppercase |
| **Value** | `0.875rem`, normal weight, `--muted-foreground` | `1.125rem` (mobile) / `1.5rem` (desktop), `700 weight`, `--foreground` |

**Bug Fixed:** Desktop font-size was using `var(--token-space-lg)` (spacing token = 12px) instead of actual font size.

**Files Modified:**
- [ClassRequirementsDialog.css:151-177](src/components/dialogs/ClassRequirementsDialog.css#L151-L177) - Swapped label/value hierarchy
- [ClassRequirementsDialog.css:256-263](src/components/dialogs/ClassRequirementsDialog.css#L256-L263) - Fixed desktop overrides
- [ClassRequirementsDialog.css:302-309](src/components/dialogs/ClassRequirementsDialog.css#L302-L309) - Updated dark mode

## Rules Assistant Dark Mode Text Visibility - 2025-11-30 ✅ COMPLETE

- **FIXED:** Beta disclaimer and help text were nearly invisible in dark mode due to using `var(--token-text-secondary)`.

**Changes:**
- Beta disclaimer: Changed to `var(--foreground)` with amber-tinted background `rgba(245, 158, 11, 0.15)`
- Beta disclaimer strong text: Uses `var(--token-warning)` for amber accent
- Help text: Changed to `var(--foreground)` with teal-tinted background `rgba(20, 184, 166, 0.15)`

**Files Modified:**
- [RulesAssistant.css:44-57](src/components/rules/RulesAssistant.css#L44-L57) - Added dark mode overrides for text visibility

## Inbox Panel Header Consistency - 2025-11-30 ✅ COMPLETE

- **FIXED:** Inbox panel header now matches Rules Assistant and Search & Sort slide-out panels.

**Before → After:**
| Element | Before | After |
|---------|--------|-------|
| **Background** | `var(--brand-gradient)` (teal gradient) | `var(--card)` (neutral) |
| **Title text** | White | `var(--foreground)` |
| **Icon** | White | `var(--primary)` (teal) |
| **Close button** | White on translucent | `var(--token-text-tertiary)` on transparent |

**Files Modified:**
- [NotificationCenter.css:47-108](src/components/notifications/NotificationCenter.css#L47-L108) - Updated header to use design tokens
- [NotificationCenter.css:22-37](src/components/notifications/NotificationCenter.css#L22-L37) - Updated panel to use `var(--background)`

