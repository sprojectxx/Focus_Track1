import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase, createSessionFromUrl } from '../lib/supabase';
import { colors } from '../theme';
import { LoadingState } from '../components/LoadingState';
import { LoginScreen } from '../screens/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';
import { HabitProvider } from '../context/HabitContext';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Archive: undefined;
  HabitDetail: { habitId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Check current session on startup
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        setLoading(false);
      }
    });

    // 2. Subscribe to Auth State changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setLoading(false);
      }
    });

    // 3. Handle deep links for OAuth callbacks
    const handleUrl = (event: { url: string }) => {
      if (event.url && event.url.includes('auth/callback')) {
        createSessionFromUrl(event.url);
      }
    };

    const linkSub = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('auth/callback')) {
        createSessionFromUrl(url);
      }
    });

    // 4. Cleanup listeners on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  if (loading) {
    return <LoadingState message="Initializing FocusTrack session..." />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 14,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {!session ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <HabitProvider>
          <Stack.Group>
            <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
              {({ navigation }) => (
                <TabNavigator
                  onNavigateToArchive={() => navigation.navigate('Archive')}
                  onNavigateToDetail={(id) => navigation.navigate('HabitDetail', { habitId: id })}
                  onSignOut={() => {
                    supabase.auth.signOut();
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Archive" options={{ title: 'ARCHIVED PROTOCOLS' }}>
              {() => <ArchiveScreen />}
            </Stack.Screen>
            <Stack.Screen name="HabitDetail" options={{ title: 'HABIT PROTOCOL' }}>
              {({ route }) => <HabitDetailScreen habitId={route.params?.habitId} />}
            </Stack.Screen>
          </Stack.Group>
        </HabitProvider>
      )}
    </Stack.Navigator>
  );
};
