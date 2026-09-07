import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Habit } from '../types';
import { getTodayYMD, isToday, getElapsedDaysInMonth, getDeviceTimeZone } from '../utils/date';
import { syncUserTimeZone } from '../lib/profileService';
import { syncHabitReminders, scheduleHabitReminder, cancelHabitReminder } from '../lib/notificationService';
import { calculateOverallConsistency } from '../utils/habitStats';
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
  refreshHabits: () => Promise<void>;
  toggleTodayHabit: (habitId: string) => Promise<void>;
  createHabit: (habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>) => Promise<void>;
  updateHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
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

  const timeZone = getDeviceTimeZone();
  const todayStr = getTodayYMD(timeZone);
  const now = new Date();
  const [selectedDateStr] = useState<string>(todayStr);
  const [viewingYear] = useState<number>(now.getFullYear());
  const [viewingMonth] = useState<number>(now.getMonth() + 1);

  const loadHabits = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHabits([]);
        return;
      }

      await syncUserTimeZone(user.id);
      const fetched = await fetchUserHabits(user.id);
      setHabits(fetched);

      // Keep local reminders aligned with the server-backed habit configuration.
      try {
        await syncHabitReminders(fetched);
      } catch (notificationError) {
        console.warn('[HabitContext] Notification sync skipped:', notificationError);
      }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadHabits();
      else setHabits([]);
    });

    return () => subscription.unsubscribe();
  }, [loadHabits]);

  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.isArchived), [habits]);

  const toggleTodayHabit = async (habitId: string) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;

    const currentVal = !!target.history[todayStr];
    const newVal = !currentVal;

    setHabits((prev) => prev.map((h) => h.id === habitId
      ? { ...h, history: { ...h.history, [todayStr]: newVal } }
      : h));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User authentication session expired.');
      await toggleHabitCompletionInSupabase(user.id, target, todayStr, newVal);
    } catch (err: any) {
      console.error('[HabitContext] Toggle error, rolling back:', err);
      setHabits((prev) => prev.map((h) => h.id === habitId
        ? { ...h, history: { ...h.history, [todayStr]: currentVal } }
        : h));
      setError('Failed to sync completion state with server.');
    }
  };

  const createHabit = async (habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');
      const newHabit = await createHabitInSupabase(user.id, habitData);
      setHabits((prev) => [newHabit, ...prev]);
      try { await scheduleHabitReminder(newHabit); } catch (notificationError) {
        console.warn('[HabitContext] New habit reminder could not be scheduled:', notificationError);
      }
    } catch (err: any) {
      console.error('[HabitContext] Create habit error:', err);
      throw err;
    }
  };

  const updateHabit = async (habitId: string, habitData: Partial<Habit>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');
      await updateHabitInSupabase(user.id, habitId, habitData);
      const updatedHabit = habits.find((h) => h.id === habitId);
      const mergedHabit = updatedHabit ? { ...updatedHabit, ...habitData } : null;
      setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, ...habitData } : h));
      if (mergedHabit) {
        try { await scheduleHabitReminder(mergedHabit); } catch (notificationError) {
          console.warn('[HabitContext] Updated habit reminder could not be scheduled:', notificationError);
        }
      }
    } catch (err: any) {
      console.error('[HabitContext] Update habit error:', err);
      throw err;
    }
  };

  const archiveHabit = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');
      const current = habits.find((h) => h.id === habitId);
      const { archivedAt } = await setHabitArchivedInSupabase(user.id, habitId, true, current);
      await cancelHabitReminder(habitId);
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, isArchived: true, archivedAt: archivedAt || new Date().toISOString().split('T')[0] } : h
        )
      );
    } catch (err: any) {
      console.error('[HabitContext] Archive error:', err);
      throw err;
    }
  };

  const unarchiveHabit = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');
      const target = habits.find((h) => h.id === habitId);
      const { archivedIntervals } = await setHabitArchivedInSupabase(user.id, habitId, false, target);
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, isArchived: false, archivedAt: undefined, archivedIntervals: archivedIntervals || h.archivedIntervals }
            : h
        )
      );
      if (target) {
        try { await scheduleHabitReminder({ ...target, isArchived: false }); } catch (notificationError) {
          console.warn('[HabitContext] Restored habit reminder could not be scheduled:', notificationError);
        }
      }
    } catch (err: any) {
      console.error('[HabitContext] Unarchive error:', err);
      throw err;
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');
      await deleteHabitFromSupabase(user.id, habitId);
      await cancelHabitReminder(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    } catch (err: any) {
      console.error('[HabitContext] Delete error:', err);
      throw err;
    }
  };

  const stats = useMemo(() => {
    const jsTodayDay = (now.getDay() + 6) % 7;
    let todayDueCount = 0;
    let todayCompletedCount = 0;

    activeHabits.forEach((h) => {
      if (h.scheduleDays.includes(jsTodayDay)) {
        todayDueCount++;
        if (h.history[todayStr]) todayCompletedCount++;
      }
    });

    const todayCompletionRate = todayDueCount > 0 ? Math.round((todayCompletedCount / todayDueCount) * 100) : 0;
    const overallCompletion = calculateOverallConsistency(habits, todayStr);

    return {
      todayDueCount,
      todayCompletedCount,
      todayCompletionRate,
      overallCompletion,
      currentStreak: 0,
      bestStreak: 0,
    };
  }, [activeHabits, habits, todayStr, now]);

  return (
    <HabitContext.Provider value={{ habits, activeHabits, archivedHabits, loading, refreshing, error, selectedDateStr, viewingYear, viewingMonth, refreshHabits: () => loadHabits(true), toggleTodayHabit, createHabit, updateHabit, archiveHabit, unarchiveHabit, deleteHabit, stats }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within a HabitProvider');
  return context;
};
