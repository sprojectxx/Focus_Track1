import { Habit, HabitStats } from '../types';
import {
  getTodayYMD,
  getDaysInMonth,
  getFocusTrackDayIndex,
  formatYMD,
  parseYMDToLocalDate,
} from './date';

function getCleanCreatedAtYMD(createdAt?: string, fallbackTodayStr: string = getTodayYMD()): string {
  if (!createdAt || typeof createdAt !== 'string') return fallbackTodayStr;
  const clean = createdAt.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return fallbackTodayStr;
}

export function calculateHabitStats(
  habit: Habit,
  viewingYear?: number,
  viewingMonth?: number,
  todayStr: string = getTodayYMD()
): HabitStats {
  const createdAtYMD = getCleanCreatedAtYMD(habit.createdAt, todayStr);
  const scheduleDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];

  let monthDueCount = 0;
  let monthCompletedCount = 0;

  if (viewingYear !== undefined && viewingMonth !== undefined) {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatYMD(viewingYear, viewingMonth, d);
      if (dateKey >= createdAtYMD && dateKey <= todayStr) {
        const dateObj = parseYMDToLocalDate(dateKey);
        if (dateObj) {
          const ftDayIndex = getFocusTrackDayIndex(dateObj);
          if (scheduleDays.includes(ftDayIndex)) {
            monthDueCount++;
            if (habit.history[dateKey]) {
              monthCompletedCount++;
            }
          }
        }
      }
    }
  } else {
    // Total lifetime due & completed up to today
    const startObj = parseYMDToLocalDate(createdAtYMD) || parseYMDToLocalDate(todayStr)!;
    const todayObj = parseYMDToLocalDate(todayStr)!;
    const current = new Date(startObj);

    while (current <= todayObj) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const d = current.getDate();
      const dateKey = formatYMD(y, m, d);

      if (dateKey <= todayStr) {
        const ftDayIndex = getFocusTrackDayIndex(current);
        if (scheduleDays.includes(ftDayIndex)) {
          monthDueCount++;
          if (habit.history[dateKey]) {
            monthCompletedCount++;
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const missedCount = Math.max(0, monthDueCount - monthCompletedCount);
  const completionRate = monthDueCount > 0 ? Math.round((monthCompletedCount / monthDueCount) * 100) : 0;

  // Streak Calculation (respecting scheduleDays and createdAt, unscheduled days do NOT break streak)
  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  const startObj = parseYMDToLocalDate(createdAtYMD) || parseYMDToLocalDate(todayStr)!;
  const todayObj = parseYMDToLocalDate(todayStr)!;
  const cursor = new Date(startObj);

  while (cursor <= todayObj) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    const d = cursor.getDate();
    const dateKey = formatYMD(y, m, d);

    const ftDayIndex = getFocusTrackDayIndex(cursor);
    if (scheduleDays.includes(ftDayIndex)) {
      const isDone = !!habit.history[dateKey];
      const isTodayScan = dateKey === todayStr;

      if (isDone) {
        runningStreak++;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        if (!isTodayScan) {
          runningStreak = 0;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  currentStreak = runningStreak;

  // 8-Week Trajectory Bars
  const trajectoryBars: Array<{
    week: string;
    value: number;
    height: string;
    isEmpty: boolean;
  }> = [];

  const currentWeekEnd = parseYMDToLocalDate(todayStr) || new Date();
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
      const y = dayCursor.getFullYear();
      const m = dayCursor.getMonth() + 1;
      const d = dayCursor.getDate();
      const dateKey = formatYMD(y, m, d);

      if (dateKey >= createdAtYMD && dateKey <= todayStr) {
        const ftDayIndex = getFocusTrackDayIndex(dayCursor);
        if (scheduleDays.includes(ftDayIndex)) {
          weekDue++;
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

export function calculateTotalRepetitions(habits: Habit[]): number {
  let total = 0;
  habits.forEach((h) => {
    Object.values(h.history).forEach((val) => {
      if (val) total++;
    });
  });
  return total;
}

export function calculateOverallConsistency(
  habits: Habit[],
  todayStr: string = getTodayYMD()
): number {
  let totalDue = 0;
  let totalCompleted = 0;

  habits.forEach((h) => {
    const createdAtYMD = getCleanCreatedAtYMD(h.createdAt, todayStr);
    const scheduleDays = h.scheduleDays || [0, 1, 2, 3, 4, 5, 6];

    const startObj = parseYMDToLocalDate(createdAtYMD) || parseYMDToLocalDate(todayStr)!;
    const todayObj = parseYMDToLocalDate(todayStr)!;
    const cursor = new Date(startObj);

    while (cursor <= todayObj) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const d = cursor.getDate();
      const dateKey = formatYMD(y, m, d);

      if (dateKey <= todayStr) {
        const ftDayIndex = getFocusTrackDayIndex(cursor);
        if (scheduleDays.includes(ftDayIndex)) {
          totalDue++;
          if (h.history[dateKey]) {
            totalCompleted++;
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0;
}

export interface HeatmapCell {
  dateStr: string;
  count: number;
  dueCount: number;
  level: number; // 0 to 4
  isFuture: boolean;
}

export function calculateHeatmapWeeks(
  habits: Habit[],
  selectedYear: number,
  todayStr: string = getTodayYMD()
): HeatmapCell[][] {
  const currentYear = parseYMDToLocalDate(todayStr)?.getFullYear() || new Date().getFullYear();

  let endSunday: Date;
  if (selectedYear === currentYear) {
    const todayObj = parseYMDToLocalDate(todayStr) || new Date();
    const daysUntilSunday = (7 - todayObj.getDay()) % 7;
    endSunday = new Date(todayObj);
    endSunday.setDate(endSunday.getDate() + daysUntilSunday);
  } else {
    // Last Sunday of the selected year
    endSunday = new Date(selectedYear, 11, 31);
    const daysUntilSunday = (7 - endSunday.getDay()) % 7;
    endSunday.setDate(endSunday.getDate() + daysUntilSunday);
  }

  // Exactly 52 weeks x 7 days = 364 days
  const startMonday = new Date(endSunday);
  startMonday.setDate(startMonday.getDate() - (52 * 7 - 1));

  const cursor = new Date(startMonday);
  const weeks: HeatmapCell[][] = [];

  for (let w = 0; w < 52; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const day = cursor.getDate();
      const key = formatYMD(y, m, day);

      const isFuture = key > todayStr;
      let completedCount = 0;
      let dueCount = 0;

      if (!isFuture) {
        const ftDayIndex = getFocusTrackDayIndex(cursor);
        habits.forEach((h) => {
          const createdAtYMD = getCleanCreatedAtYMD(h.createdAt, todayStr);
          const scheduleDays = h.scheduleDays || [0, 1, 2, 3, 4, 5, 6];

          if (key >= createdAtYMD && scheduleDays.includes(ftDayIndex)) {
            dueCount++;
            if (h.history[key]) {
              completedCount++;
            }
          }
        });
      }

      let level = 0;
      if (!isFuture && dueCount > 0) {
        const ratio = completedCount / dueCount;
        if (ratio >= 1.0) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        else if (ratio > 0) level = 1;
        else level = 0;
      }

      week.push({
        dateStr: key,
        count: completedCount,
        dueCount,
        level,
        isFuture,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export interface MonthlyRate {
  month: string;
  rate: number;
  dueCount: number;
  completedCount: number;
}

export function calculateMonthlyRates(
  habits: Habit[],
  selectedYear: number,
  todayStr: string = getTodayYMD()
): MonthlyRate[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((monthName, monthIndex) => {
    const daysInMonth = getDaysInMonth(selectedYear, monthIndex + 1);
    let monthDue = 0;
    let monthCompleted = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatYMD(selectedYear, monthIndex + 1, day);
      if (dateKey <= todayStr) {
        const dateObj = parseYMDToLocalDate(dateKey);
        if (dateObj) {
          const ftDayIndex = getFocusTrackDayIndex(dateObj);
          habits.forEach((h) => {
            const createdAtYMD = getCleanCreatedAtYMD(h.createdAt, todayStr);
            const scheduleDays = h.scheduleDays || [0, 1, 2, 3, 4, 5, 6];

            if (dateKey >= createdAtYMD && scheduleDays.includes(ftDayIndex)) {
              monthDue++;
              if (h.history[dateKey]) {
                monthCompleted++;
              }
            }
          });
        }
      }
    }

    const rate = monthDue > 0 ? Math.round((monthCompleted / monthDue) * 100) : 0;
    return {
      month: monthName,
      rate,
      dueCount: monthDue,
      completedCount: monthCompleted,
    };
  });
}

