# AKC Nationals Scoring Database Schema

## Overview
Database schema for the AKC Scent Work Master National Championship 2025 scoring system. Supports single group of 200 exhibitors with top 100 advancing to finals.

## Core Tables

### `nationals_scores`
Individual element scores for each dog/element combination.

**Purpose**: Records every score for every dog in every element
**Key Features**: Handles excused dogs (0 points, 2 min), point calculations, and judge assignments

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `entry_id` | INTEGER | Links to tbl_entry_queue.id |
| `armband` | VARCHAR(10) | Dog's armband number |
| `element_type` | VARCHAR(20) | CONTAINER, BURIED, INTERIOR, EXTERIOR, HD_CHALLENGE |
| `day` | INTEGER | Competition day (1, 2, 3) |
| `judge_id` | INTEGER | Links to judge_profiles.id |
| `points` | INTEGER | Total points earned (can be negative) |
| `time_seconds` | INTEGER | Search time in seconds (0-120) |
| `alerts_correct` | INTEGER | Number of correct alerts |
| `alerts_incorrect` | INTEGER | Number of incorrect alerts |
| `faults` | INTEGER | Number of faults |
| `finish_call_errors` | INTEGER | Number of finish call errors |
| `excused` | BOOLEAN | Dog was excused (gets 0 points, 120 seconds) |
| `disqualified` | BOOLEAN | Dog was disqualified |
| `scored_at` | TIMESTAMPTZ | When score was recorded |
| `mobile_app_lic_key` | VARCHAR(100) | Trial license key |

**Constraints**:
- Unique combination of entry_id + element_type + day
- Time must be 0-120 seconds
- All count fields must be >= 0

**Scoring Rules**:
- Correct alert: +10 points
- Incorrect alert: -5 points  
- Fault: -2 points
- Finish call error: -5 points
- Excused: 0 points, 120 seconds

### `nationals_rankings`
Aggregated rankings and totals for each exhibitor.

**Purpose**: Real-time leaderboard with qualification status
**Key Features**: Auto-updated via triggers, tracks element completion

| Column | Type | Description |
|--------|------|-------------|
| `entry_id` | INTEGER | Primary key, links to tbl_entry_queue.id |
| `armband` | VARCHAR(10) | Dog's armband number |
| `total_points` | INTEGER | Sum of all points across all days |
| `day1_points` | INTEGER | Day 1 total points |
| `day2_points` | INTEGER | Day 2 total points |  
| `day3_points` | INTEGER | Day 3 total points |
| `total_time_seconds` | INTEGER | Sum of all times |
| `day1_time_seconds` | INTEGER | Day 1 total time |
| `day2_time_seconds` | INTEGER | Day 2 total time |
| `day3_time_seconds` | INTEGER | Day 3 total time |
| `container_completed` | BOOLEAN | Container element completed |
| `buried_completed` | BOOLEAN | Buried element completed |
| `interior_completed` | BOOLEAN | Interior element completed |
| `exterior_completed` | BOOLEAN | Exterior element completed |
| `hd_challenge_completed` | BOOLEAN | Handler Discrimination completed |
| `rank` | INTEGER | Current overall rank |
| `qualified_for_finals` | BOOLEAN | Qualified for Day 3 finals (top 100) |
| `final_rank` | INTEGER | Final championship rank |

**Auto-Updates**: Triggered whenever nationals_scores is modified

### `nationals_advancement`
Finals qualification tracking and championship results.

**Purpose**: Track advancement from preliminaries to finals to championship
**Key Features**: Tracks preliminary vs finals performance

| Column | Type | Description |
|--------|------|-------------|
| `entry_id` | INTEGER | Links to tbl_entry_queue.id |
| `preliminary_points` | INTEGER | Days 1-2 combined points |
| `preliminary_rank` | INTEGER | Rank after Days 1-2 |
| `qualified_for_finals` | BOOLEAN | Made top 100 cut |
| `finals_points` | INTEGER | Day 3 points |
| `finals_rank` | INTEGER | Day 3 rank |
| `championship_points` | INTEGER | Final total points |
| `championship_rank` | INTEGER | Final championship rank |
| `national_champion` | BOOLEAN | Won the championship |
| `reserve_champion` | BOOLEAN | Reserve champion |
| `top_10_finish` | BOOLEAN | Finished in top 10 |

## Views

### `view_nationals_leaderboard`
Complete leaderboard with dog info and rankings.

