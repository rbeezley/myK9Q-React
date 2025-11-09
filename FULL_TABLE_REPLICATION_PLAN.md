# Full Table Replication Implementation Plan (Option B)

**Project**: myK9Q React App
**Timeline**: 30 days across 6 phases
**Risk Level**: Medium-High (mitigated by feature flags)
**Benefit**: Single source of truth, cleaner architecture, better long-term maintainability
**Last Updated**: 2025-11-09

---

## Phase Overview

This plan is organized into **6 distinct phases** spanning 30 days total:

| Phase | Duration | Focus | Success Criteria |
|-------|----------|-------|-----------------|
| **Phase 0: Pre-Implementation** | 3 days | Database schema fixes, missing tables | All tables/views created and tested |
| **Phase 1: Foundation** | 5 days | Core infrastructure, IndexedDB, base classes | ReplicatedTable pattern working for 1 table |
| **Phase 2: Sync & Conflict Resolution** | 5 days | Sync engine, conflict resolver, orchestration | Bidirectional sync working offline |
| **Phase 3: Core Table Migration** | 5 days | Critical tables (entries, classes, trials, shows) | 100% offline scoring and navigation |
| **Phase 4: Secondary Tables** | 5 days | Visibility, announcements, push, stats, nationals | All 17 tables replicated |
| **Phase 5: Production Rollout** | 7 days | Cleanup, optimization, testing, 100% rollout | Zero rollbacks, <5% error rate |

