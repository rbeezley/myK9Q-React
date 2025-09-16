-- AKC Scent Work Master National 2025 - Seed Data
-- Script: seed-nationals-data.sql
-- Purpose: Generate realistic test data for 200 exhibitors
-- Usage: Run in Supabase SQL Editor after running the main migration

BEGIN;

-- First, let's check if we have the required license key in tbl_entry_queue
-- We'll use the myK9Q1 license key that should exist
DO $$
DECLARE
    test_license VARCHAR(100) := 'myK9Q1-d8609f3b-d3fd43aa-6323a604';
    entry_count INTEGER;
BEGIN
    -- Check if we have entries for this license
    SELECT COUNT(*) INTO entry_count 
    FROM tbl_entry_queue 
    WHERE mobile_app_lic_key = test_license;
    
    RAISE NOTICE 'Found % entries for license key %', entry_count, test_license;
    
    -- If we don't have enough entries, we'll create sample data
    IF entry_count < 200 THEN
        RAISE NOTICE 'Creating sample entry data...';
        
        -- Insert sample entries (this would normally come from the main entry system)
        INSERT INTO tbl_entry_queue (
            mobile_app_lic_key, armband, call_name, breed, handler, handler_location,
            checkin_status, created_at
        )
        SELECT 
            test_license,
            (100 + generate_series)::TEXT as armband,
            'TestDog' || generate_series as call_name,
            CASE (generate_series % 15)
                WHEN 0 THEN 'Border Collie'
                WHEN 1 THEN 'German Shepherd'
                WHEN 2 THEN 'Golden Retriever'
                WHEN 3 THEN 'Labrador Retriever'
                WHEN 4 THEN 'Belgian Malinois'
                WHEN 5 THEN 'Australian Cattle Dog'
                WHEN 6 THEN 'Dutch Shepherd'
                WHEN 7 THEN 'Working Kelpie'
                WHEN 8 THEN 'Australian Shepherd'
                WHEN 9 THEN 'Springer Spaniel'
                WHEN 10 THEN 'Vizsla'
                WHEN 11 THEN 'Weimaraner'
                WHEN 12 THEN 'Mixed Breed'
                WHEN 13 THEN 'Pointing Labs'
                ELSE 'Other Sporting'
            END as breed,
            'Handler' || generate_series as handler,
            CASE (generate_series % 20)
                WHEN 0 THEN 'Austin, TX'
                WHEN 1 THEN 'Houston, TX'
                WHEN 2 THEN 'Dallas, TX'
                WHEN 3 THEN 'Los Angeles, CA'
                WHEN 4 THEN 'San Francisco, CA'
                WHEN 5 THEN 'Phoenix, AZ'
                WHEN 6 THEN 'Denver, CO'
                WHEN 7 THEN 'Seattle, WA'
                WHEN 8 THEN 'Portland, OR'
                WHEN 9 THEN 'Las Vegas, NV'
                WHEN 10 THEN 'Salt Lake City, UT'
                WHEN 11 THEN 'Albuquerque, NM'
                WHEN 12 THEN 'Oklahoma City, OK'
                WHEN 13 THEN 'Kansas City, MO'
                WHEN 14 THEN 'Little Rock, AR'
                WHEN 15 THEN 'Memphis, TN'
                WHEN 16 THEN 'New Orleans, LA'
                WHEN 17 THEN 'Jacksonville, FL'
                WHEN 18 THEN 'Atlanta, GA'
                ELSE 'Other City, ST'
            END as handler_location,
            1 as checkin_status, -- All checked in
            NOW() - INTERVAL '1 day' as created_at
        FROM generate_series(1, 200)
        WHERE generate_series <= (200 - entry_count); -- Only create what we need
    END IF;
END $$;

