import { supabase } from './supabaseClient';

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function syncUserTimeZone(userId: string): Promise<string> {
  const timeZone = getBrowserTimeZone();
  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();

  if (readError) throw readError;

  if (profile?.timezone !== timeZone) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ timezone: timeZone, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateError) throw updateError;
  }

  return timeZone;
}
