import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { EmptyState } from '../components/EmptyState';

interface HabitDetailScreenProps {
  habitId?: string;
}

export const HabitDetailScreen: React.FC<HabitDetailScreenProps> = ({ habitId = 'Sample Habit' }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>HABIT PROTOCOL DETAIL</Text>
          <Text style={typography.caption}>ID: {habitId}</Text>
        </View>

        <EmptyState
          title="Habit Statistics & History Engine"
          description="Detailed habit metadata, real-time math engine stats, and completion trajectory will be rendered in future phases."
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
