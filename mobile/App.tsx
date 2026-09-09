import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './theme';

import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './navigation/RootNavigator';

const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'com.focustrack.app://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Analytics: 'analytics',
          Dashboard: 'dashboard',
          Habits: 'habits',
          Calendar: 'calendar',
          Settings: 'settings',
        },
      } as any,
      Archive: 'archive',
      HabitDetail: 'habit/:habitId',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <NavigationContainer
        linking={linking}
        theme={{
          dark: true,
          colors: {
            primary: colors.textPrimary,
            background: colors.background,
            card: colors.surface,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.accent,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
          },
        }}
      >
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
