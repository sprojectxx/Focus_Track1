import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={typography.h1}>FOCUSTRACK</Text>
          <Text style={[typography.bodySecondary, styles.subtitle]}>
            HIGH-PERFORMANCE HABIT & ROUTINE PROTOCOL
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Authentication (M1 Foundation)</Text>
          <Text style={[typography.bodySecondary, styles.cardText]}>
            Native Google OAuth and Supabase session management will be activated in M2.
          </Text>
          
          <Button
            title="DEVELOPMENT BYPASS — ENTER APP"
            onPress={() => onLoginSuccess?.()}
            variant="primary"
            style={styles.button}
          />
        </View>
      </View>
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
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
    letterSpacing: 1.5,
    fontSize: 11,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  cardText: {
    marginVertical: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});
