import { Habit } from '../types';
import {
  isHabitDueOnDate,
  calculateTotalRepetitions,
  calculateOverallConsistency,
  calculateOverallStreaks,
  getMonthlyConsistencyMatrix,
  calculateMonthlyRates,
} from './habitStats';

// Deterministic test fixture
const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Morning Workout',
    category: 'Fitness',
    priority: 'high',
    icon: 'barbell',
    scheduleDays: [0, 1, 2, 3, 4], // Weekdays
    scheduleType: 'weekdays',
    reminderEnabled: true,
    reminderTime: '07:00',
    history: {
      '2026-09-01': true,
      '2026-09-02': true,
      '2026-09-03': false,
      '2026-09-04': true,
      '2026-09-07': true,
      '2026-09-08': true,
    },
    focusMinutesPerSession: 30,
    isArchived: false,
    createdAt: '2026-09-01',
  },
  {
    id: 'habit-2',
    name: 'Read Books',
    category: 'Learning',
    priority: 'medium',
    icon: 'book',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    scheduleType: 'daily',
    reminderEnabled: false,
    reminderTime: '21:00',
    history: {
      '2026-09-01': true,
      '2026-09-02': true,
      '2026-09-03': true,
      '2026-09-04': true,
      '2026-09-05': true,
      '2026-09-06': true,
      '2026-09-07': true,
      '2026-09-08': true,
    },
    focusMinutesPerSession: 20,
    isArchived: false,
    createdAt: '2026-09-01',
  },
];

export function runParityValidation(): boolean {
  const todayStr = '2026-09-08';
  const timeZone = 'UTC';

  const reps = calculateTotalRepetitions(mockHabits, todayStr, timeZone);
  const consistency = calculateOverallConsistency(mockHabits, todayStr, timeZone);
  const streaks = calculateOverallStreaks(mockHabits, todayStr, timeZone);
  const matrix = getMonthlyConsistencyMatrix(mockHabits, 2026, 9, timeZone);
  const monthlyRates = calculateMonthlyRates(mockHabits, 2026, todayStr, timeZone);

  console.log('[Parity Test] Total Repetitions:', reps);
  console.log('[Parity Test] Consistency Rate:', consistency, '%');
  console.log('[Parity Test] Current Streak:', streaks.currentStreak, 'Best Streak:', streaks.bestStreak);
  console.log('[Parity Test] September Matrix Cells:', matrix.length);
  console.log('[Parity Test] September Monthly Rate:', monthlyRates[8].rate, '%');

  // Verify expectations:
  // habit 1: 5 completions out of 6 due weekdays = 5
  // habit 2: 8 completions out of 8 due daily = 8
  // Total reps = 13
  const expectedReps = 13;
  const passed = reps === expectedReps && consistency > 0 && matrix.length >= 28;

  if (!passed) {
    throw new Error(`Parity validation failed: expected ${expectedReps} reps, got ${reps}`);
  }

  return true;
}

if (typeof window !== 'undefined') {
  (window as any).__runParityValidation = runParityValidation;
}
