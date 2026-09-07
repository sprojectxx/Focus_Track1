import { Habit, HabitStats } from '../types';
import { getTodayYMD, getDaysInMonth, getFocusTrackDayIndex, formatYMD } from './date';

function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d);
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateHabitStats(
  habit: Habit,
  viewingYear?: number,
  viewingMonth?: number,
  todayStr: string = getTodayYMD()
): HabitStats {
  const todayDate = parseDateKey(todayStr);

  let startDate = parseDateKey(habit.createdAt || todayStr);
  if (isNaN(startDate.getTime()) || startDate > todayDate) {
    startDate = new Date(todayDate);
  }

  const scheduleDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];

  let monthDueCount = 0;
  let monthCompletedCount = 0;

  if (viewingYear !== undefined && viewingMonth !== undefined) {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = d.toString().padStart(2, '0');
      const mStr = viewingMonth.toString().padStart(2, '0');
      const dateKey = `${viewingYear}-${mStr}-${dStr}`;
      const dateObj = parseDateKey(dateKey);

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

  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

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
        if (!isTodayScan) {
          runningStreak = 0;
        }
      }
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }
  currentStreak = runningStreak;

  const trajectoryBars: Array<{
    week: string;
    value: number;
    height: string;
    isEmpty: boolean;
  }> = [];

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

export function calculateTotalRepetitions(habits: Habit[]): number {
  let total = 0;
  habits.forEach((h) => {
    Object.values(h.history).forEach((val) => {
      if (val) total++;
    });
  });
  return total;
}

export interface HeatmapCell {
  dateStr: string;
  count: number;
  level: number; // 0 to 4
}

export function calculateHeatmapWeeks(habits: Habit[], selectedYear: number): HeatmapCell[][] {
  const weeks: HeatmapCell[][] = [];
  const startDate = new Date(selectedYear, 0, 1);
  const dayOfWeek = (startDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const current = new Date(startDate);
  current.setDate(current.getDate() - dayOfWeek);

  for (let w = 0; w < 53; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const year = current.getFullYear();
      const monthStr = (current.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = current.getDate().toString().padStart(2, '0');
      const key = `${year}-${monthStr}-${dayStr}`;

      let completedCount = 0;
      habits.forEach((h) => {
        if (h.history[key]) completedCount++;
      });

      let level = 0;
      if (completedCount >= 4) level = 4;
      else if (completedCount === 3) level = 3;
      else if (completedCount === 2) level = 2;
      else if (completedCount === 1) level = 1;

      week.push({
        dateStr: key,
        count: completedCount,
        level,
      });

      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getFullYear() > selectedYear && w >= 51) break;
  }
  return weeks;
}

export interface MonthlyRate {
  month: string;
  rate: number;
}

export function calculateMonthlyRates(habits: Habit[], selectedYear: number): MonthlyRate[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((monthName, monthIndex) => {
    const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
    let monthCompleted = 0;
    let monthTotalPossible = habits.length * daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      habits.forEach((h) => {
        if (h.history[dateKey]) monthCompleted++;
      });
    }

    const rate = monthTotalPossible > 0 ? Math.round((monthCompleted / monthTotalPossible) * 100) : 0;
    return { month: monthName, rate };
  });
}
