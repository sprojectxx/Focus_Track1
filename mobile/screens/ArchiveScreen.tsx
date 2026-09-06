import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { Habit } from '../types';
import { colors, spacing, typography } from '../theme';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

export const ArchiveScreen: React.FC = () => {
  const {
    archivedHabits,
    loading,
    refreshing,
    error,
    refreshHabits,
    unarchiveHabit,
    deleteHabit,
  } = useHabits();

  const handleRestore = async (habit: Habit) => {
    try {
      await unarchiveHabit(habit.id);
    } catch (err) {
      console.error('[ArchiveScreen] Restore error:', err);
    }
  };

  const handleDeleteConfirm = (habit: Habit) => {
    Alert.alert(
      'Permanently Delete Protocol',
      `Are you sure you want to permanently delete "${habit.name}"? This action cannot be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
            } catch (err) {
              console.error('[ArchiveScreen] Delete error:', err);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading Archived Protocols..." />;
  }

  if (error && archivedHabits.length === 0) {
    return <ErrorState title="Archive Error" message={error} onRetry={refreshHabits} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHabits}
            tintColor={colors.textPrimary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.h1}>ARCHIVED PROTOCOLS</Text>
          <Text style={typography.caption}>INACTIVE HABITS & HISTORICAL RECORDS</Text>
        </View>

        {archivedHabits.length === 0 ? (
          <EmptyState
            title="Archive Vault Empty"
            description="You have no archived habit protocols."
          />
        ) : (
          archivedHabits.map((habit) => (
            <View key={habit.id} style={styles.card}>
              <View style={styles.cardBody}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={(habit.icon as any) || 'archive-outline'}
                    size={22}
                    color={colors.textMuted}
                  />
                </View>

                <View style={styles.details}>
                  <Text style={[typography.h3, styles.archivedTitle]}>{habit.name}</Text>
                  <Text style={typography.caption}>
                    {habit.categoryLabel || habit.category} • Created {habit.createdAt}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRestore(habit)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={16} color={colors.textPrimary} />
                  <Text style={styles.actionText}>RESTORE PROTOCOL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteConfirm(habit)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                  <Text style={[styles.actionText, styles.deleteText]}>PERMANENT DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  archivedTitle: {
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.minTouchTarget,
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  deleteText: {
    color: colors.dangerText,
  },
});
