import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSignOut }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>SETTINGS</Text>
          <Text style={typography.caption}>SYSTEM PREFERENCES & ACCOUNT</Text>
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Application Identity</Text>
          <Text style={[typography.bodySecondary, styles.sectionText]}>
            Package ID: com.focustrack.app
          </Text>
          <Text style={[typography.bodySecondary, styles.sectionText]}>
            Framework: React Native + Expo (M1 Foundation)
          </Text>
        </View>

        <View style={styles.section}>
          <Button
            title="SIGN OUT (TEST NAVIGATOR)"
            onPress={() => onSignOut?.()}
            variant="danger"
          />
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
});
