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
  calculateHeatmapWeeks,
  calculateMonthlyRates,
  calculateHabitStats,
} from '../utils/habitStats';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HEATMAP_COLORS: Record<number, string> = {
  0: '#161616',
  1: '#3A3A3A',
  2: '#777777',
  3: '#B0B0B0',
  4: '#FFFFFF',
};

export const AnalyticsScreen: React.FC = () => {
  const { activeHabits, loading, refreshing, error, refreshHabits, stats } = useHabits();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const totalRepetitions = useMemo(
    () => calculateTotalRepetitions(activeHabits),
    [activeHabits]
  );

  const overallStreaks = useMemo(() => {
    if (activeHabits.length === 0) return { best: 0, current: 0 };
    let best = 0;
    let current = 0;
    activeHabits.forEach((h) => {
      const hStats = calculateHabitStats(h);
      if (hStats.bestStreak > best) best = hStats.bestStreak;
      if (hStats.currentStreak > current) current = hStats.currentStreak;
    });
    return { best, current };
  }, [activeHabits]);

  const heatmapWeeks = useMemo(
    () => calculateHeatmapWeeks(activeHabits, selectedYear),
    [activeHabits, selectedYear]
  );

  const monthlyRates = useMemo(
    () => calculateMonthlyRates(activeHabits, selectedYear),
    [activeHabits, selectedYear]
  );

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
            description="Create active habit protocols to track discipline metrics and heatmap consistency."
          />
        ) : (
          <>
            {/* Bento Grid KPI Cards */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{stats.overallCompletion}%</Text>
                <Text style={typography.caption}>OVERALL CONSISTENCY</Text>
              </View>

              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{totalRepetitions}</Text>
                <Text style={typography.caption}>TOTAL REPETITIONS</Text>
              </View>

              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{overallStreaks.best}</Text>
                <Text style={typography.caption}>LONGEST STREAK</Text>
              </View>

              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{overallStreaks.current}</Text>
                <Text style={typography.caption}>CURRENT STREAK</Text>
              </View>
            </View>

            {/* Heatmap Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={typography.h3}>52-WEEK CONSISTENCY MATRIX</Text>
                  <Text style={typography.caption}>EXECUTION INTENSITY HEATMAP</Text>
                </View>
                <View style={styles.yearSelector}>
                  <TouchableOpacity
                    onPress={() => setSelectedYear((y) => y - 1)}
                    style={styles.yearNavButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.yearText}>{selectedYear}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedYear((y) => y + 1)}
                    style={styles.yearNavButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heatmapScroll}>
                <View style={styles.heatmapGrid}>
                  {/* Day Labels Column */}
                  <View style={styles.dayLabelsColumn}>
                    {DAY_LABELS.map((lbl, idx) => (
                      <Text key={idx} style={styles.dayLabelText}>
                        {lbl}
                      </Text>
                    ))}
                  </View>

                  {/* Weeks Columns */}
                  {heatmapWeeks.map((week, wIdx) => (
                    <View key={wIdx} style={styles.weekColumn}>
                      {week.map((cell, dIdx) => (
                        <View
                          key={dIdx}
                          style={[
                            styles.heatmapSquare,
                            { backgroundColor: HEATMAP_COLORS[cell.level] || HEATMAP_COLORS[0] },
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Legend */}
              <View style={styles.legendRow}>
                <Text style={typography.caption}>LESS</Text>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <View
                    key={lvl}
                    style={[
                      styles.legendSquare,
                      { backgroundColor: HEATMAP_COLORS[lvl] },
                    ]}
                  />
                ))}
                <Text style={typography.caption}>MORE</Text>
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
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bentoValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  yearNavButton: {
    padding: spacing.xs,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
  },
  heatmapScroll: {
    marginBottom: spacing.sm,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 3,
  },
  dayLabelsColumn: {
    justifyContent: 'space-between',
    marginRight: spacing.xs,
    paddingVertical: 1,
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    height: 10,
    lineHeight: 10,
  },
  weekColumn: {
    gap: 3,
  },
  heatmapSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
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

