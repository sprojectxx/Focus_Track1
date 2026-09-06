import { supabase } from './supabase';
import { getDeviceTimeZone } from '../utils/date';

/**
 * Keep the user's stored IANA timezone aligned with the device timezone.
 * The database validates the value against pg_timezone_names and falls back
 * to UTC when a stored value is invalid or missing.
 */
export async function syncUserTimeZone(userId: string): Promise<string> {
  const deviceTimeZone = getDeviceTimeZone();

  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();

  if (readError) throw readError;

  if (profile?.timezone !== deviceTimeZone) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ timezone: deviceTimeZone, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;
  }

  return deviceTimeZone;
}
