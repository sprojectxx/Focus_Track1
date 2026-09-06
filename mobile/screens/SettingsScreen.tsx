import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSignOut }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[SignOut Error]:', error.message);
        setSignOutError(error.message || 'Failed to sign out. Please try again.');
      } else {
        onSignOut?.();
      }
    } catch (err: any) {
      console.error('[SignOut Exception]:', err);
      setSignOutError('Network error while signing out.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>SETTINGS</Text>
          <Text style={typography.caption}>SYSTEM PREFERENCES & ACCOUNT</Text>
        </View>

        {/* User Identity Section */}
        <View style={styles.section}>
          <Text style={typography.h3}>Authenticated Account</Text>
          <Text style={[typography.bodySecondary, styles.sectionText]}>
            User Email: {userEmail || 'Loading user info...'}
          </Text>
          <Text style={[typography.bodySecondary, styles.sectionText]}>
            Package ID: com.focustrack.app
          </Text>
          <Text style={[typography.bodySecondary, styles.sectionText]}>
            Framework: React Native + Expo (M2 Auth Active)
          </Text>
        </View>

        {/* Error Feedback */}
        {signOutError ? (
          <View style={styles.errorContainer}>
            <Text style={[typography.caption, styles.errorText]}>{signOutError}</Text>
          </View>
        ) : null}

        {/* Sign Out Action */}
        <View style={styles.section}>
          <Button
            title={signingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
            onPress={handleSignOut}
            variant="danger"
            disabled={signingOut}
          />
          {signingOut ? (
            <ActivityIndicator style={styles.loader} size="small" color={colors.dangerText} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionText: {
    marginTop: spacing.xs,
  },
  errorContainer: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerText,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.textPrimary,
  },
  loader: {
    marginTop: spacing.sm,
  },
});
