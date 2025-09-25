-- Fix nationals tables to use consistent license_key field
-- Run this to align nationals tables with normalized schema

-- 1. Fix nationals_advancement table
ALTER TABLE nationals_advancement
DROP COLUMN IF EXISTS mobile_app_lic_key;

ALTER TABLE nationals_advancement
ADD COLUMN license_key TEXT;

-- Add foreign key to ensure data integrity
ALTER TABLE nationals_advancement
ADD CONSTRAINT nationals_advancement_entry_id_fkey
FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;

-- 2. Fix nationals_rankings table
ALTER TABLE nationals_rankings
DROP COLUMN IF EXISTS mobile_app_lic_key;

ALTER TABLE nationals_rankings
ADD COLUMN license_key TEXT;

-- Change primary key from entry_id to id for consistency
ALTER TABLE nationals_rankings DROP CONSTRAINT IF EXISTS nationals_rankings_pkey;
ALTER TABLE nationals_rankings ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- Add proper foreign key
ALTER TABLE nationals_rankings
ADD CONSTRAINT nationals_rankings_entry_id_fkey
FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;

-- 3. Create nationals_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS nationals_scores (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES entries(id) ON DELETE CASCADE,
  license_key TEXT NOT NULL,
  preliminary_score INTEGER DEFAULT 0,
  finals_score INTEGER DEFAULT 0,
  championship_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 3),
  element TEXT NOT NULL, -- Interior, Exterior, Container, Buried, etc.
  level TEXT NOT NULL,   -- Master only for nationals
  is_qualified BOOLEAN DEFAULT false,
  is_eliminated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(entry_id, day_number, element)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_nationals_scores_license_key ON nationals_scores(license_key);
CREATE INDEX IF NOT EXISTS idx_nationals_scores_entry_id ON nationals_scores(entry_id);
CREATE INDEX IF NOT EXISTS idx_nationals_advancement_license_key ON nationals_advancement(license_key);
CREATE INDEX IF NOT EXISTS idx_nationals_rankings_license_key ON nationals_rankings(license_key);

-- Verify changes
SELECT 'Nationals schema updated successfully' as status;