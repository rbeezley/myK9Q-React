-- Add Device Fingerprint to Rate Limiting
-- Migration: 20260110_add_device_fingerprint_rate_limiting
-- Created: 2026-01-10
--
-- Purpose: Track login attempts by IP + device fingerprint instead of just IP.
-- This prevents one user's failed attempts from blocking other users at the
-- same venue who share the same public IP address.
--
-- Device fingerprint is a hash of: user_agent + accept_language + screen info
-- This differentiates devices even on the same network.

BEGIN;

-- Add device_fingerprint column to login_attempts
ALTER TABLE login_attempts
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Create index for efficient lookups by IP + fingerprint
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_fingerprint_recent
    ON login_attempts (ip_address, device_fingerprint, attempted_at DESC);

-- Update the rate limit check function to use device fingerprint
CREATE OR REPLACE FUNCTION check_login_rate_limit(
    p_ip_address TEXT,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 15,
    p_block_minutes INTEGER DEFAULT 15
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

    -- If device fingerprint provided, check by IP + fingerprint (per-device limiting)
    -- Otherwise fall back to IP-only (backwards compatible)
    IF p_device_fingerprint IS NOT NULL AND p_device_fingerprint != '' THEN
        SELECT COUNT(*), MAX(attempted_at)
        INTO v_recent_failures, v_last_failure
        FROM login_attempts
        WHERE ip_address = p_ip_address
          AND device_fingerprint = p_device_fingerprint
          AND attempted_at > v_window_start
          AND success = FALSE;
    ELSE
        SELECT COUNT(*), MAX(attempted_at)
        INTO v_recent_failures, v_last_failure
        FROM login_attempts
        WHERE ip_address = p_ip_address
          AND attempted_at > v_window_start
          AND success = FALSE;
    END IF;

    -- Check if currently blocked
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

-- Update record_login_attempt to accept device fingerprint
CREATE OR REPLACE FUNCTION record_login_attempt(
    p_ip_address TEXT,
    p_success BOOLEAN,
    p_passcode_prefix CHAR(1) DEFAULT NULL,
    p_license_key TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attempt_id UUID;
BEGIN
    INSERT INTO login_attempts (ip_address, success, passcode_prefix, license_key, user_agent, device_fingerprint)
    VALUES (p_ip_address, p_success, p_passcode_prefix, p_license_key, p_user_agent, p_device_fingerprint)
    RETURNING id INTO v_attempt_id;

    RETURN v_attempt_id;
END;
$$;

-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS admin_get_rate_limit_status(INTEGER);

-- Update admin_get_rate_limit_status to show fingerprint info
CREATE OR REPLACE FUNCTION admin_get_rate_limit_status(p_hours_back INTEGER DEFAULT 2)
RETURNS TABLE (
    ip_address TEXT,
    failed_attempts BIGINT,
    last_attempt TIMESTAMPTZ,
    is_blocked BOOLEAN,
    blocked_until TIMESTAMPTZ,
    unique_devices BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cutoff TIMESTAMPTZ;
BEGIN
    v_cutoff := NOW() - (p_hours_back || ' hours')::INTERVAL;

    RETURN QUERY
    SELECT
        la.ip_address,
        COUNT(*) as failed_attempts,
        MAX(la.attempted_at) as last_attempt,
        -- An IP is blocked if ANY device on it has 10+ failures in 15 min
        -- But with fingerprinting, we show aggregated stats
        (COUNT(*) >= 10 AND MAX(la.attempted_at) > NOW() - INTERVAL '15 minutes') as is_blocked,
        CASE
            WHEN COUNT(*) >= 10 AND MAX(la.attempted_at) > NOW() - INTERVAL '15 minutes'
            THEN MAX(la.attempted_at) + INTERVAL '15 minutes'
            ELSE NULL
        END as blocked_until,
        COUNT(DISTINCT la.device_fingerprint) as unique_devices
    FROM login_attempts la
    WHERE la.attempted_at > v_cutoff
      AND la.success = FALSE
    GROUP BY la.ip_address
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC, MAX(la.attempted_at) DESC;
END;
$$;

-- Update admin_clear_rate_limits to handle fingerprints
CREATE OR REPLACE FUNCTION admin_clear_rate_limits(
    p_ip_address TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
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

    IF p_ip_address IS NOT NULL AND p_device_fingerprint IS NOT NULL THEN
        -- Clear for specific IP + device
        DELETE FROM login_attempts
        WHERE ip_address = p_ip_address
          AND device_fingerprint = p_device_fingerprint
          AND attempted_at > v_cutoff
          AND success = FALSE;
    ELSIF p_ip_address IS NOT NULL THEN
        -- Clear for specific IP (all devices)
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
            WHEN p_ip_address IS NOT NULL AND p_device_fingerprint IS NOT NULL THEN
                'Cleared ' || v_deleted || ' failed attempts for device'
            WHEN p_ip_address IS NOT NULL THEN
                'Cleared ' || v_deleted || ' failed attempts for IP ' || p_ip_address
            ELSE
                'Cleared ' || v_deleted || ' failed attempts for all IPs'
        END;
END;
$$;

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DEVICE FINGERPRINT RATE LIMITING MIGRATION COMPLETE ===';
    RAISE NOTICE 'Added: device_fingerprint column to login_attempts';
    RAISE NOTICE 'Updated: check_login_rate_limit() to use IP + fingerprint';
    RAISE NOTICE 'Updated: record_login_attempt() to store fingerprint';
    RAISE NOTICE 'Updated: admin_get_rate_limit_status() to show device count';
    RAISE NOTICE '';
    RAISE NOTICE 'Rate limiting is now per-device instead of per-IP:';
    RAISE NOTICE '  - User A fails 10 times → only User A device is blocked';
    RAISE NOTICE '  - User B on different device can still login (same IP)';
    RAISE NOTICE '';
END $$;

SELECT 'Device fingerprint rate limiting migration applied successfully' as status;
