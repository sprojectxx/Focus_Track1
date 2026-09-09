import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { TextInputField } from '../components/TextInputField';
import { getDeviceTimeZone } from '../utils/date';
import { fetchUserProfile, updateUserProfile, UserProfileData } from '../lib/profileService';
import appJson from '../app.json';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSignOut }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string>('Unavailable');

  // Profile editable state
  const [name, setName] = useState<string>('');
  const [title, setTitle] = useState<string>('OPERATOR');
  const [creed, setCreed] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tz = getDeviceTimeZone();
      setTimeZone(tz || 'Unavailable');
    } catch {
      setTimeZone('Unavailable');
    }

    supabase.auth
      .getUser()
      .then(async ({ data: { user }, error }) => {
        if (error || !user) {
          setUserEmail('Unavailable');
          setUserId(null);
          setLoadingProfile(false);
          return;
        }
        setUserEmail(user.email || 'Unavailable');
        setUserId(user.id || null);

        // Fetch user profile from Supabase
        try {
          const profile = await fetchUserProfile(user.id);
          if (profile) {
            setName(profile.name || '');
            setTitle(profile.title || 'OPERATOR');
            setCreed(profile.creed || '');
            setAvatarUrl(profile.avatarUrl || '');
          }
        } catch (err: any) {
          console.warn('[SettingsScreen] Failed to load user profile:', err);
        } finally {
          setLoadingProfile(false);
        }
      })
      .catch((err) => {
        console.warn('[SettingsScreen] Failed to retrieve user identity:', err);
        setUserEmail('Unavailable');
        setUserId(null);
        setLoadingProfile(false);
      });
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    setProfileError(null);
    setSaveSuccess(false);

    try {
      await updateUserProfile(userId, {
        name: name.trim(),
        title: title.trim(),
        creed: creed.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('[SettingsScreen] Save profile error:', err);
      setProfileError(err?.message || 'Failed to save profile credentials to database.');
    } finally {
      setSavingProfile(false);
    }
  };

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

  const appVersion = appJson?.expo?.version || '1.0.0';
  const packageName = appJson?.expo?.android?.package || 'com.focustrack.app';
  const appName = appJson?.expo?.name || 'FocusTrack';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.h1}>SETTINGS</Text>
          <Text style={typography.caption}>SYSTEM PREFERENCES & ACCOUNT</Text>
        </View>

        {/* Profile Credentials Section */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>IDENTITY CREDENTIALS</Text>
          {loadingProfile ? (
            <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginVertical: spacing.md }} />
          ) : (
            <>
              {avatarUrl ? (
                <View style={styles.avatarPreviewRow}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  <Text style={typography.caption}>AVATAR PREVIEW</Text>
                </View>
              ) : null}

              <TextInputField
                label="Designation / Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Operator Name"
              />

              <TextInputField
                label="Title / Rank"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. OPERATOR"
              />

              <TextInputField
                label="Operational Creed / Philosophy"
                value={creed}
                onChangeText={setCreed}
                placeholder="e.g. Ex Duris Gloria — From suffering comes glory"
              />

              <TextInputField
                label="Avatar Image URL"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://..."
              />

              {profileError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.dangerText} />
                  <Text style={[typography.caption, styles.errorText]}>{profileError}</Text>
                </View>
              ) : null}

              {saveSuccess ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.textPrimary} />
                  <Text style={styles.successText}>CHANGES SYNCED</Text>
                </View>
              ) : null}

              <Button
                title={savingProfile ? 'SAVING CREDENTIALS...' : 'SAVE CREDENTIALS'}
                onPress={handleSaveProfile}
                variant="primary"
                disabled={savingProfile}
                style={{ marginTop: spacing.sm }}
              />
            </>
          )}
        </View>

        {/* Active IANA Timezone Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={typography.h3}>TIMEZONE</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.timezoneDisplay}>{timeZone}</Text>
          <Text style={[typography.caption, styles.subtext]}>
            Used for today, streaks, calendar and reminders.
          </Text>
        </View>

        {/* Authenticated Account Section */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>AUTHENTICATED ACCOUNT</Text>
          <View style={styles.infoRow}>
            <Text style={typography.caption}>EMAIL</Text>
            <Text style={[typography.body, styles.valueText]} numberOfLines={1} ellipsizeMode="tail">
              {userEmail || 'Loading...'}
            </Text>
          </View>
          {userId ? (
            <View style={[styles.infoRow, styles.lastInfoRow]}>
              <Text style={typography.caption}>USER ID</Text>
              <Text style={[typography.caption, styles.monoText]} numberOfLines={1} ellipsizeMode="middle">
                {userId}
              </Text>
            </View>
          ) : null}
        </View>

        {/* System & Application Identity */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>SYSTEM IDENTITY & ABOUT</Text>
          <View style={styles.infoRow}>
            <Text style={typography.caption}>APPLICATION</Text>
            <Text style={[typography.body, styles.valueText]}>{appName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={typography.caption}>VERSION</Text>
            <Text style={[typography.body, styles.valueText]}>{appVersion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={typography.caption}>PACKAGE ID</Text>
            <Text style={[typography.body, styles.valueText]} numberOfLines={1} ellipsizeMode="middle">
              {packageName}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={typography.caption}>FRAMEWORK</Text>
            <Text style={[typography.body, styles.valueText]}>React Native + Expo</Text>
          </View>
        </View>

        {/* Error Feedback Banner */}
        {signOutError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.dangerText} />
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
    paddingBottom: spacing.xxl,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  timezoneDisplay: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  subtext: {
    color: colors.textMuted,
    fontSize: 11,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  valueText: {
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  monoText: {
    color: colors.textSecondary,
    fontSize: 11,
    maxWidth: '65%',
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.dangerText,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.textPrimary,
    flex: 1,
  },
  loader: {
    marginTop: spacing.sm,
  },
  avatarPreviewRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.border,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.textPrimary,
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.md,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  successText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
});

