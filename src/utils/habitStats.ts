import { Habit } from '../types';
import { getTodayYMD, getDaysInMonth, isPast, isToday, isFuture } from './date';

export interface HabitStats {
  dueCount: number;
  completedCount: number;
  missedCount: number;
  completionRate: number; // 0 - 100
  currentStreak: number;
  bestStreak: number;
  trajectoryBars: Array<{
    week: string;
    value: number; // 0 - 100
    height: string;
    isEmpty: boolean;
  }>;
}

/**
 * Format a Date object to YYYY-MM-DD local string
 */
function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into local midnight Date object
 */
function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d);
}

/**
 * Convert Date day (0=Sun, 1=Mon, ..., 6=Sat) to FocusTrack schedule index (0=Mon, ..., 6=Sun)
 */
function getFocusTrackDayIndex(date: Date): number {
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return (jsDay + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun
}

/**
 * Calculate real habit statistics without hardcoded values or fake fallbacks.
 */
export function calculateHabitStats(
  habit: Habit,
  viewingYear?: number,
  viewingMonth?: number,
  todayStr: string = getTodayYMD()
): HabitStats {
  const todayDate = parseDateKey(todayStr);

  // 1. Determine Habit Start Date
  let startDate = parseDateKey(habit.createdAt || todayStr);
  if (isNaN(startDate.getTime()) || startDate > todayDate) {
    startDate = new Date(todayDate);
  }

  const scheduleDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];

  // 2. Filter Due Occurrences for Viewing Month (or Overall if not specified)
  let monthDueCount = 0;
  let monthCompletedCount = 0;

  if (viewingYear !== undefined && viewingMonth !== undefined) {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = d.toString().padStart(2, '0');
      const mStr = viewingMonth.toString().padStart(2, '0');
      const dateKey = `${viewingYear}-${mStr}-${dStr}`;
      const dateObj = parseDateKey(dateKey);

      // Only count days from habit start date up to today
      if (dateObj >= startDate && dateObj <= todayDate) {
        const ftDayIndex = getFocusTrackDayIndex(dateObj);
        if (scheduleDays.includes(ftDayIndex)) {
          monthDueCount++;
          if (habit.history[dateKey]) {
            monthCompletedCount++;
          }
        }
      }
    }
  } else {
    // Overall from start date to today
    const current = new Date(startDate);
    while (current <= todayDate) {
      const dateKey = formatDateKey(current);
      const ftDayIndex = getFocusTrackDayIndex(current);
      if (scheduleDays.includes(ftDayIndex)) {
        monthDueCount++;
        if (habit.history[dateKey]) {
          monthCompletedCount++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const missedCount = Math.max(0, monthDueCount - monthCompletedCount);
  const completionRate = monthDueCount > 0 ? Math.round((monthCompletedCount / monthDueCount) * 100) : 0;

  // 3. Calculate All-Time Current Streak & Best Streak based on scheduled occurrences
  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  // Iterate chronologically from habit start date up to today
  const scanDate = new Date(startDate);
  while (scanDate <= todayDate) {
    const ftDayIndex = getFocusTrackDayIndex(scanDate);
    if (scheduleDays.includes(ftDayIndex)) {
      const dateKey = formatDateKey(scanDate);
      const isDone = !!habit.history[dateKey];
      const isTodayScan = dateKey === todayStr;

      if (isDone) {
        runningStreak++;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        // If today is not completed yet, allow streak to be preserved from previous completed scheduled day
        if (isTodayScan) {
          // Do not reset runningStreak on today if user still has time to complete today
        } else {
          runningStreak = 0;
        }
      }
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }
  currentStreak = runningStreak;

  // 4. Calculate Past 8 Weeks Trajectory Bars
  const trajectoryBars: Array<{
    week: string;
    value: number;
    height: string;
    isEmpty: boolean;
  }> = [];

  // Work backwards 8 weeks from the end of the current week (Sunday)
  const currentWeekEnd = new Date(todayDate);
  const daysUntilSunday = (7 - currentWeekEnd.getDay()) % 7;
  currentWeekEnd.setDate(currentWeekEnd.getDate() + daysUntilSunday);

  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(currentWeekEnd);
    weekEnd.setDate(weekEnd.getDate() - w * 7);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    let weekDue = 0;
    let weekCompleted = 0;

    const dayCursor = new Date(weekStart);
    while (dayCursor <= weekEnd) {
      if (dayCursor >= startDate && dayCursor <= todayDate) {
        const ftDayIndex = getFocusTrackDayIndex(dayCursor);
        if (scheduleDays.includes(ftDayIndex)) {
          weekDue++;
          const dateKey = formatDateKey(dayCursor);
          if (habit.history[dateKey]) {
            weekCompleted++;
          }
        }
      }
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    const weekNumber = 8 - w;
    if (weekDue > 0) {
      const rate = Math.round((weekCompleted / weekDue) * 100);
      trajectoryBars.push({
        week: `W${weekNumber}`,
        value: rate,
        height: `${Math.max(rate, 4)}%`,
        isEmpty: false,
      });
    } else {
      trajectoryBars.push({
        week: `W${weekNumber}`,
        value: 0,
        height: '0%',
        isEmpty: true,
      });
    }
  }

  return {
    dueCount: monthDueCount,
    completedCount: monthCompletedCount,
    missedCount,
    completionRate,
    currentStreak,
    bestStreak,
    trajectoryBars,
  };
}
