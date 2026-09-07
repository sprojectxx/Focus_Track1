import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { colors, spacing, typography } from '../theme';
import {
  calculateTotalRepetitions,
  calculateMonthlyRates,
  calculateHabitStats,
  getMonthlyConsistencyMatrix,
} from '../utils/habitStats';
import {
  getDeviceTimeZone,
  getTodayYMD,
  parseYMD,
} from '../utils/date';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const HEATMAP_COLORS: Record<number, string> = {
  0: '#161616',
  1: '#3A3A3A',
  2: '#777777',
  3: '#B0B0B0',
  4: '#FFFFFF',
};

export const AnalyticsScreen: React.FC = () => {
  const { habits, activeHabits, loading, refreshing, error, refreshHabits, stats } = useHabits();

  const timeZone = getDeviceTimeZone();
  const todayStr = getTodayYMD(timeZone);
  const parsedToday = useMemo(
    () => parseYMD(todayStr) || { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() },
    [todayStr]
  );

  const [selectedYear, setSelectedYear] = useState<number>(parsedToday.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsedToday.month);

  const totalRepetitions = useMemo(
    () => calculateTotalRepetitions(habits, todayStr, timeZone),
    [habits, todayStr, timeZone]
  );

  const overallStreaks = useMemo(() => {
    if (activeHabits.length === 0) return { best: 0, current: 0 };
    let best = 0;
    let current = 0;
    activeHabits.forEach((h) => {
      const hStats = calculateHabitStats(h, undefined, undefined, todayStr, timeZone);
      if (hStats.bestStreak > best) best = hStats.bestStreak;
      if (hStats.currentStreak > current) current = hStats.currentStreak;
    });
    return { best, current };
  }, [activeHabits, todayStr, timeZone]);

  const monthlyMatrix = useMemo(
    () => getMonthlyConsistencyMatrix(habits, selectedYear, selectedMonth, timeZone),
    [habits, selectedYear, selectedMonth, timeZone]
  );

  const monthlyRates = useMemo(
    () => calculateMonthlyRates(habits, selectedYear, todayStr, timeZone),
    [habits, selectedYear, todayStr, timeZone]
  );

  const isCurrentOrFutureMonth =
    selectedYear > parsedToday.year ||
    (selectedYear === parsedToday.year && selectedMonth >= parsedToday.month);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (isCurrentOrFutureMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Calculating discipline metrics..." />;
  }

  if (error && activeHabits.length === 0) {
    return <ErrorState title="Analytics Error" message={error} onRetry={refreshHabits} />;
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
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={typography.h1}>ANALYTICS</Text>
          <Text style={typography.caption}>DISCIPLINE ENGINE & PERFORMANCE TRENDS</Text>
        </View>

        {activeHabits.length === 0 ? (
          <EmptyState
            title="No Active Protocols"
            description="Create active habit protocols to track discipline metrics and consistency."
          />
        ) : (
          <>
            {/* Bento Grid KPI Cards */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{stats.overallCompletion}%</Text>
                <Text style={[typography.caption, styles.bentoLabel]}>OVERALL CONSISTENCY</Text>
              </View>

              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{totalRepetitions}</Text>
                <Text style={[typography.caption, styles.bentoLabel]}>TOTAL REPETITIONS</Text>
              </View>

              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{overallStreaks.best}</Text>
                <Text style={[typography.caption, styles.bentoLabel]}>LONGEST STREAK</Text>
              </View>

              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{overallStreaks.current}</Text>
                <Text style={[typography.caption, styles.bentoLabel]}>CURRENT STREAK</Text>
              </View>
            </View>

            {/* Monthly Consistency Matrix Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={typography.h3}>MONTHLY CONSISTENCY MATRIX</Text>
                  <Text style={typography.caption}>
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </Text>
                </View>

                {/* Month Navigation */}
                <View style={styles.monthSelector}>
                  <TouchableOpacity
                    onPress={prevMonth}
                    style={styles.monthNavButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>
                    {MONTH_NAMES[selectedMonth - 1].slice(0, 3)} {selectedYear}
                  </Text>
                  <TouchableOpacity
                    onPress={nextMonth}
                    disabled={isCurrentOrFutureMonth}
                    style={[styles.monthNavButton, isCurrentOrFutureMonth && styles.monthNavButtonDisabled]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isCurrentOrFutureMonth ? colors.textMuted : colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 7-Column Weekday Header */}
              <View style={styles.weekdayRow}>
                {WEEKDAY_NAMES.map((dayName) => (
                  <View key={dayName} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{dayName}</Text>
                  </View>
                ))}
              </View>

              {/* 7-Column Day Grid */}
              <View style={styles.matrixGrid}>
                {monthlyMatrix.map((cell, idx) => {
                  const isCurrentMonth = cell.isCurrentMonth;
                  const isToday = cell.isToday;
                  const isFuture = cell.isFuture;
                  const level = cell.level;
                  const totalDue = cell.totalDue;

                  if (!isCurrentMonth) {
                    return (
                      <View key={idx} style={[styles.gridCell, styles.gridCellOtherMonth]}>
                        <Text style={styles.gridDayTextOtherMonth}>
                          {cell.day.toString().padStart(2, '0')}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.gridCell,
                        isFuture && styles.gridCellFuture,
                        isToday && styles.gridCellToday,
                        !isFuture && totalDue > 0 && { backgroundColor: HEATMAP_COLORS[level] },
                        !isFuture && totalDue === 0 && styles.gridCellNoData,
                      ]}
                    >
                      <Text
                        style={[
                          styles.gridDayText,
                          isToday && styles.gridDayTextToday,
                          !isFuture && level >= 3 && styles.gridDayTextDarkBg,
                          isFuture && styles.gridDayTextFuture,
                        ]}
                      >
                        {cell.day.toString().padStart(2, '0')}
                      </Text>
                      {!isFuture && totalDue > 0 ? (
                        <Text
                          style={[
                            styles.gridSubText,
                            level >= 3 && styles.gridSubTextDarkBg,
                          ]}
                        >
                          {cell.completedDue}/{cell.totalDue}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <Text style={typography.caption}>0%</Text>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <View
                    key={lvl}
                    style={[
                      styles.legendSquare,
                      { backgroundColor: HEATMAP_COLORS[lvl] },
                    ]}
                  />
                ))}
                <Text style={typography.caption}>100%</Text>
              </View>
            </View>

            {/* 12-Month Bar Chart */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={typography.h3}>MONTHLY RATE TRAJECTORY</Text>
                  <Text style={typography.caption}>12-MONTH COMPLETION DISTRIBUTION</Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <View style={styles.barsRow}>
                  {monthlyRates.map((item, idx) => (
                    <View key={idx} style={styles.barColumn}>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.max(item.rate, 3)}%` as DimensionValue },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.month}</Text>
                      <Text style={styles.barValue}>{item.rate}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
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
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bentoCard: {
    width: '47%',
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bentoLabel: {
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  monthNavButton: {
    padding: spacing.xs,
  },
  monthNavButtonDisabled: {
    opacity: 0.3,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  weekdayCell: {
    width: '13.5%',
    marginHorizontal: '0.4%',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  gridCell: {
    width: '13.5%',
    marginHorizontal: '0.4%',
    marginVertical: 2,
    aspectRatio: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellOtherMonth: {
    backgroundColor: colors.background,
    borderColor: 'transparent',
    opacity: 0.15,
  },
  gridCellFuture: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.25,
  },
  gridCellToday: {
    borderColor: colors.textPrimary,
    borderWidth: 1.5,
  },
  gridCellNoData: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  gridDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gridDayTextToday: {
    color: colors.textPrimary,
  },
  gridDayTextDarkBg: {
    color: colors.background,
  },
  gridDayTextFuture: {
    color: colors.textMuted,
  },
  gridDayTextOtherMonth: {
    color: colors.textMuted,
  },
  gridSubText: {
    fontSize: 7,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 1,
  },
  gridSubTextDarkBg: {
    color: colors.background,
    opacity: 0.9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartContainer: {
    marginTop: spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 12,
    height: 80,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  barValue: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