**Usage**: Primary TV dashboard data source
**Includes**: Dog info, handler info, points, times, completion status

```sql
SELECT * FROM view_nationals_leaderboard 
ORDER BY rank ASC 
LIMIT 20;
```

### `view_nationals_qualifiers`  
Top 100 qualifiers for finals with advancement data.

**Usage**: Finals leaderboard, qualification announcements
**Includes**: All leaderboard data plus finals performance

```sql
SELECT * FROM view_nationals_qualifiers
WHERE qualified_for_finals = true
ORDER BY rank ASC;
```

### `view_element_progress`
Summary statistics by element and day.

**Usage**: Element Progress component, judge statistics
**Includes**: Completion rates, average scores, timing data

```sql
SELECT * FROM view_element_progress
WHERE day = 2
ORDER BY element_type;
```

### `view_judge_summary`
Judge performance and statistics.

**Usage**: Judge reports, performance analysis
**Includes**: Dogs judged, excusal rates, average scores

## Functions & Triggers

### `update_nationals_rankings()`
**Trigger Function**: Auto-updates rankings when scores change
**Runs**: After INSERT/UPDATE on nationals_scores
**Actions**:
1. Updates point totals
2. Updates time totals  
3. Updates element completion flags
4. Calculates top 100 qualification
5. Sets timestamps

### `calculate_nationals_rankings()`
**Manual Function**: Recalculates all rankings
**Usage**: Run after major data changes or corrections
**Actions**:
1. Calculates preliminary rankings (Days 1-2)
2. Calculates final rankings (including Day 3)
3. Updates all rank fields

```sql
SELECT calculate_nationals_rankings();
```

## Indexes

Performance optimized for:
- Entry/armband lookups
- Date range queries  
- Ranking sorts
- Element filtering
- License key filtering

Key indexes:
- `idx_nationals_scores_entry_day` - Score lookups by dog/day
- `idx_nationals_rankings_rank` - Leaderboard sorting
- `idx_nationals_rankings_points` - Point-based ranking
- `idx_nationals_advancement_qualified` - Finals qualification

## Usage Examples

### Record a Score
```sql
INSERT INTO nationals_scores (
  entry_id, armband, element_type, day,
  points, time_seconds, alerts_correct, alerts_incorrect,
  faults, finish_call_errors, mobile_app_lic_key
) VALUES (
  123, '125', 'CONTAINER', 1,
  18, 85, 2, 0, 1, 0, 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
);
```

### Record Excused Dog
```sql
INSERT INTO nationals_scores (
  entry_id, armband, element_type, day,
  points, time_seconds, excused, mobile_app_lic_key
) VALUES (
  124, '126', 'BURIED', 1,
  0, 120, true, 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
);
```

### Get Current Top 10
```sql
SELECT rank, armband, total_points, total_time_seconds
FROM view_nationals_leaderboard
WHERE rank <= 10
ORDER BY rank ASC;
```

### Get Top 100 Qualifiers
```sql
SELECT COUNT(*) as qualified_count
FROM nationals_rankings
WHERE qualified_for_finals = true;
```

### Get Element Progress
```sql
SELECT 
  element_type,
  total_entries,
  successful_entries,
  excused_entries,
  ROUND(avg_points, 1) as avg_points
FROM view_element_progress
WHERE day = 2;
```

## Migration Instructions

1. **Run main migration**:
   ```sql
   -- In Supabase SQL Editor
   \i supabase/migrations/001_nationals_scoring.sql
   ```

2. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'nationals_%';
   ```

3. **Load seed data** (optional):
   ```sql
   \i scripts/seed-nationals-data.sql
   ```

4. **Test queries**:
   ```sql
   SELECT COUNT(*) FROM nationals_scores;
   SELECT COUNT(*) FROM nationals_rankings;
   ```

## Data Integrity

- **Foreign keys**: Link to existing tbl_entry_queue entries
- **Check constraints**: Validate times, counts, enum values
- **Unique constraints**: Prevent duplicate scores  
- **Triggers**: Maintain data consistency
- **Indexes**: Ensure query performance

## Security Considerations

- All tables include `mobile_app_lic_key` for multi-tenancy
- Row Level Security can be enabled for admin access
- Triggers ensure data consistency
- Views provide controlled data access

---

*Schema supports the updated requirements: single group of 200, top 100 advance, excused dogs get 0 points + 2 minutes*