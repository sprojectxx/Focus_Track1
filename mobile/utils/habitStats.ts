import { Habit, HabitStats } from '../types';
import {
  getTodayYMD,
  getDaysInMonth,
  getFocusTrackDayIndex,
  formatYMD,
  parseYMDToLocalDate,
  getCalendarMonthGrid,
  getDeviceTimeZone,
  isToday,
  isFuture,
} from './date';

function getCleanDateYMD(dateStr?: string, fallbackTodayStr: string = getTodayYMD()): string {
  if (!dateStr || typeof dateStr !== 'string') return fallbackTodayStr;
  const clean = dateStr.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return fallbackTodayStr;
}

export interface MonthlyConsistencyCell {
  day: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  totalDue: number;
  completedDue: number;
  ratio: number;
  level: number;
}

/**
 * Reusable Timezone-Safe Monthly Consistency Matrix Calculation
 * Uses centralized isHabitDueOnDate for due/completion verification.
 */
export function getMonthlyConsistencyMatrix(
  habits: Habit[],
  year: number,
  month: number,
  timeZone: string = getDeviceTimeZone()
): MonthlyConsistencyCell[] {
  const todayStr = getTodayYMD(timeZone);
  const monthGrid = getCalendarMonthGrid(year, month);

  return monthGrid.map((gridCell) => {
    const { day, dateKey, isCurrentMonth } = gridCell;
    const isTodayCell = isToday(dateKey, timeZone);
    const isFutureCell = isFuture(dateKey, timeZone);

    let totalDue = 0;
    let completedDue = 0;

    if (!isFutureCell) {
      for (const habit of habits) {
        if (isHabitDueOnDate(habit, dateKey, todayStr)) {
          totalDue++;
          if (habit.history[dateKey]) {
            completedDue++;
          }
        }
      }
    }

    const ratio = totalDue > 0 ? completedDue / totalDue : 0;

    let level = 0;
    if (totalDue > 0) {
      if (ratio >= 1.0) level = 4;
      else if (ratio >= 0.75) level = 3;
      else if (ratio >= 0.50) level = 2;
      else if (ratio >= 0.25) level = 1;
      else level = 0;
    }

    return {
      day,
      dateKey,
      isCurrentMonth,
      isToday: isTodayCell,
      isFuture: isFutureCell,
      totalDue,
      completedDue,
      ratio,
      level,
    };
  });
}

/**
 * Centralized Reusable Due-Occasion Validator
 * Enforces:
 * 1. Valid YYYY-MM-DD format
 * 2. Date <= Today
 * 3. Date >= Habit Creation Date
 * 4. Scheduled weekday match
 * 5. Not after archivedAt when currently archived
 * 6. Not inside any historical archive interval [archivedAt, restoredAt)
 */
export function isHabitDueOnDate(
  habit: Habit,
  dateStr: string,
  todayStr: string = getTodayYMD()
): boolean {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  // 1. Cannot be in the future
  if (dateStr > todayStr) return false;

  // 2. Cannot be before creation date
  const createdAtYMD = getCleanDateYMD(habit.createdAt, todayStr);
  if (dateStr < createdAtYMD) return false;

  // 3. Must be a scheduled weekday
  const dateObj = parseYMDToLocalDate(dateStr);
  if (!dateObj) return false;
  const ftDayIndex = getFocusTrackDayIndex(dateObj);
  const scheduleDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
  if (!scheduleDays.includes(ftDayIndex)) return false;

  // 4. Current archive boundary check (archivedAt is INACTIVE starting on archivedAt date)
  if (habit.isArchived) {
    const archivedAtYMD = getCleanDateYMD(habit.archivedAt, todayStr);
    if (dateStr >= archivedAtYMD) return false;
  }

  // 5. Historical archive interval check (for restored habits)
  if (habit.archivedIntervals && habit.archivedIntervals.length > 0) {
    for (const interval of habit.archivedIntervals) {
      const archYMD = getCleanDateYMD(interval.archivedAt, todayStr);
      const restYMD = getCleanDateYMD(interval.restoredAt, todayStr);
      if (archYMD && restYMD && dateStr >= archYMD && dateStr < restYMD) {
        return false; // Habit was archived during this period
      }
    }
  }

  return true;
}

export function calculateHabitStats(
  habit: Habit,
  viewingYear?: number,
  viewingMonth?: number,
  todayStr: string = getTodayYMD()
): HabitStats {
  const createdAtYMD = getCleanDateYMD(habit.createdAt, todayStr);
  let monthDueCount = 0;
  let monthCompletedCount = 0;

  if (viewingYear !== undefined && viewingMonth !== undefined) {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatYMD(viewingYear, viewingMonth, d);
      if (isHabitDueOnDate(habit, dateKey, todayStr)) {
        monthDueCount++;
        if (habit.history[dateKey]) {
          monthCompletedCount++;
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

      if (isHabitDueOnDate(habit, dateKey, todayStr)) {
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

  // Streak Calculation (skipping unscheduled or non-due dates without resetting streak)
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

    if (isHabitDueOnDate(habit, dateKey, todayStr)) {
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

      if (isHabitDueOnDate(habit, dateKey, todayStr)) {
        weekDue++;
        if (habit.history[dateKey]) {
          weekCompleted++;
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

export function calculateTotalRepetitions(habits: Habit[], todayStr: string = getTodayYMD()): number {
  let total = 0;
  habits.forEach((h) => {
    Object.entries(h.history).forEach(([dateKey, val]) => {
      if (val && isHabitDueOnDate(h, dateKey, todayStr)) {
        total++;
      }
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
    const createdAtYMD = getCleanDateYMD(h.createdAt, todayStr);
    const startObj = parseYMDToLocalDate(createdAtYMD) || parseYMDToLocalDate(todayStr)!;
    const todayObj = parseYMDToLocalDate(todayStr)!;
    const cursor = new Date(startObj);

    while (cursor <= todayObj) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const d = cursor.getDate();
      const dateKey = formatYMD(y, m, d);

      if (isHabitDueOnDate(h, dateKey, todayStr)) {
        totalDue++;
        if (h.history[dateKey]) {
          totalCompleted++;
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
  } else if (selectedYear < currentYear) {
    // Last Sunday strictly belonging to selectedYear
    const endDec31 = new Date(selectedYear, 11, 31);
    const daysPastSunday = endDec31.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    endSunday = new Date(endDec31);
    endSunday.setDate(endSunday.getDate() - daysPastSunday);
  } else {
    endSunday = new Date(selectedYear, 11, 31);
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

      habits.forEach((h) => {
        if (isHabitDueOnDate(h, key, todayStr)) {
          dueCount++;
          if (h.history[key]) {
            completedCount++;
          }
        }
      });

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
      habits.forEach((h) => {
        if (isHabitDueOnDate(h, dateKey, todayStr)) {
          monthDue++;
          if (h.history[dateKey]) {
            monthCompleted++;
          }
        }
      });
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


