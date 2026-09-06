import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { EmptyState } from '../components/EmptyState';

export const DashboardScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>DASHBOARD</Text>
          <Text style={typography.caption}>NATIVE MOBILE FOUNDATION</Text>
        </View>

        <EmptyState
          title="Daily Execution Engine"
          description="Habit completion logic and real-time execution engine will be connected in future phases."
        />
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
});
