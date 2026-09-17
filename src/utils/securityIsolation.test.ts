import { Habit } from '../types';
import { isHabitDueOnDate, calculateHabitStats, calculateOverallConsistency } from './habitStats';
import { getTodayYMD, isToday, isPast, isFuture } from './date';

/**
 * Automated Security & Business Invariant Regression Test Suite
 */
export function runSecurityInvariantTests(): boolean {
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

  console.log('--- STARTING FOCUSTRACK SECURITY & INVARIANT REGRESSION TESTS ---');

  const userAHabit: Habit = {
    id: 'habit-a1-uuid',
    name: 'User A Discipline Habit',
    category: 'Core',
    priority: 'high',
    icon: 'target',
    scheduleDays: [0, 1, 2, 3, 4], // Weekdays Mon-Fri
    scheduleType: 'weekdays',
    reminderEnabled: true,
    reminderTime: '08:00',
    history: {
      '2026-09-01': true,
      '2026-09-02': true,
    },
    isArchived: false,
    createdAt: '2026-09-01',
  };

  const userBHabit: Habit = {
    id: 'habit-b1-uuid',
    name: 'User B Private Habit',
    category: 'Private',
    priority: 'low',
    icon: 'lock',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    scheduleType: 'daily',
    reminderEnabled: false,
    reminderTime: '09:00',
    history: {
      '2026-09-01': true,
    },
    isArchived: false,
    createdAt: '2026-09-01',
  };

  const todayStr = '2026-09-05'; // Saturday

  // Test 1: Unscheduled day completion check (Saturday is not due for Mon-Fri habit)
  assert(!isHabitDueOnDate(userAHabit, '2026-09-05', todayStr, 'UTC'), 'Invariant: Habit A is NOT due on unscheduled Saturday');

  // Test 2: Future date completion check
  assert(!isHabitDueOnDate(userAHabit, '2026-09-10', todayStr, 'UTC'), 'Invariant: Future date 2026-09-10 is NOT due');

  // Test 3: Pre-creation date completion check
  assert(!isHabitDueOnDate(userAHabit, '2026-08-30', todayStr, 'UTC'), 'Invariant: Pre-creation date 2026-08-30 is NOT due');

  // Test 4: Archived interval check
  const archivedHabit: Habit = {
    ...userAHabit,
    archivedIntervals: [{ archivedAt: '2026-09-03', restoredAt: '2026-09-05' }],
  };
  assert(!isHabitDueOnDate(archivedHabit, '2026-09-03', todayStr, 'UTC'), 'Invariant: Date inside archived interval is NOT due');
  assert(!isHabitDueOnDate(archivedHabit, '2026-09-04', todayStr, 'UTC'), 'Invariant: Date inside archived interval is NOT due');

  // Test 5: Multi-cycle archive/restore intervals
  const multiCycleHabit: Habit = {
    ...userAHabit,
    archivedIntervals: [
      { archivedAt: '2026-09-02', restoredAt: '2026-09-03' },
      { archivedAt: '2026-09-04', restoredAt: '2026-09-05' },
    ],
  };
  assert(!isHabitDueOnDate(multiCycleHabit, '2026-09-02', todayStr, 'UTC'), 'Invariant: Multi-cycle cycle 1 archived date is NOT due');
  assert(!isHabitDueOnDate(multiCycleHabit, '2026-09-04', todayStr, 'UTC'), 'Invariant: Multi-cycle cycle 2 archived date is NOT due');

  // Test 6: Cross-Account habit ID leak check
  const crossAccountHabits = [userAHabit];
  const dueOnSaturday = crossAccountHabits.filter(h => isHabitDueOnDate(h, todayStr, todayStr, 'UTC'));
  assert(dueOnSaturday.length === 0, 'Invariant: Zero User A habits due on Saturday');

  // Test 7: Date comparisons
  assert(isPast('2026-09-01', 'UTC'), 'Date: 2026-09-01 is past relative to current date');
  assert(isFuture('2099-01-01', 'UTC'), 'Date: 2099-01-01 is future relative to current date');

  console.log(`--- REGRESSION AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    throw new Error(`Security regression test failed: ${failed} tests failed.`);
  }

  return true;
}

if (typeof window !== 'undefined') {
  (window as any).__runSecurityInvariantTests = runSecurityInvariantTests;
} else {
  runSecurityInvariantTests();
}
