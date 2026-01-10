-- Update Rate Limit Thresholds
-- Migration: 20260110_update_rate_limit_thresholds
-- Created: 2026-01-10
--
-- Purpose: Make rate limiting more forgiving for shared IP environments
-- like dog show venues where many users share the same public IP.
--
-- Changes:
-- - Increase max attempts from 5 to 10
-- - Decrease block duration from 30 to 15 minutes
-- - Add function to clear rate limits for admin use

BEGIN;

-- Update the rate limit check function with new defaults
CREATE OR REPLACE FUNCTION check_login_rate_limit(
    p_ip_address TEXT,
    p_max_attempts INTEGER DEFAULT 10,  -- Changed from 5 to 10
    p_window_minutes INTEGER DEFAULT 15,
    p_block_minutes INTEGER DEFAULT 15  -- Changed from 30 to 15
)
RETURNS TABLE (
    allowed BOOLEAN,
    attempts_count INTEGER,
    remaining_attempts INTEGER,
    blocked_until TIMESTAMPTZ,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recent_failures INTEGER;
    v_last_failure TIMESTAMPTZ;
    v_window_start TIMESTAMPTZ;
    v_block_end TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    -- Count failed attempts in window
    SELECT COUNT(*), MAX(attempted_at)
    INTO v_recent_failures, v_last_failure
    FROM login_attempts
    WHERE ip_address = p_ip_address
      AND attempted_at > v_window_start
      AND success = FALSE;

    -- Check if currently blocked (10+ failures, block for 15 min from last failure)
    IF v_recent_failures >= p_max_attempts AND v_last_failure IS NOT NULL THEN
        v_block_end := v_last_failure + (p_block_minutes || ' minutes')::INTERVAL;

        IF NOW() < v_block_end THEN
            RETURN QUERY SELECT
                FALSE,
                v_recent_failures,
                0,
                v_block_end,
                'Too many failed attempts. Please try again in ' ||
                    CEIL(EXTRACT(EPOCH FROM (v_block_end - NOW())) / 60)::TEXT || ' minutes.';
            RETURN;
        END IF;
    END IF;

    -- Allow the attempt
    RETURN QUERY SELECT
        TRUE,
        v_recent_failures,
        GREATEST(0, p_max_attempts - v_recent_failures - 1),
        NULL::TIMESTAMPTZ,
        'Attempt allowed';
END;
$$;

-- Function to clear rate limits for a specific IP (admin use)
CREATE OR REPLACE FUNCTION admin_clear_rate_limits(
    p_ip_address TEXT DEFAULT NULL,
    p_hours_back INTEGER DEFAULT 2
)
RETURNS TABLE (
    deleted_count INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
    v_cutoff TIMESTAMPTZ;
BEGIN
    v_cutoff := NOW() - (p_hours_back || ' hours')::INTERVAL;

    IF p_ip_address IS NOT NULL THEN
        -- Clear for specific IP
        DELETE FROM login_attempts
        WHERE ip_address = p_ip_address
          AND attempted_at > v_cutoff
          AND success = FALSE;
    ELSE
        -- Clear all recent failed attempts
        DELETE FROM login_attempts
        WHERE attempted_at > v_cutoff
          AND success = FALSE;
    END IF;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN QUERY SELECT
        v_deleted,
        CASE
            WHEN p_ip_address IS NOT NULL THEN
                'Cleared ' || v_deleted || ' failed attempts for IP ' || p_ip_address
            ELSE
                'Cleared ' || v_deleted || ' failed attempts for all IPs'
        END;
END;
$$;

-- Function to get current rate limit status (for admin dashboard)
CREATE OR REPLACE FUNCTION admin_get_rate_limit_status(
    p_hours_back INTEGER DEFAULT 2
)
RETURNS TABLE (
    ip_address TEXT,
    failed_attempts BIGINT,
    last_attempt TIMESTAMPTZ,
    is_blocked BOOLEAN,
    blocked_until TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cutoff TIMESTAMPTZ;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_cutoff := NOW() - (p_hours_back || ' hours')::INTERVAL;
    v_window_start := NOW() - INTERVAL '15 minutes';

    RETURN QUERY
    SELECT
        la.ip_address,
        COUNT(*) as failed_attempts,
        MAX(la.attempted_at) as last_attempt,
        (COUNT(*) >= 10 AND MAX(la.attempted_at) > NOW() - INTERVAL '15 minutes') as is_blocked,
        CASE
            WHEN COUNT(*) >= 10 AND MAX(la.attempted_at) > NOW() - INTERVAL '15 minutes'
            THEN MAX(la.attempted_at) + INTERVAL '15 minutes'
            ELSE NULL
        END as blocked_until
    FROM login_attempts la
    WHERE la.attempted_at > v_cutoff
      AND la.success = FALSE
    GROUP BY la.ip_address
    HAVING COUNT(*) >= 3  -- Only show IPs with 3+ failures
    ORDER BY COUNT(*) DESC, MAX(la.attempted_at) DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_clear_rate_limits TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_rate_limit_status TO anon, authenticated;

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RATE LIMIT THRESHOLDS UPDATE COMPLETE ===';
    RAISE NOTICE 'Updated: check_login_rate_limit() defaults';
    RAISE NOTICE '  - Max attempts: 10 (was 5)';
    RAISE NOTICE '  - Block duration: 15 minutes (was 30)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created: admin_clear_rate_limits() function';
    RAISE NOTICE 'Created: admin_get_rate_limit_status() function';
    RAISE NOTICE '';
END $$;

SELECT 'Rate limit thresholds updated successfully' as status;
