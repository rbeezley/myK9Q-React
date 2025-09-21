# Normalized Database Relationships - myK9Show

## Entity Relationship Diagram

```mermaid
erDiagram
    dog_shows ||--o{ trial_events : "contains"
    trial_events ||--o{ competition_classes : "has"
    competition_classes ||--o{ class_entries : "includes"
    class_entries ||--o{ entry_results : "produces"
    dog_shows ||--o{ access_sync_logs : "tracks"

    dog_shows {
        text license_key PK "Trial identifier"
        text show_name "Show name"
        date start_date "Start date"
        date end_date "End date"
        text location "Show location"
        text club_name "Host club"
        text event_type "Type of event"
        timestamp created_at "Record creation"
        timestamp updated_at "Last modified"
    }

    trial_events {
        uuid id PK "Unique identifier"
        text license_key FK "Links to dog_shows"
        integer trial_number "Trial sequence (1,2,3...)"
        date trial_date "Date of trial"
        text judge_name "Assigned judge"
        text event_type "Event classification"
        timestamp created_at "Record creation"
        timestamp updated_at "Last modified"
    }

    competition_classes {
        uuid id PK "Unique identifier"
        uuid trial_event_id FK "Links to trial_events"
        text element "Search element (Interior, Exterior, etc.)"
        text level "Skill level (Novice, Advanced, etc.)"
        text section "Class section (A, B, etc.)"
        integer class_order "Running order"
        text status "Class status"
        timestamp created_at "Record creation"
        timestamp updated_at "Last modified"
    }

    class_entries {
        uuid id PK "Unique identifier"
        uuid competition_class_id FK "Links to competition_classes"
        text license_key "Trial identifier"
        integer entry_id "Entry number"
        text dog_name "Dog's name"
        text breed "Dog's breed"
        text handler_name "Handler name"
        text handler_state "Handler's state"
        integer check_in_status "Status (0-3)"
        text section "Entry section (A/B)"
        timestamp created_at "Record creation"
        timestamp updated_at "Last modified"
    }

    entry_results {
        uuid id PK "Unique identifier"
        uuid class_entry_id FK "Links to class_entries"
        decimal search_time "Time in seconds"
        integer score "Points earned"
        text placement "Final placement"
        text status "Result status"
        boolean qualified "Qualification status"
        timestamp created_at "Record creation"
        timestamp updated_at "Last Modified"
    }

    access_sync_logs {
        uuid id PK "Unique identifier"
        text license_key FK "Links to dog_shows"
        text table_name "Synced table"
        text operation "Sync operation"
        integer records_affected "Count of records"
        timestamp synced_at "Sync timestamp"
        text status "Sync status"
        text error_message "Error details"
    }
```

## Table Relationships Explained

### 1. **dog_shows** (Root Entity)
- **Primary Key**: `license_key` (text)
- **Purpose**: Main container for each dog show event
- **Relationships**:
  - One show can have multiple trial events
  - Tracks sync operations via access_sync_logs

### 2. **trial_events** (Event Container)
- **Primary Key**: `id` (uuid)
- **Foreign Key**: `license_key` → dog_shows
- **Purpose**: Individual trial sessions within a show
- **Relationships**:
  - Each trial belongs to one show
  - Each trial can have multiple competition classes

### 3. **competition_classes** (Class Definition)
- **Primary Key**: `id` (uuid)
- **Foreign Key**: `trial_event_id` → trial_events
- **Purpose**: Specific competition categories (element + level + section)
- **Key Feature**: **Section Merging Logic**
  - Novice A & B sections are merged in UI for unified scoring
  - Section data preserved for separate placement calculations
- **Relationships**:
  - Each class belongs to one trial event
  - Each class can have multiple entries

### 4. **class_entries** (Participant Records)
- **Primary Key**: `id` (uuid)
- **Foreign Key**: `competition_class_id` → competition_classes
- **Purpose**: Individual dog/handler combinations in each class
- **Key Fields**:
  - `section`: Preserved for placement calculations (A/B)
  - `check_in_status`: 0=Not arrived, 1=Checked in, 2=In ring, 3=Complete
- **Relationships**:
  - Each entry belongs to one competition class
  - Each entry can have multiple results (retries/re-runs)

### 5. **entry_results** (Scoring Data)
- **Primary Key**: `id` (uuid)
- **Foreign Key**: `class_entry_id` → class_entries
- **Purpose**: Actual performance results and scores
- **Key Fields**:
  - `search_time`: Performance time in seconds
  - `placement`: Final ranking within section
  - `qualified`: Whether the run qualifies for titles
- **Relationships**:
  - Each result belongs to one class entry
  - Multiple results possible per entry (re-runs)

### 6. **access_sync_logs** (Audit Trail)
- **Primary Key**: `id` (uuid)
- **Foreign Key**: `license_key` → dog_shows
- **Purpose**: Track synchronization between Access and Supabase
- **Relationships**:
  - Links to shows for audit purposes
  - Independent tracking table

## Data Flow & Section Merging

### Original Access Structure (Flat)
```
tbl_entry_queue: All entries in single table
├── Novice A entries (section = 'A')
├── Novice B entries (section = 'B')
└── Other level entries
```

### Normalized Structure (Relational)
```
dog_shows
└── trial_events
    └── competition_classes
        ├── Novice A class (section = 'A')
        ├── Novice B class (section = 'B')
        └── class_entries (preserves original section)
            └── entry_results (placement within section)
```

### UI Merging Logic
- **Scoring Interface**: Combines Novice A + B entries into single list
- **Placement Calculation**: Maintains separate A/B section rankings
- **Real-time Updates**: WebSocket subscriptions work across merged sections

## Current Status
- **Total Entries**: 522/524 synced (99.6% complete)
- **Missing**: 2 entries with data issues
- **Section Merging**: Active for Novice level classes
- **Sync Direction**: Bidirectional (Access ↔ Supabase)

This normalized structure maintains data integrity while enabling the flexible UI requirements for section merging in competition scoring.