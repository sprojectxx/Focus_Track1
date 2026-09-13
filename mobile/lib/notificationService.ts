import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../types';

const STORAGE_PREFIX = 'focustrack.notification.ids.';
export const HABIT_REMINDER_CHANNEL = 'habit-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function notificationStorageKey(habitId: string) {
  return `${STORAGE_PREFIX}${habitId}`;
}

function androidWeekday(dayIndex: number) {
  // FocusTrack: 0=Monday ... 6=Sunday; Android: 1=Sunday ... 7=Saturday.
  return ((dayIndex + 1) % 7) + 1;
}

function parseTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(HABIT_REMINDER_CHANNEL, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [0, 200],
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getNotificationPermissionState() {
  return Notifications.getPermissionsAsync();
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (!habitId) return;

  // 1. Cancel IDs stored in AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(notificationStorageKey(habitId));
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      if (Array.isArray(ids) && ids.length > 0) {
        await Promise.allSettled(
          ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
        );
      }
    }
  } catch (err) {
    console.warn(`[notificationService] Error reading/cancelling stored IDs for habit ${habitId}:`, err);
  }

  // 2. Authoritative Native Check: Inspect all scheduled native notifications as safety net
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matching = scheduled.filter(
      (n) =>
        n.content.data?.type === 'habit-reminder' &&
        n.content.data?.habitId === habitId
    );

    if (matching.length > 0) {
      await Promise.allSettled(
        matching.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );
    }
  } catch (err) {
    console.warn(`[notificationService] Error checking native scheduled notifications for habit ${habitId}:`, err);
  }

  // 3. Remove AsyncStorage storage key
  try {
    await AsyncStorage.removeItem(notificationStorageKey(habitId));
  } catch (err) {
    console.warn(`[notificationService] Error removing storage key for habit ${habitId}:`, err);
  }
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
  // Always authoritatively cancel existing native reminders for habit.id first
  await cancelHabitReminder(habit.id);

  // M5 targets native Android first. iOS remote/local scheduling can be added without
  // changing the habit data model in a later platform pass.
  if (Platform.OS !== 'android') return;
  if (!habit.reminderEnabled || habit.isArchived) return;

  const time = parseTime(habit.reminderTime);
  if (!time || habit.scheduleDays.length === 0) return;

  const allowed = await requestNotificationPermission();
  if (!allowed) return;

  const ids: string[] = [];

  for (const dayIndex of habit.scheduleDays) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: habit.name,
        body: 'Your scheduled habit reminder is due.',
        data: { habitId: habit.id, type: 'habit-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: androidWeekday(dayIndex),
        hour: time.hour,
        minute: time.minute,
        channelId: HABIT_REMINDER_CHANNEL,
      },
    });
    ids.push(id);
  }

  await AsyncStorage.setItem(notificationStorageKey(habit.id), JSON.stringify(ids));
}

export async function syncHabitReminders(habits: Habit[]) {
  await configureNotifications();

  // STEP C: Build a set of valid active habit IDs (reminder enabled & not archived)
  const activeHabits = habits.filter((h) => h.reminderEnabled && !h.isArchived);
  const validHabitIds = new Set(activeHabits.map((h) => h.id));

  // STEP B & D: Inspect every native scheduled notification and cancel orphaned/inactive ones
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const orphanedOrInvalid = scheduled.filter((n) => {
      if (n.content.data?.type !== 'habit-reminder') return false;
      const habitId = n.content.data?.habitId as string | undefined;
      return !habitId || !validHabitIds.has(habitId);
    });

    if (orphanedOrInvalid.length > 0) {
      await Promise.allSettled(
        orphanedOrInvalid.map(async (n) => {
          const habitId = n.content.data?.habitId as string | undefined;
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
          if (habitId) {
            await AsyncStorage.removeItem(notificationStorageKey(habitId)).catch(() => {});
          }
        })
      );
    }
  } catch (err) {
    console.warn('[notificationService] Error during native notification cleanup in syncHabitReminders:', err);
  }

  // Also clean up any lingering AsyncStorage keys whose habitId is not in validHabitIds
  try {
    const keys = await AsyncStorage.getAllKeys();
    const notifKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
    for (const key of notifKeys) {
      const habitId = key.replace(STORAGE_PREFIX, '');
      if (!validHabitIds.has(habitId)) {
        await cancelHabitReminder(habitId);
      }
    }
  } catch (err) {
    console.warn('[notificationService] Error cleaning AsyncStorage keys in syncHabitReminders:', err);
  }

  // STEP E: Reschedule active valid habits cleanly
  for (const habit of activeHabits) {
    await scheduleHabitReminder(habit);
  }
}
