import { supabase } from './supabase';
import { Habit } from '../types';
import { isToday, getTodayYMD } from '../utils/date';

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function fetchUserHabits(userId: string): Promise<Habit[]> {
  if (!userId) return [];

  const { data: habitsData, error: habitsErr } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (habitsErr) {
    console.error('[HabitService] Error fetching habits:', habitsErr);
    throw habitsErr;
  }

  if (!habitsData || habitsData.length === 0) {
    return [];
  }

  const { data: logsData, error: logsErr } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId);

  if (logsErr) {
    console.error('[HabitService] Error fetching habit logs:', logsErr);
  }

  const mapped: Habit[] = habitsData.map((h) => {
    const history: Record<string, boolean> = {};

    if (logsData) {
      logsData
        .filter((l) => l.habit_id === h.id)
        .forEach((l) => {
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
      archivedAt: h.archived_at ? h.archived_at.split('T')[0] : undefined,
      archivedIntervals: h.archived_intervals || undefined,
      createdAt: h.created_at ? h.created_at.split('T')[0] : getTodayYMD(),
      history,
    };
  });

  return mapped;
}

export async function toggleHabitCompletionInSupabase(
  userId: string,
  habit: Habit,
  dateStr: string,
  newValue: boolean
): Promise<void> {
  // STRICT TODAY-ONLY RULE
  if (!isToday(dateStr)) {
    throw new Error('Habit completion can only be toggled for today.');
  }

  if (!userId) {
    throw new Error('User authentication required.');
  }

  let activeHabitId = habit.id;

  if (!isUUID(activeHabitId)) {
    const { data: insertedHabit, error: insertErr } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name: habit.name,
        category: habit.category,
        category_label: habit.categoryLabel || habit.category,
        description: habit.description || '',
        priority: habit.priority || 'medium',
        icon: habit.icon || 'target',
        custom_image: habit.customImage || null,
        visual_type: habit.visualType || 'icon',
        schedule_days: habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6],
        schedule_type: habit.scheduleType || 'daily',
        reminder_enabled: habit.reminderEnabled || false,
        reminder_time: habit.reminderTime || '08:00',
        target_time: habit.targetTime || 'Morning',
        focus_minutes_per_session: habit.focusMinutesPerSession || 30,
        is_archived: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr || !insertedHabit) {
      throw insertErr || new Error('Failed to synchronize habit before logging completion.');
    }
    activeHabitId = insertedHabit.id;
  }

  if (newValue) {
    const { error: upsertErr } = await supabase.from('habit_logs').upsert(
      {
        habit_id: activeHabitId,
        user_id: userId,
        completed_date: dateStr,
        completed: true,
      },
      { onConflict: 'habit_id,completed_date' }
    );

    if (upsertErr) {
      throw upsertErr;
    }
  } else {
    const { error: delErr } = await supabase.from('habit_logs').delete().match({
      habit_id: activeHabitId,
      user_id: userId,
      completed_date: dateStr,
    });

    if (delErr) {
      throw delErr;
    }
  }
}

export async function createHabitInSupabase(
  userId: string,
  habitData: Omit<Habit, 'id' | 'history' | 'isArchived' | 'createdAt'>
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
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
    })
    .select()
    .single();

  if (error || !data) {
    throw error || new Error('Failed to create habit in database.');
  }

  return {
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
}

export async function updateHabitInSupabase(
  userId: string,
  habitId: string,
  habitData: Partial<Habit>
): Promise<void> {
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
  if (habitData.focusMinutesPerSession !== undefined)
    payload.focus_minutes_per_session = habitData.focusMinutesPerSession;

  const { error } = await supabase.from('habits').update(payload).match({ id: habitId, user_id: userId });

  if (error) {
    throw error;
  }
}

export async function setHabitArchivedInSupabase(
  userId: string,
  habitId: string,
  isArchived: boolean,
  currentHabit?: Habit,
  timeZone?: string
): Promise<{ archivedAt?: string; archivedIntervals?: Array<{ archivedAt: string; restoredAt: string }> }> {
  const todayYMD = getTodayYMD(timeZone);
  let updatePayload: Record<string, any> = { is_archived: isArchived };
  let newArchivedAt: string | undefined = undefined;
  let newArchivedIntervals: Array<{ archivedAt: string; restoredAt: string }> | undefined = currentHabit?.archivedIntervals;

  if (isArchived) {
    newArchivedAt = todayYMD;
    updatePayload.archived_at = new Date().toISOString();
  } else {
    // Restoring: archivedAt MUST exist and be valid
    const previousArchivedAt = currentHabit?.archivedAt ? currentHabit.archivedAt.slice(0, 10) : '';
    if (!previousArchivedAt || !/^\d{4}-\d{2}-\d{2}$/.test(previousArchivedAt)) {
      throw new Error('Cannot restore habit: archived boundary is missing.');
    }

    const closedInterval = { archivedAt: previousArchivedAt, restoredAt: todayYMD };
    newArchivedIntervals = [...(currentHabit?.archivedIntervals || []), closedInterval];
    updatePayload.archived_at = null;
    updatePayload.archived_intervals = newArchivedIntervals;
    newArchivedAt = undefined;
  }

  // Mandatory atomic Supabase update without silent fallback
  const { error } = await supabase
    .from('habits')
    .update(updatePayload)
    .match({ id: habitId, user_id: userId });

  if (error) {
    console.error('[HabitService] Failed to persist archive boundary:', error);
    throw error;
  }

  return { archivedAt: newArchivedAt, archivedIntervals: newArchivedIntervals };
}

export async function deleteHabitFromSupabase(userId: string, habitId: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().match({ id: habitId, user_id: userId });

  if (error) {
    throw error;
  }
}