-- Generate realistic Day 1 scores
-- Container and Buried elements
INSERT INTO nationals_scores (
    entry_id, armband, element_type, day, points, time_seconds, 
    alerts_correct, alerts_incorrect, faults, finish_call_errors,
    excused, scored_at, mobile_app_lic_key
)
SELECT 
    eq.id as entry_id,
    eq.armband,
    element_type,
    1 as day,
    CASE 
        -- Simulate excused dogs (about 5%)
        WHEN random() < 0.05 THEN 0
        -- Simulate normal scoring distribution
        ELSE GREATEST(0, 
            (alerts_correct * 10) - 
            (alerts_incorrect * 5) - 
            (faults * 2) - 
            (finish_errors * 5)
        )
    END as points,
    CASE 
        WHEN random() < 0.05 THEN 120 -- Excused dogs get max time
        ELSE FLOOR(30 + random() * 90)::INTEGER -- 30-120 seconds
    END as time_seconds,
    alerts_correct,
    alerts_incorrect,
    faults,
    finish_errors,
    CASE WHEN random() < 0.05 THEN true ELSE false END as excused,
    NOW() - INTERVAL '1 day' + (random() * INTERVAL '8 hours') as scored_at,
    eq.mobile_app_lic_key
FROM tbl_entry_queue eq
CROSS JOIN (
    SELECT 'CONTAINER' as element_type
    UNION ALL
    SELECT 'BURIED' as element_type
) elements
CROSS JOIN (
    SELECT 
        CASE 
            WHEN random() < 0.3 THEN 2 -- 30% get 2 correct alerts
            WHEN random() < 0.7 THEN 1 -- 40% get 1 correct alert
            ELSE 0 -- 30% get 0 correct alerts
        END as alerts_correct,
        CASE
            WHEN random() < 0.8 THEN 0 -- 80% no incorrect alerts
            WHEN random() < 0.95 THEN 1 -- 15% one incorrect
            ELSE 2 -- 5% two incorrect
        END as alerts_incorrect,
        CASE
            WHEN random() < 0.7 THEN 0 -- 70% no faults
            WHEN random() < 0.9 THEN 1 -- 20% one fault
            ELSE 2 -- 10% two faults
        END as faults,
        CASE
            WHEN random() < 0.85 THEN 0 -- 85% no finish errors
            ELSE 1 -- 15% one finish error
        END as finish_errors
) scoring
WHERE eq.mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
LIMIT 400; -- 200 dogs × 2 elements

-- Generate realistic Day 2 scores  
-- Interior and Exterior elements
INSERT INTO nationals_scores (
    entry_id, armband, element_type, day, points, time_seconds,
    alerts_correct, alerts_incorrect, faults, finish_call_errors,
    excused, scored_at, mobile_app_lic_key
)
SELECT 
    eq.id as entry_id,
    eq.armband,
    element_type,
    2 as day,
    CASE 
        -- Simulate excused dogs (about 3% on day 2)
        WHEN random() < 0.03 THEN 0
        -- Simulate normal scoring distribution (slightly higher on day 2)
        ELSE GREATEST(0, 
            (alerts_correct * 10) - 
            (alerts_incorrect * 5) - 
            (faults * 2) - 
            (finish_errors * 5)
        )
    END as points,
    CASE 
        WHEN random() < 0.03 THEN 120 -- Excused dogs get max time
        ELSE FLOOR(25 + random() * 85)::INTEGER -- 25-110 seconds (faster on day 2)
    END as time_seconds,
    alerts_correct,
    alerts_incorrect,
    faults,
    finish_errors,
    CASE WHEN random() < 0.03 THEN true ELSE false END as excused,
    NOW() + (random() * INTERVAL '8 hours') as scored_at,
    eq.mobile_app_lic_key
