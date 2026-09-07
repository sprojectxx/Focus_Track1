import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, createSessionFromUrl } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setAuthError(null);

    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'com.focustrack.app',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('[Supabase Google OAuth Error]:', error.message);
        setAuthError(error.message || 'Google sign-in could not be initiated.');
        setLoading(false);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          const sessionCreated = await createSessionFromUrl(result.url);
          if (!sessionCreated) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              setAuthError('Authentication completed but session activation failed. Please try again.');
            }
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          // User cancelled browser auth - clean return without scary error
        } else {
          setAuthError('Sign-in was interrupted. Please try again.');
        }
      } else {
        setAuthError('Unable to retrieve authentication URL. Please try again.');
      }
    } catch (err: any) {
      console.error('[Google Login Exception]:', err);
      setAuthError('An unexpected error occurred during Google sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={typography.h1}>FOCUSTRACK</Text>
          <Text style={[typography.bodySecondary, styles.subtitle]}>
            HIGH-PERFORMANCE HABIT & ROUTINE PROTOCOL
          </Text>
        </View>

        {/* OAuth Form Card */}
        <View style={styles.card}>
          <Text style={typography.h3}>ACCOUNT ACCESS</Text>
          <Text style={[typography.bodySecondary, styles.cardSubtitle]}>
            Sign in using your Google account to access your FocusTrack habit protocols.
          </Text>

          {/* General Error Banner */}
          {authError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.dangerText} />
              <Text style={[typography.caption, styles.errorBannerText]}>{authError}</Text>
            </View>
          ) : null}

          {/* Google OAuth Primary CTA Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.7}
            style={[styles.googleButton, loading && styles.googleButtonDisabled]}
            accessibilityLabel="Continue with Google"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="logo-google" size={20} color={colors.background} />
            )}
            <Text style={styles.googleButtonText}>
              {loading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Notice */}
        <View style={styles.footer}>
          <Text style={typography.caption}>
            FocusTrack Native Mobile v1.0 • Package com.focustrack.app
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
    letterSpacing: 1.5,
    fontSize: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.dangerText,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
    minHeight: 48,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
});
