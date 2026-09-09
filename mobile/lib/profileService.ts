import { supabase } from './supabase';
import { getDeviceTimeZone } from '../utils/date';

export interface UserProfileData {
  name: string;
  title?: string;
  creed?: string;
  avatarUrl?: string;
  timezone?: string;
}

/**
 * Fetch existing profile data from Supabase.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, title, creed, avatar_url, timezone')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    name: data.name || '',
    title: data.title || 'OPERATOR',
    creed: data.creed || 'Ex Duris Gloria — From suffering comes glory',
    avatarUrl: data.avatar_url || '',
    timezone: data.timezone || 'UTC',
  };
}

/**
 * Update user profile in Supabase (name, title, creed, avatarUrl).
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfileData>): Promise<void> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (profileData.name !== undefined) payload.name = profileData.name;
  if (profileData.title !== undefined) payload.title = profileData.title;
  if (profileData.creed !== undefined) payload.creed = profileData.creed;
  if (profileData.avatarUrl !== undefined) payload.avatar_url = profileData.avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

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
