-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================
-- 1. MOTIVATIONAL QUOTES TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS public.motivational_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), quote TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'ANONYMOUS', translation TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.motivational_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view motivational quotes" ON public.motivational_quotes FOR SELECT USING (true);
INSERT INTO public.motivational_quotes (quote, author, translation) VALUES
  ('EX DURIS GLORIA', 'LATIN PROVERB', 'From suffering comes glory'),
  ('DISCIPLINE IS BUILT ONE DAY AT A TIME.', 'FOCUSTRACK', 'Unwavering daily consistency'),
  ('WE ARE WHAT WE REPEATEDLY DO. EXCELLENCE IS NOT AN ACT, BUT A HABIT.', 'ARISTOTLE', 'Habitual mastery'),
  ('SUFFER THE PAIN OF DISCIPLINE OR SUFFER THE PAIN OF REGRET.', 'JIM ROHN', 'The daily choice'),
  ('HE WHO HAS A WHY TO LIVE CAN BEAR ALMOST ANY HOW.', 'FRIEDRICH NIETZSCHE', 'Purpose over comfort'),
  ('VICTORY BELONGS TO THE MOST PERSEVERING.', 'NAPOLEON BONAPARTE', 'Relentless execution'),
  ('NO MAN IS FREE WHO IS NOT MASTER OF HIMSELF.', 'EPICTETUS', 'Self-sovereignty')
ON CONFLICT DO NOTHING;

-- ===================================================
-- 2. PROFILES TABLE (Linked to auth.users)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, title TEXT DEFAULT 'OPERATOR', avatar_url TEXT,
  discipline_score INT DEFAULT 0,
  creed TEXT DEFAULT 'Ex Duris Gloria — From suffering comes glory',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ===================================================
-- 3. HABITS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Core Discipline', category_label TEXT,
  description TEXT, priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  icon TEXT DEFAULT 'target', custom_image TEXT, visual_type TEXT DEFAULT 'icon',
  schedule_days INT[] DEFAULT '{0,1,2,3,4,5,6}', schedule_type TEXT DEFAULT 'daily',
  reminder_enabled BOOLEAN DEFAULT FALSE, reminder_time TEXT DEFAULT '08:00', target_time TEXT,
  focus_minutes_per_session INT DEFAULT 30, is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ, archived_intervals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- ===================================================
-- 4. HABIT LOGS (HISTORY) TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, completed_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_habit_day UNIQUE (habit_id, completed_date)
);
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);

-- ===================================================
-- 5. USER FCM TOKENS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL, platform TEXT DEFAULT 'android', updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_token UNIQUE (user_id, token)
);
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own FCM tokens" ON public.user_fcm_tokens FOR ALL USING (auth.uid() = user_id);

-- ===================================================
-- 6. TRIGGER TO AUTOMATICALLY CREATE PROFILE
-- ===================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE random_creed TEXT;
BEGIN
  SELECT quote || ' — ' || COALESCE(translation, author) INTO random_creed
  FROM public.motivational_quotes ORDER BY random() LIMIT 1;
  IF random_creed IS NULL THEN random_creed := 'Ex Duris Gloria — From suffering comes glory'; END IF;
  INSERT INTO public.profiles (id, name, avatar_url, creed, timezone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), random_creed, 'UTC')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================
-- 7. TIMEZONE-AWARE TODAY-ONLY HABIT LOG ENFORCEMENT
-- ===================================================
CREATE OR REPLACE FUNCTION public.get_user_timezone(p_user_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.timezone FROM public.profiles AS p
    WHERE p.id = p_user_id AND p.timezone IS NOT NULL AND p.timezone <> ''
      AND EXISTS (SELECT 1 FROM pg_timezone_names AS tz WHERE tz.name = p.timezone)), 'UTC');
$$;
REVOKE ALL ON FUNCTION public.get_user_timezone(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_timezone(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_local_today(p_user_id UUID)
RETURNS DATE LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (CURRENT_TIMESTAMP AT TIME ZONE public.get_user_timezone(p_user_id))::date;
$$;
REVOKE ALL ON FUNCTION public.user_local_today(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_local_today(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_today_only_habit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE local_today DATE; row_user_id UUID;
BEGIN
  row_user_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  IF row_user_id IS NULL THEN RAISE EXCEPTION 'Habit log user_id is required.'; END IF;
  local_today := public.user_local_today(row_user_id);

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'You can only create habit logs for your own account.'; END IF;
    IF NEW.completed_date <> local_today THEN RAISE EXCEPTION 'Habit logs can only be created for today''s date (%) in your timezone.', local_today; END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id <> auth.uid() OR NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'You can only modify your own habit logs.'; END IF;
    IF OLD.completed_date <> local_today OR NEW.completed_date <> local_today THEN RAISE EXCEPTION 'Habit logs can only be modified for today''s date (%) in your timezone.', local_today; END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id <> auth.uid() THEN RAISE EXCEPTION 'You can only remove your own habit logs.'; END IF;
    IF OLD.completed_date <> local_today THEN RAISE EXCEPTION 'Habit logs can only be removed for today''s date (%) in your timezone.', local_today; END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS enforce_habit_logs_today_only ON public.habit_logs;
CREATE TRIGGER enforce_habit_logs_today_only BEFORE INSERT OR UPDATE OR DELETE ON public.habit_logs FOR EACH ROW EXECUTE FUNCTION public.enforce_today_only_habit_log();
