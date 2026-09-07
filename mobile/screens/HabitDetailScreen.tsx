import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { colors, spacing, typography } from '../theme';
import { calculateHabitStats } from '../utils/habitStats';
import { EmptyState } from '../components/EmptyState';
import { AddEditHabitModal } from '../components/AddEditHabitModal';

interface HabitDetailScreenProps {
  habitId?: string;
}

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const HabitDetailScreen: React.FC<HabitDetailScreenProps> = ({ habitId }) => {
  const { habits, updateHabit, archiveHabit } = useHabits();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const habit = useMemo(
    () => habits.find((h) => h.id === habitId) || null,
    [habits, habitId]
  );

  const stats = useMemo(() => {
    if (!habit) return null;
    const now = new Date();
    return calculateHabitStats(habit, now.getFullYear(), now.getMonth() + 1);
  }, [habit]);

  if (!habit || !stats) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <EmptyState
            title="Protocol Not Found"
            description="The requested habit protocol could not be found or has been removed."
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleArchiveConfirm = () => {
    Alert.alert(
      'Archive Protocol',
      `Move "${habit.name}" to Archived Protocols?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await archiveHabit(habit.id);
            } catch (err) {
              console.error('[HabitDetailScreen] Archive error:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Protocol Banner */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.iconBox}>
              <Ionicons
                name={(habit.icon as any) || 'target-outline'}
                size={28}
                color={colors.textPrimary}
              />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{habit.categoryLabel || habit.category}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{habit.priority.toUpperCase()} PRIORITY</Text>
              </View>
            </View>
          </View>

          <Text style={[typography.h1, styles.title]}>{habit.name}</Text>
          {habit.description ? (
            <Text style={[typography.bodySecondary, styles.description]}>
              {habit.description}
            </Text>
          ) : null}

          <Text style={[typography.caption, styles.createdAt]}>
            CREATED ON {habit.createdAt} • {habit.focusMinutesPerSession} MIN/SESSION
          </Text>

          {/* Edit / Archive Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsEditModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.actionButtonText}>EDIT PROTOCOL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleArchiveConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                ARCHIVE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Statistics Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>REAL PERFORMANCE METRICS</Text>
          <Text style={typography.caption}>CALCULATED FROM SUPABASE LOGS</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completionRate}%</Text>
            <Text style={typography.caption}>COMPLETION RATE</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={typography.caption}>CURRENT STREAK</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.bestStreak}</Text>
            <Text style={typography.caption}>BEST STREAK</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.completedCount} / {stats.dueCount}
            </Text>
            <Text style={typography.caption}>SESSIONS COMPLETED</Text>
          </View>
        </View>

        {/* Schedule Summary */}
        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>WEEKLY SCHEDULE</Text>
        </View>

        <View style={styles.scheduleRow}>
          {DAY_NAMES.map((dayName, idx) => {
            const isScheduled = habit.scheduleDays.includes(idx);
            return (
              <View
                key={dayName}
                style={[styles.dayCard, isScheduled && styles.dayCardScheduled]}
              >
                <Text style={[styles.dayCardText, isScheduled && styles.dayCardTextScheduled]}>
                  {dayName}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 8-Week Trajectory Bars */}
        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>8-WEEK PERFORMANCE TRAJECTORY</Text>
        </View>

        <View style={styles.trajectoryCard}>
          <View style={styles.barsRow}>
            {stats.trajectoryBars.map((bar, idx) => (
              <View key={idx} style={styles.barColumn}>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { height: bar.height as DimensionValue }]} />
                </View>
                <Text style={typography.caption}>{bar.week}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 14-Day Recent Execution History */}
        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>RECENT EXECUTION HISTORY (14 DAYS)</Text>
        </View>

        <View style={styles.historyCard}>
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const yStr = d.getFullYear();
            const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
            const dayStr = d.getDate().toString().padStart(2, '0');
            const dateKey = `${yStr}-${mStr}-${dayStr}`;
            const isDone = !!habit.history[dateKey];
            const dateLabel = d.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).toUpperCase();

            return (
              <View key={dateKey} style={styles.historyRow}>
                <Text style={styles.historyDateText}>{dateLabel}</Text>
                <View
                  style={[
                    styles.historyBadge,
                    isDone ? styles.historyBadgeDone : styles.historyBadgeMissed,
                  ]}
                >
                  <Ionicons
                    name={isDone ? 'checkmark' : 'close'}
                    size={12}
                    color={isDone ? colors.textPrimary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.historyBadgeText,
                      isDone ? styles.historyTextDone : styles.historyTextMissed,
                    ]}
                  >
                    {isDone ? 'COMPLETED' : 'NO LOG'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Edit Modal */}
        <AddEditHabitModal
          visible={isEditModalOpen}
          editingHabit={habit}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={async (updatedData) => {
            await updateHabit(habit.id, updatedData);
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
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: spacing.radiusLg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
  title: {
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.md,
  },
  createdAt: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.minTouchTarget,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionButtonTextSecondary: {
    color: colors.textSecondary,
  },
  sectionTitleRow: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayCard: {
    flex: 1,
    height: spacing.minTouchTarget,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    opacity: 0.4,
  },
  dayCardScheduled: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.textPrimary,
    opacity: 1,
  },
  dayCardText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dayCardTextScheduled: {
    color: colors.textPrimary,
  },
  trajectoryCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: spacing.md,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 12,
    height: 80,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 6,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    gap: 4,
  },
  historyBadgeDone: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.textPrimary,
  },
  historyBadgeMissed: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyTextDone: {
    color: colors.textPrimary,
  },
  historyTextMissed: {
    color: colors.textMuted,
  },
});
