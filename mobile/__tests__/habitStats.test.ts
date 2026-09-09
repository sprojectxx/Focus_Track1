import { Habit } from '../types';
import {
  isHabitDueOnDate,
  calculateHabitStats,
  calculateOverallConsistency,
  calculateTotalRepetitions,
  calculateOverallStreaks,
} from '../utils/habitStats';

// Simple lightweight test runner for deterministic audit
function runAuditTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${description}`);
      failed++;
    }
  }

  console.log('--- STARTING HABIT STATS DETERMINISTIC AUDIT ---');

  const baseHabit: Habit = {
    id: 'habit-1',
    name: 'Daily Workout',
    category: 'FITNESS',
    priority: 'medium',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    icon: 'barbell-outline',
    focusMinutesPerSession: 30,
    reminderEnabled: true,
    reminderTime: '08:00',
    history: {},
    isArchived: false,
    createdAt: '2026-09-01',
  };

  const todayStr = '2026-09-05'; // Saturday
  const timeZone = 'UTC';

  // Test 1: Daily Habit 5 consecutive completed days (Sept 1 to Sept 5)
  const habit1: Habit = {
    ...baseHabit,
    history: {
      '2026-09-01': true, // Tue
      '2026-09-02': true, // Wed
      '2026-09-03': true, // Thu
      '2026-09-04': true, // Fri
      '2026-09-05': true, // Sat
    },
  };
  const stats1 = calculateHabitStats(habit1, undefined, undefined, todayStr, timeZone);
  assert(stats1.currentStreak === 5, 'Scenario 1: Daily habit streak = 5 when all 5 days completed');
  assert(stats1.bestStreak === 5, 'Scenario 1: Best streak = 5');

  // Test 2: Weekday Habit (Mon-Fri) completed Mon-Fri, checked on Saturday (unscheduled)
  const habit2: Habit = {
    ...baseHabit,
    scheduleDays: [0, 1, 2, 3, 4], // Mon to Fri
    createdAt: '2026-08-31', // Mon Aug 31
    history: {
      '2026-08-31': true, // Mon
      '2026-09-01': true, // Tue
      '2026-09-02': true, // Wed
      '2026-09-03': true, // Thu
      '2026-09-04': true, // Fri
    },
  };
  const stats2 = calculateHabitStats(habit2, undefined, undefined, todayStr, timeZone);
  assert(stats2.currentStreak === 5, 'Scenario 2: Weekday habit streak preserved at 5 on unscheduled Saturday');

  // Test 3: Custom Schedule (Mon, Wed, Fri) completed Mon, Wed, Fri
  const habit3: Habit = {
    ...baseHabit,
    scheduleDays: [0, 2, 4], // Mon, Wed, Fri
    createdAt: '2026-08-31',
    history: {
      '2026-08-31': true, // Mon
      '2026-09-02': true, // Wed
      '2026-09-04': true, // Fri
    },
  };
  const stats3 = calculateHabitStats(habit3, undefined, undefined, todayStr, timeZone);
  assert(stats3.currentStreak === 3, 'Scenario 3: Custom schedule streak = 3');

  // Test 4: Missed due day (Wed missed)
  const habit4: Habit = {
    ...baseHabit,
    history: {
      '2026-09-01': true, // Tue
      '2026-09-02': true, // Wed
      '2026-09-03': false, // Thu missed
      '2026-09-04': true, // Fri
      '2026-09-05': true, // Sat
    },
  };
  const stats4 = calculateHabitStats(habit4, undefined, undefined, todayStr, timeZone);
  assert(stats4.currentStreak === 2, 'Scenario 4: Missed day resets current streak to 2 (Fri, Sat)');
  assert(stats4.bestStreak === 2, 'Scenario 4: Best streak = 2');

  // Test 5: Incomplete Today (Mon-Fri completed, Sat today incomplete)
  const habit5: Habit = {
    ...baseHabit,
    history: {
      '2026-09-01': true,
      '2026-09-02': true,
      '2026-09-03': true,
      '2026-09-04': true,
      // 2026-09-05 today is incomplete
    },
  };
  const stats5 = calculateHabitStats(habit5, undefined, undefined, todayStr, timeZone);
  assert(stats5.currentStreak === 4, 'Scenario 5: Incomplete today preserves streak from yesterday at 4');

  // Test 6: Habit Created Mid-Week (Created Sept 3)
  const habit6: Habit = {
    ...baseHabit,
    createdAt: '2026-09-03',
    history: {
      '2026-09-03': true, // Thu
      '2026-09-04': true, // Fri
      '2026-09-05': true, // Sat
    },
  };
  const stats6 = calculateHabitStats(habit6, undefined, undefined, todayStr, timeZone);
  assert(stats6.currentStreak === 3, 'Scenario 6: Mid-week creation streak = 3');

  // Test 7: Archive Interval (Habit archived on Wed, restored on Fri)
  const habit7: Habit = {
    ...baseHabit,
    createdAt: '2026-09-01',
    archivedIntervals: [{ archivedAt: '2026-09-03', restoredAt: '2026-09-04' }],
    history: {
      '2026-09-01': true, // Tue
      '2026-09-02': true, // Wed
      // Sept 3 archived
      '2026-09-04': true, // Fri
      '2026-09-05': true, // Sat
    },
  };
  assert(!isHabitDueOnDate(habit7, '2026-09-03', todayStr, timeZone), 'Scenario 7: Date inside archived interval is not due');
  const stats7 = calculateHabitStats(habit7, undefined, undefined, todayStr, timeZone);
  assert(stats7.currentStreak === 4, 'Scenario 7: Archive interval does not break streak across archived day (streak = 4)');

  // Test 8: Total Repetitions & Overall Consistency Calculation
  const totalReps = calculateTotalRepetitions([habit1, habit2], todayStr, timeZone);
  assert(totalReps === 10, 'Scenario 8: Total repetitions across habits = 10');

  const overallStreaks = calculateOverallStreaks([habit1, habit4], todayStr, timeZone);
  assert(overallStreaks.currentStreak === 5, 'Scenario 8: Overall current streak takes max across active habits = 5');
  assert(overallStreaks.bestStreak === 5, 'Scenario 8: Overall best streak = 5');

  console.log(`--- AUDIT FINISHED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) throw new Error('Test failure detected');
}

runAuditTests();
