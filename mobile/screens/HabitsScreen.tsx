import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

interface HabitsScreenProps {
  onNavigateToDetail?: (habitId: string) => void;
  onNavigateToArchive?: () => void;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  onNavigateToDetail,
  onNavigateToArchive,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>HABITS & ROUTINES</Text>
          <Text style={typography.caption}>PROTOCOL CONFIGURATION</Text>
        </View>

        <View style={styles.actionRow}>
          <Button
            title="VIEW ARCHIVE"
            onPress={() => onNavigateToArchive?.()}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="SAMPLE DETAIL"
            onPress={() => onNavigateToDetail?.('sample-habit-id')}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <EmptyState
          title="Habit Protocol Manager"
          description="Habit creation, editing, scheduling, and protocol management will be connected in future phases."
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
