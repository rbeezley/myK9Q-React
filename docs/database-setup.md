# myK9Q Dev Database Setup Guide

## Creating a Development Copy of myK9Q Supabase Database

### Option 1: New Supabase Project (Recommended)

#### Step 1: Create New Project
1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click **"New Project"**
3. **Name**: `myk9q-react-dev`
4. **Organization**: Same as production
5. **Region**: Same as production myK9Q project
6. **Database Password**: Generate strong password (save it!)
7. Click **"Create new project"**

#### Step 2: Export Production Data Structure

**From your current myK9Q Supabase dashboard:**

1. **Go to SQL Editor**
2. **Run this query to see your tables:**
```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

3. **Export key views (these are critical for myK9Q):**
```sql
-- Export the main view used by Flutter app
SELECT pg_get_viewdef('view_entry_class_join_distinct', true);
SELECT pg_get_viewdef('view_entry_class_join_section_distinct', true);
SELECT pg_get_viewdef('view_unique_armbands', true);
SELECT pg_get_viewdef('view_unique_mobile_app_lic_key', true);
```

4. **Get table structures:**
```sql
-- For each table, run this to get the CREATE statement
SELECT 
  'CREATE TABLE ' || table_name || ' (' ||
  string_agg(
    column_name || ' ' || data_type ||
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')'
      ELSE ''
    END ||
    CASE 
      WHEN is_nullable = 'NO' THEN ' NOT NULL'
      ELSE ''
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_name = 'tbl_entry_queue'  -- Replace with each table
GROUP BY table_name;
```

#### Step 3: Set Up Development Database Schema

**In your new dev project SQL Editor:**

1. **Create the main tables** (based on Flutter analysis):
```sql
-- Core tables from Flutter app
CREATE TABLE tbl_entry_queue (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  mobile_app_lic_key TEXT,
  armband INTEGER,
  call_name TEXT,
  breed TEXT,
  handler TEXT,
  checkin_status INTEGER DEFAULT 0,
  result_text TEXT,
  search_time TEXT,
  fault_count INTEGER DEFAULT 0,
  exhibitor_order INTEGER,  -- Custom run order (gate steward can reorder)
  placement INTEGER,
  in_ring BOOLEAN DEFAULT false,
  is_scored BOOLEAN DEFAULT false,
  reason TEXT,
  areatime1 TEXT,
  areatime2 TEXT,  
  areatime3 TEXT,
  exclude INTEGER DEFAULT 0,
  entryid INTEGER,
  trialid_fk INTEGER,
  classid_fk INTEGER,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  no_finish INTEGER DEFAULT 0,
  fastcat_block TEXT,
  fastcat_handicap TEXT,
  fastcat_mph TEXT,
  fastcat_health_status BOOLEAN DEFAULT false,
  fastcat_health_timestamp TIME,
  fastcat_health_comment TEXT,
  sort_order INTEGER
);

CREATE TABLE tbl_class_queue (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  mobile_app_lic_key TEXT,
  trial_date TEXT,
  trial_number TEXT,
  element TEXT,
  level TEXT,
  section TEXT,
  time_limit TEXT,
  time_limit2 TEXT,
  time_limit3 TEXT,
  areas INTEGER DEFAULT 1,
  judge_name TEXT,
  self_checkin BOOLEAN DEFAULT false,
  realtime_results BOOLEAN DEFAULT true,
  trial_type TEXT
);

CREATE TABLE tbl_trial_queue (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  mobile_app_lic_key TEXT,
  trial_date TEXT,
  trial_number TEXT,
  trial_type TEXT,
  club_name TEXT,
  judge_name TEXT,
  location TEXT
);

CREATE TABLE tbl_announcements (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  mobile_app_lic_key TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false
);
```

2. **Create the critical view** (main data source for Flutter app):
```sql
CREATE OR REPLACE VIEW view_entry_class_join_distinct AS
SELECT 
  e.id,
  e.created_at,
  e.mobile_app_lic_key,
  c.trial_date,
  c.trial_number,
  c.element,
  c.level,
  c.section,
  e.armband,
  e.call_name,
  e.breed,
  e.handler,
  e.checkin_status,
  e.result_text,
  e.search_time,
  e.fault_count,
  e.exhibitor_order,
  e.placement,
  e.in_ring,
  e.is_scored,
  c.trial_date || ' - ' || c.trial_number as trial_date_text,
  c.section || ' - ' || c.level as section_grouped,
  e.reason,
  e.areatime1,
  e.areatime2,
  e.areatime3,
  e.exclude,
  e.entryid,
  e.trialid_fk,
  e.classid_fk,
  c.time_limit,
  c.time_limit2,
  c.time_limit3,
  c.areas,
  -- Count statistics
  (SELECT COUNT(*) FROM tbl_entry_queue WHERE classid_fk = c.id AND is_scored = false) as pending_count,
  (SELECT COUNT(*) FROM tbl_entry_queue WHERE classid_fk = c.id AND is_scored = true) as completed_count,
  (SELECT COUNT(*) FROM tbl_entry_queue WHERE classid_fk = c.id) as total_count,
  c.judge_name,
  c.self_checkin,
  c.realtime_results,
  c.trial_type,
  e.correct_count,
  e.incorrect_count,
  e.no_finish,
  e.fastcat_block,
  e.fastcat_handicap,
  e.fastcat_mph,
  e.fastcat_health_status,
  e.fastcat_health_timestamp,
  e.fastcat_health_comment,
  e.sort_order
FROM tbl_entry_queue e
JOIN tbl_class_queue c ON e.classid_fk = c.id;
```

#### Step 4: Add Sample Development Data

```sql
-- Insert sample trial
INSERT INTO tbl_trial_queue (mobile_app_lic_key, trial_date, trial_number, trial_type, club_name, judge_name, location)
VALUES ('DEV-KEY-123', '2024-01-15', '1', 'UKC Obedience', 'Development Dog Club', 'Judge Jane Smith', 'Dev Location');

-- Insert sample class  
INSERT INTO tbl_class_queue (mobile_app_lic_key, trial_date, trial_number, element, level, section, time_limit, areas, judge_name, trial_type)
VALUES ('DEV-KEY-123', '2024-01-15', '1', 'Obedience', 'Open', 'A', '03:00', 1, 'Judge Jane Smith', 'UKC Obedience');

-- Insert sample entries
INSERT INTO tbl_entry_queue (mobile_app_lic_key, armband, call_name, breed, handler, classid_fk, trialid_fk, exhibitor_order)
VALUES 
  ('DEV-KEY-123', 1, 'Test Dog 1', 'Golden Retriever', 'Handler One', 1, 1, 1),
  ('DEV-KEY-123', 2, 'Test Dog 2', 'Border Collie', 'Handler Two', 1, 1, 2),
  ('DEV-KEY-123', 3, 'Test Dog 3', 'Labrador', 'Handler Three', 1, 1, 3);

-- Add Scent Work class for multi-area testing
INSERT INTO tbl_class_queue (mobile_app_lic_key, trial_date, trial_number, element, level, section, time_limit, time_limit2, time_limit3, areas, judge_name, trial_type)
VALUES ('DEV-KEY-123', '2024-01-15', '2', 'Scent Work', 'Advanced', 'Interior/Exterior/Vehicle', '03:00', '02:30', '02:00', 3, 'Judge Jane Smith', 'AKC Scent Work');

INSERT INTO tbl_entry_queue (mobile_app_lic_key, armband, call_name, breed, handler, classid_fk, trialid_fk, exhibitor_order)
VALUES 
  ('DEV-KEY-123', 11, 'Scent Dog 1', 'German Shepherd', 'Scent Handler 1', 2, 1, 1),
  ('DEV-KEY-123', 12, 'Scent Dog 2', 'Belgian Malinois', 'Scent Handler 2', 2, 1, 2);
```

#### Step 5: Configure Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE tbl_entry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_class_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_trial_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for development (allow all for now)
CREATE POLICY "Allow all operations for development" ON tbl_entry_queue
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for development" ON tbl_class_queue
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for development" ON tbl_trial_queue
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for development" ON tbl_announcements
  FOR ALL USING (true);
```

#### Step 6: Set Up Development Environment Variables

Create `.env.local` in your React project:
```bash
# Development Supabase (your new dev project)
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_MOBILE_APP_LIC_KEY=DEV-KEY-123
VITE_APP_VERSION=1.0.0-dev
```

---

## Option 2: Supabase CLI with Database Dump (If you have CLI access)

### Install Supabase CLI
```bash
npm install -g supabase
```

### Export Production Database
```bash
# Login to Supabase
supabase login

# Link to your production project  
supabase link --project-ref your-prod-project-id

# Export the schema and data
supabase db dump --schema public --data-only > production-data.sql
supabase db dump --schema public --schema-only > production-schema.sql
```

### Import to Development Database
```bash
# Link to your new dev project
supabase link --project-ref your-dev-project-id

# Import schema first
supabase db reset
psql -h db.your-dev-project.supabase.co -U postgres -f production-schema.sql

# Import data
psql -h db.your-dev-project.supabase.co -U postgres -f production-data.sql
```

---

## Option 3: Manual Database Copy via Dashboard

### Export from Production
1. **Go to your production myK9Q Supabase dashboard**
2. **SQL Editor > New Query**
3. **Export each table:**
```sql
-- Copy this output to recreate in dev
COPY (SELECT * FROM tbl_entry_queue) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM tbl_class_queue) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM tbl_trial_queue) TO STDOUT WITH CSV HEADER;
```

### Import to Development  
1. **In dev database SQL Editor**
2. **Create tables (use schema from Step 3 above)**
3. **Import data using INSERT statements**

---

## Testing Your Development Database

### Connection Test
```typescript
// test-connection.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-dev-project.supabase.co',
  'your-dev-anon-key'
);

// Test connection
async function testConnection() {
  const { data, error } = await supabase
    .from('view_entry_class_join_distinct')
    .select('*')
    .limit(5);
    
  console.log('Connection test:', { data, error });
}
```

### Verify Key Views Work
```sql
-- Test the main view Flutter uses
SELECT * FROM view_entry_class_join_distinct LIMIT 5;

-- Verify real-time subscriptions work
SELECT * FROM tbl_announcements;
```

---

## Next Steps After Dev Database is Ready

1. **Update PROJECT-CONTEXT.md** with dev database details
2. **Begin Phase 1 development** using dev database
3. **Test all 7 competition types** with sample data
4. **Validate real-time subscriptions** work correctly
5. **Once stable**, consider testing with production data copy

---

## Benefits of This Approach

✅ **Safe Development** - No risk to production Flutter app
✅ **Real Testing** - Same schema structure as production  
✅ **Sample Data** - Clean test data for development
✅ **Isolated Environment** - Can experiment freely
✅ **Easy Reset** - Can recreate dev database anytime

Would you like me to help you with any specific step in this process?