FROM tbl_entry_queue eq
CROSS JOIN (
    SELECT 'INTERIOR' as element_type
    UNION ALL
    SELECT 'EXTERIOR' as element_type
) elements
CROSS JOIN (
    SELECT 
        CASE 
            WHEN random() < 0.4 THEN 2 -- 40% get 2 correct alerts (improved from day 1)
            WHEN random() < 0.8 THEN 1 -- 40% get 1 correct alert
            ELSE 0 -- 20% get 0 correct alerts
        END as alerts_correct,
        CASE
            WHEN random() < 0.85 THEN 0 -- 85% no incorrect alerts (improved)
            WHEN random() < 0.97 THEN 1 -- 12% one incorrect
            ELSE 2 -- 3% two incorrect
        END as alerts_incorrect,
        CASE
            WHEN random() < 0.75 THEN 0 -- 75% no faults (improved)
            WHEN random() < 0.92 THEN 1 -- 17% one fault
            ELSE 2 -- 8% two faults
        END as faults,
        CASE
            WHEN random() < 0.9 THEN 0 -- 90% no finish errors (improved)
            ELSE 1 -- 10% one finish error
        END as finish_errors
) scoring
WHERE eq.mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
LIMIT 400; -- 200 dogs × 2 elements

-- Add some Handler Discrimination Challenge scores for Day 2
-- (Not all dogs participate in HD Challenge)
INSERT INTO nationals_scores (
    entry_id, armband, element_type, day, points, time_seconds,
    alerts_correct, alerts_incorrect, faults, finish_call_errors,
    excused, scored_at, mobile_app_lic_key
)
SELECT 
    eq.id as entry_id,
    eq.armband,
    'HD_CHALLENGE' as element_type,
    2 as day,
    CASE 
        WHEN random() < 0.02 THEN 0 -- 2% excused
        WHEN random() < 0.6 THEN 10 -- 60% successful (10 points)
        ELSE 0 -- 38% unsuccessful (0 points)
    END as points,
    FLOOR(45 + random() * 75)::INTEGER as time_seconds, -- 45-120 seconds
    CASE WHEN random() < 0.6 THEN 1 ELSE 0 END as alerts_correct,
    CASE WHEN random() < 0.38 THEN 1 ELSE 0 END as alerts_incorrect,
    0 as faults, -- HD Challenge typically has no faults
    CASE WHEN random() < 0.1 THEN 1 ELSE 0 END as finish_errors,
    CASE WHEN random() < 0.02 THEN true ELSE false END as excused,
    NOW() + INTERVAL '4 hours' + (random() * INTERVAL '3 hours') as scored_at,
    eq.mobile_app_lic_key
FROM tbl_entry_queue eq
WHERE eq.mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
AND random() < 0.75 -- Only 75% of dogs participate in HD Challenge
LIMIT 150; -- Approximately 150 dogs participate

-- Generate some preliminary Day 3 scores for the top qualifiers
-- (Finals - Combined elements for top 100)
WITH top_qualifiers AS (
    SELECT entry_id, armband 
    FROM nationals_rankings 
    WHERE qualified_for_finals = true 
    ORDER BY rank 
    LIMIT 100
)
INSERT INTO nationals_scores (
    entry_id, armband, element_type, day, points, time_seconds,
    alerts_correct, alerts_incorrect, faults, finish_call_errors,
    excused, scored_at, mobile_app_lic_key
)
SELECT 
    tq.entry_id,
    tq.armband,
    'CONTAINER' as element_type, -- Finals start with container
    3 as day,
    CASE 
        WHEN random() < 0.01 THEN 0 -- 1% excused in finals
        ELSE GREATEST(0, 
            (alerts_correct * 10) - 
            (alerts_incorrect * 5) - 
            (faults * 2) - 
            (finish_errors * 5)
        )
    END as points,
    CASE 
        WHEN random() < 0.01 THEN 120 
        ELSE FLOOR(20 + random() * 70)::INTEGER -- Faster times in finals
    END as time_seconds,
    alerts_correct,
    alerts_incorrect,
    faults,
    finish_errors,
    CASE WHEN random() < 0.01 THEN true ELSE false END as excused,
    NOW() + INTERVAL '1 day' + (random() * INTERVAL '2 hours') as scored_at,
    'myK9Q1-d8609f3b-d3fd43aa-6323a604'
