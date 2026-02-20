-- =====================================================
-- Migration: Fix Combined A/B Class Notifications
-- =====================================================
-- Problem: notify_up_soon() only looks at entries within a single class_id.
-- When Novice A & B run combined (95% of the time), exhibitors get incorrect
-- "dogs ahead" counts because entries from the paired class are ignored.
--
-- Solution: Find the paired class (same trial_id + element + level, opposite
-- section A↔B) and include its entries when calculating who's next.
-- Also updates notification text and URL for combined classes.
--
-- Date: 2026-02-20
-- =====================================================

CREATE OR REPLACE FUNCTION notify_up_soon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_function_url TEXT;
  v_payload JSONB;
  v_anon_key TEXT;
  v_trigger_secret TEXT;
  v_license_key TEXT;
  v_class_name TEXT;
  v_dogs_ahead INTEGER;
  v_paired_class_id BIGINT;
  v_notification_url TEXT;
  scored_entry RECORD;
  next_entry RECORD;
  subscription RECORD;
BEGIN
  SELECT trigger_secret, anon_key INTO v_trigger_secret, v_anon_key
  FROM push_notification_config
  LIMIT 1;

  v_function_url := 'https://yyzgjyiqgmjzyhzkqdfx.supabase.co/functions/v1/send-push-notification';

  -- Get info about the entry that was just scored
  SELECT
    e.id,
    e.armband_number,
    e.class_id,
    s.license_key,
    c.element,
    c.level,
    c.section,
    COALESCE(NULLIF(e.exhibitor_order, 0), e.armband_number) AS effective_run_order
  INTO scored_entry
  FROM entries e
    JOIN classes c ON e.class_id = c.id
    JOIN trials t ON c.trial_id = t.id
    JOIN shows s ON t.show_id = s.id
  WHERE e.id = NEW.id;

  v_license_key := scored_entry.license_key;

  -- Find paired class (same trial, element, level; opposite section A↔B)
  v_paired_class_id := NULL;
  IF scored_entry.section IN ('A', 'B') THEN
    SELECT c2.id INTO v_paired_class_id
    FROM classes c
    JOIN classes c2 ON c2.trial_id = c.trial_id
      AND c2.element = c.element
      AND c2.level = c.level
      AND c2.section != c.section
      AND c2.section IN ('A', 'B')
    WHERE c.id = scored_entry.class_id;
  END IF;

  -- Build class name and URL based on whether classes are combined
  IF v_paired_class_id IS NOT NULL THEN
    v_class_name := scored_entry.element || ' ' || scored_entry.level || ' A & B';
    -- Use combined entry list route with both class IDs (A first, B second)
    IF scored_entry.section = 'A' THEN
      v_notification_url := '/class/' || scored_entry.class_id || '/' || v_paired_class_id || '/entries/combined';
    ELSE
      v_notification_url := '/class/' || v_paired_class_id || '/' || scored_entry.class_id || '/entries/combined';
    END IF;
  ELSE
    v_class_name := scored_entry.element || ' ' || scored_entry.level;
    v_notification_url := '/class/' || scored_entry.class_id || '/entries';
  END IF;

  v_dogs_ahead := 0;

  -- Find next unscored entries in run order (spanning both classes if combined)
  FOR next_entry IN
    SELECT
      e.id,
      e.armband_number,
      e.dog_call_name,
      e.handler_name,
      e.class_id,
      COALESCE(NULLIF(e.exhibitor_order, 0), e.armband_number) AS effective_run_order
    FROM entries e
    WHERE
        (e.class_id = scored_entry.class_id
         OR e.class_id = COALESCE(v_paired_class_id, -1))
        AND e.id != scored_entry.id
        AND (e.is_scored IS NULL OR e.is_scored = false)
        AND COALESCE(NULLIF(e.exhibitor_order, 0), e.armband_number) > scored_entry.effective_run_order
      ORDER BY COALESCE(NULLIF(e.exhibitor_order, 0), e.armband_number) ASC
      LIMIT 5
  LOOP
    v_dogs_ahead := v_dogs_ahead + 1;

    -- Find subscriptions for exhibitors with this dog as a favorite
    FOR subscription IN
      SELECT
        ps.endpoint,
        ps.p256dh,
        ps.auth,
        ps.notification_preferences,
        COALESCE((ps.notification_preferences->>'dogs_ahead')::INTEGER, 3) AS user_dogs_ahead
      FROM push_subscriptions ps
      WHERE
        ps.license_key = v_license_key
        AND ps.is_active = true
        AND ps.notification_preferences->>'up_soon' = 'true'
        AND ps.notification_preferences->'favorite_armbands' @> to_jsonb(next_entry.armband_number)
        AND v_dogs_ahead <= COALESCE((ps.notification_preferences->>'dogs_ahead')::INTEGER, 3)
    LOOP
      v_payload := jsonb_build_object(
        'type', 'up_soon',
        'license_key', v_license_key,
        'title', 'You''re Up Soon!',
        'body', next_entry.dog_call_name || ' (#' || next_entry.armband_number || ') is ' || v_dogs_ahead || ' dogs away in ' || v_class_name,
        'url', v_notification_url,
        'armband_number', next_entry.armband_number,
        'dog_name', next_entry.dog_call_name,
        'handler', next_entry.handler_name,
        'class_id', next_entry.class_id,
        'entry_id', next_entry.id
      );

      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key,
          'apikey', v_anon_key,
          'X-Trigger-Secret', v_trigger_secret
        ),
        body := v_payload,
        timeout_milliseconds := 5000
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send up_soon notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_up_soon IS 'Sends push notifications when dogs are coming up soon. Spans paired A/B classes for combined queue position.';
