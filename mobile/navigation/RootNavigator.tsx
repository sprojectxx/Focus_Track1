import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { LoginScreen } from '../screens/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Archive: undefined;
  HabitDetail: { habitId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  // Placeholder auth state for M1. M2 will connect real Supabase Auth.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

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
      {!isAuthenticated ? (
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {() => <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
            {({ navigation }) => (
              <TabNavigator
                onNavigateToArchive={() => navigation.navigate('Archive')}
                onNavigateToDetail={(id) => navigation.navigate('HabitDetail', { habitId: id })}
                onSignOut={() => setIsAuthenticated(false)}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Archive"
            component={ArchiveScreen}
            options={{ title: 'ARCHIVED PROTOCOLS' }}
          />
          <Stack.Screen
            name="HabitDetail"
            options={{ title: 'HABIT PROTOCOL' }}
          >
            {({ route }) => <HabitDetailScreen habitId={route.params?.habitId} />}
          </Stack.Screen>
        </>
      )}
    </Stack.Navigator>
  );
};
