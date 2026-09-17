import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Habit, NavigationTab, UserProfile } from '../types';
import { INITIAL_USER_PROFILE } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { getRandomMottoString } from '../data/motivationalQuotes';
import { scheduleHabitReminder, cancelHabitReminder } from '../lib/notifications';
import { getTodayYMD, getElapsedDaysInMonth, isToday } from '../utils/date';
import { calculateOverallConsistency, calculateOverallStreaks } from '../utils/habitStats';

interface HabitContextType {
  habits: Habit[];
  activeHabits: Habit[];
  archivedHabits: Habit[];
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedHabitId: string | null;
  setSelectedHabitId: (id: string | null) => void;
  selectedHabit: Habit | null;
  
  // Date State
  currentDate: Date;
  viewingYear: number;
  viewingMonth: number; // 1-12
  selectedDateStr: string; // 'YYYY-MM-DD'
  setSelectedDateStr: (dateStr: string) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;
  setViewingMonthYear: (year: number, month: number) => void;

  // Habit Actions
  toggleHabitDay: (habitId: string, dateStr: string) => void;
  createHabit: (habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>) => void;
  updateHabit: (habitId: string, habitData: Partial<Habit>) => void;
  archiveHabit: (habitId: string) => void;
  unarchiveHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  
  // Modals & Panels
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  editingHabit: Habit | null;
  setEditingHabit: (habit: Habit | null) => void;
  isDailyPanelOpen: boolean;
  setIsDailyPanelOpen: (open: boolean) => void;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // Computed Metrics
  stats: {
    overallCompletion: number;
    daysTracked: number;
    totalDaysInMonth: number;
    currentStreak: number;
    bestStreak: number;
    totalCompletedSessions: number;
  };
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  resetToDefaults: () => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const HABITS_STORAGE_PREFIX = 'focustrack_habits_v1_';
const PROFILE_STORAGE_PREFIX = 'focustrack_profile_v1_';

export function getHabitsStorageKey(userId?: string | null): string | null {
  if (!userId) return null;
  return `${HABITS_STORAGE_PREFIX}${userId}`;
}

export function getProfileStorageKey(userId?: string | null): string | null {
  if (!userId) return null;
  return `${PROFILE_STORAGE_PREFIX}${userId}`;
}

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Real-time dynamic date initialization
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)
  const todayStr = getTodayYMD();

  const [currentDate] = useState<Date>(now);
  const [viewingYear, setViewingYear] = useState<number>(currentYear);
  const [viewingMonth, setViewingMonth] = useState<number>(currentMonth);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDailyPanelOpen, setIsDailyPanelOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);

  // Habits State
  const [habits, setHabits] = useState<Habit[]>([]);

  // Calculate canonical derived Discipline Score dynamically
  const derivedDisciplineScore = useMemo(() => {
    return calculateOverallConsistency(habits, todayStr);
  }, [habits, todayStr]);

  const effectiveUserProfile = useMemo(() => ({
    ...userProfile,
    disciplineScore: derivedDisciplineScore,
  }), [userProfile, derivedDisciplineScore]);

  // Handle Auth Account Switch & Supabase Sync
  useEffect(() => {
    if (!user?.id) {
      // User is signed out: clear all account-specific in-memory state immediately
      setHabits([]);
      setUserProfile(INITIAL_USER_PROFILE);
      setSelectedHabitId(null);
      setEditingHabit(null);
      setIsDailyPanelOpen(false);
      setIsNotificationOpen(false);
      setIsProfileModalOpen(false);
      return;
    }

    // User is signed in: clear previous user's habits immediately before fetching
    setHabits([]);
    setSelectedHabitId(null);
    setEditingHabit(null);

    // Load user-scoped local profile if available
    const profileKey = getProfileStorageKey(user.id);
    if (profileKey) {
      const cachedProf = localStorage.getItem(profileKey);
      if (cachedProf) {
        try {
          setUserProfile(JSON.parse(cachedProf));
        } catch {}
      }
    }

    // Load user-scoped cached habits for optimistic rendering
    const habitsKey = getHabitsStorageKey(user.id);
    if (habitsKey) {
      const cachedStr = localStorage.getItem(habitsKey);
      if (cachedStr) {
        try {
          const parsed: Habit[] = JSON.parse(cachedStr);
          setHabits(parsed.filter(h => !h.id.startsWith('habit-')));
        } catch {}
      }
    }

    if (!isSupabaseConfigured) return;

    // Fetch Profile from Supabase
    const fetchSupabaseProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setUserProfile({
            name: data.name || user.user_metadata?.full_name || 'Operator',
            title: data.title || 'TACTICAL OPERATOR',
            avatarUrl: data.avatar_url || user.user_metadata?.avatar_url || INITIAL_USER_PROFILE.avatarUrl,
            disciplineScore: 0,
            creed: data.creed || getRandomMottoString(),
          });
        } else {
          setUserProfile({
            name: user.user_metadata?.full_name || 'Operator',
            title: 'TACTICAL OPERATOR',
            avatarUrl: user.user_metadata?.avatar_url || INITIAL_USER_PROFILE.avatarUrl,
            disciplineScore: 0,
            creed: getRandomMottoString(),
          });
        }
      } catch (err) {
        console.error('[HabitContext] Profile fetch error:', err);
      }
    };

    // Fetch Habits & Logs from Supabase
    const fetchSupabaseHabits = async () => {
      try {
        const { data: habitsData, error: habitsErr } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (habitsErr) {
          console.error('[HabitContext] Fetch habits error:', habitsErr);
          // On fetch error: do not leave previous account data or fall back to un-scoped cache
          setHabits([]);
          return;
        }

        if (!habitsData || habitsData.length === 0) {
          // ALWAYS set empty array when authenticated account has 0 habits!
          setHabits([]);
          if (habitsKey) {
            localStorage.setItem(habitsKey, JSON.stringify([]));
          }
          return;
        }

        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id);

        // Read local history map ONLY from current user's storage key
        let localHistoryMap: Record<string, Record<string, boolean>> = {};
        if (habitsKey) {
          const savedLocal = localStorage.getItem(habitsKey);
          if (savedLocal) {
            try {
              const parsedLocal: Habit[] = JSON.parse(savedLocal);
              parsedLocal.forEach(h => {
                localHistoryMap[h.id] = h.history || {};
              });
            } catch {}
          }
        }

        const mapped: Habit[] = habitsData.map(h => {
          const history: Record<string, boolean> = {
            ...(localHistoryMap[h.id] || {}),
          };

          if (logsData) {
            logsData
              .filter(l => l.habit_id === h.id)
              .forEach(l => {
                history[l.completed_date] = l.completed;
              });
          }

          return {
            id: h.id,
            name: h.name,
            category: h.category || 'General',
            categoryLabel: h.category_label || h.category,
            description: h.description || '',
            priority: h.priority || 'medium',
            icon: h.icon || 'target',
            customImage: h.custom_image || undefined,
            visualType: (h.visual_type as 'icon' | 'image' | 'symbol') || 'icon',
            scheduleDays: h.schedule_days || [0, 1, 2, 3, 4, 5, 6],
            scheduleType: (h.schedule_type as 'daily' | 'weekdays' | 'weekends' | 'custom') || 'daily',
            reminderEnabled: h.reminder_enabled ?? false,
            reminderTime: h.reminder_time || '08:00',
            targetTime: h.target_time || 'Morning',
            focusMinutesPerSession: h.focus_minutes_per_session || 30,
            isArchived: h.is_archived ?? false,
            archivedAt: h.archived_at ? (h.archived_at.split('T')[0] || getTodayYMD()) : undefined,
            archivedIntervals: Array.isArray(h.archived_intervals) ? h.archived_intervals : [],
            createdAt: h.created_at ? (h.created_at.split('T')[0] || getTodayYMD()) : getTodayYMD(),
            history,
          };
        });

        setHabits(mapped);
      } catch (err) {
        console.error('[HabitContext] Failed to load habits from Supabase:', err);
        setHabits([]);
      }
    };

    fetchSupabaseProfile();
    fetchSupabaseHabits();
  }, [user?.id]);

  // Save to User-Scoped LocalStorage
  useEffect(() => {
    const key = getHabitsStorageKey(user?.id);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habits to localStorage', e);
    }
  }, [habits, user?.id]);

  useEffect(() => {
    const key = getProfileStorageKey(user?.id);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(userProfile));
    } catch (e) {
      console.error('Failed to save profile to localStorage', e);
    }
  }, [userProfile, user?.id]);

  // Schedule Reminders for active habits when habits change
  useEffect(() => {
    if (!user?.id) return;
    habits.forEach((h) => {
      if (!h.isArchived && h.reminderEnabled && h.reminderTime) {
        scheduleHabitReminder(h.id, h.name, h.reminderTime, h.scheduleDays, h.isArchived, h.reminderEnabled, 10);
      } else {
        cancelHabitReminder(h.id);
      }
    });
  }, [habits, user?.id]);

  const activeHabits = useMemo(() => habits.filter(h => !h.isArchived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.isArchived), [habits]);

  const selectedHabit = useMemo(() => {
    if (!selectedHabitId) return null;
    return habits.find(h => h.id === selectedHabitId) || null;
  }, [habits, selectedHabitId]);

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Date Navigation
  const nextMonth = () => {
    if (viewingMonth === 12) {
      setViewingMonth(1);
      setViewingYear(prev => prev + 1);
    } else {
      setViewingMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (viewingMonth === 1) {
      setViewingMonth(12);
      setViewingYear(prev => prev - 1);
    } else {
      setViewingMonth(prev => prev - 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const dStr = getTodayYMD();
    setViewingYear(y);
    setViewingMonth(m);
    setSelectedDateStr(dStr);
  };

  const setViewingMonthYear = (year: number, month: number) => {
    setViewingYear(year);
    setViewingMonth(month);
  };

  // Toggle Habit on a Specific Day (Synced with Supabase habit_logs)
  const toggleHabitDay = async (habitId: string, dateStr: string) => {
    if (!isToday(dateStr)) {
      console.warn('[HabitContext] Habit completion can only be toggled for today:', dateStr);
      return;
    }

    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const currentVal = !!targetHabit.history[dateStr];
    const newVal = !currentVal;

    // 1. Optimistic update to local state
    setHabits(prev =>
      prev.map(habit => {
        if (habit.id !== habitId) return habit;
        return {
          ...habit,
          history: {
            ...habit.history,
            [dateStr]: newVal,
          },
        };
      })
    );

    // 2. Sync with Supabase with strict rollback on failure
    if (isSupabaseConfigured && user?.id) {
      try {
        if (!isUUID(habitId)) {
          throw new Error('Cannot mutate habit log: invalid habit UUID.');
        }

        if (newVal) {
          const { error: upsertErr } = await supabase.from('habit_logs').upsert(
            {
              habit_id: habitId,
              user_id: user.id,
              completed_date: dateStr,
              completed: true,
            },
            { onConflict: 'habit_id,completed_date' }
          );

          if (upsertErr) {
            console.error('[HabitContext] Upsert log error:', upsertErr);
            // Rollback optimistic state
            setHabits(prev =>
              prev.map(h => h.id === habitId ? { ...h, history: { ...h.history, [dateStr]: currentVal } } : h)
            );
            alert(`Failed to save habit completion: ${upsertErr.message}`);
          }
        } else {
          const { error: delErr } = await supabase.from('habit_logs').delete().match({
            habit_id: habitId,
            user_id: user.id,
            completed_date: dateStr,
          });

          if (delErr) {
            console.error('[HabitContext] Delete log error:', delErr);
            // Rollback optimistic state
            setHabits(prev =>
              prev.map(h => h.id === habitId ? { ...h, history: { ...h.history, [dateStr]: currentVal } } : h)
            );
            alert(`Failed to remove habit completion: ${delErr.message}`);
          }
        }
      } catch (err: any) {
        console.error('[HabitContext] Sync habit log error:', err);
        setHabits(prev =>
          prev.map(h => h.id === habitId ? { ...h, history: { ...h.history, [dateStr]: currentVal } } : h)
        );
      }
    }
  };

  // Create Habit (Server-First Creation — No Phantom Habits!)
  const createHabit = async (habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>) => {
    let newHabit: Habit;

    if (isSupabaseConfigured && user?.id) {
      try {
        const { data, error } = await supabase.from('habits').insert({
          user_id: user.id,
          name: habitData.name,
          category: habitData.category,
          category_label: habitData.categoryLabel || habitData.category,
          description: habitData.description || '',
          priority: habitData.priority || 'medium',
          icon: habitData.icon || 'target',
          custom_image: habitData.customImage || null,
          visual_type: habitData.visualType || 'icon',
          schedule_days: habitData.scheduleDays || [0, 1, 2, 3, 4, 5, 6],
          schedule_type: habitData.scheduleType || 'daily',
          reminder_enabled: habitData.reminderEnabled ?? false,
          reminder_time: habitData.reminderTime || '08:00',
          target_time: habitData.targetTime || 'Morning',
          focus_minutes_per_session: habitData.focusMinutesPerSession || 30,
          is_archived: false,
          created_at: new Date().toISOString(),
        }).select().single();

        if (error || !data) {
          console.error('Failed to create habit in Supabase:', error);
          alert(`Failed to create habit: ${error?.message || 'Database insert error'}`);
          return; // Do NOT add phantom habit to local state!
        }

        newHabit = {
          id: data.id,
          name: data.name,
          category: data.category,
          categoryLabel: data.category_label,
          description: data.description,
          priority: data.priority,
          icon: data.icon,
          customImage: data.custom_image,
          visualType: data.visual_type,
          scheduleDays: data.schedule_days,
          scheduleType: data.schedule_type,
          reminderEnabled: data.reminder_enabled,
          reminderTime: data.reminder_time,
          targetTime: data.target_time,
          focusMinutesPerSession: data.focus_minutes_per_session,
          isArchived: false,
          createdAt: data.created_at ? data.created_at.split('T')[0] : getTodayYMD(),
          history: {},
        };
      } catch (err: any) {
        console.error('Failed to create habit in Supabase:', err);
        alert(`Failed to create habit: ${err.message || 'Network error'}`);
        return;
      }
    } else {
      newHabit = {
        ...habitData,
        id: generateUUID(),
        history: {},
        isArchived: false,
        createdAt: getTodayYMD(),
      };
    }

    setHabits(prev => [newHabit, ...prev]);
    setIsCreateModalOpen(false);
  };

  // Update Habit (Server-First Update with Rollback)
  const updateHabit = async (habitId: string, habitData: Partial<Habit>) => {
    const previousHabit = habits.find(h => h.id === habitId);
    if (!previousHabit) return;

    if (isSupabaseConfigured && user?.id) {
      try {
        const payload: Record<string, any> = {};
        if (habitData.name !== undefined) payload.name = habitData.name;
        if (habitData.category !== undefined) payload.category = habitData.category;
        if (habitData.categoryLabel !== undefined) payload.category_label = habitData.categoryLabel;
        if (habitData.description !== undefined) payload.description = habitData.description;
        if (habitData.priority !== undefined) payload.priority = habitData.priority;
        if (habitData.icon !== undefined) payload.icon = habitData.icon;
        if (habitData.customImage !== undefined) payload.custom_image = habitData.customImage;
        if (habitData.visualType !== undefined) payload.visual_type = habitData.visualType;
        if (habitData.scheduleDays !== undefined) payload.schedule_days = habitData.scheduleDays;
        if (habitData.scheduleType !== undefined) payload.schedule_type = habitData.scheduleType;
        if (habitData.reminderEnabled !== undefined) payload.reminder_enabled = habitData.reminderEnabled;
        if (habitData.reminderTime !== undefined) payload.reminder_time = habitData.reminderTime;
        if (habitData.targetTime !== undefined) payload.target_time = habitData.targetTime;
        if (habitData.focusMinutesPerSession !== undefined) payload.focus_minutes_per_session = habitData.focusMinutesPerSession;

        const { data, error } = await supabase.from('habits').update(payload).match({ id: habitId, user_id: user.id }).select();
        if (error || !data || data.length === 0) {
          throw error || new Error('Habit not found or update returned 0 affected rows.');
        }
      } catch (err: any) {
        console.error('Failed to update habit in Supabase:', err);
        alert(`Failed to update habit: ${err.message || 'Database error'}`);
        return;
      }
    }

    setHabits(prev => prev.map(h => (h.id === habitId ? { ...h, ...habitData } : h)));
    setEditingHabit(null);
    setIsCreateModalOpen(false);
  };

  // Archive / Unarchive / Delete (Canonical Interval Tracking & Server-First Rollbacks)
  const archiveHabit = async (habitId: string) => {
    const target = habits.find(h => h.id === habitId);
    if (!target) return;

    const todayYMD = getTodayYMD();
    const isoNow = new Date().toISOString();

    if (isSupabaseConfigured && user?.id) {
      try {
        const { data, error } = await supabase.from('habits').update({
          is_archived: true,
          archived_at: isoNow,
        }).match({ id: habitId, user_id: user.id }).select();

        if (error || !data || data.length === 0) {
          throw error || new Error('Failed to archive habit in database.');
        }
      } catch (err: any) {
        console.error('[HabitContext] Archive error:', err);
        alert(`Failed to archive habit: ${err.message || 'Database error'}`);
        return;
      }
    }

    await cancelHabitReminder(habitId);
    setHabits(prev =>
      prev.map(h => (h.id === habitId ? { ...h, isArchived: true, archivedAt: todayYMD } : h))
    );
    if (selectedHabitId === habitId) {
      setSelectedHabitId(null);
    }
  };

  const unarchiveHabit = async (habitId: string) => {
    const target = habits.find(h => h.id === habitId);
    if (!target) return;

    const todayYMD = getTodayYMD();
    const previousArchivedAt = target.archivedAt || todayYMD;
    const closedInterval = { archivedAt: previousArchivedAt, restoredAt: todayYMD };
    const newArchivedIntervals = [...(target.archivedIntervals || []), closedInterval];

    if (isSupabaseConfigured && user?.id) {
      try {
        const { data, error } = await supabase.from('habits').update({
          is_archived: false,
          archived_at: null,
          archived_intervals: newArchivedIntervals,
        }).match({ id: habitId, user_id: user.id }).select();

        if (error || !data || data.length === 0) {
          throw error || new Error('Failed to restore habit in database.');
        }
      } catch (err: any) {
        console.error('[HabitContext] Restore error:', err);
        alert(`Failed to restore habit: ${err.message || 'Database error'}`);
        return;
      }
    }

    setHabits(prev =>
      prev.map(h =>
        h.id === habitId
          ? { ...h, isArchived: false, archivedAt: undefined, archivedIntervals: newArchivedIntervals }
          : h
      )
    );
  };

  const deleteHabit = async (habitId: string) => {
    const previousHabits = [...habits];
    await cancelHabitReminder(habitId);

    if (isSupabaseConfigured && user?.id) {
      try {
        const { data, error } = await supabase.from('habits').delete().match({ id: habitId, user_id: user.id }).select();
        if (error) {
          throw error;
        }
      } catch (err: any) {
        console.error('[HabitContext] Delete habit error:', err);
        alert(`Failed to delete habit: ${err.message || 'Database error'}`);
        setHabits(previousHabits);
        return;
      }
    }

    setHabits(prev => prev.filter(h => h.id !== habitId));
    if (selectedHabitId === habitId) {
      setSelectedHabitId(null);
    }
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    const previousProfile = { ...userProfile };
    const updated = { ...userProfile, ...profile };
    setUserProfile(updated);

    if (isSupabaseConfigured && user?.id) {
      supabase.from('profiles').upsert({
        id: user.id,
        name: updated.name,
        title: updated.title,
        avatar_url: updated.avatarUrl,
        creed: updated.creed,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to persist profile to Supabase:', error);
          alert(`Failed to update profile: ${error.message}`);
          setUserProfile(previousProfile);
        }
      });
    }
  };

  const resetToDefaults = () => {
    cancelAllWebReminders();
    setHabits([]);
    setUserProfile(INITIAL_USER_PROFILE);
    if (user?.id) {
      const hKey = getHabitsStorageKey(user.id);
      const pKey = getProfileStorageKey(user.id);
      if (hKey) localStorage.removeItem(hKey);
      if (pKey) localStorage.removeItem(pKey);
    }
    goToToday();
  };

  // Computed Metrics for current viewing month
  const stats = useMemo(() => {
    const maxDayToCheck = getElapsedDaysInMonth(viewingYear, viewingMonth);
    let totalPossible = 0;
    let totalCompleted = 0;
    let daysWithAtLeastOne = 0;

    for (let d = 1; d <= maxDayToCheck; d++) {
      const dayStr = d.toString().padStart(2, '0');
      const monthStr = viewingMonth.toString().padStart(2, '0');
      const key = `${viewingYear}-${monthStr}-${dayStr}`;

      let dayHasCompletion = false;
      activeHabits.forEach(h => {
        totalPossible += 1;
        if (h.history[key]) {
          totalCompleted += 1;
          dayHasCompletion = true;
        }
      });
      if (dayHasCompletion) {
        daysWithAtLeastOne++;
      }
    }

    // Calculate total completed sessions and real streaks across all history
    let totalSessions = 0;

    habits.forEach(h => {
      Object.entries(h.history).forEach(([, completed]) => {
        if (completed) {
          totalSessions++;
        }
      });
    });

    const todayStr = getTodayYMD();
    const overallCompletion = calculateOverallConsistency(habits, todayStr);
    const overallStreaks = calculateOverallStreaks(habits, todayStr);

    return {
      overallCompletion,
      daysTracked: daysWithAtLeastOne,
      totalDaysInMonth: 30,
      currentStreak: overallStreaks.currentStreak,
      bestStreak: overallStreaks.bestStreak,
      totalCompletedSessions: totalSessions,
    };
  }, [activeHabits, habits, viewingYear, viewingMonth]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        activeHabits,
        archivedHabits,
        currentTab,
        setCurrentTab,
        selectedHabitId,
        setSelectedHabitId,
        selectedHabit,
        currentDate,
        viewingYear,
        viewingMonth,
        selectedDateStr,
        setSelectedDateStr,
        nextMonth,
        prevMonth,
        goToToday,
        setViewingMonthYear,
        toggleHabitDay,
        createHabit,
        updateHabit,
        archiveHabit,
        unarchiveHabit,
        deleteHabit,
        isCreateModalOpen,
        setIsCreateModalOpen,
        editingHabit,
        setEditingHabit,
        isDailyPanelOpen,
        setIsDailyPanelOpen,
        isNotificationOpen,
        setIsNotificationOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        stats,
        userProfile: effectiveUserProfile,
        updateUserProfile,
        resetToDefaults,
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