**Total Timeline**: 30 days (3 days pre-work + 27 days implementation)

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Executive Summary](#executive-summary)
3. [Critical Findings from Feature Inventory](#critical-findings-from-feature-inventory)
4. [The "Hybrid Mess" Problem](#the-hybrid-mess-problem---why-we-need-this-rewrite)
5. [Phase 0: Pre-Implementation - Database Schema Fixes](#phase-0-pre-implementation---database-schema-fixes-3-days)
6. [Phase 1: Foundation & Core Infrastructure](#phase-1-foundation--core-infrastructure-5-days)
7. [Phase 2: Sync Engine & Conflict Resolution](#phase-2-sync-engine--conflict-resolution-5-days)
8. [Phase 3: Core Table Migration](#phase-3-core-table-migration-5-days)
9. [Phase 4: Secondary Tables & Edge Cases](#phase-4-secondary-tables--edge-cases-5-days)
10. [Phase 5: Production Rollout & Optimization](#phase-5-production-rollout--optimization-7-days)
11. [Complete Table Replication Priority Order](#complete-table-replication-priority-order-17-tables)
12. [Feature-Specific Sync Strategies](#feature-specific-sync-strategies)
13. [Rollout Phases & Feature Flags](#rollout-phases--feature-flags)
14. [Risk Mitigation](#risk-mitigation)
15. [Rollback Plan](#rollback-plan)
16. [Success Metrics](#success-metrics)
17. [Architectural Guardrails](#architectural-guardrails-never-let-this-happen-again)
18. [Implementation Checklist](#implementation-checklist-guardrails-in-place)
19. [Key Files to Create](#key-files-to-create)
20. [Dependencies & Prerequisites](#dependencies--prerequisites)
21. [Questions Before Starting](#questions-before-starting)
22. [Comparison to Option A](#comparison-to-option-a-extend-current)
23. [Summary of Changes](#summary-of-changes-to-original-plan)
24. [Next Steps](#next-steps)

---

## Executive Summary

**Timeline**: 30 days across 6 phases (see Phase Overview above)
**Risk Level**: Medium-High (mitigated by feature flags)
**Benefit**: Single source of truth, cleaner architecture, better long-term maintainability

### Architecture Overview

#### Current State
- **LocalStateManager**: Entry-only caching (566 lines)
- **AutoDownloadService**: Downloads show data on login
- **React Query**: Used in useClassListData.ts for trials/classes
- **IndexedDB**: Cache wrapper with TTL support
- **Hybrid Approach**: Mix of React Query, SWR, and LocalStateManager

#### Target State
- **ReplicatedTableService**: Generic table replication for all 17 tables
- **Single Source of Truth**: All reads go through replicated cache
- **Automatic Sync**: Background sync with conflict resolution
- **Feature Flags**: Gradual rollout per table
- **Unified API**: Consistent interface across all data access

---

## Critical Findings from Feature Inventory

The exploration revealed:

1. ✅ **Core scoring features ARE covered** (entries, classes, trials, shows)
2. ❌ **Result Visibility Control is BLOCKED** - missing 2 tables for cascading visibility
3. ❌ **Statistics page is DEGRADED** - missing `view_stats_summary` optimization
4. ❌ **Announcements partially incomplete** - `announcement_reads` table unclear
5. ❌ **Audit logging unclear** - `view_audit_log` schema needs clarification
6. ✅ **Push notifications covered** (config, queue, subscriptions tables exist)
7. ✅ **Nationals scoring dormant but tables exist** (event_statistics, nationals_rankings)

---

## The "Hybrid Mess" Problem - Why We Need This Rewrite

### Current State Analysis: A Fragmented Caching Nightmare

Right now, the app has **THREE DIFFERENT CACHING SYSTEMS** that don't talk to each other:

#### 1. **LocalStateManager** (Entries Only)
- **Location**: `src/services/localStateManager.ts` (566 lines)
- **Storage**: IndexedDB (`STORES.METADATA`)
- **Cache Keys**: `local-state-entries`, `pending-changes`
- **Scope**: **ONLY entries table**
- **Strategy**: Optimistic updates with pending changes merge
- **Expiration**: Manual cleanup (stale pending > 1 min)

#### 2. **React Query** (Trials, Classes)
- **Location**: `src/pages/ClassList/hooks/useClassListData.ts`
- **Storage**: React Query cache (in-memory + `localStorage` via persist)
- **Cache Keys**: `['classList', trialId, 'trialInfo']`, `['classList', trialId, 'classes']`
- **Scope**: Trials and classes (via `view_class_summary`)
- **Strategy**: `staleTime: 5 min`, `gcTime: 10 min`, `networkMode: 'always'`
- **Expiration**: React Query garbage collection

#### 3. **IndexedDB Direct Cache** (Everything Else)
- **Location**: `src/utils/indexedDB.ts` + `src/services/autoDownloadService.ts`
- **Storage**: IndexedDB (`STORES.CACHE`)
- **Cache Keys**: `trial-info-${licenseKey}-${trialId}`, `class-summary-${licenseKey}-${trialId}`, `auto-download-${licenseKey}`
- **Scope**: Trial info, class summaries, auto-download metadata
- **Strategy**: TTL-based (30 min default)
- **Expiration**: Auto-cleanup on `get()` if expired

### The Inconsistency Issues

| Data Type | System | Cache Key Pattern | TTL | Offline Support |
|-----------|--------|-------------------|-----|-----------------|
| **Entries** | LocalStateManager | `local-state-entries` | Manual cleanup | ✅ Full (offline queue) |
| **Classes** | React Query | `['classList', trialId, 'classes']` | 1 min stale | ⚠️ Partial (in-memory only) |
| **Trials** | React Query | `['classList', trialId, 'trialInfo']` | 5 min stale | ⚠️ Partial (in-memory only) |
| **Trial Info** | IndexedDB Cache | `trial-info-${licenseKey}-${trialId}` | 30 min | ✅ Full (IndexedDB) |
| **Class Summary** | IndexedDB Cache | `class-summary-${licenseKey}-${trialId}` | 30 min | ✅ Full (IndexedDB) |
| **Auto-Download** | IndexedDB Cache | `auto-download-${licenseKey}` | 30 min | ✅ Full (IndexedDB) |

### Specific Problems This Causes

#### Problem 1: **Duplicate Caching**
```typescript
// Trial data is cached TWICE in different formats:

// 1. React Query cache (in-memory + localStorage persist)
const trialInfoQuery = useQuery({
  queryKey: ['classList', trialId, 'trialInfo'],
  queryFn: () => fetchTrialInfo(trialId, showId, licenseKey),
});

// 2. IndexedDB cache (in autoDownloadService.ts)
const cached = await idbCache.get(`trial-info-${licenseKey}-${trialId}`);
```

**Result**: Same trial data stored in 2 places with different cache keys and different expiration times.

#### Problem 2: **Inconsistent Offline Behavior**
```typescript
// Offline scenario: User goes offline after loading ClassList

// ❌ React Query cache is in-memory (lost on browser refresh)
// User refreshes browser → Data is GONE (React Query cache cleared)

// ✅ IndexedDB cache persists across browser restarts
// BUT: Code tries to fetch from React Query first, which fails offline
// THEN: Falls back to IndexedDB cache (if the code path exists)

// Result: Unreliable offline experience depending on which code path executes
```

#### Problem 3: **Race Conditions Between Caches**
```typescript
// Sequence of events:
// 1. User loads ClassList → React Query fetches trials
// 2. autoDownloadService runs → IndexedDB caches trials
// 3. User scores entry → LocalStateManager updates entries
// 4. Server updates trial (placement calculation) → Trial data changes
// 5. React Query refetches → Gets new trial data
// 6. IndexedDB cache is stale → Still has old trial data
// 7. User goes offline → Code tries React Query (fails) → Falls back to stale IndexedDB

// Result: Stale data shown offline because caches aren't synchronized
```

#### Problem 4: **No Single Source of Truth**
```typescript
// Question: "What is the current trial_name for trial 123?"

// Answer depends on WHICH system you ask:

// LocalStateManager: "I don't know, I only store entries"
// React Query: "Trial 1" (stale, cached 3 minutes ago)
// IndexedDB Cache: "Trial 1 - Updated" (fresh, cached 30 seconds ago)
// Supabase (server): "Trial 1 - Updated v2" (just changed)

// Result: Different parts of the UI show different values
```

#### Problem 5: **Cache Invalidation Nightmare**
```typescript
// When a trial is updated on the server, we need to invalidate:

// 1. React Query cache
queryClient.invalidateQueries(['classList', trialId, 'trialInfo']);

// 2. IndexedDB cache
await idbCache.delete(`trial-info-${licenseKey}-${trialId}`);

// 3. React Query classes cache (because it includes trial data)
queryClient.invalidateQueries(['classList', trialId, 'classes']);

// 4. IndexedDB class summary cache
await idbCache.delete(`class-summary-${licenseKey}-${trialId}`);

// Result: Must remember to invalidate ALL caches, easy to miss one
// (Missed invalidation = stale data shown to user)
```

#### Problem 6: **Different TTL Strategies = Confusion**
```typescript
// Same data, different expiration logic:

// React Query (stale-while-revalidate):
staleTime: 1 * 60 * 1000, // 1 min - data considered stale
gcTime: 5 * 60 * 1000,    // 5 min - data garbage collected

// IndexedDB Cache (TTL-based):
ttl: 30 * 60 * 1000,      // 30 min - data expires

// LocalStateManager (manual cleanup):
if (age > 60 * 1000) {    // 1 min - pending changes cleaned up
  clearStalePending();
}

// Result: Same data has 3 different "freshness" definitions
```

#### Problem 7: **Memory Waste**
```typescript
// Trial data with 100 classes, 1000 entries:

// React Query in-memory cache: ~2 MB
// IndexedDB cache (duplicate): ~2 MB
// LocalStateManager (entries only): ~1 MB

// Total memory usage: ~5 MB (with 2 MB of duplicates)
// With full table replication: ~3 MB (single copy)

// Result: 40% memory overhead from duplicate caching
```

### Visual Diagram: Current "Hybrid Mess"

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                             │
│                    (Load ClassList Page)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   useClassListData() Hook               │
        └────────┬───────────────────────┬────────┘
                 │                       │
                 ▼                       ▼
   ┌─────────────────────┐    ┌──────────────────────┐
   │  React Query        │    │  React Query         │
   │  (trialInfo)        │    │  (classes)           │
   │                     │    │                      │
   │  Cache:             │    │  Cache:              │
   │  in-memory +        │    │  in-memory +         │
   │  localStorage       │    │  localStorage        │
   │                     │    │                      │
   │  TTL: 5 min stale   │    │  TTL: 1 min stale    │
   └──────────┬──────────┘    └───────────┬──────────┘
              │                           │
              │ (on cache miss)           │ (on cache miss)
              ▼                           ▼
   ┌──────────────────────────────────────────────────┐
   │         fetchTrialInfo() / fetchClasses()        │
   │                                                  │
   │  1. Try IndexedDB cache first (autoDownload)    │
   │  2. If miss, fetch from Supabase                │
   │  3. Store in IndexedDB cache                    │
   │  4. Return to React Query                       │
   │  5. React Query caches it AGAIN                 │
   └──────────────────────┬───────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  IndexedDB Cache (idbCache)         │
        │                                     │
        │  trial-info-${key}-${id}           │
        │  class-summary-${key}-${id}        │
        │                                     │
        │  TTL: 30 min                        │
        └─────────────────────────────────────┘

                          │
                          │ (getClassEntries)
                          ▼
        ┌─────────────────────────────────────┐
        │  LocalStateManager (entries only)   │
        │                                     │
        │  local-state-entries                │
        │  pending-changes                    │
        │                                     │
        │  TTL: Manual cleanup (1 min)        │
        └─────────────────────────────────────┘

RESULT: Trial data stored in 3 places, classes in 2 places, entries in 2 places
        Different cache keys, different TTLs, no synchronization
```

### What Full Table Replication Fixes

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                             │
│                    (Load ClassList Page)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   useReplicatedTable('trials')         │
        │   useReplicatedTable('classes')        │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌─────────────────────────────────────────┐
        │  ReplicationManager (single source)     │
        │                                         │
        │  getTable('trials')  → ReplicatedTable  │
        │  getTable('classes') → ReplicatedTable  │
        │  getTable('entries') → ReplicatedTable  │
        │                                         │
        │  ALL data in ONE place with ONE TTL     │
        └──────────────────┬──────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────────┐
        │  IndexedDB (STORES.REPLICATED_TABLES)   │
        │                                         │
        │  {tableName: 'trials', id: '123', ...}  │
        │  {tableName: 'classes', id: '456', ...} │
        │  {tableName: 'entries', id: '789', ...} │
        │                                         │
        │  Consistent cache keys                  │
        │  Unified TTL strategy                   │
        │  Single sync engine                     │
        │  Automatic conflict resolution          │
        └─────────────────────────────────────────┘

RESULT: ONE copy of data, ONE source of truth, ONE cache invalidation point
```

### Code Comparison: Before vs After

#### Before (Hybrid Mess):
```typescript
// To get trial data, you need to know WHICH system to ask:

// Option 1: React Query (in-memory, lost on refresh)
const { data: trialInfo } = useQuery({
  queryKey: ['classList', trialId, 'trialInfo'],
  queryFn: () => fetchTrialInfo(trialId, showId, licenseKey),
});

// Option 2: IndexedDB Cache (persistent, manual)
const cached = await idbCache.get(`trial-info-${licenseKey}-${trialId}`);

// Option 3: Direct Supabase (online only)
const { data } = await supabase.from('trials').select('*').eq('id', trialId);

// Result: 3 different code paths, 3 different APIs, no consistency
```

#### After (Full Replication):
```typescript
// Single API for ALL tables:

// Get trial data (automatically cached, synced, conflict-resolved)
const trial = await replicationManager.getTable('trials').get(trialId);

// Get classes for a trial
const classes = await replicationManager.getTable('classes').queryIndex('trial_id', trialId);

// Get entries for a class
const entries = await replicationManager.getTable('entries').queryIndex('class_id', classId);

// Result: ONE API, ONE source of truth, consistent behavior
```

### Migration Strategy: How We Fix This

#### Migration Phase Approach

This migration follows the 6 phases outlined in the Phase Overview:

**Phase 0-1**: Build ReplicatedTable infrastructure alongside existing code
- Feature flags control which system is used
- New code paths use ReplicatedTable
- Old code paths still use LocalStateManager + React Query
- **No breaking changes** during migration

**Phase 2-3**: Migrate critical tables (entries, classes, trials, shows)
- Start with `entries` (critical path)
- Move `classes`, `trials`, `shows`
- Gradually increase feature flag rollout (10% → 50% → 100%)
- Monitor for errors, roll back if needed

**Phase 4**: Migrate secondary tables (visibility, announcements, stats)
- Complete all 17 tables + 2 cached views
- Feature flags at 50-100%

**Phase 5**: Remove old code and optimize
- Once all tables at 100% replication
- Delete LocalStateManager (566 lines)
- Remove React Query from data fetching (keep for mutations if needed)
- Remove duplicate IndexedDB cache keys
- **Result**: ~1500 lines of code deleted, single source of truth established

### Why This Justifies the 30-Day Timeline

**Option A (Extend Current Hybrid)**:
- Adds 3-4 more caching systems on top of existing 3
- Makes the "hybrid mess" even worse
- Ships faster (7-9 days) but accumulates technical debt
- In 6 months, we'll have 6-7 different caching systems

**Option B (Full Replication)**:
- Replaces ALL 3 systems with ONE unified system
- Takes longer (30 days) but pays down technical debt
- Future features are EASIER to add (just extend ReplicatedTable)
- In 6 months, still have ONE system

**The Trade-off**:
- 21 extra days of development time
- In exchange for: 1500 lines less code, unified architecture, easier future features
- **ROI**: Every future feature saves 2-3 days of development (no need to add caching logic)

---

## Phase 0: Pre-Implementation - Database Schema Fixes (3 days)

**Timeline**: Day -3 to Day 0 (before Phase 1 begins)
**Goal**: Create all missing tables and views required for full feature coverage
**Success Criteria**: All 5 missing tables/views created, tested, and documented

Before implementing replication, we need to fix missing/unclear tables.

### Day -3 to -1: Create Missing Tables & Views

#### Missing Tables to Create

1. **`trial_result_visibility_overrides`** (cascading visibility - trial level)
   - Blocks: CompetitionAdmin, DogDetails visibility enforcement
   - Priority: CRITICAL
   - Schema:
     ```sql
     CREATE TABLE trial_result_visibility_overrides (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
       license_key TEXT NOT NULL,
       visibility_preset TEXT, -- 'immediate', 'after_class', 'none', 'custom'
       placement_visible BOOLEAN DEFAULT false,
       qualification_visible BOOLEAN DEFAULT false,
       time_visible BOOLEAN DEFAULT false,
       faults_visible BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW(),
       updated_by TEXT -- User/role who made the change (for audit trail)
     );

     CREATE INDEX idx_trial_visibility_trial_id ON trial_result_visibility_overrides(trial_id);
     CREATE INDEX idx_trial_visibility_license_key ON trial_result_visibility_overrides(license_key);
     ```

2. **`class_result_visibility_overrides`** (cascading visibility - class level)
   - Blocks: CompetitionAdmin, DogDetails visibility enforcement
   - Priority: CRITICAL
   - Schema:
     ```sql
     CREATE TABLE class_result_visibility_overrides (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
       license_key TEXT NOT NULL,
       visibility_preset TEXT,
       placement_visible BOOLEAN DEFAULT false,
       qualification_visible BOOLEAN DEFAULT false,
       time_visible BOOLEAN DEFAULT false,
       faults_visible BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW(),
       updated_by TEXT -- User/role who made the change (for audit trail)
     );

     CREATE INDEX idx_class_visibility_class_id ON class_result_visibility_overrides(class_id);
     CREATE INDEX idx_class_visibility_license_key ON class_result_visibility_overrides(license_key);
     ```

3. **`announcement_reads`** (verify exists first - create if missing)
   - Blocks: Announcements read tracking
   - Priority: HIGH
   - **Action**: Check if table exists in production. If not, create it within Phase 0.
   - Verification Query:
     ```sql
     -- Run this to check if table exists
     SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_name = 'announcement_reads'
     );
     ```
   - Schema (if table needs to be created):
     ```sql
     CREATE TABLE announcement_reads (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
       user_identifier TEXT NOT NULL, -- Device/browser fingerprint or user ID
       license_key TEXT NOT NULL,
       read_at TIMESTAMP DEFAULT NOW(),
       created_at TIMESTAMP DEFAULT NOW()
     );

     CREATE INDEX idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
     CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_identifier, license_key);
     ```

4. **`view_audit_log`** (unified view for audit trail - NOT materialized)
   - Blocks: AuditLog page performance
   - Priority: MEDIUM
   - **Note**: This should be a REGULAR VIEW (not materialized) for real-time audit trail queries
   - Schema:
     ```sql
     CREATE OR REPLACE VIEW view_audit_log AS
     SELECT
       'show_visibility' AS change_type,
       'Show Level' AS scope,
       sv.license_key,
       s.show_name,
       NULL::UUID AS trial_id,
       NULL::INTEGER AS trial_number,
       NULL::UUID AS class_id,
       NULL::TEXT AS element,
       NULL::TEXT AS level,
       NULL::TEXT AS section,
       'visibility' AS setting_category,
       jsonb_build_object(
         'preset', sv.visibility_preset,
         'placement_visible', sv.placement_visible,
         'qualification_visible', sv.qualification_visible,
         'time_visible', sv.time_visible,
         'faults_visible', sv.faults_visible
       ) AS setting_value,
       sv.updated_at,
       sv.updated_by -- Requires updated_by column on show_visibility_config
     FROM show_visibility_config sv
     JOIN shows s ON sv.show_id = s.id

     UNION ALL

     SELECT
       'trial_visibility' AS change_type,
       'Trial Level' AS scope,
       tv.license_key,
       s.show_name,
       tv.trial_id,
       t.trial_number,
       NULL::UUID AS class_id,
       NULL::TEXT AS element,
       NULL::TEXT AS level,
       NULL::TEXT AS section,
       'visibility' AS setting_category,
       jsonb_build_object(
         'preset', tv.visibility_preset,
         'placement_visible', tv.placement_visible,
         'qualification_visible', tv.qualification_visible,
         'time_visible', tv.time_visible,
         'faults_visible', tv.faults_visible
       ) AS setting_value,
       tv.updated_at,
       tv.updated_by -- Requires updated_by column on trial_result_visibility_overrides
     FROM trial_result_visibility_overrides tv
     JOIN trials t ON tv.trial_id = t.id
     JOIN shows s ON t.show_id = s.id

     UNION ALL

     SELECT
       'class_visibility' AS change_type,
       'Class Level' AS scope,
       cv.license_key,
       s.show_name,
       c.trial_id,
       t.trial_number,
       cv.class_id,
       c.element,
       c.level,
       c.section,
       'visibility' AS setting_category,
       jsonb_build_object(
         'preset', cv.visibility_preset,
         'placement_visible', cv.placement_visible,
         'qualification_visible', cv.qualification_visible,
         'time_visible', cv.time_visible,
         'faults_visible', cv.faults_visible
       ) AS setting_value,
       cv.updated_at,
       cv.updated_by -- Requires updated_by column on class_result_visibility_overrides
     FROM class_result_visibility_overrides cv
     JOIN classes c ON cv.class_id = c.id
     JOIN trials t ON c.trial_id = t.id
     JOIN shows s ON t.show_id = s.id

     ORDER BY updated_at DESC;
     ```

5. **`view_stats_summary`** (pre-aggregated statistics)
   - Blocks: Statistics page performance
   - Priority: MEDIUM
   - Schema:
     ```sql
     CREATE MATERIALIZED VIEW view_stats_summary AS
     SELECT
       s.id AS show_id,
       s.license_key,
       t.id AS trial_id,
       t.trial_date,
       t.trial_number,
       c.id AS class_id,
       c.element,
       c.level,
       c.section,
       c.judge_name,
       e.breed,
       COUNT(*) AS total_entries,
       SUM(CASE WHEN e.is_scored THEN 1 ELSE 0 END) AS scored_entries,
       SUM(CASE WHEN e.result_status = 'qualified' THEN 1 ELSE 0 END) AS qualified_count,
       SUM(CASE WHEN e.result_status = 'nq' THEN 1 ELSE 0 END) AS nq_count,
       AVG(e.time) FILTER (WHERE e.is_scored) AS avg_time,
       MIN(e.time) FILTER (WHERE e.is_scored) AS fastest_time,
       MAX(e.time) FILTER (WHERE e.is_scored) AS slowest_time,
       SUM(CASE WHEN e.faults = 0 AND e.is_scored THEN 1 ELSE 0 END) AS clean_run_count,
       AVG(e.faults) FILTER (WHERE e.is_scored) AS avg_faults,
       SUM(CASE WHEN e.placement = 1 THEN 1 ELSE 0 END) AS first_place_count,
       SUM(CASE WHEN e.placement = 2 THEN 1 ELSE 0 END) AS second_place_count,
       SUM(CASE WHEN e.placement = 3 THEN 1 ELSE 0 END) AS third_place_count,
       SUM(CASE WHEN e.placement = 4 THEN 1 ELSE 0 END) AS fourth_place_count
     FROM entries e
     JOIN classes c ON e.class_id = c.id
     JOIN trials t ON c.trial_id = t.id
     JOIN shows s ON t.show_id = s.id
     GROUP BY s.id, s.license_key, t.id, t.trial_date, t.trial_number,
              c.id, c.element, c.level, c.section, c.judge_name, e.breed;

     CREATE INDEX idx_stats_summary_license_key ON view_stats_summary(license_key);
     CREATE INDEX idx_stats_summary_trial_id ON view_stats_summary(trial_id);
     CREATE INDEX idx_stats_summary_element_level ON view_stats_summary(element, level);
     CREATE INDEX idx_stats_summary_breed ON view_stats_summary(breed);
     CREATE INDEX idx_stats_summary_judge ON view_stats_summary(judge_name);

     -- Refresh function (call nightly or on-demand)
     CREATE OR REPLACE FUNCTION refresh_stats_summary()
     RETURNS void AS $$
     BEGIN
       REFRESH MATERIALIZED VIEW CONCURRENTLY view_stats_summary;
     END;
     $$ LANGUAGE plpgsql;

     -- Schedule nightly refresh with pg_cron (run at 2 AM daily)
     -- Requires pg_cron extension: CREATE EXTENSION IF NOT EXISTS pg_cron;
     SELECT cron.schedule('refresh-stats-summary', '0 2 * * *', 'SELECT refresh_stats_summary();');
     ```

   **Refresh Strategy**:
   - **Automatic**: Nightly refresh at 2 AM via pg_cron
   - **Manual**: Admin API endpoint (`POST /api/admin/refresh-stats`) for on-demand refresh
   - **CONCURRENTLY**: Uses `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid table locks
   - **Performance**: Stats update daily, not real-time (acceptable trade-off for performance)

#### Action Items (Pre-Week 1)

- [ ] **Verify and add `updated_by` column for audit trail**:
  - [ ] Check if `show_visibility_config` already has `updated_by` column
  - [ ] If missing, add: `ALTER TABLE show_visibility_config ADD COLUMN updated_by TEXT;`
  - [ ] Add `updated_by` to new visibility override tables (already in schema above)
  - [ ] Document expected values: user ID, role, or session identifier
- [ ] Run migration to create visibility override tables
- [ ] **Verify `announcement_reads` exists in production**:
  - [ ] Run verification query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcement_reads');`
  - [ ] If table doesn't exist, create it using schema above
  - [ ] If table exists, verify columns match expected schema
  - [ ] Document findings in Phase 0 completion report
- [ ] Create materialized views for audit log and stats
- [ ] Test that CompetitionAdmin can read/write visibility config
- [ ] **Update DATABASE_REFERENCE.md** with comprehensive schema details:
  - [ ] Add full column definitions for all 3 new visibility tables
  - [ ] Document indexes (primary keys, foreign keys, composite indexes)
  - [ ] Document RLS policies (license_key filtering, role-based access)
  - [ ] Document triggers (`updated_at` auto-update, audit logging)
  - [ ] Add query examples for cascading visibility logic
  - [ ] **Document materialized view refresh strategy**:
    - [ ] `view_stats_summary`: Materialized view with nightly refresh (pg_cron: `0 2 * * *`)
    - [ ] Manual refresh via admin API: `POST /api/admin/refresh-stats`
    - [ ] Consider CONCURRENTLY option to avoid locks: `REFRESH MATERIALIZED VIEW CONCURRENTLY view_stats_summary;`
    - [ ] `view_audit_log`: Regular view (NOT materialized) - real-time queries acceptable for audit trail
- [ ] Add RLS policies for all new tables (license_key filtering)
- [ ] Add triggers for `updated_at` auto-update on new tables
- [ ] **Test database reference accuracy**:
  - [ ] Verify all table names match production schema
  - [ ] Verify all column types match production
  - [ ] Verify all indexes exist in production
  - [ ] Run example queries from DATABASE_REFERENCE.md to ensure they work

---

## Phase 1: Foundation & Core Infrastructure (5 days)

**Timeline**: Day 1 to Day 5
**Goal**: Build ReplicatedTable pattern and IndexedDB foundation
**Success Criteria**: ReplicatedTable working for at least one table with full CRUD

### Day 1-2: Design & Scaffolding

**Deliverables**:
- [ ] Create `src/services/replication/` folder structure
- [ ] Design `ReplicatedTable<T>` generic class interface
- [ ] Design `ReplicationManager` orchestrator interface
- [ ] Add feature flag system (`src/config/featureFlags.ts`)
- [ ] Write comprehensive TypeScript interfaces

**Files to Create**:
1. `src/services/replication/ReplicatedTable.ts` (interface, 150 lines)
2. `src/services/replication/ReplicationManager.ts` (scaffold, 100 lines)
3. `src/config/featureFlags.ts` (50 lines)
4. `src/services/replication/__tests__/setup.ts` (jest/vitest config)

**Feature Flag Structure**:
```typescript
// src/config/featureFlags.ts
export const features = {
  replication: {
    enabled: true, // Master kill switch
    tables: {
      entries: { enabled: true, rolloutPercentage: 100 },
      classes: { enabled: true, rolloutPercentage: 100 },
      trials: { enabled: true, rolloutPercentage: 50 },
      shows: { enabled: false, rolloutPercentage: 0 },
      // ... 13 more tables
    },
  },
};

/**
 * Stable user ID for feature flag rollout
 * IMPORTANT: Must persist across sessions for consistent rollout
 */
function getStableUserId(): string {
  // Try localStorage first (persistent across sessions)
  let userId = localStorage.getItem('myK9Q_stable_user_id');

  if (!userId) {
    // Generate stable ID from license key (consistent per user)
    const auth = JSON.parse(localStorage.getItem('myK9Q_auth') || '{}');
    if (auth.licenseKey) {
      // Hash license key to create stable user ID
      userId = hashString(auth.licenseKey).toString();
    } else {
      // Fallback: Generate UUID and persist it
      userId = crypto.randomUUID();
    }

    localStorage.setItem('myK9Q_stable_user_id', userId);
  }

  return userId;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function isFeatureEnabled(tableName: string, userId?: string): boolean {
  const table = features.replication.tables[tableName];
  if (!table || !features.replication.enabled) return false;

  // Use stable user ID if not provided
  const stableUserId = userId || getStableUserId();

  // Deterministic rollout based on user ID hash
  if (table.rolloutPercentage < 100) {
    const hash = hashString(stableUserId);
    return (hash % 100) < table.rolloutPercentage;
  }

  return table.enabled;
}
```

### Day 3-4: IndexedDB Schema Extension & idb Library Migration

**Deliverables**:
- [ ] **Migrate to `idb` library wrapper** (Day 3)
  - [ ] Install `idb` package: `npm install idb`
  - [ ] Replace raw IndexedDB API calls with `idb` wrapper in `src/utils/indexedDB.ts`
  - [ ] Update all `openDB()`, `get()`, `set()`, `delete()` calls to use idb API
  - [ ] Test existing functionality (cache, mutations, shows, metadata stores)
  - [ ] Commit migration before adding new stores
- [ ] Add `replicated_tables` store to IndexedDB (Day 4)
- [ ] Add `sync_metadata` store (last sync times, conflicts)
- [ ] Add `pending_mutations` store (replaces current mutations)
- [ ] Migration script for existing IndexedDB data

**Files to Update**:
- `src/utils/indexedDB.ts` (+250 lines - includes idb migration)

**New IndexedDB Schema**:
```typescript
// Updated STORES constant
export const STORES = {
  CACHE: 'cache', // Existing
  MUTATIONS: 'mutations', // Existing (will be deprecated)
  SHOWS: 'shows', // Existing
  METADATA: 'metadata', // Existing
  // NEW STORES for replication
  REPLICATED_TABLES: 'replicated_tables', // Generic storage for all replicated tables
  SYNC_METADATA: 'sync_metadata', // Last sync times, conflict logs
  PENDING_MUTATIONS: 'pending_mutations', // New mutation queue
} as const;

interface ReplicatedRow<T> {
  tableName: string; // e.g., 'entries', 'classes'
  id: string; // Primary key
  data: T; // Actual row data
  version: number; // For conflict detection
  lastSyncedAt: number; // Timestamp
  isDirty: boolean; // Has local changes
}

interface SyncMetadata {
  tableName: string;
  lastFullSyncAt: number;
  lastIncrementalSyncAt: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
  conflictCount: number;
}

interface PendingMutation {
  id: string; // UUID
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  rowId: string;
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'success';
}
```

**idb Library Migration Example**:
```typescript
// BEFORE (raw IndexedDB API in src/utils/indexedDB.ts)
async init(): Promise<IDBDatabase> {
  if (this.db) return this.db;
  this.initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      this.db = request.result;
      resolve(this.db);
    };
    // ... upgrade logic
  });
  return this.initPromise;
}

// AFTER (using idb wrapper)
import { openDB, IDBPDatabase } from 'idb';

async init(): Promise<IDBPDatabase> {
  if (this.db) return this.db;
  this.db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores with cleaner API
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp');
      }
    },
  });
  return this.db;
}
```

**Data Migration Utility**:
```typescript
// src/services/replication/migrations/migrateToReplicatedTables.ts
export async function migrateExistingCache(): Promise<void> {
  // Migrate entries from LocalStateManager to ReplicatedTable
  const existingEntries = await db.get(STORES.METADATA, 'local-state-entries');
  if (existingEntries) {
    const replicatedTable = new ReplicatedEntriesTable();
    await replicatedTable.batchSet(existingEntries.value);
  }

  // Migrate other cached data...
}
```

### Day 5: Core ReplicatedTable Implementation

**Deliverables**:
- [ ] Implement `ReplicatedTable<T>` base class
- [ ] Add CRUD operations (get, set, delete, query)
- [ ] Add subscription/listener pattern for real-time updates
- [ ] Add TTL/expiration logic

**Files to Create**:
- `src/services/replication/ReplicatedTable.ts` (implementation, 400 lines)
- `src/services/replication/__tests__/ReplicatedTable.test.ts` (200 lines)

**Core API**:
```typescript
export abstract class ReplicatedTable<T extends { id: string }> {
  constructor(
    protected tableName: string,
    protected ttl: number = 30 * 60 * 1000 // 30 min default
  ) {}

  // CRUD operations
  abstract get(id: string): Promise<T | null>;
  abstract set(id: string, data: T): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract query(filter: Partial<T>): Promise<T[]>;

  // Query by index
  abstract queryIndex<K extends keyof T>(indexName: K, value: T[K]): Promise<T[]>;

  // Batch operations
  abstract batchSet(items: T[]): Promise<void>;
  abstract batchDelete(ids: string[]): Promise<void>;

  // Sync operations
  abstract sync(): Promise<void>;
  abstract forceSyncAll(): Promise<void>;

  // Subscription pattern
  subscribe(callback: (data: T[]) => void): () => void;

  // Conflict resolution
  protected abstract resolveConflict(local: T, remote: T): T;

  // TTL management
  protected isExpired(item: ReplicatedRow<T>): boolean;
  protected cleanExpired(): Promise<number>;
}
```

---

## Phase 2: Sync Engine & Conflict Resolution (5 days)

**Timeline**: Day 6 to Day 10
**Goal**: Implement bidirectional sync with conflict resolution
**Success Criteria**: Offline changes sync successfully, conflicts resolve automatically

### Day 6-7: Sync Engine

**Deliverables**:
- [ ] Implement bidirectional sync logic
- [ ] Add optimistic update support
- [ ] Add batch sync for performance
- [ ] Add network status detection

**Files to Create**:
- `src/services/replication/SyncEngine.ts` (500 lines)
- `src/services/replication/__tests__/SyncEngine.test.ts` (150 lines)

**Sync Strategies**:
```typescript
export class SyncEngine {
  // Full sync (initial download)
  async fullSync(tableName: string, licenseKey: string): Promise<void> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('license_key', licenseKey);

    if (error) throw error;

    const table = this.manager.getTable(tableName);
    await table.batchSet(data);

    await this.updateSyncMetadata(tableName, { lastFullSyncAt: Date.now() });
  }

  // Incremental sync (delta updates since last sync)
  async incrementalSync(tableName: string, licenseKey: string): Promise<void> {
    const metadata = await this.getSyncMetadata(tableName);
    const lastSync = metadata?.lastIncrementalSyncAt || 0;

    const { data } = await supabase
      .from(tableName)
      .select('*')
      .eq('license_key', licenseKey)
      .gt('updated_at', new Date(lastSync).toISOString());

    const table = this.manager.getTable(tableName);
    await table.batchSet(data);

    await this.updateSyncMetadata(tableName, { lastIncrementalSyncAt: Date.now() });
  }

  // Upload pending mutations
  async uploadPendingMutations(): Promise<void> {
    const pending = await db.getAll<PendingMutation>(STORES.PENDING_MUTATIONS);
    const failedMutations: PendingMutation[] = [];

    for (const mutation of pending) {
      try {
        await this.executeMutation(mutation);
        await db.delete(STORES.PENDING_MUTATIONS, mutation.id);
      } catch (error) {
        mutation.retries++;
        mutation.status = mutation.retries > 3 ? 'failed' : 'pending';
        mutation.error = error instanceof Error ? error.message : String(error);
        await db.set(STORES.PENDING_MUTATIONS, mutation);

        // Collect failed mutations for user notification
        if (mutation.status === 'failed') {
          failedMutations.push(mutation);
        }

        // Log to global error tracking (Sentry, console, etc.)
        console.error('[SyncEngine] Mutation failed:', {
          id: mutation.id,
          tableName: mutation.tableName,
          operation: mutation.operation,
          retries: mutation.retries,
          error: mutation.error,
        });
      }
    }

    // Notify user if any mutations permanently failed
    if (failedMutations.length > 0) {
      this.notifyUserOfSyncFailure(failedMutations);
    }
  }

  // User notification for sync failures
  private notifyUserOfSyncFailure(failedMutations: PendingMutation[]): void {
    // Dispatch custom event for React components to listen to
    window.dispatchEvent(new CustomEvent('replication:sync-failed', {
      detail: {
        count: failedMutations.length,
        mutations: failedMutations,
        message: `${failedMutations.length} change(s) failed to sync. Please check your connection and try again.`,
      }
    }));

    // Optionally: Show toast notification
    // toast.error(`Sync failed for ${failedMutations.length} items`);
  }
}
```

### Day 8-9: Conflict Resolution

**Deliverables**:
- [ ] Implement Last-Write-Wins (LWW) strategy
- [ ] Add server-authoritative fields (e.g., placement)
- [ ] Add client-authoritative fields (e.g., check-in status)
- [ ] Add conflict logging/monitoring

**Files to Create**:
- `src/services/replication/ConflictResolver.ts` (300 lines)
- `src/services/replication/__tests__/ConflictResolver.test.ts` (200 lines)

**Conflict Resolution Strategies**:
```typescript
export class ConflictResolver {
  // Last-Write-Wins (default strategy)
  resolveLWW<T extends { updated_at: string }>(local: T, remote: T): T {
    return new Date(local.updated_at) > new Date(remote.updated_at) ? local : remote;
  }

  // Server-authoritative (for placement, scores)
  resolveServerAuthoritative<T>(local: T, remote: T): T {
    return remote; // Server always wins
  }

  // Client-authoritative (for check-in status, UI state)
  resolveClientAuthoritative<T>(local: T, remote: T): T {
    return local; // Client always wins
  }

  // Field-level merge (merge non-conflicting fields)
  resolveFieldLevel<T extends Record<string, any>>(
    local: T,
    remote: T,
    serverFields: (keyof T)[],
    clientFields: (keyof T)[]
  ): T {
    const merged = { ...remote }; // Start with server data

    // Apply client-authoritative fields
    for (const field of clientFields) {
      merged[field] = local[field];
    }

    return merged;
  }

  // Log conflicts for debugging
  logConflict<T>(tableName: string, local: T, remote: T, resolution: T): void {
    console.warn('[Conflict]', {
      table: tableName,
      local,
      remote,
      resolution,
      timestamp: Date.now(),
    });

    // Optionally store in IndexedDB for admin review
    db.set(STORES.METADATA, {
      key: `conflict-${Date.now()}`,
      value: { tableName, local, remote, resolution },
      timestamp: Date.now(),
    });
  }
}
```

**Entry-Specific Conflict Resolution**:
```typescript
class ReplicatedEntriesTable extends ReplicatedTable<Entry> {
  protected resolveConflict(local: Entry, remote: Entry): Entry {
    // Server wins for: placement, is_scored, score
    // Client wins for: entry_status (check-in), local UI state

    return {
      ...remote, // Server data as base
      entry_status: local.entry_status, // Client check-in status wins
      // Keep server's placement, score, is_scored
    };
  }
}
```

### Day 10: ReplicationManager

**Deliverables**:
- [ ] Implement table registry (map of table name → ReplicatedTable)
- [ ] Add global sync orchestration
- [ ] Add priority-based sync (score entries first, stats later)
- [ ] Add sync progress reporting

**Files to Create**:
- `src/services/replication/ReplicationManager.ts` (complete, 350 lines)
- `src/hooks/useSyncProgress.ts` (React hook for UI, 100 lines)
- `src/hooks/useSyncFailureNotification.ts` (React hook for error banner, 80 lines)
- `src/components/SyncFailureBanner.tsx` (UI component, 120 lines)

**ReplicationManager API**:
```typescript
export class ReplicationManager {
  private tables: Map<string, ReplicatedTable<any>> = new Map();
  private syncEngine: SyncEngine;
  private conflictResolver: ConflictResolver;

  // Register a table for replication
  registerTable<T>(name: string, table: ReplicatedTable<T>): void {
    this.tables.set(name, table);
  }

  // Get a registered table
  getTable<T>(name: string): ReplicatedTable<T> {
    const table = this.tables.get(name);
    if (!table) throw new Error(`Table ${name} not registered`);
    return table;
  }

  // Sync all tables (with priority ordering)
  async syncAll(licenseKey: string): Promise<void> {
    const priorities = ['entries', 'classes', 'trials', 'shows', ...otherTables];
    const totalSteps = priorities.length;
    let currentStep = 0;

    for (const tableName of priorities) {
      if (!isFeatureEnabled(tableName)) continue;

      currentStep++;
      const table = this.tables.get(tableName);
      if (table) {
        await table.sync();
        this.reportProgress(tableName, currentStep, totalSteps);
      }
    }
  }

  // Sync a single table
  async syncTable(tableName: string, licenseKey: string): Promise<void> {
    const table = this.getTable(tableName);
    await table.sync();
  }

  // Report sync progress (for UI with step counts)
  private reportProgress(tableName: string, currentStep: number, totalSteps: number): void {
    // Emit event for React hooks to consume
    window.dispatchEvent(new CustomEvent('replication:progress', {
      detail: {
        tableName,
        currentStep,
        totalSteps,
        percentage: Math.round((currentStep / totalSteps) * 100),
        status: 'synced'
      }
    }));
  }
}

// Singleton instance
export const replicationManager = new ReplicationManager();
```

**Sync Failure Notification Hook**:
```typescript
// src/hooks/useSyncFailureNotification.ts
import { useEffect, useState } from 'react';
import type { PendingMutation } from '@/utils/indexedDB';

interface SyncFailure {
  count: number;
  mutations: PendingMutation[];
  message: string;
}

export function useSyncFailureNotification() {
  const [failure, setFailure] = useState<SyncFailure | null>(null);

  useEffect(() => {
    const handleSyncFailed = (event: CustomEvent<SyncFailure>) => {
      setFailure(event.detail);
    };

    window.addEventListener('replication:sync-failed', handleSyncFailed as EventListener);

    return () => {
      window.removeEventListener('replication:sync-failed', handleSyncFailed as EventListener);
    };
  }, []);

  const dismiss = () => setFailure(null);

  const retry = async () => {
    // Trigger manual sync
    await replicationManager.syncAll(/* licenseKey */);
    setFailure(null);
  };

  return { failure, dismiss, retry };
}
```

**Sync Failure Banner Component**:
```typescript
// src/components/SyncFailureBanner.tsx
import { useSyncFailureNotification } from '@/hooks/useSyncFailureNotification';

export function SyncFailureBanner() {
  const { failure, dismiss, retry } = useSyncFailureNotification();

  if (!failure) return null;

  return (
    <div className="sync-failure-banner" role="alert" aria-live="assertive">
      <div className="banner-content">
        <span className="icon">⚠️</span>
        <p className="message">{failure.message}</p>
        <div className="actions">
          <button onClick={retry} className="btn-retry">
            Retry Sync
          </button>
          <button onClick={dismiss} className="btn-dismiss">
            Dismiss
          </button>
        </div>
      </div>

      {/* Show details in dev mode */}
      {import.meta.env.DEV && (
        <details className="failure-details">
          <summary>Debug Info ({failure.count} mutations)</summary>
          <pre>{JSON.stringify(failure.mutations, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
```

**Usage in App.tsx**:
```typescript
// src/App.tsx
import { SyncFailureBanner } from '@/components/SyncFailureBanner';

function App() {
  return (
    <>
      <SyncFailureBanner /> {/* Global error banner */}
      <Router>
        {/* routes */}
      </Router>
    </>
  );
}
```

**Sync Progress Hook** (for progress indicators):
```typescript
// src/hooks/useSyncProgress.ts
import { useEffect, useState } from 'react';

interface SyncProgress {
  tableName: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  status: 'synced' | 'syncing' | 'error';
}

export function useSyncProgress() {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const handleProgress = (event: CustomEvent<SyncProgress>) => {
      const progressData = event.detail;
      setProgress(progressData);

      // Mark complete when all steps are done
      if (progressData.currentStep === progressData.totalSteps) {
        setIsComplete(true);
        // Clear progress after 2 seconds
        setTimeout(() => {
          setProgress(null);
          setIsComplete(false);
        }, 2000);
      }
    };

    window.addEventListener('replication:progress', handleProgress as EventListener);

    return () => {
      window.removeEventListener('replication:progress', handleProgress as EventListener);
    };
  }, []);

  return { progress, isComplete };
}
```

**Progress Indicator Component**:
```typescript
// src/components/SyncProgressBar.tsx
import { useSyncProgress } from '@/hooks/useSyncProgress';

export function SyncProgressBar() {
  const { progress, isComplete } = useSyncProgress();

  if (!progress) return null;

  return (
    <div className="sync-progress-bar" role="progressbar" aria-valuenow={progress.percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-header">
        <span className="progress-label">
          {isComplete ? '✅ Sync Complete' : `🔄 Syncing ${progress.tableName}...`}
        </span>
        <span className="progress-steps">
          {progress.currentStep} / {progress.totalSteps}
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  );
}
```

---

## Phase 3: Core Table Migration (5 days)

**Timeline**: Day 11 to Day 15
**Goal**: Migrate critical tables for offline scoring
**Success Criteria**: 100% offline navigation, zero data loss in scoring

**Priority Order** (based on offline criticality):

### Day 11: Replicate `entries` Table (Most Critical)

**Why First**: Scoring is the core feature, entries table is critical for offline operation

**Deliverables**:
- [ ] Create `ReplicatedEntriesTable` extending `ReplicatedTable<Entry>`
- [ ] Add table-specific query methods (`getByClassId()`, `getByArmband()`)
- [ ] Add feature flag: `features.replication.entries.enabled`
- [ ] Update `entryService.ts` to check feature flag and route to replicated table
- [ ] Add A/B testing logic (50% users get new path)
- [ ] Write integration tests
- [ ] Deploy to staging

**Implementation**:
```typescript
// src/services/replication/tables/ReplicatedEntriesTable.ts
export class ReplicatedEntriesTable extends ReplicatedTable<Entry> {
  constructor() {
    super('entries', 30 * 60 * 1000); // 30 min TTL
  }

  // Table-specific queries
  async getByClassId(classId: string): Promise<Entry[]> {
    return this.queryIndex('class_id', classId);
  }

  async getByArmband(armband: string): Promise<Entry | null> {
    const results = await this.queryIndex('armband_number', armband);
    return results[0] || null;
  }

  // Conflict resolution (client wins for check-in, server wins for scores)
  protected resolveConflict(local: Entry, remote: Entry): Entry {
    return {
      ...remote, // Server data as base
      entry_status: local.entry_status, // Client check-in status
    };
  }
}

// Register with manager
replicationManager.registerTable('entries', new ReplicatedEntriesTable());
```

**Update entryService.ts**:
```typescript
// src/services/entryService.ts
import { isFeatureEnabled } from '@/config/featureFlags';
import { replicationManager } from '@/services/replication/ReplicationManager';

export async function getClassEntries(classId: string, licenseKey: string): Promise<Entry[]> {
  // Feature flag check
  if (isFeatureEnabled('entries')) {
    // NEW PATH: Use replicated table
    const table = replicationManager.getTable<Entry>('entries');
    return table.getByClassId(classId);
  }

  // OLD PATH: Direct Supabase query + LocalStateManager
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('class_id', classId);

  if (error) throw error;

  await localStateManager.applyServerUpdate(data);
  return localStateManager.getEntries(classId);
}
```

**Tests**:
```typescript
// src/services/replication/tables/__tests__/ReplicatedEntriesTable.test.ts
describe('ReplicatedEntriesTable', () => {
  it('should cache entries locally', async () => {
    const table = new ReplicatedEntriesTable();
    const entry = { id: '123', armband_number: '101', class_id: 'class-1' };

    await table.set('123', entry);
    const cached = await table.get('123');

    expect(cached).toEqual(entry);
  });

  it('should query by class_id', async () => {
    const table = new ReplicatedEntriesTable();
    await table.batchSet([
      { id: '1', class_id: 'class-1', armband_number: '101' },
      { id: '2', class_id: 'class-1', armband_number: '102' },
      { id: '3', class_id: 'class-2', armband_number: '103' },
    ]);

    const results = await table.getByClassId('class-1');
    expect(results).toHaveLength(2);
  });

  it('should resolve conflicts (client check-in wins)', async () => {
    const table = new ReplicatedEntriesTable();
    const local = { id: '1', entry_status: 'checked-in', score: 95 };
    const remote = { id: '1', entry_status: 'not-checked-in', score: 100 };

    const resolved = table['resolveConflict'](local, remote);

    expect(resolved.entry_status).toBe('checked-in'); // Client wins
    expect(resolved.score).toBe(100); // Server wins
  });
});
```

### Day 12: Replicate `classes` Table

**Deliverables**:
- [ ] Create `ReplicatedClassesTable`
- [ ] Add query methods (`getByTrialId()`)
- [ ] Update ClassList page to use replicated table
- [ ] Feature flag rollout: 10%

**Files**:
- `src/services/replication/tables/ReplicatedClassesTable.ts` (150 lines)
- `src/services/replication/tables/__tests__/ReplicatedClassesTable.test.ts` (100 lines)

### Day 13: Replicate `trials` + `shows` Tables

**Deliverables**:
- [ ] Create `ReplicatedTrialsTable`
- [ ] Create `ReplicatedShowsTable`
- [ ] Update Home dashboard to use replicated tables
- [ ] Feature flag rollout: 25%

**Files**:
- `src/services/replication/tables/ReplicatedTrialsTable.ts` (100 lines)
- `src/services/replication/tables/ReplicatedShowsTable.ts` (100 lines)

### Day 14: Replicate `class_requirements` Table

**Deliverables**:
- [ ] Create `ReplicatedClassRequirementsTable`
- [ ] Update scoresheet logic to use replicated requirements
- [ ] Feature flag rollout: 50%

**Files**:
- `src/services/replication/tables/ReplicatedClassRequirementsTable.ts` (100 lines)

### Day 15: Replicate Visibility Config Tables

**Deliverables**:
- [ ] Create `ReplicatedShowVisibilityConfigTable`
- [ ] Create `ReplicatedTrialVisibilityOverridesTable`
- [ ] Create `ReplicatedClassVisibilityOverridesTable`
- [ ] Update CompetitionAdmin to use replicated tables
- [ ] Update DogDetails visibility enforcement
- [ ] Feature flag rollout: 50%

**Implementation**:
```typescript
// src/services/replication/tables/ReplicatedVisibilityConfigTable.ts
export class ReplicatedShowVisibilityConfigTable extends ReplicatedTable<ShowVisibilityConfig> {
  constructor() {
    super('show_visibility_config', 24 * 60 * 60 * 1000); // 24 hour TTL
  }

  // Get visibility for a specific class (cascading logic)
  async getVisibilityForClass(classId: string): Promise<VisibilityConfig> {
    // 1. Try class-level override first
    const classOverride = await this.getClassOverride(classId);
    if (classOverride) return classOverride;

    // 2. Try trial-level override
    const trialOverride = await this.getTrialOverride(classId);
    if (trialOverride) return trialOverride;

    // 3. Fall back to show-level default
    const showDefault = await this.getShowDefault(classId);
    return showDefault;
  }

  // Conflict resolution: Server-authoritative (admin config)
  protected resolveConflict(local: ShowVisibilityConfig, remote: ShowVisibilityConfig): ShowVisibilityConfig {
    return remote; // Server always wins for admin config
  }
}
```

**Testing Day 15**:
- [ ] Verify CompetitionAdmin can toggle visibility offline (read-only, config cached)
- [ ] Verify DogDetails enforces cached visibility rules
- [ ] Verify cascading logic works (class → trial → show)

---

## Phase 4: Secondary Tables & Edge Cases (5 days)

**Timeline**: Day 16 to Day 20
**Goal**: Replicate all remaining tables and cached views
**Success Criteria**: All 17 tables + 2 cached views operational

### Day 16: Replicate Announcements Stack

**Deliverables**:
- [ ] Create `ReplicatedAnnouncementsTable`
- [ ] Create `ReplicatedAnnouncementReadsTable`
- [ ] Create `ReplicatedPushNotificationConfigTable`
- [ ] Update Announcements page to use replicated tables
- [ ] Feature flag rollout: 50%

**Implementation**:
```typescript
// src/services/replication/tables/ReplicatedAnnouncementsTable.ts
export class ReplicatedAnnouncementsTable extends ReplicatedTable<Announcement> {
  constructor() {
    super('announcements', 5 * 60 * 1000); // 5 min TTL (announcements change frequently)
  }

  // Mark announcement as read (optimistic update)
  async markAsRead(announcementId: string, userId: string): Promise<void> {
    // Queue mutation
    await db.set(STORES.PENDING_MUTATIONS, {
      id: crypto.randomUUID(),
      tableName: 'announcement_reads',
      operation: 'INSERT',
      rowId: announcementId,
      data: {
        announcement_id: announcementId,
        user_identifier: userId,
        read_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    });

    // Update local cache immediately (optimistic)
    // (implementation details...)
  }
}
```

### Day 17: Replicate Push Notification Stack

**Deliverables**:
- [ ] Create `ReplicatedPushSubscriptionsTable`
- [ ] Skip `push_notification_queue` (server-only, no offline value)
- [ ] Update push notification service
- [ ] Feature flag rollout: 50%

**Note**: `push_notification_queue` is server-managed and doesn't need local replication.

### Day 18: Replicate Statistics Views (Cached Materialized View)

**Deliverables**:
- [ ] Create caching strategy for `view_stats_summary` data
- [ ] Add "Last updated: X min ago" banner to Statistics page
- [ ] Add manual refresh button
- [ ] Feature flag rollout: 25%

**Implementation**:
```typescript
// src/services/replication/tables/CachedStatsTable.ts
export class CachedStatsTable {
  private cacheKey = 'cached-stats-summary';
  private ttl = 60 * 60 * 1000; // 1 hour

  async getStatsForTrial(trialId: string): Promise<StatsSummary[]> {
    // Try cache first
    const cached = await idbCache.get<StatsSummary[]>(this.cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.data.filter(s => s.trial_id === trialId);
    }

    // Fetch fresh from materialized view
    const { data } = await supabase
      .from('view_stats_summary')
      .select('*')
      .eq('trial_id', trialId);

    // Cache result
    await idbCache.set(this.cacheKey, data, this.ttl);

    return data;
  }

  async refresh(): Promise<void> {
    // Clear cache and force refetch
    await idbCache.delete(this.cacheKey);

    // Optionally trigger materialized view refresh on server
    await supabase.rpc('refresh_stats_summary');
  }
}
```

### Day 19: Replicate Nationals Tables (Dormant)

**Deliverables**:
- [ ] Create `ReplicatedEventStatisticsTable`
- [ ] Create `ReplicatedNationalsRankingsTable`
- [ ] Verify compatibility with `nationalsScoring` service
- [ ] Feature flag: disabled by default (dormant feature)

**Note**: These tables are for future nationals events. Replicate them now so infrastructure is ready.

### Day 20: Replicate Audit Logging (Cached View)

**Deliverables**:
- [ ] Create caching strategy for `view_audit_log` data
- [ ] Update AuditLog page to show cached data with banner
- [ ] Add "Refresh" button for admins
- [ ] Feature flag rollout: 25%

**Implementation**:
```typescript
// src/services/replication/tables/CachedAuditLogTable.ts
export class CachedAuditLogTable {
  private cacheKey = 'cached-audit-log';
  private ttl = 7 * 24 * 60 * 60 * 1000; // 7 days

  async getAuditLog(licenseKey: string): Promise<AuditLogEntry[]> {
    const cached = await idbCache.get<AuditLogEntry[]>(this.cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    // Fetch from view
    const { data } = await supabase
      .from('view_audit_log')
      .select('*')
      .eq('license_key', licenseKey)
      .order('updated_at', { ascending: false })
      .limit(1000);

    await idbCache.set(this.cacheKey, data, this.ttl);
    return data;
  }
}
```

---

## Phase 5: Production Rollout & Optimization (7 days)

**Timeline**: Day 21 to Day 27
**Goal**: 100% feature flag rollout with zero rollbacks
**Success Criteria**: <5% error rate, <50ms cache reads, stable for 48 hours

### Day 21-22: Remove Old Code Paths

**Deliverables**:
- [ ] Remove `useStaleWhileRevalidate` hook (after 100% migration)
- [ ] Keep LocalStateManager for 1 week as fallback (then remove)
- [ ] Remove React Query from ClassList (if fully migrated)
- [ ] Update documentation

**Code Cleanup**:
- Delete `src/hooks/useStaleWhileRevalidate.ts` (~150 lines)
- Simplify `src/services/entryService.ts` (remove old path, ~200 lines)
- Update `src/pages/ClassList/hooks/useClassListData.ts` (remove React Query, ~100 lines)
- Update CLAUDE.md and DATABASE_REFERENCE.md

**Migration PRs**:
- [ ] PR #1: Remove useStaleWhileRevalidate
- [ ] PR #2: Simplify entryService
- [ ] PR #3: Remove React Query dependencies (if no longer needed)
- [ ] PR #4: Update documentation

### Day 23-24: Performance Optimization

**Deliverables**:
- [ ] Add IndexedDB query indexes for hot paths
- [ ] Optimize batch sync size (chunk large syncs)
- [ ] Add intelligent prefetching (predict next page)
- [ ] Reduce memory footprint (LRU eviction)

**Optimizations**:
1. **Add Compound Indexes**:
   ```typescript
   // IndexedDB schema update
   const store = db.createObjectStore('replicated_tables', { keyPath: ['tableName', 'id'] });
   store.createIndex('tableName_id', ['tableName', 'id'], { unique: true });
   store.createIndex('tableName_classId', ['tableName', 'class_id'], { unique: false });
   ```

2. **Batch Sync Chunking**:
   ```typescript
   async fullSync(tableName: string, licenseKey: string): Promise<void> {
     const CHUNK_SIZE = 100;
     let offset = 0;
     let hasMore = true;

     while (hasMore) {
       const { data } = await supabase
         .from(tableName)
         .select('*')
         .eq('license_key', licenseKey)
         .range(offset, offset + CHUNK_SIZE - 1);

       await table.batchSet(data);

       hasMore = data.length === CHUNK_SIZE;
       offset += CHUNK_SIZE;
     }
   }
   ```

3. **LRU Eviction** (prevent IndexedDB quota errors):
   ```typescript
   // Size estimation utility
   private estimateSize(row: ReplicatedRow<any>): number {
     try {
       // JSON.stringify + Blob gives accurate byte count
       const jsonStr = JSON.stringify(row);
       return new Blob([jsonStr]).size;
     } catch (error) {
       // Fallback: rough estimate (2 bytes per char)
       console.warn('Failed to estimate row size, using fallback:', error);
       return JSON.stringify(row).length * 2;
     }
   }

   private estimateTotalSize(rows: ReplicatedRow<any>[]): number {
     return rows.reduce((sum, row) => sum + this.estimateSize(row), 0);
   }

   async evictLRU(targetSizeBytes: number): Promise<void> {
     const allRows = await db.getAll<ReplicatedRow<any>>(STORES.REPLICATED_TABLES);

     // Sort by lastSyncedAt (oldest first = least recently used)
     const sorted = allRows.sort((a, b) => a.lastSyncedAt - b.lastSyncedAt);

     let currentSize = this.estimateTotalSize(allRows);
     let evictedCount = 0;
     let i = 0;

     console.log(`🗑️ [LRU] Current size: ${(currentSize / 1024 / 1024).toFixed(2)} MB, Target: ${(targetSizeBytes / 1024 / 1024).toFixed(2)} MB`);

     while (currentSize > targetSizeBytes && i < sorted.length) {
       const row = sorted[i];
       const rowSize = this.estimateSize(row);

       // Delete row from IndexedDB
       await db.delete(STORES.REPLICATED_TABLES, `${row.tableName}-${row.id}`);

       currentSize -= rowSize;
       evictedCount++;
       i++;

       // Log progress every 100 rows
       if (evictedCount % 100 === 0) {
         console.log(`🗑️ [LRU] Evicted ${evictedCount} rows, current size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
       }
     }

     console.log(`✅ [LRU] Eviction complete: ${evictedCount} rows deleted, final size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
   }

   // Auto-evict when approaching quota (call during sync)
   async checkAndEvictIfNeeded(): Promise<void> {
     const estimate = await navigator.storage?.estimate();
     const usage = estimate?.usage || 0;
     const quota = estimate?.quota || 0;

     // If using >80% of quota, evict down to 60%
     if (usage > quota * 0.8) {
       const targetSize = quota * 0.6;
       console.warn(`⚠️ [LRU] Approaching quota (${(usage / quota * 100).toFixed(1)}%), evicting to ${(targetSize / 1024 / 1024).toFixed(0)} MB`);
       await this.evictLRU(targetSize);
     }
   }
   ```

**Performance Targets**:
- [ ] <50ms latency for cached reads
- [ ] <5 seconds for full sync of 1000 entries
- [ ] <50MB memory usage for full dataset
- [ ] Main thread remains responsive during large syncs (no UI blocking)

**Web Worker Optimization** (Phase 5 Day 23-24):
```typescript
// src/services/replication/workers/syncWorker.ts
import { expose } from 'comlink';
import { SyncEngine } from '../SyncEngine';

const syncEngine = new SyncEngine();

// Expose sync methods to main thread
const workerAPI = {
  fullSync: (tableName: string, licenseKey: string) =>
    syncEngine.fullSync(tableName, licenseKey),

  incrementalSync: (tableName: string, licenseKey: string) =>
    syncEngine.incrementalSync(tableName, licenseKey),

  uploadPendingMutations: () =>
    syncEngine.uploadPendingMutations(),
};

expose(workerAPI);
```

```typescript
// src/services/replication/ReplicationManager.ts
import { wrap } from 'comlink';

export class ReplicationManager {
  private syncWorker: Worker | null = null;
  private syncAPI: any = null;

  constructor() {
    // Initialize web worker for background sync
    if (typeof Worker !== 'undefined') {
      this.syncWorker = new Worker(
        new URL('./workers/syncWorker.ts', import.meta.url),
        { type: 'module' }
      );
      this.syncAPI = wrap(this.syncWorker);
    }
  }

  // Sync in web worker (non-blocking)
  async syncTable(tableName: string, licenseKey: string): Promise<void> {
    if (this.syncAPI) {
      // Offload to worker
      await this.syncAPI.incrementalSync(tableName, licenseKey);
    } else {
      // Fallback to main thread
      await this.syncEngine.incrementalSync(tableName, licenseKey);
    }
  }
}
```

**Benefits of Web Worker Sync**:
- ✅ Main thread stays responsive during large syncs
- ✅ UI doesn't freeze when syncing 1000+ entries
- ✅ Better perceived performance for users
- ✅ Easy rollback (just remove worker, keep main thread sync)

### Day 25-26: Edge Case Testing

**Deliverables**:
- [ ] Test multi-device sync (same user, 2 browsers)
- [ ] Test long offline periods (24+ hours)
- [ ] Test large datasets (1000+ entries)
- [ ] Test race conditions (rapid updates)

**Test Scenarios**:
1. **Multi-Device Sync**:
   - User logs in on Desktop (Device A)
   - User logs in on Tablet (Device B)
   - User scores entry on Device A
   - Verify Device B sees update via real-time subscription
   - User goes offline on Device A, makes changes
   - User syncs Device A when back online
   - Verify Device B sees synced changes

2. **Long Offline Period**:
   - User downloads show data
   - User goes offline for 48 hours
   - User scores 50 entries offline
   - User comes back online
   - Verify all 50 scores sync successfully
   - Verify no data loss

3. **Large Dataset**:
   - Show with 20 trials, 100 classes, 2000 entries
   - Measure sync time (target: <30 seconds)
   - Measure memory usage (target: <100MB)
   - Verify UI remains responsive

4. **Race Conditions**:
   - User scores entry on Device A
   - Server processes score, updates placement
   - Device A syncs before server finishes placement calculation
   - Verify conflict resolution works (server placement wins)

**E2E Tests** (Playwright):
```typescript
// e2e/offline-replication.spec.ts
test('should sync scores after long offline period', async ({ page, context }) => {
  // Login and download show data
  await page.goto('/login');
  await page.fill('[name="passcode"]', 'aa260');
  await page.click('button[type="submit"]');

  // Wait for auto-download to complete
  await page.waitForSelector('[data-testid="download-complete"]');

  // Go offline
  await context.setOffline(true);

  // Navigate to entry list
  await page.goto('/class/123/entries');

  // Score 3 entries
  for (let i = 0; i < 3; i++) {
    await page.click(`[data-testid="entry-${i}"]`);
    await page.fill('[name="time"]', '45.23');
    await page.click('button[data-testid="submit-score"]');
  }

  // Verify pending mutations count
  const pendingCount = await page.textContent('[data-testid="pending-mutations"]');
  expect(pendingCount).toBe('3');

  // Go online
  await context.setOffline(false);

  // Wait for sync
  await page.waitForSelector('[data-testid="sync-complete"]');

  // Verify all scores synced
  const finalPendingCount = await page.textContent('[data-testid="pending-mutations"]');
  expect(finalPendingCount).toBe('0');
});
```

### Day 27: Production Rollout

**Deliverables**:
- [ ] Enable all feature flags to 100%
- [ ] Monitor error logs for 48 hours
- [ ] Rollback plan ready (flip feature flags back to 0%)
- [ ] Announce to users (if stable)

**Rollout Checklist**:
1. **Pre-Rollout**:
   - [ ] Run full test suite (unit + integration + e2e)
   - [ ] Performance benchmarks pass
   - [ ] Staging environment stable for 48 hours
   - [ ] Rollback plan documented and tested

2. **Rollout Phases**:
   - **Phase 1 (Hour 0)**: Set all flags to 100%
   - **Phase 2 (Hour 1)**: Monitor error logs (target: <1% error rate)
   - **Phase 3 (Hour 6)**: Check user reports (target: <5 complaints)
   - **Phase 4 (Hour 24)**: Declare stable or rollback

3. **Monitoring Metrics**:
   - Error rate (Sentry or console.error logs)
   - Sync success rate (Supabase logs)
   - Performance metrics (Core Web Vitals)
   - User complaints (GitHub issues, support tickets)

4. **Rollback Triggers**:
   - Error rate > 5% for any table
   - Sync failure rate > 10%
   - Performance degradation > 20%
   - User complaints > 3 per day

5. **Rollback Procedure**:
   ```typescript
   // Emergency rollback: Set all flags to 0%
   export const features = {
     replication: {
       enabled: false, // EMERGENCY KILL SWITCH
       tables: {
         entries: { enabled: false, rolloutPercentage: 0 },
         // ... all tables disabled
       },
     },
   };
   ```

6. **Post-Rollout**:
   - [ ] Announce to users (release notes)
   - [ ] Update documentation
   - [ ] Archive old code (LocalStateManager, useStaleWhileRevalidate)
   - [ ] Celebrate 🎉

---

## Complete Table Replication Priority Order (17 Tables)

### Tier 1: Critical for Offline Scoring (Phase 3 - Days 11-15)
1. ✅ **entries** - Score submission (CRITICAL)
2. ✅ **classes** - Class selection + status
3. ✅ **trials** - Trial context
4. ✅ **shows** - Show context
5. ✅ **class_requirements** - Scoring rules (configurable)

### Tier 2: Required for Full Navigation (Phase 4 - Days 16-18)
6. ✅ **announcements** - Real-time announcements
7. ✅ **announcement_reads** - Read tracking (verify exists)
8. ✅ **push_notification_config** - User notification settings
9. ✅ **push_subscriptions** - Device push endpoints

### Tier 3: Visibility & Admin Features (Phase 3 Day 15 + Phase 4 Days 19-20)
10. ✅ **show_visibility_config** - Show-level defaults (migration 20251107)
11. ❌ **trial_result_visibility_overrides** - Trial overrides (Phase 0 - create first)
12. ❌ **class_result_visibility_overrides** - Class overrides (Phase 0 - create first)

### Tier 4: Analytics & Nationals (Phase 4 - Days 19 + Phase 5 Days 21-22)
13. ✅ **event_statistics** - Nationals event data
14. ✅ **nationals_rankings** - Leaderboard data

### Tier 5: Cached Views (Phase 4 - Not Full Replication)
15. ❌ **view_stats_summary** - Statistics aggregates (Phase 0 - cached materialized view)
16. ❌ **view_audit_log** - Audit trail (Phase 0 - cached view)

### Tables to SKIP (Server-Only or No Offline Value)
- ❌ **push_notification_queue** (server-managed, no local replication needed)
- ❌ **performance_metrics** (localStorage only, optional feature)

**Total Tables to Replicate**: 14 core tables + 2 cached views = 16 data sources

---

## Feature-Specific Sync Strategies

### 1. Result Visibility Control
**Tables**: `show_visibility_config`, `trial_result_visibility_overrides`, `class_result_visibility_overrides`

**Sync Strategy**:
- **Read-only replication** (admins configure online, settings cached)
- **TTL**: 24 hours (visibility config changes infrequently)
- **Conflict Resolution**: Server-authoritative (admin changes always win)
- **Offline Behavior**: Cached rules applied, but admin can't change settings offline

**Implementation**:
```typescript
class ReplicatedVisibilityConfigTable extends ReplicatedTable<VisibilityConfig> {
  // Cache visibility config for offline enforcement
  async getVisibilityForClass(classId: string): Promise<VisibilityConfig> {
    // Check local cache first
    const cached = await this.get(classId);
    if (cached && !this.isExpired(cached)) return cached;

    // Fetch from server (cascading logic: class → trial → show)
    const config = await this.fetchCascadingVisibility(classId);
    await this.set(classId, config);
    return config;
  }
}
```

### 2. Statistics Dashboard
**Tables/Views**: `view_stats_summary` (materialized view)

**Sync Strategy**:
- **Materialized view approach** (pre-aggregated on server, synced periodically)
- **TTL**: 1 hour (stats change frequently during event)
- **Offline Behavior**: Show cached stats with "Last updated: X min ago" banner
- **Refresh Strategy**: Manual refresh button + auto-refresh every 5 min when online

### 3. Announcements with Read Tracking
**Tables**: `announcements`, `announcement_reads`

**Sync Strategy**:
- **Bidirectional sync** (announcements read-only for non-admins, reads sync bidirectionally)
- **Real-time subscriptions** (already implemented)
- **Offline Behavior**:
  - Show cached announcements
  - Queue "mark as read" actions locally
  - Sync reads when back online

### 4. Push Notifications
**Tables**: `push_subscriptions`, `push_notification_config`, `push_notification_queue`

**Sync Strategy**:
- **push_subscriptions**: Bidirectional (device registers subscription)
- **push_notification_config**: Bidirectional (user preferences)
- **push_notification_queue**: Server-authoritative (read-only for clients, SKIP replication)

### 5. Audit Logging
**Tables/Views**: `view_audit_log`

**Sync Strategy**:
- **Read-only** (audit log is append-only, managed by triggers)
- **TTL**: 7 days (historical data)
- **Offline Behavior**: Show cached audit log with warning banner

---

## Rollout Phases & Feature Flags

### Flag Structure
```typescript
// src/config/featureFlags.ts
export const features = {
  replication: {
    enabled: true, // Master kill switch
    tables: {
      entries: { enabled: true, rolloutPercentage: 100 },
      classes: { enabled: true, rolloutPercentage: 100 },
      trials: { enabled: true, rolloutPercentage: 50 },
      shows: { enabled: false, rolloutPercentage: 0 },
      // ... 13 more tables
    },
  },
};
```

### Gradual Rollout Strategy (Within Each Phase)
1. **Phase 3 (Day 11-15)**: 10% of users for entries/classes/trials/shows/class_requirements
2. **Phase 3 Completion**: Increase to 50% for core tables
3. **Phase 4 (Day 16-20)**: 10% for secondary tables, 50-100% for core
4. **Phase 5 (Day 21-24)**: 100% for core, 50% for secondary
5. **Phase 5 Final (Day 25-27)**: 100% for all tables

### Rollback Triggers
- Error rate > 5% for any table
- Sync failure rate > 10%
- Performance degradation > 20%
- User complaints > 3 per day

---

## Risk Mitigation

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IndexedDB quota exceeded | Medium | High | Implement LRU eviction, warn users |
| Sync conflicts corrupt data | Low | Critical | Server-authoritative fields, conflict logs |
| Performance regression | Medium | Medium | Benchmarking, feature flags |
| Real-time subscriptions break | Low | High | Keep old subscriptions as fallback |

### Timeline Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Week 2 sync engine takes 10 days | Medium | Medium | Simplify conflict resolution (LWW only) |
| Week 3 migration takes 10 days | Low | Medium | Parallelize table migrations |
| Edge cases discovered in Week 5 | High | Low | Accept minor bugs, fix post-launch |

### User Impact Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users lose offline work | Low | Critical | Offline queue persists indefinitely |
| UI becomes slower | Medium | Medium | Performance benchmarking gates |
| Confusing error messages | High | Low | Better error handling + logging |

---

## Rollback Plan

### Scenario 1: Single Table Failure
1. Set feature flag to 0% for failing table
2. Clear IndexedDB cache for that table
3. Force users to reload (service worker update)
4. Investigate logs, fix bug, re-deploy
5. Gradual rollout again (10% → 50% → 100%)

### Scenario 2: Sync Engine Failure
1. Set `features.replication.enabled = false`
2. Fall back to old LocalStateManager + React Query
3. Notify users via announcement banner
4. Fix critical bug within 24 hours
5. Hotfix deployment with testing

### Scenario 3: Data Corruption
1. Immediate rollback to old system
2. Clear all IndexedDB replicated data
3. Force full re-download from server
4. Audit logs to identify corruption source
5. Add validation checks before re-deploying

### Rollback Checkpoints
- **End of Phase 2 (Day 10)**: Can abort with minimal sunk cost (just infrastructure)
- **End of Phase 3 (Day 15)**: Can keep core tables, defer secondary tables
- **End of Phase 4 (Day 20)**: Point of no return (too much invested)

---

## Success Metrics

### Phase 3 Goals (Core Tables - Day 15)
- [ ] 100% offline navigation for ClassList page
- [ ] Zero data loss in offline scoring
- [ ] <100ms latency for cached reads

### Phase 5 Goals (Full System - Day 27)
- [ ] All 17 tables replicated (14 tables + 2 cached views + 1 skip)
- [ ] 95%+ sync success rate
- [ ] <5% error rate in production
- [ ] Zero rollbacks needed

### Long-Term Goals (Month 2-3)
- [ ] Multi-show support (extend replication)
- [ ] Collaborative features (real-time shared state)
- [ ] Reduced technical debt (unified data layer)

---

## Architectural Guardrails: Never Let This Happen Again

This section documents **concrete rules and processes** to prevent future "hybrid mess" scenarios.

### Rule 1: One Data Access Pattern for All Tables

**Enforced by**: Code review checklist + ESLint rule

**The Rule**:
```typescript
// ✅ ALLOWED: Single unified API
const data = await replicationManager.getTable('tableName').get(id);

// ❌ FORBIDDEN: Direct Supabase queries in components
const { data } = await supabase.from('tableName').select('*');

// ❌ FORBIDDEN: Direct IndexedDB access in components
const cached = await idbCache.get('cache-key');

// ❌ FORBIDDEN: Multiple caching libraries
import { useQuery } from '@tanstack/react-query'; // Not for data fetching
```

**Enforcement**:
1. **ESLint Rule** (create `eslint-plugin-local-first.js`):
```javascript
module.exports = {
  rules: {
    'no-direct-supabase': {
      create(context) {
        return {
          CallExpression(node) {
            // Flag direct supabase.from() calls outside of replication service
            if (node.callee.property?.name === 'from' &&
                node.callee.object?.name === 'supabase') {
              const filename = context.getFilename();
              if (!filename.includes('services/replication/')) {
                context.report({
                  node,
                  message: 'Direct Supabase queries forbidden. Use replicationManager.getTable() instead.'
                });
              }
            }
          }
        };
      }
    }
  }
};
```

2. **Pre-commit Hook** (check for violations):
```bash
# .husky/pre-commit
npm run lint -- --rule 'local-first/no-direct-supabase: error'
```

3. **Code Review Checklist**:
   - [ ] All data access goes through `replicationManager`
   - [ ] No direct `supabase.from()` calls in components
   - [ ] No new caching libraries added

### Rule 2: Architecture Review Every 4 Weeks

**Enforced by**: Calendar reminder + mandatory meeting

**The Process**:
1. **Week 4 Review**: Check for architectural drift
2. **Week 8 Review**: Check for duplicate patterns
3. **Week 12 Review**: Check for technical debt accumulation

**Review Questions**:
```markdown
## Architecture Review Checklist (Week N)

### Data Access Patterns
- [ ] All data access uses replicationManager? (Yes/No)
- [ ] Any new caching systems added? (List or None)
- [ ] Any direct Supabase calls outside replication? (Count: ___)

### Code Duplication
- [ ] Any duplicate data fetching logic? (List files)
- [ ] Any duplicate cache keys? (List patterns)
- [ ] Any duplicate sync logic? (List files)

### Technical Debt
- [ ] Lines of code added this month: ___
- [ ] Lines of code deleted this month: ___
- [ ] Net change: ___ (Target: <500 per month)

### Red Flags (Any "Yes" triggers refactor)
- [ ] Do we have 2+ ways to fetch the same data?
- [ ] Do we have 2+ caching systems?
- [ ] Is offline behavior inconsistent across features?
- [ ] Are cache keys hardcoded in >1 place?

### Action Items
- Refactor needed? (Yes/No): ___
- If yes, schedule by: ___
- If no, next review: Week ___
```

**Rule**: If 2+ red flags = STOP new features, refactor immediately

### Rule 3: "Two of Anything" Triggers Abstraction

**Enforced by**: Developer discipline + code review

**The Rule**:
```
First time: Write code (LocalStateManager for entries)
Second time: Copy-paste is OK (React Query for classes)
Third time: STOP - Abstract the pattern (ReplicatedTable)
```

**Examples**:

**Scenario 1: Second Caching System**
```typescript
// Week 1: Built LocalStateManager for entries
class LocalStateManager { /* ... */ }

// Week 4: About to add React Query for classes
// 🛑 STOP: We already have one caching system
// ✅ INSTEAD: Extend LocalStateManager to support classes

// Week 4 (correct approach):
class LocalStateManager {
  getEntries(classId) { /* ... */ }
  getClasses(trialId) { /* NEW: Reuse existing pattern */ }
}
```

**Scenario 2: Second Cache Key Pattern**
```typescript
// Week 1: Cache key pattern for entries
const key = `local-state-entries`;

// Week 4: About to add different pattern for classes
const key = `trial-info-${licenseKey}-${trialId}`; // ❌ Different pattern!

// 🛑 STOP: We have two different cache key formats
// ✅ INSTEAD: Abstract the pattern

class CacheKeyBuilder {
  static forTable(tableName: string, id: string): string {
    return `replicated-${tableName}-${id}`;
  }
}

const entriesKey = CacheKeyBuilder.forTable('entries', entryId);
const classesKey = CacheKeyBuilder.forTable('classes', classId);
```

**Enforcement**:
- Code review must flag duplicate patterns
- Developer must justify why abstraction wasn't used

### Rule 4: Document Architecture Decisions (ADRs)

**Enforced by**: Required for major changes

**Format**: `docs/architecture/ADR-NNN-title.md`

**Template**:
```markdown
# ADR-001: Use ReplicatedTable for All Data Access

**Status**: Accepted
**Date**: 2025-11-09
**Deciders**: [Your Name], Claude Code

## Context
We had 3 different caching systems (LocalStateManager, React Query, IndexedDB cache)
causing duplicate data, inconsistent offline behavior, and cache invalidation issues.

## Decision
We will implement a unified ReplicatedTable pattern for all 17 database tables,
replacing LocalStateManager, React Query data fetching, and direct IndexedDB access.

## Consequences

### Positive
- Single source of truth for all data
- Consistent offline behavior
- Unified cache invalidation
- ~1500 lines of code deletion

### Negative
- 30 days of refactoring work
- Learning curve for new pattern
- Migration risk (mitigated by feature flags)

## Alternatives Considered
- **Option A**: Extend LocalStateManager to 3-4 more tables (rejected: accumulates debt)
- **Option C**: Use third-party library like RxDB (rejected: too much vendor lock-in)

## Validation
- [ ] All tables use ReplicatedTable by Week 5
- [ ] <5% error rate in production
- [ ] Zero duplicate caching systems

## Review Date
2025-12-09 (30 days after implementation)
```

**Required ADRs Going Forward**:
- Any new caching system (requires ADR explaining why existing pattern doesn't work)
- Any new data fetching pattern (must justify vs. replicationManager)
- Any breaking changes to ReplicatedTable API

### Rule 5: Simplicity Metrics (Enforce During Code Review)

**The Metrics**:
```typescript
// Track these metrics in every PR:

interface CodeComplexityMetrics {
  // How many ways can you fetch the same data?
  dataAccessPatterns: number; // Target: 1 (replicationManager only)

  // How many caching systems?
  cachingSystems: number; // Target: 1 (IndexedDB via ReplicatedTable)

  // How many cache key formats?
  cacheKeyPatterns: number; // Target: 1 (CacheKeyBuilder.forTable)

  // How many sync engines?
  syncEngines: number; // Target: 1 (SyncEngine)

  // Lines of caching code?
  cachingCodeLines: number; // Target: <2000 lines total
}
```

**Enforcement**:
```bash
# Add to package.json scripts
"check-complexity": "node scripts/checkComplexity.js"

# scripts/checkComplexity.js
const metrics = {
  dataAccessPatterns: countPatterns('supabase.from', 'idbCache.get', 'replicationManager.getTable'),
  cachingSystems: countLibraries(['@tanstack/react-query', 'LocalStateManager', 'ReplicationManager']),
  // ...
};

if (metrics.dataAccessPatterns > 1) {
  console.error('❌ Multiple data access patterns detected!');
  process.exit(1);
}
```

**Pre-commit Hook**:
```bash
# .husky/pre-commit
npm run check-complexity || exit 1
```

### Rule 6: "No New Caching Code" Policy

**Enforced by**: Code review + automated checks

**The Rule**:
```
Once ReplicatedTable is implemented (Week 5):
- Adding a new table? Extend ReplicatedTable (5 lines)
- Adding a new cache? ❌ REJECTED unless you can prove ReplicatedTable doesn't work
- Adding a new sync strategy? ❌ REJECTED unless you update SyncEngine globally
```

**Example Rejection**:
```typescript
// PR #123: "Add caching for announcements"

// ❌ REJECTED CODE:
const cachedAnnouncements = await idbCache.get('announcements-cache');

// Code Review Comment:
// "Please use replicationManager.getTable('announcements') instead.
//  If announcements table isn't replicated yet, add it to ReplicatedAnnouncementsTable.
//  See FULL_TABLE_REPLICATION_PLAN.md Week 4 Day 16 for implementation guide."

// ✅ APPROVED CODE:
const announcements = await replicationManager
  .getTable('announcements')
  .queryIndex('license_key', licenseKey);
```

### Rule 7: Mandatory "Why Not ReplicatedTable?" Justification

**Enforced by**: PR template

**PR Template Addition**:
```markdown
## Data Access Checklist

- [ ] Does this PR fetch data from the database?
- [ ] If yes, does it use `replicationManager.getTable()`?
- [ ] If no, why not? (Provide justification):

**Justification for NOT using ReplicatedTable**:
(Required if you answered "No" above)

Examples of valid justifications:
- "This is a one-time migration script, not production code"
- "This is testing code for ReplicatedTable itself"
- "This is a performance optimization benchmark"

Examples of invalid justifications:
- "I didn't know about ReplicatedTable" (Read the docs!)
- "It was easier to use Supabase directly" (Short-term thinking!)
- "I wanted to try React Query" (We already have a pattern!)
```

### Rule 8: Annual "Kill a Caching System" Day

**Enforced by**: Calendar reminder

**The Process**:
1. **Once per year**: Review all caching code
2. **Goal**: Delete at least one caching system or pattern
3. **Candidates**: Any code that's been superseded by ReplicatedTable

**Example Annual Review** (2026-11-09):
```markdown
## 2026 Annual Caching System Audit

### Current Systems
1. ReplicatedTable (active, 2000 lines)
2. LocalStateManager (deprecated, 566 lines) ← DELETE THIS
3. React Query persist (deprecated, 100 lines) ← DELETE THIS

### Decision
- Delete LocalStateManager.ts (all tables migrated to ReplicatedTable)
- Remove React Query persist plugin (not needed anymore)
- Net result: -666 lines of code

### Files to Delete
- src/services/localStateManager.ts
- src/utils/reactQueryPersist.ts
- All references to LocalStateManager (grep for `localStateManager.`)
```

### Rule 9: Living Architecture Documentation

**Enforced by**: CI/CD pipeline

**The Rule**: Architecture diagrams must stay in sync with code

**Implementation**:
```bash
# scripts/validateArchDocs.js
// Checks that FULL_TABLE_REPLICATION_PLAN.md matches actual implementation

const expectedFiles = [
  'src/services/replication/ReplicatedTable.ts',
  'src/services/replication/ReplicationManager.ts',
  // ... all 17 table files
];

const missingFiles = expectedFiles.filter(f => !fs.existsSync(f));
if (missingFiles.length > 0) {
  console.error('❌ Architecture docs out of sync!');
  console.error('Missing files:', missingFiles);
  process.exit(1);
}

// Check for forbidden patterns
const forbiddenPatterns = [
  { pattern: 'supabase.from', file: 'src/pages/**/*.tsx' },
  { pattern: 'idbCache.get', file: 'src/components/**/*.tsx' },
];

// ... validate and fail CI if found
```

**Update Process**:
- Code changes → Update FULL_TABLE_REPLICATION_PLAN.md
- Architecture changes → Update ADR-NNN docs
- New patterns → Update code review checklist

### Rule 10: "Stranger's Test" for New Features

**Enforced by**: Code review question

**The Test**:
```
If a new developer (who has never seen this codebase) needs to add offline
support for a new table, can they do it in <1 hour by reading the docs?

If NO → Documentation is insufficient
If YES → Architecture is clean enough
```

**Example Test Case**:
```markdown
## New Developer Onboarding Test

**Task**: Add offline support for a new `dogs` table

**Time Limit**: 1 hour

**Success Criteria**:
1. Read FULL_TABLE_REPLICATION_PLAN.md
2. Create `ReplicatedDogsTable.ts`
3. Register with ReplicationManager
4. Write basic tests
5. Query dogs table in a component

**If they can't complete in 1 hour**:
- Documentation is too complex → Simplify
- Pattern is too hard → Refactor
- Examples are missing → Add more
```

---

## Implementation Checklist: Guardrails in Place

Before starting Phase 1, ensure all guardrails are implemented:

### Phase 0 Setup (Before Day 1)
- [ ] Add ESLint rule: `no-direct-supabase`
- [ ] Add pre-commit hook: `npm run check-complexity`
- [ ] Create `scripts/checkComplexity.js`
- [ ] Create `scripts/validateArchDocs.js`
- [ ] Add CI/CD check: `npm run validate-arch-docs`
- [ ] Update PR template with "Data Access Checklist"
- [ ] Schedule recurring calendar reminder: Architecture Review (every 4 weeks)
- [ ] Create `docs/architecture/` folder
- [ ] Write ADR-001: Use ReplicatedTable for All Data Access
- [ ] Add "Annual Kill a Caching System Day" to calendar (2026-11-09)

### Phase 1 Enforcement (Day 1-5)
- [ ] First PR must include updated ADR-001
- [ ] Code review must check "Two of Anything" rule
- [ ] ESLint rule must pass in CI/CD

### Phase 5 Post-Implementation (Day 27)
- [ ] Run complexity check: `npm run check-complexity`
- [ ] Verify metrics: dataAccessPatterns = 1, cachingSystems = 1
- [ ] Update architecture docs: FULL_TABLE_REPLICATION_PLAN.md
- [ ] Schedule first architecture review: 4 weeks from now
- [ ] Run "Stranger's Test" with a team member

### Ongoing Enforcement
- [ ] Every PR: Check "Data Access Checklist"
- [ ] Every 4 weeks: Architecture Review meeting
- [ ] Every year: Delete deprecated caching code

---

**These guardrails ensure we NEVER end up with another "hybrid mess" again.**

---

## Key Files to Create

### Core Services (Phase 1-2)
1. `src/services/replication/ReplicatedTable.ts` (400 lines)
2. `src/services/replication/ReplicationManager.ts` (450 lines with web worker support)
3. `src/services/replication/SyncEngine.ts` (600 lines with error handling)
4. `src/services/replication/ConflictResolver.ts` (300 lines)
5. `src/services/replication/workers/syncWorker.ts` (100 lines - Phase 5)

### Table Implementations (Phase 3-4)
6. `src/services/replication/tables/ReplicatedEntriesTable.ts` (150 lines)
7. `src/services/replication/tables/ReplicatedClassesTable.ts` (150 lines)
8. `src/services/replication/tables/ReplicatedTrialsTable.ts` (100 lines)
9. `src/services/replication/tables/ReplicatedShowsTable.ts` (100 lines)
10. `src/services/replication/tables/ReplicatedClassRequirementsTable.ts` (100 lines)
11. `src/services/replication/tables/ReplicatedVisibilityConfigTable.ts` (200 lines)
12. `src/services/replication/tables/ReplicatedAnnouncementsTable.ts` (150 lines)
13. `src/services/replication/tables/ReplicatedPushNotificationConfigTable.ts` (100 lines)
14. ... 6 more table files

### Supporting Files (Phase 1-2)
15. `src/config/featureFlags.ts` (200 lines with stable user ID)
16. `src/utils/replicationHelpers.ts` (200 lines)
17. `src/hooks/useReplicatedTable.ts` (150 lines)
18. `src/hooks/useSyncProgress.ts` (100 lines)
19. `src/hooks/useSyncFailureNotification.ts` (80 lines - Phase 2)

### UI Components (Phase 2)
20. `src/components/SyncFailureBanner.tsx` (120 lines)
21. `src/components/SyncFailureBanner.css` (80 lines)

### Tests (Phase 1-5)
22. `src/services/replication/__tests__/ReplicatedTable.test.ts` (300 lines)
23. `src/services/replication/__tests__/SyncEngine.test.ts` (400 lines)
24. `src/services/replication/__tests__/ConflictResolver.test.ts` (250 lines)
25. `src/hooks/__tests__/useSyncFailureNotification.test.ts` (150 lines)
26. `e2e/offline-replication.spec.ts` (500 lines)

### Scripts & Tools (Phase 0-1)
27. `scripts/checkComplexity.js` (150 lines)
28. `scripts/validateArchDocs.js` (100 lines)

### Documentation (Phase 0-5)
29. `docs/architecture/ADR-001-replicated-table.md` (Phase 1)
30. `DATABASE_REFERENCE.md` (updates in Phase 0)

**Total New Files**: ~30 files
**Total New Lines**: ~6,500 lines
**Total Deleted Lines**: ~1,500 lines (after Phase 5 cleanup)
**Net Change**: +5,000 lines

---

## Dependencies & Prerequisites

### Required Libraries
- [x] IndexedDB (already integrated via `utils/indexedDB.ts`)
- [x] Supabase JS Client (already integrated)
- [x] React Query (already integrated, will phase out)
- [ ] **`idb` library** (RECOMMENDED - upgrade from optional)
  - **Why**: Better IndexedDB DX, handles browser inconsistencies
  - **Migration**: Refactor `utils/indexedDB.ts` to use `idb` wrapper
  - **Install**: `npm install idb` (~6KB gzipped)
  - **Priority**: Phase 1 Day 1 (before building ReplicatedTable)
- [ ] **`comlink` library** (RECOMMENDED for Phase 5 optimization)
  - **Why**: Offload sync to web worker, keep main thread responsive
  - **Use Case**: Large syncs (1000+ entries) won't block UI
  - **Install**: `npm install comlink` (~2KB gzipped)
  - **Priority**: Phase 5 Day 23-24 (performance optimization)

### Team Skills Required
- TypeScript generics (for `ReplicatedTable<T>`)
- IndexedDB API knowledge
- Conflict resolution algorithms (LWW, CRDT basics)
- React hooks (custom hooks for replication)

---

## Questions Before Starting

1. **Performance Tolerance**: What's acceptable cache read latency? (Current: ~10ms, Target: <50ms)
2. **Offline Duration**: How long should offline mutations persist? (Current: 7 days, Proposal: 30 days)
3. **Conflict Strategy**: Prefer server or client for conflicts? (Proposal: Server wins for scores, client wins for check-in)
4. **Rollout Speed**: Aggressive (10 days) or cautious (27 days)? (Proposal: Start cautious, accelerate if stable)
5. **Multi-Device Sync**: Should same user on 2 devices see instant updates? (Proposal: Yes, via Supabase real-time)

---

## Comparison to Option A (Extend Current)

| Aspect | Option A (Extend Current) | Option B (Full Replication) |
|--------|---------------------------|----------------------------|
| **Timeline** | 7-9 days | 30 days |
| **Code Added** | ~800 lines | ~5000 lines |
| **Code Removed** | ~200 lines | ~1500 lines (after migration) |
| **Complexity** | Low (extend existing) | Medium (new abstractions) |
| **Long-Term Debt** | Accumulates | Pays down debt |
| **Multi-Show Support** | Hard to add later | Natural fit |
| **Testability** | Medium | High (generic tests) |
| **Rollback Risk** | Low | Medium (mitigated by flags) |
| **Feature Coverage** | 80% (missing visibility, stats) | 100% (all features) |

---

## Summary of Changes to Original Plan

### Initial Plan Updates (2025-11-09)
1. ✅ Added Phase 0: Pre-Implementation (Database Schema Fixes) - 3 days
2. ✅ Added 3 visibility config tables to replication list
3. ✅ Added 2 materialized views (stats, audit) as cached data sources
4. ✅ Clarified `announcement_reads` needs verification
5. ✅ Reduced total tables from "23" to "14 replicated + 2 cached views"
6. ✅ Added feature-specific sync strategies for visibility, stats, announcements, audit
7. ✅ Comprehensive risk mitigation and rollback plans
8. ✅ **Reorganized with consistent Phase naming** (Phase 0-5 instead of mixed Week/Phase)
9. ✅ **Added Phase Overview table** for at-a-glance understanding
10. ✅ **Added Table of Contents** with 24 sections and anchor links

### Technical Improvements (addressing feedback)
11. ✅ **Upgraded `idb` library from optional to RECOMMENDED**
    - Better IndexedDB DX and browser compatibility
    - Migration path for `utils/indexedDB.ts`
12. ✅ **Upgraded `comlink` library from optional to RECOMMENDED**
    - Web worker sync for non-blocking large syncs
    - Phase 5 optimization with concrete implementation
13. ✅ **Enhanced error handling in SyncEngine**
    - Global error logging with Sentry integration points
    - User notification strategy via custom events
    - Retry mechanism with exponential backoff
14. ✅ **Added sync failure UI components**
    - `useSyncFailureNotification` hook (80 lines)
    - `SyncFailureBanner` component (120 lines)
    - Integration with App.tsx for global error banner
15. ✅ **Stable user ID for feature flag rollout**
    - Persists across sessions via localStorage
    - Derived from license key (consistent per user)
    - Fallback to UUID with persistence
    - Deterministic rollout (same user always gets same experience)
16. ✅ **Enhanced DATABASE_REFERENCE.md requirements**
    - Comprehensive schema documentation checklist
    - Index, RLS policy, and trigger documentation
    - Query examples and testing requirements
17. ✅ **Web Worker optimization with concrete examples**
    - `syncWorker.ts` implementation (100 lines)
    - ReplicationManager integration
    - Fallback to main thread sync
    - Performance benefits documented

### Latest Refinements (2025-11-09 - Final Review)
18. ✅ **Enhanced announcement_reads verification in Phase 0**
    - Added explicit verification query with step-by-step checklist
    - If table missing, create it; if exists, verify schema matches
    - Document findings in Phase 0 completion report
19. ✅ **Clarified materialized view refresh strategy**
    - `view_stats_summary`: Materialized with nightly pg_cron refresh (2 AM)
    - Manual refresh via admin API: `POST /api/admin/refresh-stats`
    - `view_audit_log`: Regular view (NOT materialized) for real-time queries
    - CONCURRENTLY option to avoid table locks
20. ✅ **Added updated_by column requirements**
    - All visibility tables include `updated_by TEXT` column for audit trail
    - Verify `show_visibility_config` has `updated_by`, add if missing
    - Document expected values: user ID, role, or session identifier
21. ✅ **Added idb library migration sub-task to Phase 1 Day 3**
    - Explicit migration of `src/utils/indexedDB.ts` to use idb wrapper
    - Test existing functionality before adding new stores
    - Commit migration separately before schema extension
    - Concrete before/after code examples
22. ✅ **Enhanced sync progress reporting with step counts**
    - Progress event includes `currentStep`, `totalSteps`, and `percentage`
    - `useSyncProgress` hook with complete/incomplete states
    - `SyncProgressBar` component with visual progress indicator
    - Auto-clear progress 2 seconds after completion
23. ✅ **Added estimateSize function for accurate LRU eviction**
    - Uses `JSON.stringify + Blob` for accurate byte count
    - Fallback to string length * 2 if Blob fails
    - Auto-eviction triggers at 80% quota, evicts to 60%
    - Progress logging every 100 rows
    - Detailed console output for debugging

**Total Timeline**: **Phase 0 (3 days) + Phases 1-5 (27 days) = 30 days total**

**Total New Files**: ~30 files (~6,500 new lines)
**Total Deleted Files**: ~3 files (~1,500 deleted lines)
**Net Change**: +5,000 lines

**Risk**: Medium-High (mitigated by feature flags, phased rollout, and comprehensive error handling)

---

## Next Steps

1. **Review this plan** with the team (1 hour meeting)
2. **Run Phase 0 schema fixes** (verify missing tables, create migrations - Day -3 to 0)
3. **Prototype ReplicatedTable** for entries only (Phase 1: Day 1-5)
4. **Validate performance** with 1000+ entries (Phase 2: Day 6)
5. **Decide: Continue or pivot to Option A** (Phase 2: Day 7)
6. If continuing, **complete Phase 2 sync engine** (Day 8-10)
7. **Begin Phase 3 core table migration** (Day 11-15)

---

**Last Updated**: 2025-11-09
**Status**: Draft - Ready for Review
**Author**: Claude Code + myK9Q Team
