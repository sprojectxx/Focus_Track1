import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Habit } from '../types';
import { getTodayYMD, isToday, getElapsedDaysInMonth } from '../utils/date';
import {
  fetchUserHabits,
  toggleHabitCompletionInSupabase,
  createHabitInSupabase,
  updateHabitInSupabase,
  setHabitArchivedInSupabase,
  deleteHabitFromSupabase,
} from '../lib/habitService';

interface HabitContextType {
  habits: Habit[];
  activeHabits: Habit[];
  archivedHabits: Habit[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedDateStr: string;
  viewingYear: number;
  viewingMonth: number;
  
  // Actions
  refreshHabits: () => Promise<void>;
  toggleTodayHabit: (habitId: string) => Promise<void>;
  createHabit: (habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>) => Promise<void>;
  updateHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  
  // Stats
  stats: {
    todayDueCount: number;
    todayCompletedCount: number;
    todayCompletionRate: number;
    overallCompletion: number;
    currentStreak: number;
    bestStreak: number;
  };
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = getTodayYMD();
  const now = new Date();
  const [selectedDateStr] = useState<string>(todayStr);
  const [viewingYear] = useState<number>(now.getFullYear());
  const [viewingMonth] = useState<number>(now.getMonth() + 1);

  const loadHabits = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHabits([]);
        return;
      }

      const fetched = await fetchUserHabits(user.id);
      setHabits(fetched);
    } catch (err: any) {
      console.error('[HabitContext] Load habits error:', err);
      setError(err.message || 'Failed to load habit protocol data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadHabits();
      } else {
        setHabits([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadHabits]);

  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.isArchived), [habits]);

  // Toggle Today's Habit Completion with Optimistic UI Update & Error Rollback
  const toggleTodayHabit = async (habitId: string) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;

    const currentVal = !!target.history[todayStr];
    const newVal = !currentVal;

    // 1. Optimistic local update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          history: {
            ...h.history,
            [todayStr]: newVal,
          },
        };
      })
    );

    // 2. Sync mutation with Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User authentication session expired.');
      }

      await toggleHabitCompletionInSupabase(user.id, target, todayStr, newVal);
    } catch (err: any) {
      console.error('[HabitContext] Toggle error, rolling back:', err);
      // Rollback to previous state
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          return {
            ...h,
            history: {
              ...h.history,
              [todayStr]: currentVal,
            },
          };
        })
      );
      setError('Failed to sync completion state with server.');
    }
  };

  // Create Habit
  const createHabit = async (
    habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated.');

      const newHabit = await createHabitInSupabase(user.id, habitData);
      setHabits((prev) => [newHabit, ...prev]);
    } catch (err: any) {
      console.error('[HabitContext] Create habit error:', err);
      throw err;
    }
  };

  // Update Habit
  const updateHabit = async (habitId: string, habitData: Partial<Habit>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated.');

      await updateHabitInSupabase(user.id, habitId, habitData);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, ...habitData } : h))
      );
    } catch (err: any) {
      console.error('[HabitContext] Update habit error:', err);
      throw err;
    }
  };

  // Archive Habit
  const archiveHabit = async (habitId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated.');

      await setHabitArchivedInSupabase(user.id, habitId, true);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, isArchived: true } : h))
      );
    } catch (err: any) {
      console.error('[HabitContext] Archive error:', err);
      throw err;
    }
  };

  // Unarchive Habit
  const unarchiveHabit = async (habitId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated.');

      await setHabitArchivedInSupabase(user.id, habitId, false);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, isArchived: false } : h))
      );
    } catch (err: any) {
      console.error('[HabitContext] Unarchive error:', err);
      throw err;
    }
  };

  // Delete Habit
  const deleteHabit = async (habitId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated.');

      await deleteHabitFromSupabase(user.id, habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    } catch (err: any) {
      console.error('[HabitContext] Delete error:', err);
      throw err;
    }
  };

  // Computed Real Data Statistics
  const stats = useMemo(() => {
    const jsTodayDay = (now.getDay() + 6) % 7; // 0=Mon, ..., 6=Sun

    let todayDueCount = 0;
    let todayCompletedCount = 0;

    activeHabits.forEach((h) => {
      if (h.scheduleDays.includes(jsTodayDay)) {
        todayDueCount++;
        if (h.history[todayStr]) {
          todayCompletedCount++;
        }
      }
    });

    const todayCompletionRate =
      todayDueCount > 0 ? Math.round((todayCompletedCount / todayDueCount) * 100) : 0;

    // Monthly overall rate calculation
    const elapsedDays = getElapsedDaysInMonth(viewingYear, viewingMonth);
    let monthDueTotal = 0;
    let monthCompletedTotal = 0;

    for (let d = 1; d <= elapsedDays; d++) {
      const dStr = d.toString().padStart(2, '0');
      const mStr = viewingMonth.toString().padStart(2, '0');
      const dateKey = `${viewingYear}-${mStr}-${dStr}`;
      const dObj = new Date(viewingYear, viewingMonth - 1, d);
      const ftDayIdx = (dObj.getDay() + 6) % 7;

      activeHabits.forEach((h) => {
        if (h.scheduleDays.includes(ftDayIdx)) {
          monthDueTotal++;
          if (h.history[dateKey]) {
            monthCompletedTotal++;
          }
        }
      });
    }

    const overallCompletion =
      monthDueTotal > 0 ? Math.round((monthCompletedTotal / monthDueTotal) * 100) : 0;

    return {
      todayDueCount,
      todayCompletedCount,
      todayCompletionRate,
      overallCompletion,
      currentStreak: 0, // Computed per habit in HabitDetail
      bestStreak: 0,
    };
  }, [activeHabits, todayStr, viewingYear, viewingMonth, now]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        activeHabits,
        archivedHabits,
        loading,
        refreshing,
        error,
        selectedDateStr,
        viewingYear,
        viewingMonth,
        refreshHabits: () => loadHabits(true),
        toggleTodayHabit,
        createHabit,
        updateHabit,
        archiveHabit,
        unarchiveHabit,
        deleteHabit,
        stats,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
