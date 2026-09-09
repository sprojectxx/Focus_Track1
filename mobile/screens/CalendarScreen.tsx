import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { colors, spacing, typography } from '../theme';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  getCalendarMonthGrid,
  getTodayYMD,
  isToday,
  isPast,
  isFuture,
  yearInWords,
  getDeviceTimeZone,
} from '../utils/date';
import { isHabitDueOnDate } from '../utils/habitStats';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const CalendarScreen: React.FC = () => {
  const {
    habits,
    activeHabits,
    loading,
    refreshing,
    error,
    refreshHabits,
    toggleTodayHabit,
  } = useHabits();

  const timeZone = getDeviceTimeZone();
  const todayStr = getTodayYMD(timeZone);
  const now = new Date();

  const [viewingYear, setViewingYear] = useState<number>(now.getFullYear());
  const [viewingMonth, setViewingMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isDailyDrawerOpen, setIsDailyDrawerOpen] = useState<boolean>(false);

  const monthGrid = getCalendarMonthGrid(viewingYear, viewingMonth);
  const isCurrentViewingMonth = viewingYear === now.getFullYear() && viewingMonth === (now.getMonth() + 1);

  const prevMonth = () => {
    if (viewingMonth === 1) {
      setViewingMonth(12);
      setViewingYear((prev) => prev - 1);
    } else {
      setViewingMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewingMonth === 12) {
      setViewingMonth(1);
      setViewingYear((prev) => prev + 1);
    } else {
      setViewingMonth((prev) => prev + 1);
    }
  };

  const goToToday = () => {
    setViewingYear(now.getFullYear());
    setViewingMonth(now.getMonth() + 1);
    setSelectedDateStr(todayStr);
  };

  const handleCellPress = (dateKey: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDateStr(dateKey);
    setIsDailyDrawerOpen(true);
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading FocusTrack Calendar..." />;
  }

  if (error && activeHabits.length === 0) {
    return <ErrorState title="Calendar Error" message={error} onRetry={refreshHabits} />;
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
        {/* Calendar Header */}
        <View style={styles.header}>
          <View>
            <Text style={typography.h1}>{MONTH_NAMES[viewingMonth - 1]}</Text>
            <Text style={[typography.caption, styles.subHeader]}>
              {yearInWords(viewingYear)}
            </Text>
          </View>

          {/* Month Controls */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={prevMonth}
              style={styles.navButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToToday}
              style={[styles.todayButton, isCurrentViewingMonth && styles.todayButtonActive]}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.todayButtonText,
                  isCurrentViewingMonth && styles.todayButtonTextActive,
                ]}
              >
                TODAY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextMonth}
              style={styles.navButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_NAMES.map((dayName) => (
            <View key={dayName} style={styles.weekdayCell}>
              <Text style={typography.caption}>{dayName}</Text>
            </View>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>
          {monthGrid.map((item, index) => {
            if (!item.isCurrentMonth) {
              return (
                <View key={index} style={[styles.dayCell, styles.dayCellDisabled]}>
                  <Text style={[typography.caption, styles.dayTextDisabled]}>
                    {item.day.toString().padStart(2, '0')}
                  </Text>
                </View>
              );
            }

            const dayNumStr = item.day.toString().padStart(2, '0');
            const dateKey = item.dateKey;
            const isTodayCell = isToday(dateKey, timeZone);
            const isSelected = selectedDateStr === dateKey;

            // Habits completed and due on this day (active + archived)
            const completedHabits = habits.filter(
              (h) => isHabitDueOnDate(h, dateKey, todayStr) && !!h.history[dateKey]
            );

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isTodayCell && styles.dayCellToday,
                  isSelected && !isTodayCell && styles.dayCellSelected,
                ]}
                onPress={() => handleCellPress(dateKey, true)}
                activeOpacity={0.8}
                hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
              >
                <View style={styles.cellTop}>
                  <Text
                    style={[
                      styles.dayText,
                      isTodayCell && styles.dayTextToday,
                    ]}
                  >
                    {dayNumStr}
                  </Text>
                  {isTodayCell ? (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  ) : null}
                </View>

                {/* Completion Dots */}
                <View style={styles.dotsRow}>
                  {completedHabits.slice(0, 3).map((h, hIdx) => (
                    <View key={hIdx} style={styles.completedDot} />
                  ))}
                  {completedHabits.length > 3 ? (
                    <Text style={styles.moreDotsText}>+{completedHabits.length - 3}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Daily History Modal Drawer */}
      <Modal
        visible={isDailyDrawerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDailyDrawerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.h2}>
                  {selectedDateStr ? selectedDateStr : 'DATE LOG'}
                </Text>
                <Text style={typography.caption}>
                  {selectedDateStr && isToday(selectedDateStr, timeZone)
                    ? 'TODAY • COMPLETIONS MUTABLE'
                    : selectedDateStr && isPast(selectedDateStr, timeZone)
                    ? 'HISTORICAL DATE • READ-ONLY LOG'
                    : 'FUTURE DATE • LOCKED'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDailyDrawerOpen(false)}
                style={styles.modalCloseButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              showsVerticalScrollIndicator={true}
            >
              {(() => {
                const isTodaySelected = selectedDateStr ? isToday(selectedDateStr, timeZone) : false;
                const relevantHabits = isTodaySelected
                  ? activeHabits.filter((h) => selectedDateStr && isHabitDueOnDate(h, selectedDateStr, todayStr))
                  : habits.filter((h) => selectedDateStr && isHabitDueOnDate(h, selectedDateStr, todayStr));

                if (relevantHabits.length === 0) {
                  return (
                    <Text style={[typography.bodySecondary, styles.emptyText]}>
                      No habit protocols configured or due on this date.
                    </Text>
                  );
                }

                return relevantHabits.map((habit) => {
                  const isDone = selectedDateStr ? !!habit.history[selectedDateStr] : false;

                  return (
                    <View key={habit.id} style={styles.drawerHabitRow}>
                      <View style={styles.drawerHabitInfo}>
                        <Ionicons
                          name={(habit.icon as any) || 'target-outline'}
                          size={20}
                          color={colors.textPrimary}
                          style={styles.drawerIcon}
                        />
                        <Text style={typography.h3}>{habit.name}</Text>
                      </View>

                      {isTodaySelected ? (
                        <TouchableOpacity
                          style={[styles.checkbox, isDone && styles.checkboxDone]}
                          onPress={() => toggleTodayHabit(habit.id)}
                          activeOpacity={0.7}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={18} color={colors.background} />
                          ) : null}
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.readOnlyBadge, isDone && styles.readOnlyBadgeDone]}>
                          <Text style={[styles.readOnlyBadgeText, isDone && styles.readOnlyBadgeTextDone]}>
                            {isDone ? 'COMPLETED' : 'NOT LOGGED'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  subHeader: {
    marginTop: spacing.xs,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todayButtonTextActive: {
    color: colors.background,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  dayCell: {
    width: '13.5%',
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
    padding: 6,
    justifyContent: 'space-between',
  },
  dayCellDisabled: {
    backgroundColor: colors.background,
    borderColor: 'transparent',
    opacity: 0.2,
  },
  dayCellToday: {
    borderColor: colors.textPrimary,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceSecondary,
  },
  dayCellSelected: {
    borderColor: colors.textSecondary,
    backgroundColor: colors.surfaceSecondary,
  },
  cellTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  dayTextToday: {
    color: colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  moreDotsText: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    paddingBottom: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  drawerHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  drawerHabitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerIcon: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    borderRadius: spacing.radiusMd,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.textPrimary,
  },
  readOnlyBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyBadgeDone: {
    backgroundColor: colors.textPrimary,
  },
  readOnlyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  readOnlyBadgeTextDone: {
    color: colors.background,
  },
});
