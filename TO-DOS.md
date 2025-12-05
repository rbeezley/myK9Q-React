# Outstanding Tasks

## React Server Components Vulnerability - 2025-12-03 ✅ COMPLETE

- **FIXED:** Updated React 19.2.0 → **19.2.1** to patch CVE-2025-55182 and CVE-2025-66478.
- **Note:** myK9Q was low-risk (no RSC usage) but updated for defense in depth.
- **Files:** [package.json](package.json)

---

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

## Class Card Progress Bar Divider - 2025-11-28 21:19 ✅ COMPLETE

- **IMPLEMENTED:** Replaced static dividing line with a progress bar showing class completion.

**How it works:**
- **Gray track** = Total entries in class
- **Teal fill** = % of dogs scored (width grows left-to-right)
- **Green fill** = 100% complete (all dogs scored)

**No-entries state:**
- Shows gray line for visual consistency
- Icon and "No entries yet" on one line (compact)

**Files Modified:**
- [ClassCard.tsx:305-315](src/pages/ClassList/ClassCard.tsx#L305-L315) - Added progress bar element
- [ClassCard.tsx:362-369](src/pages/ClassList/ClassCard.tsx#L362-L369) - Updated no-entries to inline layout
- [ClassList.css:789-808](src/pages/ClassList/ClassList.css#L789-L808) - Added progress bar styles
- [ClassList.css:1306-1331](src/pages/ClassList/ClassList.css#L1306-L1331) - Updated no-entries to flex-row

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

## App-Wide Typography Upgrade - 2025-12-03 ✅ COMPLETE

- **IMPLEMENTED:** Montserrat is now the primary app-wide font.
- **Files:** [design-tokens.css:299](src/styles/design-tokens.css#L299), [critical.css:173](public/critical.css#L173)
- **Note:** Playfair Display remains reserved for The Podium celebration moments.

## App-Wide Premium Background Upgrade - 2025-12-03 ✅ COMPLETE

- **IMPLEMENTED:** Warm background colors applied across light and dark modes.
- **Changes:**
  - Light BG: `#F8F7F4` (warm off-white)
  - Light Card: `#FEFDFB` (subtle cream)
  - Dark BG: `#1a1a1e` (warmer charcoal)
- **Files:** [design-tokens.css:20-40](src/styles/design-tokens.css#L20-L40), [design-tokens.css:334](src/styles/design-tokens.css#L334)

---

## Show Details Page with Contact Links - 2025-11-30 08:00 ✅ COMPLETE

- **IMPLEMENTED:** Show Info page with contact and location links accessible from hamburger menu.

**Features:**
- ✅ Event Details card: club name, event name, organization, dates, status badge
- ✅ Location card (hidden if empty): site name, full site address with Google Maps link, website link, event URL link
- ✅ Trial Secretary card (hidden if empty): name, `mailto:` email, `tel:` phone
- ✅ Trial Chairman card (hidden if empty): name, `mailto:` email, `tel:` phone
- ✅ Notes card (hidden if empty, trims whitespace)
- ✅ Refresh button to sync latest data
- ✅ Loading and error states
- ✅ Compact styling to minimize scrolling

**Database Fields Supported:**
- Site info: `site_name`, `site_address`, `site_city`, `site_state`, `site_zip`, `location` (legacy)
- Secretary: `secretary_name`/`show_secretary_name`, `secretary_email`/`show_secretary_email`, `secretary_phone`/`show_secretary_phone`
- Chairman: `chairman_name`, `chairman_email`, `chairman_phone`
- URLs: `website`, `event_url`

**Files Created/Modified:**
- [ShowDetails.tsx](src/pages/ShowDetails/ShowDetails.tsx) (new)
- [ShowDetails.css](src/pages/ShowDetails/ShowDetails.css) (new)
- [App.tsx](src/App.tsx) - Added `/show/:licenseKey` route
- [HamburgerMenu.tsx](src/components/ui/HamburgerMenu.tsx) - Added "Show Info" nav item after Statistics
- [ReplicatedShowsTable.ts](src/services/replication/tables/ReplicatedShowsTable.ts) - Updated Show interface with all fields

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

## Hamburger Menu Logical Grouping - 2025-12-02 ✅ COMPLETE

- **IMPLEMENTED:** Reorganized hamburger menu items into logical groups.

**Final Structure:**
| Section | Items |
|---------|-------|
| **Home** | Home |
| **Show-related** | Show Info, Statistics |
| **Communication** | Announcements, Inbox |
| **Tools** | Rules Assistant (kept visible per user request) |
| **Admin** | Run Order Display, Results Control (admin only) |
| **Help & Support** | User Guide, Video Tutorials, About (collapsible) |
| **Preferences** | Settings, Light/Dark Mode |
| **Session** | Logout |

**Files Modified:**
- [HamburgerMenu.tsx:185-223](src/components/ui/HamburgerMenu.tsx#L185-L223) - Reordered menu items with section comments

## Fix CSS Rehydration Issue - 2025-12-02 ✅ COMPLETE

- **FIXED:** Status badges showed gray text and armband numbers had incorrect styling on initial page load (fixed after browser refresh).

**Root Cause:**
- Component CSS (`ClassList.css`, `utilities.css`) loads asynchronously via ES module import in `main.tsx`
- React can render before all CSS chunks are loaded
- Status badges inherited gray text color instead of white
- Armband numbers could render with unexpected styling during the CSS loading race condition

**Solution:**
Added minimal critical CSS fallbacks in `critical.css` that ensure elements look correct even before component CSS loads:
- Status badges: Solid backgrounds with explicit white text (`color: #ffffff`)
- Armband numbers: Simple inline text with no container styling

**Files Modified:**
- [critical.css](public/critical.css) - Added critical component fallbacks (status badges, armband numbers)
- [index.html](index.html) - Bumped cache version `?v=3` → `?v=4`

**Testing:**
- Hard refresh (Ctrl+Shift+R) on ClassList page
- Verify status badge text is white on colored backgrounds
- Verify armband numbers display as simple inline teal text

**Additional Fix (2025-12-02):**
- Added dog card height fallbacks to prevent overlap on Home page during CSS loading
- `.dog-card` and `.entry-card` now have `min-height: 70px`, `max-height: none`, and `overflow: hidden`
- Cache version bumped to `?v=5`

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

---

## Drag-and-Drop ExhibitorOrder Cross-Tab Sync Issue - 2025-12-04 21:15

- **Debug cross-tab exhibitorOrder sync** - When Tab A reorders entries via drag-and-drop, Tab B doesn't reflect the new order despite receiving sync notifications. **Problem:** The entire sync chain appears to work (Realtime events fire, sync runs, cache updates, listeners notified, refresh called) but Tab B's UI continues showing the old exhibitor_order values. Other status changes (like "in-ring") DO sync correctly, suggesting the issue is specific to exhibitorOrder updates. **Files:** `src/services/entry/entryBatchOperations.ts:62-108` (updateExhibitorOrder), `src/pages/EntryList/hooks/useEntryListData.ts:97-132` (refresh with pending queue), `src/pages/EntryList/hooks/useDragAndDropEntries.ts:160-233` (handleDragEnd), `src/services/replication/ConnectionManager.ts:147-215` (broadcast/realtime handling), `src/services/replication/tables/ReplicatedEntriesTable.ts` (sync logic), `src/pages/EntryList/hooks/useEntryListDataHelpers.ts:238-285` (cache read). **Solution:** Debug logging has been added throughout the data flow chain. Next step is to test with two tabs and compare console logs to identify where the exhibitorOrder value stops being correct. Key logs to look for: 🔀 (drag), 📋 (Supabase update), 📡 (broadcast/realtime), 🔔 (subscription callback), 📦 (cache read), 📥 (UI state update).

**Debug Logging Chain (in order):**

| Tab A (User drags) | Tab B (Should update) |
|--------------------|-----------------------|
| 🔀 useDragAndDropEntries - entries being reordered | 📡 ConnectionManager - broadcast/realtime received |
| 📋 updateExhibitorOrder - what's sent to Supabase | 🔍 ReplicatedEntriesTable - sync query filter |
| ✅ updateExhibitorOrder - Supabase response | 🔄 ReplicatedEntriesTable - entries being cached |
| 🔄 triggerImmediateEntrySync - sync triggered | 🔔 ReplicatedTableCache - notifyListeners |
| | 🔔 useEntryListData - subscription callback |
| | 📦 useEntryListDataHelpers - raw cache entry |
| | 📥 EntryList/CombinedEntryList - UI state update |

**Hypothesis to test:**
1. Is Tab B's sync query filter (updated_at > timestamp) missing the updates due to timing?
2. Is the cache returning old data despite batchSet completing?
3. Is the transformation in transformReplicatedEntry losing the value?
4. Is React not re-rendering due to shallow comparison?

**Test procedure:**
1. Open Tab A to a class list, clear console
2. Open Tab B to same class, clear console
3. On Tab A, drag entry to reorder
4. Compare both console logs - find where exhibitorOrder values diverge

**Priority:** High - Core feature broken, impacts multi-device workflows

---

## Printable Judge Scoresheets by Class - 2025-12-05 14:06

- **Create printable scoresheet page for judges** - Generate paper scoresheets per class that judges can print or save as PDF for official record-keeping (1-year retention required). **Problem:** Judges need physical paper scoresheets to record scores during trials and must retain them for regulatory compliance. Currently no way to generate formatted scoresheets for a class. **Files:** `src/pages/Results/` (reference implementation for print/PDF pattern), `src/pages/scoresheets/` (existing digital scoresheet components for data structure reference). **Solution:** Create new page similar to Results that renders a printable scoresheet layout. Key elements from example image:
  - **Header:** Trial date, Trial #, Judge name, Element, Level, Section
  - **Requirements box:** Hides count, Distractions count/type, Time Limit
  - **Used box:** Actual hides used, Time limits per area
  - **Entry rows (one per dog):**
    - Armband #, Dog name (call name)
    - Registration #, Handler name
    - Breed
    - Qualified checkbox
    - Handler Error / Safety Concern / Mild Disruption write-in fields
    - Fault checkboxes: Incorrect Call, Harsh correction, Significant Disruption, Point to Hide, Max Time
    - Time entry: MM:SS:TT columns
  - **Footer:** Class Entries count
  - Print-optimized CSS (fits on standard letter/A4 paper)

**Access Points (same pattern as Check-In Sheets and Results):**
  - Class List page → 3-dot menu per class → "Print Scoresheet"
  - Entry List page → 3-dot menu → "Print Scoresheet"
  - Combined Entry List page → 3-dot menu → "Print Scoresheet"

**Priority:** Medium - Judges currently use external templates; this improves workflow efficiency

