-- FocusTrack Phase M8.12
-- Fix cascade deletion of habit_logs when a parent habit is deleted.

CREATE OR REPLACE FUNCTION public.mark_habit_deletion_in_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_ids TEXT;
BEGIN
  current_ids := current_setting('focustrack.deleting_habit_ids', true);
  IF current_ids IS NULL OR current_ids = '' THEN
    PERFORM set_config('focustrack.deleting_habit_ids', OLD.id::text, true);
  ELSE
    PERFORM set_config('focustrack.deleting_habit_ids', current_ids || ',' || OLD.id::text, true);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS habit_deletion_cascade_flag ON public.habits;
CREATE TRIGGER habit_deletion_cascade_flag
  BEFORE DELETE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_habit_deletion_in_progress();

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

    -- If parent habit deletion is in progress (cascade deletion), allow log cleanup.
    -- Otherwise, enforce today-only removal for direct habit log mutations.
    deleting_ids := string_to_array(COALESCE(current_setting('focustrack.deleting_habit_ids', true), ''), ',');
    IF NOT (OLD.habit_id::text = ANY(deleting_ids)) THEN
      IF OLD.completed_date <> local_today THEN
        RAISE EXCEPTION
          'Habit logs can only be removed for today''s date (%) in your timezone.',
          local_today;
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;
