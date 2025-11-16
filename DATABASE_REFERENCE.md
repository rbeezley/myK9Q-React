# DATABASE REFERENCE

**Project**: myK9Q-React-Dev
**Supabase Project ID**: yyzgjyiqgmjzyhzkqdfx
**Region**: us-east-2
**Database**: PostgreSQL (Supabase)

This document provides a comprehensive reference for the myK9Q database schema, including tables, views, functions, and triggers.

---

## Table of Contents
- [Core Tables](#core-tables)
- [Performance Views](#performance-views)
- [Database Functions](#database-functions)
- [Database Triggers](#database-triggers)
- [Common Query Patterns](#common-query-patterns)
- [Multi-Tenant Isolation](#multi-tenant-isolation)

---

## Core Tables

**IMPORTANT - ID Types:**
- Most tables use **bigserial** (auto-incrementing integers), NOT UUIDs
- When working with IndexedDB or client-side caching, convert IDs to strings for consistent lookups
- Supabase returns bigserial as JavaScript `number` type, but route params are always strings

### announcements
Push notification announcements for events.
- **id** (bigserial, PK): Auto-incrementing unique identifier
- **license_key** (text): Multi-tenant isolation key
- **trial_id** (bigint, FK → trials): Associated trial
- **message** (text): Announcement message
- **announcement_type** (text): Type of announcement
- **metadata** (jsonb): Additional metadata
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### classes
Class definitions for trials (e.g., Novice A, Masters B).
- **id** (bigserial, PK): Auto-incrementing unique identifier
- **trial_id** (bigint, FK → trials): Parent trial
- **element** (text): Competition element (e.g., "Scent Work", "Rally")
- **level** (text): Class level (e.g., "Novice", "Masters")
- **section** (text): Section letter (e.g., "A", "B")
- **judge_name** (text): Assigned judge
- **class_status** (text): Current status (NULL = no-status, 'setup', 'briefing', 'break', 'start_time', 'in-progress', 'completed')
- **briefing_time** (text): Time for briefing status
- **break_until** (text): Time for break status
- **start_time** (text): Time for start_time status
- **class_order** (int): Display order
- **self_checkin_enabled** (boolean): Allow exhibitor check-in
- **realtime_results_enabled** (boolean): Show live results
- **is_completed** (boolean): Class completion flag
- **time_limit_seconds** (int): Area 1 time limit
- **time_limit_area2_seconds** (int): Area 2 time limit
- **time_limit_area3_seconds** (int): Area 3 time limit
- **area_count** (int): Number of search areas
- **actual_start_time** (timestamp): Auto-populated when first dog in class is scored
- **actual_end_time** (timestamp): Auto-populated when last dog in class is scored
- **license_key** (text): Multi-tenant isolation key
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

**Important Notes**:
- `class_status = NULL` represents "No Status" in the UI
- Time fields (briefing_time, break_until, start_time) store formatted time strings
- `actual_start_time` and `actual_end_time` are automatically populated by database triggers
- Always filter by `license_key` via trial/show joins for multi-tenant isolation
- **ID Type:** bigserial returns as JavaScript number but must be converted to string for IndexedDB keys

### class_requirements
Organization-specific class requirements with configurable rules.
- **id** (uuid, PK): Unique identifier
- **organization** (text): Organization name (e.g., "AKC", "UKC")
- **element** (text): Competition element
- **level** (text): Class level
- **has_30_second_warning** (boolean, default: true): Whether 30-second warning is given
- **time_type** (text, default: 'range'): Type of max time allowed ('fixed', 'range', 'dictated')
- **warning_notes** (text): Custom warning message for display
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Auto-updated via trigger when rules change

### entries
Dog entries for classes.
- **id** (bigserial, PK): Auto-incrementing unique identifier
- **class_id** (bigint, FK → classes): Associated class
- **armband_number** (text): Unique armband identifier
- **call_name** (text): Dog's call name
- **handler** (text): Handler name
- **entry_status** (text): Check-in status ('checked-in', 'at-gate', 'in-ring')
- **result_status** (text): Scoring result ('qualified', 'nq', etc.)
- **is_scored** (boolean): Whether entry has been scored
- **time** (numeric): Run time in seconds
- **faults** (int): Number of faults
- **placement** (int): Final placement (1st, 2nd, etc.)
- **score** (numeric): Numeric score
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

**Important Notes**:
- Migration 039 merged results table into entries (all scoring data is here)
- `is_scored = true` triggers push notifications via trigger
- Entry status uses text values (not integer codes from legacy system)
- **ID Type:** bigserial returns as JavaScript number but must be converted to string for IndexedDB keys

### event_statistics
Statistics for national events and competitions.
- **id** (uuid, PK): Unique identifier
- **license_key** (text): Multi-tenant isolation key
- **trial_id** (uuid): Associated trial
- **class_id** (uuid): Associated class
- **entry_id** (uuid): Associated entry
- **dog_name** (text): Dog's registered name
- **handler_name** (text): Handler name
- **breed** (text): Dog breed
- **element** (text): Competition element
- **level** (text): Class level
- **score** (numeric): Entry score
- **time** (numeric): Run time
- **placement** (int): Final placement
- **qualified** (boolean): Qualification status
- **trial_date** (date): Trial date
- **results_released** (boolean): Whether results are public
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### nationals_rankings
Rankings for national competitions.
- **id** (uuid, PK): Unique identifier
- **license_key** (text): Multi-tenant isolation key
- **dog_name** (text): Dog's name
- **handler_name** (text): Handler name
- **breed** (text): Dog breed
- **element** (text): Competition element
- **level** (text): Class level
- **total_score** (numeric): Cumulative score
- **runs_completed** (int): Number of completed runs
- **average_score** (numeric): Average score
- **rank** (int): Current rank
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### push_notification_config
Configuration for push notification settings.
- **id** (uuid, PK): Unique identifier
- **license_key** (text): Multi-tenant isolation key
- **enabled** (boolean): Whether push notifications are enabled
- **up_soon_threshold** (int): Number of dogs ahead to trigger notification
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### push_notification_queue
Queue for pending push notifications.
- **id** (uuid, PK): Unique identifier
- **license_key** (text): Multi-tenant isolation key
- **entry_id** (uuid): Associated entry
- **notification_type** (text): Type of notification
- **payload** (jsonb): Notification payload
- **status** (text): Queue status ('pending', 'sent', 'failed')
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### push_subscriptions
Push notification subscriptions for users.
- **id** (uuid, PK): Unique identifier
- **license_key** (text): Multi-tenant isolation key
- **endpoint** (text): Push endpoint URL
- **p256dh_key** (text): Encryption key
- **auth_key** (text): Authentication key
- **user_agent** (text): User's browser/device
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### shows
Top-level show/event containers.
- **id** (uuid, PK): Unique identifier
- **license_key** (text): Multi-tenant isolation key (unique)
- **show_name** (text): Name of the show
- **club_name** (text): Host club name
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

**Important Notes**:
- `license_key` is the primary multi-tenant isolation mechanism
- All queries must filter by `license_key`

### show_visibility_config
Visibility settings for show data.
- **id** (uuid, PK): Unique identifier
- **show_id** (uuid, FK → shows): Associated show
- **results_visible** (boolean): Whether results are visible
- **class_list_visible** (boolean): Whether class lists are visible
- **entry_list_visible** (boolean): Whether entry lists are visible
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

### trials
Trial instances linked to shows.
- **id** (uuid, PK): Unique identifier
- **show_id** (uuid, FK → shows): Parent show
- **trial_number** (int): Trial number within show
- **trial_date** (date): Date of trial
- **trial_name** (text): Name of trial
- **competition_type** (text): Type of competition (e.g., "National", "Regular")
- **actual_start_time** (timestamp): Auto-populated when first dog in trial is scored
- **actual_end_time** (timestamp): Auto-populated when last dog in trial is scored
- **created_at** (timestamp): Creation timestamp
- **updated_at** (timestamp): Last update timestamp

**Important Notes**:
- Check `competition_type = 'National'` for nationals-specific scoring logic
- `actual_start_time` and `actual_end_time` are automatically populated by database triggers
- Always join to shows to get `license_key` for filtering

---

## Performance Views

These views are pre-aggregated and optimized for common queries. **Always use these views instead of manual joins** to eliminate N+1 queries and improve performance.

### view_class_summary ⭐ **USE THIS FOR CLASS LISTS**
Pre-aggregated class statistics with entry counts and timing fields.

**Eliminates**: 3-4 separate queries per class list
**Use in**: ClassList, Home dashboard, CompetitionAdmin pages

**Columns**:
- **Class Identification**: class_id, element, level, section, judge_name, class_status, class_order
- **Class Configuration**: self_checkin_enabled, realtime_results_enabled, is_completed, time_limit_seconds, time_limit_area2_seconds, time_limit_area3_seconds, area_count
- **Class Timing**: briefing_time, break_until, start_time
- **Trial Info**: trial_id, trial_number, trial_date, trial_name
- **Show Info**: show_id, license_key, show_name, club_name
- **Aggregated Counts**:
  - `total_entries`: Total entries in class
  - `scored_entries`: Number of scored entries
  - `checked_in_count`: Entries checked in
  - `at_gate_count`: Entries at gate
  - `in_ring_count`: Entries in ring
  - `qualified_count`: Qualified entries
  - `nq_count`: Non-qualified entries

**Example Query**:
```sql
SELECT * FROM view_class_summary
WHERE license_key = 'myK9Q1-a260f472-e0d76a33-4b6c264c'
ORDER BY trial_date, class_order;
```

### view_entry_with_results ⭐ **USE THIS FOR ENTRY DATA**
Entries pre-joined with results (post-migration 039).

**Eliminates**: Separate entries + results queries + JavaScript map/join logic
**Use in**: entryService, entry lists, scoresheet data loading, dog details

**Columns**: All entry fields + all result fields + computed convenience fields

**Example Query**:
```sql
SELECT * FROM view_entry_with_results
WHERE class_id = 'some-uuid'
AND is_scored = true;
```

### view_entry_class_join_normalized
Pre-joined entry data with class, trial, and show context.

**Use in**: Entry lists with class/trial context

**Columns**: All entry fields + class fields + trial fields + show fields

**Example Query**:
```sql
SELECT * FROM view_entry_class_join_normalized
WHERE license_key = 'myK9Q1-a260f472-e0d76a33-4b6c264c'
AND trial_id = 'some-uuid';
```

### view_trial_summary_normalized
Trial summary with show context.

**Use in**: Trial lists, trial selection dropdowns

**Columns**: All trial fields + show fields

**Example Query**:
```sql
SELECT * FROM view_trial_summary_normalized
WHERE license_key = 'myK9Q1-a260f472-e0d76a33-4b6c264c';
```

---

## Database Functions

### Authentication & Authorization
- **get_user_role()**
  Returns: text
  Gets current user's role from JWT token.

### Class Management
- **get_classes_by_trial(p_trial_id uuid, p_license_key text)**
  Returns: TABLE(id uuid, element text, level text, section text, judge_name text, class_status text, class_order int, ...)
  Gets all classes for a trial with license key verification.

- **get_class_entries(p_class_id uuid, p_license_key text)**
  Returns: TABLE(id uuid, armband_number text, call_name text, handler text, ...)
  Gets all entries for a class with license key verification.

- **update_class_status(p_class_id uuid, p_license_key text, p_status text, p_time_value text)**
  Returns: boolean
  Updates class status and time fields. Converts 'no-status' to NULL.

### Entry Management
- **get_entry_details(p_entry_id uuid, p_license_key text)**
  Returns: TABLE(entry data + class data + trial data + show data)
  Gets complete entry details with all context.

- **update_entry_status(p_entry_id uuid, p_license_key text, p_entry_status text)**
  Returns: boolean
  Updates entry check-in status.

- **score_entry(p_entry_id uuid, p_license_key text, p_time numeric, p_faults int, p_result_status text)**
  Returns: boolean
  Scores an entry and sets is_scored = true (triggers push notification).

### Placement Calculation
- **calculate_placements(p_class_id uuid, p_license_key text)**
  Returns: void
  Calculates placements for all entries in a class based on scoring rules.

- **recalculate_placements_on_score()**
  Returns: trigger
  Trigger function to auto-recalculate placements when entry is scored.

### Push Notifications
- **notify_announcement_created()**
  Returns: trigger
  Sends push notifications when announcements are created.

- **notify_class_started()**
  Returns: trigger
  Sends push notifications when class status changes to 'in-progress'.

- **notify_up_soon()**
  Returns: trigger
  Sends "up soon" notifications when entries are scored (watches is_scored column).

### Statistics & Rankings
- **update_nationals_rankings()**
  Returns: trigger
  Updates nationals rankings when event statistics are inserted.

- **handle_results_release()**
  Returns: trigger
  Handles logic when results are released publicly.

### Utility Functions
- **update_updated_at_column()**
  Returns: trigger
  Auto-updates updated_at timestamp on row updates.

- **initialize_show_visibility_defaults()**
  Returns: trigger
  Ensures every new show gets default visibility settings.

---

## Database Triggers

### Auto-Timestamp Triggers (BEFORE UPDATE)
These triggers automatically update the `updated_at` column:
- **announcements**: `update_announcements_updated_at`
- **classes**: `trigger_competition_classes_updated_at`
- **entries**: `trigger_class_entries_updated_at`
- **shows**: `trigger_dog_shows_updated_at`
- **trials**: `trigger_trial_events_updated_at`
- **class_requirements**: `class_requirements_updated_at_trigger`
- **push_notification_config**: `push_notification_config_updated_at`
- **push_notification_queue**: `push_notification_queue_updated_at`
- **push_subscriptions**: `push_subscriptions_updated_at`

### Push Notification Triggers (AFTER INSERT/UPDATE)
- **announcements** (AFTER INSERT): `trigger_notify_announcement_created`
  Sends push notifications when announcements are created.

- **classes** (AFTER UPDATE): `trigger_notify_class_started`
  Sends push notifications when class status changes.

- **entries** (AFTER UPDATE): `on_entry_scored`
  Sends "up soon" notifications when is_scored changes to true.
  **Note**: This watches the is_scored column in entries table (after migration 039 merged results into entries).

### Statistics & Rankings Triggers
- **event_statistics** (AFTER INSERT): `trigger_update_nationals_rankings`
  Updates nationals rankings when new statistics are inserted.

- **event_statistics** (BEFORE UPDATE): `trigger_handle_results_release`
  Handles results release logic.

### Initialization Triggers
- **shows** (AFTER INSERT): `trigger_initialize_show_visibility_defaults`
  Ensures every new show gets default visibility settings initialized automatically.

---

## Common Query Patterns

### Get All Classes for a Show
```sql
SELECT * FROM view_class_summary
WHERE license_key = 'your-license-key'
ORDER BY trial_date, class_order;
```

### Get Entry Details with Results
```sql
SELECT * FROM view_entry_with_results
WHERE class_id = 'class-uuid'
ORDER BY armband_number;
```

### Get Trial Summary
```sql
SELECT * FROM view_trial_summary_normalized
WHERE license_key = 'your-license-key'
AND trial_date >= CURRENT_DATE;
```

### Update Class Status (with time)
```sql
SELECT update_class_status(
  'class-uuid',
  'your-license-key',
  'briefing',
  '10:30 AM'
);
```

### Score an Entry
```sql
SELECT score_entry(
  'entry-uuid',
  'your-license-key',
  45.23,  -- time in seconds
  0,      -- faults
  'qualified'
);
```

### Get Entries for a Class
```sql
SELECT * FROM view_entry_with_results
WHERE class_id = 'class-uuid'
AND license_key = 'your-license-key'
ORDER BY armband_number;
```

---

## Multi-Tenant Isolation

**Critical**: All queries must filter by `license_key` for multi-tenant data isolation.

### License Key Format
`myK9Q1-a260f472-e0d76a33-4b6c264c`

### Passcode Generation
Extracts 4-character segments from license key:
- **Admin**: `a` + first 4 chars of segment 2 → `aa260`
- **Judge**: `j` + first 4 chars of segment 2 → `jf472`
- **Steward**: `s` + first 4 chars of segment 3 → `se0d7`
- **Exhibitor**: `e` + first 4 chars of segment 4 → `e4b6c`

### Test License Key
For development/testing: `myK9Q1-a260f472-e0d76a33-4b6c264c`

### Row-Level Security (RLS)
Most tables have RLS policies that automatically filter by:
1. JWT token's `license_key` claim
2. Explicit `license_key` parameter in function calls

**Always pass `license_key` to database functions** for security.

---

## Migration History Notes

### Migration 039: Results Table Merge
- Merged `results` table into `entries` table
- All scoring fields (time, faults, score, placement, result_status, is_scored) are now in entries
- Views updated to query entries directly instead of joining results
- **Important**: `is_scored` column in entries triggers push notifications

### Migration 042: View Reconstruction
- Recreated `view_class_summary` after migration 039 cascade drop
- Removed results table join (data now in entries)

### Migration 20251107170000: Time Fields
- Added `briefing_time`, `break_until`, `start_time` columns to classes table
- Updated `view_class_summary` to include timing fields
- Supports persistent time values for class status display

---

## Performance Best Practices

1. **Always use views for common queries**
   - `view_class_summary` for class lists (eliminates 3-4 queries)
   - `view_entry_with_results` for entry data (eliminates joins)

2. **Filter early and often**
   - Always add `WHERE license_key = 'your-key'` first
   - Add indexes on frequently filtered columns

3. **Use database functions**
   - Functions include license_key validation
   - Functions handle complex business logic server-side

4. **Leverage triggers**
   - Placement calculations happen automatically
   - Timestamps update automatically
   - Push notifications send automatically

5. **Real-time subscriptions**
   - Subscribe to tables with `license_key` filter
   - Use Supabase channels for targeted updates

---

## Quick Reference: When to Use What

| Task | Use This |
|------|----------|
| Display class list | `view_class_summary` |
| Display entry list with results | `view_entry_with_results` |
| Get entry with context | `view_entry_class_join_normalized` |
| Update class status | `update_class_status()` function |
| Score an entry | `score_entry()` function |
| Check auth role | `get_user_role()` function |
| Calculate placements | `calculate_placements()` function |
| Get trial summary | `view_trial_summary_normalized` |

---

**Last Updated**: 2025-11-07
**Schema Version**: Post-migration 042 (Results merged into entries)
