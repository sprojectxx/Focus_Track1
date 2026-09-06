import React, { useState } from 'react';
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
import { TextInputField } from '../components/TextInputField';
import { AddEditHabitModal } from '../components/AddEditHabitModal';
import { PREDEFINED_DOMAINS } from '../data/habitDomains';

interface HabitsScreenProps {
  onNavigateToDetail?: (habitId: string) => void;
  onNavigateToArchive?: () => void;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  onNavigateToDetail,
  onNavigateToArchive,
}) => {
  const {
    activeHabits,
    loading,
    refreshing,
    error,
    refreshHabits,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const filteredHabits = activeHabits.filter((habit) => {
    const matchesSearch =
      habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      habit.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain =
      selectedDomain === 'ALL' ||
      habit.category.toLowerCase() === selectedDomain.toLowerCase() ||
      habit.categoryLabel?.toLowerCase() === selectedDomain.toLowerCase();

    return matchesSearch && matchesDomain;
  });

  const handleDeleteConfirm = (habit: Habit) => {
    Alert.alert(
      'Delete Protocol Permanently',
      `Are you sure you want to permanently delete "${habit.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
            } catch (err) {
              console.error('[HabitsScreen] Delete error:', err);
            }
          },
        },
      ]
    );
  };

  const handleArchiveConfirm = (habit: Habit) => {
    Alert.alert(
      'Archive Protocol',
      `Move "${habit.name}" to Archived Protocols? It can be unarchived later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await archiveHabit(habit.id);
            } catch (err) {
              console.error('[HabitsScreen] Archive error:', err);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading Habit Protocols..." />;
  }

  if (error && activeHabits.length === 0) {
    return <ErrorState title="Habits Error" message={error} onRetry={refreshHabits} />;
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
          <Text style={typography.h1}>HABITS & PROTOCOLS</Text>
          <Text style={typography.caption}>MANAGEMENT & CONFIGURATION</Text>
        </View>

        {/* Action Header Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => {
              setEditingHabit(null);
              setIsAddModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={colors.background} />
            <Text style={styles.primaryActionText}>NEW PROTOCOL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => onNavigateToArchive?.()}
            activeOpacity={0.8}
          >
            <Ionicons name="archive-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryActionText}>ARCHIVE</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInputField
          label="Search Protocols"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by protocol name or domain..."
          rightAction={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Domain Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.domainScrollView}
          contentContainerStyle={styles.domainContainer}
        >
          {['ALL', ...PREDEFINED_DOMAINS].map((domain) => {
            const isSelected = selectedDomain === domain;
            return (
              <TouchableOpacity
                key={domain}
                style={[styles.domainChip, isSelected && styles.domainChipSelected]}
                onPress={() => setSelectedDomain(domain)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.domainChipText, isSelected && styles.domainChipTextSelected]}
                >
                  {domain.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Habit Protocol Cards */}
        {filteredHabits.length === 0 ? (
          <EmptyState
            title="No Habit Protocols Found"
            description={
              searchQuery || selectedDomain !== 'ALL'
                ? 'No habits match your active search or domain filter.'
                : 'Create your first habit protocol to start tracking consistency.'
            }
          />
        ) : (
          filteredHabits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <TouchableOpacity
                style={styles.habitMainContent}
                onPress={() => onNavigateToDetail?.(habit.id)}
                activeOpacity={0.8}
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={(habit.icon as any) || 'target-outline'}
                    size={22}
                    color={colors.textPrimary}
                  />
                </View>

                <View style={styles.habitDetails}>
                  <Text style={typography.h3}>{habit.name}</Text>
                  <Text style={typography.caption}>
                    {habit.categoryLabel || habit.category} • {habit.scheduleDays.length} DAYS/WK
                  </Text>
                </View>

                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>{habit.priority.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>

              {/* Card Actions Footer */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.cardActionButton}
                  onPress={() => {
                    setEditingHabit(habit);
                    setIsAddModalOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.cardActionText}>EDIT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardActionButton}
                  onPress={() => handleArchiveConfirm(habit)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.cardActionText}>ARCHIVE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardActionButton}
                  onPress={() => handleDeleteConfirm(habit)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                  <Text style={[styles.cardActionText, styles.deleteText]}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Add/Edit Modal */}
        <AddEditHabitModal
          visible={isAddModalOpen}
          editingHabit={editingHabit}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingHabit(null);
          }}
          onSubmit={async (habitData) => {
            if (editingHabit) {
              await updateHabit(editingHabit.id, habitData);
            } else {
              await createHabit(habitData);
            }
          }}
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
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
    height: spacing.minTouchTarget,
    borderRadius: spacing.radiusMd,
    gap: spacing.xs,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.background,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: spacing.minTouchTarget,
    borderRadius: spacing.radiusMd,
    gap: spacing.xs,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  domainScrollView: {
    marginBottom: spacing.md,
  },
  domainContainer: {
    gap: spacing.xs,
  },
  domainChip: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainChipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  domainChipTextSelected: {
    color: colors.background,
  },
  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  habitMainContent: {
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
  habitDetails: {
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.minTouchTarget,
    gap: spacing.xs,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  deleteText: {
    color: colors.dangerText,
  },
});
