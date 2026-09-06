-- FocusTrack Phase M4
-- Enforce the today-only habit completion rule using each user's IANA timezone.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

CREATE OR REPLACE FUNCTION public.get_user_timezone(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.timezone
      FROM public.profiles AS p
      WHERE p.id = p_user_id
        AND p.timezone IS NOT NULL
        AND p.timezone <> ''
        AND EXISTS (
          SELECT 1
          FROM pg_timezone_names AS tz
          WHERE tz.name = p.timezone
        )
    ),
    'UTC'
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_timezone(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_timezone(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_local_today(p_user_id UUID)
RETURNS DATE
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (CURRENT_TIMESTAMP AT TIME ZONE public.get_user_timezone(p_user_id))::date;
$$;

REVOKE ALL ON FUNCTION public.user_local_today(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_local_today(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_today_only_habit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  local_today DATE;
  row_user_id UUID;
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
      RAISE EXCEPTION
        'Habit logs can only be created for today''s date (%) in your timezone.',
        local_today;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id <> auth.uid() OR NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'You can only modify your own habit logs.';
    END IF;

    IF OLD.completed_date <> local_today OR NEW.completed_date <> local_today THEN
      RAISE EXCEPTION
        'Habit logs can only be modified for today''s date (%) in your timezone.',
        local_today;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'You can only remove your own habit logs.';
    END IF;

    IF OLD.completed_date <> local_today THEN
      RAISE EXCEPTION
        'Habit logs can only be removed for today''s date (%) in your timezone.',
        local_today;
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

-- Keep the schema snapshot aligned with the migration for fresh installs.
