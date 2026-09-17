-- FocusTrack Phase M19 — Final Security & Invariant Hardening Migration

-- 1. Add onboarding_completed column to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark existing users with habits as onboarded
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE EXISTS (
  SELECT 1 FROM public.habits WHERE habits.user_id = profiles.id
);

-- 2. Update handle_new_user trigger to include onboarding_completed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_creed TEXT;
BEGIN
  SELECT quote || ' — ' || COALESCE(translation, author) INTO random_creed
  FROM public.motivational_quotes ORDER BY random() LIMIT 1;
  IF random_creed IS NULL THEN
    random_creed := 'Ex Duris Gloria — From suffering comes glory';
  END IF;

  INSERT INTO public.profiles (id, name, avatar_url, creed, timezone, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    random_creed,
    'UTC',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Security Harden get_user_timezone & user_local_today SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_user_timezone(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tz TEXT;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot query timezone for another user account.';
  END IF;

  SELECT p.timezone INTO user_tz
  FROM public.profiles AS p
  WHERE p.id = p_user_id
    AND p.timezone IS NOT NULL
    AND p.timezone <> ''
    AND EXISTS (
      SELECT 1
      FROM pg_timezone_names AS tz
      WHERE tz.name = p.timezone
    );

  RETURN COALESCE(user_tz, 'UTC');
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_timezone(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_timezone(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_local_today(p_user_id UUID)
RETURNS DATE
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot query local date for another user account.';
  END IF;

  RETURN (CURRENT_TIMESTAMP AT TIME ZONE public.get_user_timezone(p_user_id))::date;
END;
$$;

REVOKE ALL ON FUNCTION public.user_local_today(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_local_today(UUID) TO authenticated;

-- 4. Authoritative Database-Level Habit Log Invariant Enforcement Trigger
CREATE OR REPLACE FUNCTION public.enforce_today_only_habit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  local_today DATE;
  row_user_id UUID;
  deleting_ids TEXT[];
  target_user_id UUID;
  target_schedule_days INT[];
  target_is_archived BOOLEAN;
  target_archived_at TIMESTAMPTZ;
  target_archived_intervals JSONB;
  ft_day_index INT;
  interval_record JSONB;
  arch_ymd TEXT;
  rest_ymd TEXT;
  date_str TEXT;
BEGIN
  row_user_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;

  IF row_user_id IS NULL THEN
    RAISE EXCEPTION 'Habit log user_id is required.';
  END IF;

  local_today := public.user_local_today(row_user_id);

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'You can only create habit logs for your own account.';
    END IF;

    IF NEW.completed_date <> local_today THEN
      RAISE EXCEPTION 'Habit logs can only be created for today''s date (%) in your timezone.', local_today;
    END IF;

    -- Fetch target habit properties
    SELECT user_id, schedule_days, is_archived, archived_at, archived_intervals
    INTO target_user_id, target_schedule_days, target_is_archived, target_archived_at, target_archived_intervals
    FROM public.habits
    WHERE id = NEW.habit_id;

    IF target_user_id IS NULL THEN
      RAISE EXCEPTION 'Habit % does not exist.', NEW.habit_id;
    END IF;

    IF target_user_id <> NEW.user_id THEN
      RAISE EXCEPTION 'Habit % does not belong to user %.', NEW.habit_id, NEW.user_id;
    END IF;

    -- Validate scheduled weekday (0=Mon, ..., 6=Sun)
    ft_day_index := (EXTRACT(DOW FROM NEW.completed_date)::integer + 6) % 7;
    IF target_schedule_days IS NOT NULL AND NOT (ft_day_index = ANY(target_schedule_days)) THEN
      RAISE EXCEPTION 'Habit % is not scheduled for execution on %.', NEW.habit_id, NEW.completed_date;
    END IF;

    -- Validate current archive state
    IF target_is_archived IS TRUE THEN
      IF target_archived_at IS NOT NULL AND (target_archived_at AT TIME ZONE public.get_user_timezone(NEW.user_id))::date <= NEW.completed_date THEN
        RAISE EXCEPTION 'Habit % is archived and cannot be completed on %.', NEW.habit_id, NEW.completed_date;
      END IF;
    END IF;

    -- Validate historical archive intervals
    date_str := NEW.completed_date::text;
    IF target_archived_intervals IS NOT NULL AND jsonb_array_length(target_archived_intervals) > 0 THEN
      FOR interval_record IN SELECT * FROM jsonb_array_elements(target_archived_intervals)
      LOOP
        arch_ymd := interval_record->>'archivedAt';
        rest_ymd := interval_record->>'restoredAt';
        IF arch_ymd IS NOT NULL AND rest_ymd IS NOT NULL AND date_str >= arch_ymd AND date_str < rest_ymd THEN
          RAISE EXCEPTION 'Habit % was archived on date %.', NEW.habit_id, NEW.completed_date;
        END IF;
      END LOOP;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id <> auth.uid() OR NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'You can only modify your own habit logs.';
    END IF;

    IF OLD.user_id <> NEW.user_id THEN
      RAISE EXCEPTION 'Cannot change habit log user_id.';
    END IF;

    IF OLD.habit_id <> NEW.habit_id THEN
      RAISE EXCEPTION 'Cannot change habit log habit_id.';
    END IF;

    IF OLD.completed_date <> local_today OR NEW.completed_date <> local_today THEN
      RAISE EXCEPTION 'Habit logs can only be modified for today''s date (%) in your timezone.', local_today;
    END IF;

    -- Fetch target habit properties
    SELECT user_id, schedule_days, is_archived, archived_at, archived_intervals
    INTO target_user_id, target_schedule_days, target_is_archived, target_archived_at, target_archived_intervals
    FROM public.habits
    WHERE id = NEW.habit_id;

    IF target_user_id IS NULL THEN
      RAISE EXCEPTION 'Habit % does not exist.', NEW.habit_id;
    END IF;

    IF target_user_id <> NEW.user_id THEN
      RAISE EXCEPTION 'Habit % does not belong to user %.', NEW.habit_id, NEW.user_id;
    END IF;

    -- Validate scheduled weekday (0=Mon, ..., 6=Sun)
    ft_day_index := (EXTRACT(DOW FROM NEW.completed_date)::integer + 6) % 7;
    IF target_schedule_days IS NOT NULL AND NOT (ft_day_index = ANY(target_schedule_days)) THEN
      RAISE EXCEPTION 'Habit % is not scheduled for execution on %.', NEW.habit_id, NEW.completed_date;
    END IF;

    -- Validate current archive state
    IF target_is_archived IS TRUE THEN
      IF target_archived_at IS NOT NULL AND (target_archived_at AT TIME ZONE public.get_user_timezone(NEW.user_id))::date <= NEW.completed_date THEN
        RAISE EXCEPTION 'Habit % is archived and cannot be completed on %.', NEW.habit_id, NEW.completed_date;
      END IF;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'You can only remove your own habit logs.';
    END IF;

    -- Allow cleanup if parent habit deletion cascade is active or parent habit no longer exists
    deleting_ids := string_to_array(COALESCE(current_setting('focustrack.deleting_habit_ids', true), ''), ',');
    IF (OLD.habit_id::text = ANY(deleting_ids)) OR NOT EXISTS (SELECT 1 FROM public.habits WHERE id = OLD.habit_id) THEN
      RETURN OLD;
    END IF;

    IF OLD.completed_date <> local_today THEN
      RAISE EXCEPTION 'Habit logs can only be removed for today''s date (%) in your timezone.', local_today;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS enforce_habit_logs_today_only ON public.habit_logs;
CREATE TRIGGER enforce_habit_logs_today_only
  BEFORE INSERT OR UPDATE OR DELETE ON public.habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_today_only_habit_log();
