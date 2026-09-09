import { Habit } from '../types';
import {
  getTodayYMD,
  getDaysInMonth,
  formatYMD,
  isToday,
  isFuture,
} from './date';

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function parseYMDToLocalDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

export function getFocusTrackDayIndex(date: Date): number {
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return (jsDay + 6) % 7; // 0=Mon, ..., 6=Sun
}

function getCleanDateYMD(
  dateStr?: string,
  timeZone: string = getDeviceTimeZone(),
  fallbackTodayStr?: string
): string {
  const fallback = fallbackTodayStr || getTodayYMD();
  if (!dateStr || typeof dateStr !== 'string') return fallback;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return trimmed.split('T')[0] || fallback;
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
 * Centralized Reusable Due-Occasion Validator (Authoritative Business Rules)
 */
export function isHabitDueOnDate(
  habit: Habit,
  dateStr: string,
  todayStr: string = getTodayYMD(),
  timeZone: string = getDeviceTimeZone()
): boolean {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  // 1. Cannot be in the future
  if (dateStr > todayStr) return false;

  // 2. Cannot be before creation date
  const createdAtYMD = getCleanDateYMD(habit.createdAt, timeZone, todayStr);
  if (dateStr < createdAtYMD) return false;

  // 3. Must be a scheduled weekday
  const dateObj = parseYMDToLocalDate(dateStr);
  if (!dateObj) return false;
  const ftDayIndex = getFocusTrackDayIndex(dateObj);
  const scheduleDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
  if (!scheduleDays.includes(ftDayIndex)) return false;

  // 4. Current archive boundary check
  if (habit.isArchived) {
    const archivedAtYMD = getCleanDateYMD(habit.archivedAt, timeZone, todayStr);
    if (dateStr >= archivedAtYMD) return false;
  }

  // 5. Historical archive interval check
  if (habit.archivedIntervals && habit.archivedIntervals.length > 0) {
    for (const interval of habit.archivedIntervals) {
      const archYMD = getCleanDateYMD(interval.archivedAt, timeZone, todayStr);
      const restYMD = getCleanDateYMD(interval.restoredAt, timeZone, todayStr);
      if (archYMD && restYMD && dateStr >= archYMD && dateStr < restYMD) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculate Monthly Consistency Matrix for Web/Widget/Mobile parity.
 */
export function getMonthlyConsistencyMatrix(
  habits: Habit[],
  year: number,
  month: number,
  timeZone: string = getDeviceTimeZone()
): MonthlyConsistencyCell[] {
  const todayStr = getTodayYMD();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayObj = new Date(year, month - 1, 1);
  const firstDayWeekday = getFocusTrackDayIndex(firstDayObj); // 0=Mon, ..., 6=Sun

  const matrix: MonthlyConsistencyCell[] = [];

  // Padding days from previous month
  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthDays = getDaysInMonth(prevMonthYear, prevMonth);

  for (let p = firstDayWeekday - 1; p >= 0; p--) {
    const dayNum = prevMonthDays - p;
    const dateKey = formatYMD(prevMonthYear, prevMonth, dayNum);
    matrix.push({
      day: dayNum,
      dateKey,
      isCurrentMonth: false,
      isToday: isToday(dateKey),
      isFuture: isFuture(dateKey),
      totalDue: 0,
      completedDue: 0,
      ratio: 0,
      level: 0,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatYMD(year, month, d);
    const isTodayCell = isToday(dateKey);
    const isFutureCell = isFuture(dateKey);

    let totalDue = 0;
    let completedDue = 0;

    if (!isFutureCell) {
      for (const habit of habits) {
        if (isHabitDueOnDate(habit, dateKey, todayStr, timeZone)) {
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

    matrix.push({
      day: d,
      dateKey,
      isCurrentMonth: true,
      isToday: isTodayCell,
      isFuture: isFutureCell,
      totalDue,
      completedDue,
      ratio,
      level,
    });
  }

  // Padding days for next month to complete 7-column grid
  const remainingCells = (7 - (matrix.length % 7)) % 7;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  for (let n = 1; n <= remainingCells; n++) {
    const dateKey = formatYMD(nextMonthYear, nextMonth, n);
    matrix.push({
      day: n,
      dateKey,
      isCurrentMonth: false,
      isToday: isToday(dateKey),
      isFuture: isFuture(dateKey),
      totalDue: 0,
      completedDue: 0,
      ratio: 0,
      level: 0,
    });
  }

  return matrix;
}

export function calculateHabitStats(
  habit: Habit,
  viewingYear?: number,
  viewingMonth?: number,
  todayStr: string = getTodayYMD(),
  timeZone: string = getDeviceTimeZone()
): HabitStats {
  const createdAtYMD = getCleanDateYMD(habit.createdAt, timeZone, todayStr);
  let monthDueCount = 0;
  let monthCompletedCount = 0;

  if (viewingYear !== undefined && viewingMonth !== undefined) {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatYMD(viewingYear, viewingMonth, d);
      if (isHabitDueOnDate(habit, dateKey, todayStr, timeZone)) {
        monthDueCount++;
        if (habit.history[dateKey]) {
          monthCompletedCount++;
        }
      }
    }
  } else {
    const startObj = parseYMDToLocalDate(createdAtYMD) || parseYMDToLocalDate(todayStr)!;
    const todayObj = parseYMDToLocalDate(todayStr)!;
    const current = new Date(startObj);

    while (current <= todayObj) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const d = current.getDate();
      const dateKey = formatYMD(y, m, d);

      if (isHabitDueOnDate(habit, dateKey, todayStr, timeZone)) {
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

    if (isHabitDueOnDate(habit, dateKey, todayStr, timeZone)) {
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

      if (isHabitDueOnDate(habit, dateKey, todayStr, timeZone)) {
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

export function calculateTotalRepetitions(
  habits: Habit[],
  todayStr: string = getTodayYMD(),
  timeZone: string = getDeviceTimeZone()
): number {
  let total = 0;
  habits.forEach((h) => {
    Object.entries(h.history).forEach(([dateKey, val]) => {
      if (val && isHabitDueOnDate(h, dateKey, todayStr, timeZone)) {
        total++;
      }
    });
  });
  return total;
}

export function calculateOverallConsistency(
  habits: Habit[],
  todayStr: string = getTodayYMD(),
  timeZone: string = getDeviceTimeZone()
): number {
  let totalDue = 0;
  let totalCompleted = 0;

  habits.forEach((h) => {
    const createdAtYMD = getCleanDateYMD(h.createdAt, timeZone, todayStr);
    const startObj = parseYMDToLocalDate(createdAtYMD) || parseYMDToLocalDate(todayStr)!;
    const todayObj = parseYMDToLocalDate(todayStr)!;
    const cursor = new Date(startObj);

    while (cursor <= todayObj) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const d = cursor.getDate();
      const dateKey = formatYMD(y, m, d);

      if (isHabitDueOnDate(h, dateKey, todayStr, timeZone)) {
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
