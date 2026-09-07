import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';
import { TextInputField } from '../components/TextInputField';
import { Button } from '../components/Button';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setAuthError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('[Supabase Auth Error]:', error.message);
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Email address has not been confirmed. Please check your inbox.');
        } else {
          setAuthError(error.message || 'Authentication failed. Please try again.');
        }
      } else if (data.session) {
        // Auth session created; RootNavigator onAuthStateChange will automatically navigate
      }
    } catch (err: any) {
      console.error('[Supabase Login Exception]:', err);
      setAuthError('Network error or connection issue. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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

            {/* Login Form Card */}
            <View style={styles.card}>
              <Text style={typography.h3}>Account Login</Text>
              <Text style={[typography.bodySecondary, styles.cardSubtitle]}>
                Sign in with your FocusTrack account credentials.
              </Text>

              {/* General Error Banner */}
              {authError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.dangerText} />
                  <Text style={[typography.caption, styles.errorBannerText]}>{authError}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <TextInputField
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(null);
                  if (authError) setAuthError(null);
                }}
                placeholder="name@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
                accessibilityLabel="Email Address Input"
              />

              {/* Password Input */}
              <TextInputField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(null);
                  if (authError) setAuthError(null);
                }}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={passwordError}
                accessibilityLabel="Password Input"
                rightAction={
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={showPassword ? 'Hide Password' : 'Show Password'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                }
              />

              {/* Submit Button */}
              <Button
                title={loading ? 'SIGNING IN...' : 'SIGN IN'}
                onPress={handleLogin}
                variant="primary"
                disabled={loading}
                style={styles.submitButton}
              />

              {loading ? (
                <View style={styles.loadingIndicatorContainer}>
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                </View>
              ) : null}
            </View>

            {/* Footer Notice */}
            <View style={styles.footer}>
              <Text style={typography.caption}>
                FocusTrack Native Mobile v1.0 • Package com.focustrack.app
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
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
  eyeButton: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  loadingIndicatorContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
});
