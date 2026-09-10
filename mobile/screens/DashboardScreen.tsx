import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { colors, spacing, typography } from '../theme';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { getTimeBasedGreeting, getRandomQuote } from '../data/motivationalQuotes';
import { getTodayYMD, getDaysInMonth, getFocusTrackDayIndex } from '../utils/date';
import { getIoniconsName } from '../data/monochromeIcons';
import { AddEditHabitModal } from '../components/AddEditHabitModal';

export const DashboardScreen: React.FC = () => {
  const {
    activeHabits,
    loading,
    refreshing,
    error,
    refreshHabits,
    toggleTodayHabit,
    createHabit,
    stats,
  } = useHabits();

  const [quote] = useState(() => getRandomQuote());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const greetingData = getTimeBasedGreeting();
  const todayStr = getTodayYMD();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();
  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);

  const monthName = now.toLocaleString('default', { month: 'long' }).toUpperCase();
  const jsTodayDayIndex = getFocusTrackDayIndex(now);

  const todayHabits = activeHabits.filter((h) => h.scheduleDays.includes(jsTodayDayIndex));

  if (loading && !refreshing) {
    return <LoadingState message="Loading FocusTrack Dashboard..." />;
  }

  if (error && activeHabits.length === 0) {
    return <ErrorState title="Dashboard Error" message={error} onRetry={refreshHabits} />;
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
        {/* Header Greeting & Quote */}
        <View style={styles.header}>
          <Text style={typography.h1}>{greetingData.greeting}</Text>
          <Text style={[typography.bodySecondary, styles.subtext]}>{greetingData.subtext}</Text>
        </View>

        {/* Motivational Quote Banner */}
        <View style={styles.quoteCard}>
          <Text style={[typography.caption, styles.quoteTag]}>MOTIVATIONAL PROTOCOL</Text>
          <Text style={[typography.h3, styles.quoteText]}>"{quote.quote}"</Text>
          <Text style={[typography.caption, styles.quoteAuthor]}>— {quote.author}</Text>
        </View>

        {/* Today's Execution Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={typography.h2}>TODAY'S EXECUTION</Text>
              <Text style={typography.caption}>
                {stats.todayCompletedCount} OF {stats.todayDueCount} SCHEDULED PROTOCOLS COMPLETED
              </Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{stats.todayCompletionRate}%</Text>
            </View>
          </View>
        </View>

        {/* Today's Actionable Habits List */}
        <View style={styles.sectionHeader}>
          <Text style={typography.h3}>TODAY'S TASKS</Text>
          <Text style={typography.caption}>ONLY TODAY'S COMPLETIONS ARE MUTABLE</Text>
        </View>

        {todayHabits.length === 0 ? (
          <EmptyState
            title="No Protocols Scheduled for Today"
            description="You have no habits due today. Tap below to create a new protocol."
          />
        ) : (
          todayHabits.map((habit) => {
            const isDone = !!habit.history[todayStr];
            return (
              <View key={habit.id} style={[styles.taskCard, isDone && styles.taskCardDone]}>
                <View style={styles.taskInfo}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={getIoniconsName(habit.icon) as any}
                      size={20}
                      color={colors.textPrimary}
                    />
                  </View>
                  <View style={styles.taskTextContainer}>
                    <Text style={[typography.h3, isDone && styles.taskNameDone]}>
                      {habit.name}
                    </Text>
                    <Text style={typography.caption}>
                      {habit.categoryLabel || habit.category} • {habit.priority.toUpperCase()} PRIORITY
                    </Text>
                  </View>
                </View>

                {/* Interactive Checkbox (>= 44dp Touch Target) */}
                <TouchableOpacity
                  style={[styles.checkbox, isDone && styles.checkboxDone]}
                  onPress={() => toggleTodayHabit(habit.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Toggle ${habit.name} completion for today`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone }}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={20} color={colors.background} />
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          })
        )}



        {/* Add Protocol Quick Trigger */}
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={colors.background} />
          <Text style={styles.floatingAddText}>ADD PROTOCOL</Text>
        </TouchableOpacity>

        {/* Add Habit Modal */}
        <AddEditHabitModal
          visible={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (habitData) => {
            await createHabit(habitData);
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
  subtext: {
    marginTop: spacing.xs,
    fontSize: 10,
    letterSpacing: 1,
  },
  quoteCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  quoteTag: {
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  quoteText: {
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentageBadge: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusMd,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.background,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  taskCardDone: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderLight,
    opacity: 0.8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  checkbox: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    borderRadius: spacing.radiusMd,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  checkboxDone: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  matrixContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  stickyColumnHeader: {
    width: 120,
    padding: spacing.xs,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  daysHeaderRow: {
    flexDirection: 'row',
  },
  dayHeaderCell: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dayHeaderCellToday: {
    backgroundColor: colors.textPrimary,
  },
  dayHeaderCellTextToday: {
    color: colors.background,
    fontWeight: '800',
  },
  matrixRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stickyColumnCell: {
    width: 120,
    padding: spacing.xs,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  cellsRow: {
    flexDirection: 'row',
  },
  matrixCell: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  matrixCellCompleted: {
    backgroundColor: colors.textPrimary,
  },
  matrixCellTodayBorder: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
  },
  matrixCellFuture: {
    opacity: 0.3,
  },
  lockedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  floatingAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
    height: spacing.minTouchTarget,
    borderRadius: spacing.radiusMd,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  floatingAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
    letterSpacing: 0.5,
  },
});
