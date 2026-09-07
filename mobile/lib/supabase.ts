import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseMobileConfigured = (): boolean => {
  return (
    !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function createSessionFromUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return false;
  try {
    const hashOrQuery = url.includes('#')
      ? url.split('#')[1]
      : url.includes('?')
      ? url.split('?')[1]
      : '';
    if (!hashOrQuery) return false;

    const params = new URLSearchParams(hashOrQuery);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.error('[Supabase setSession Error]:', error.message);
        return false;
      }
      return true;
    }

    const code = params.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[Supabase exchangeCodeForSession Error]:', error.message);
        return false;
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error('[createSessionFromUrl Exception]:', err);
    return false;
  }
}
