import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const CANONICAL_ANDROID_REDIRECT = 'com.focustrack.app://auth/callback';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Check local storage demo auth
      const savedDemo = localStorage.getItem('focustrack_demo_user');
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Register Capacitor Native Deep-Link URL Listener for Android OAuth return
    let appUrlListener: any = null;
    if (Capacitor.isNativePlatform()) {
      appUrlListener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        if (url && (url.includes('com.focustrack.app') || url.includes('auth/callback'))) {
          try {
            // Parse URL parameters for PKCE code or access tokens
            const parsedUrl = new URL(url.replace('#', '?'));
            const code = parsedUrl.searchParams.get('code');

            if (code) {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (data?.session) {
                setSession(data.session);
                setUser(data.session.user);
              } else if (error) {
                console.error('[OAuth DeepLink] Code exchange error:', error.message);
              }
            } else {
              // Refresh session state directly from Supabase client
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession) {
                setSession(currentSession);
                setUser(currentSession.user);
              }
            }
          } catch (err) {
            console.error('[OAuth DeepLink] Failed to parse callback URL:', err);
          } finally {
            setLoading(false);
          }
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (appUrlListener && typeof appUrlListener.remove === 'function') {
        appUrlListener.remove();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      demoLogin();
      return;
    }

    // Platform-aware redirect: Native Android uses deep link scheme, Web uses window origin
    const redirectUrl = Capacitor.isNativePlatform()
      ? CANONICAL_ANDROID_REDIRECT
      : `${window.location.origin}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('Google Sign-In Error:', error.message);
      if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
        throw new Error('Google Provider is not enabled in your Supabase Dashboard yet. Please enable Google Auth in Supabase Dashboard > Authentication > Providers > Google.');
      }
      throw error;
    }
  };


  const demoLogin = () => {
    const mockUser: Partial<User> = {
      id: 'demo-google-user-123',
      email: 'alex.focus@gmail.com',
      user_metadata: {
        full_name: 'Alex Vance',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
      }
    };
    localStorage.setItem('focustrack_demo_user', JSON.stringify(mockUser));
    setUser(mockUser as User);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('focustrack_demo_user');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
