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

export async function cancelHabitReminder(habitId: string) {
  const raw = await AsyncStorage.getItem(notificationStorageKey(habitId));
  if (!raw) return;

  const ids: string[] = JSON.parse(raw);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await AsyncStorage.removeItem(notificationStorageKey(habitId));
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
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
  // Cancel all existing scheduled notifications in the OS to prevent duplicates and orphaned alarms
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Clear existing stored IDs from AsyncStorage
  const keys = await AsyncStorage.getAllKeys();
  const notifKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
  if (notifKeys.length > 0) {
    await AsyncStorage.multiRemove(notifKeys);
  }

  for (const habit of habits) {
    await scheduleHabitReminder(habit);
  }
}