FROM top_qualifiers tq
CROSS JOIN (
    SELECT 
        CASE 
            WHEN random() < 0.5 THEN 2 -- 50% get 2 correct alerts (high performance)
            WHEN random() < 0.85 THEN 1 -- 35% get 1 correct alert
            ELSE 0 -- 15% get 0 correct alerts
        END as alerts_correct,
        CASE
            WHEN random() < 0.9 THEN 0 -- 90% no incorrect alerts
            WHEN random() < 0.98 THEN 1 -- 8% one incorrect
            ELSE 2 -- 2% two incorrect
        END as alerts_incorrect,
        CASE
            WHEN random() < 0.8 THEN 0 -- 80% no faults
            WHEN random() < 0.95 THEN 1 -- 15% one fault
            ELSE 2 -- 5% two faults
        END as faults,
        CASE
            WHEN random() < 0.95 THEN 0 -- 95% no finish errors
            ELSE 1 -- 5% one finish error
        END as finish_errors
) scoring
WHERE random() < 0.3; -- Only 30% have started Day 3 (ongoing competition)

-- Update the advancement table with qualification data
INSERT INTO nationals_advancement (
    entry_id, armband, preliminary_points, preliminary_time_seconds,
    preliminary_rank, qualified_for_finals, qualification_date,
    mobile_app_lic_key
)
SELECT 
    nr.entry_id,
    nr.armband,
    nr.day1_points + nr.day2_points as preliminary_points,
    nr.day1_time_seconds + nr.day2_time_seconds as preliminary_time_seconds,
    nr.rank as preliminary_rank,
    nr.qualified_for_finals,
    CASE WHEN nr.qualified_for_finals THEN NOW() - INTERVAL '12 hours' ELSE NULL END,
    nr.mobile_app_lic_key
FROM nationals_rankings nr
WHERE nr.mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604';

-- Force recalculation of all rankings
SELECT calculate_nationals_rankings();

-- Create some sample TV messages for the event
INSERT INTO tv_messages (trial_id, message_type, message_text, priority, active, mobile_app_lic_key) VALUES
(1, 'announcement', '🏆 Welcome to the INAUGURAL AKC Scent Work Master National Championship!', 10, true, 'myK9Q1-d8609f3b-d3fd43aa-6323a604'),
(1, 'info', '📋 Day 3 Finals: Top 100 qualifiers compete for the National Championship', 8, true, 'myK9Q1-d8609f3b-d3fd43aa-6323a604'),
(1, 'info', '⏰ Handler Discrimination Challenge results included in Day 2 totals', 6, true, 'myK9Q1-d8609f3b-d3fd43aa-6323a604'),
(1, 'achievement', '🎯 Current Leader: Check the Championship Chase panel for live updates', 7, true, 'myK9Q1-d8609f3b-d3fd43aa-6323a604'),
(1, 'info', '📱 Live scoring available via myK9Q judge interface', 4, true, 'myK9Q1-d8609f3b-d3fd43aa-6323a604');

COMMIT;

-- Verification and summary
SELECT 
    'Seed data creation completed!' as status,
    COUNT(*) as total_scores,
    COUNT(DISTINCT entry_id) as unique_dogs,
    COUNT(DISTINCT element_type) as elements_scored,
    MIN(day) as earliest_day,
    MAX(day) as latest_day
FROM nationals_scores 
WHERE mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604';

SELECT 
    'Rankings summary:' as status,
    COUNT(*) as total_rankings,
    COUNT(*) FILTER (WHERE qualified_for_finals = true) as qualifiers,
    MIN(rank) as best_rank,
    MAX(rank) as worst_rank,
    AVG(total_points) as avg_total_points
FROM nationals_rankings 
WHERE mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604';

-- Show top 10 current leaders
SELECT 
    rank,
    armband,
    total_points,
    total_time_seconds,
    qualified_for_finals,
    CASE 
        WHEN container_completed AND buried_completed AND interior_completed AND exterior_completed THEN 'Complete'
        ELSE 'In Progress'
    END as status
FROM nationals_rankings 
WHERE mobile_app_lic_key = 'myK9Q1-d8609f3b-d3fd43aa-6323a604'
ORDER BY rank ASC 
LIMIT 10;