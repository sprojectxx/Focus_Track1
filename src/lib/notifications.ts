import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface NotificationService {
  isNative: boolean;
  initPushNotifications: (userId: string) => Promise<string | null>;
  requestWebNotificationPermission: () => Promise<boolean>;
  scheduleHabitReminder: (
    habitId: string,
    habitName: string,
    timeStr: string,
    scheduleDays?: number[],
    isArchived?: boolean,
    reminderEnabled?: boolean,
    advanceMinutes?: number
  ) => Promise<void>;
  cancelHabitReminder: (habitId: string) => Promise<void>;
  cancelAllWebReminders: () => void;
}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
  messagingUrl: import.meta.env.VITE_FIREBASE_MESSAGING_URL || 'https://fcm.googleapis.com/fcm/send',
};

// Global store of scheduled Web Notification timers
const activeWebNotificationTimers: Map<string, number[]> = new Map();

/**
 * Cancel all active web notification timers (used during logout / account switch)
 */
export const cancelAllWebReminders = (): void => {
  activeWebNotificationTimers.forEach((timers) => {
    timers.forEach((tId) => clearTimeout(tId));
  });
  activeWebNotificationTimers.clear();
  console.log('[WebNotification] Cancelled all active web notification timers.');
};

/**
 * Initialize Web Browser Notifications (for Web Application)
 */
export const requestWebNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('[WebNotification] Browser does not support web notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Initialize Web Notifications
 */
export const initPushNotifications = async (_userId: string): Promise<string | null> => {
  await requestWebNotificationPermission();
  return null;
};

/**
 * Helper to calculate 10-minute advance time string & Date
 */
export const getAdvanceTimeString = (timeStr: string, advanceMinutes = 10): { advanceTimeStr: string; scheduledDate: Date; advanceDate: Date } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();

  const scheduledDate = new Date();
  scheduledDate.setHours(hours, minutes, 0, 0);

  const advanceDate = new Date(scheduledDate.getTime() - advanceMinutes * 60 * 1000);

  if (advanceDate <= now) {
    advanceDate.setDate(advanceDate.getDate() + 1);
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  const advH = advanceDate.getHours().toString().padStart(2, '0');
  const advM = advanceDate.getMinutes().toString().padStart(2, '0');

  return {
    advanceTimeStr: `${advH}:${advM}`,
    scheduledDate,
    advanceDate,
  };
};

/**
 * Schedule Habit Reminders (Both 10-Minute Advance Alert & Task Time Alert)
 * Respects habit scheduleDays, scheduleType, isArchived, and reminderEnabled.
 */
export const scheduleHabitReminder = async (
  habitId: string,
  habitName: string,
  timeStr: string,
  scheduleDays: number[] = [0, 1, 2, 3, 4, 5, 6],
  isArchived = false,
  reminderEnabled = true,
  advanceMinutes = 10
) => {
  // Always cancel previous timers first
  await cancelHabitReminder(habitId);

  if (isArchived || !reminderEnabled || !timeStr) {
    return;
  }

  const { advanceTimeStr, scheduledDate, advanceDate } = getAdvanceTimeString(timeStr, advanceMinutes);

  // Validate that the target date is a scheduled day (0=Mon, ..., 6=Sun)
  const scheduledDayIndex = (scheduledDate.getDay() + 6) % 7;
  if (!scheduleDays.includes(scheduledDayIndex)) {
    console.log(`[Notification] Skipping schedule for ${habitName} on non-scheduled day index ${scheduledDayIndex}`);
    return;
  }

  // WEB APPLICATION (Browser Notification API & Web Timers)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const nowMs = Date.now();
    const advanceMs = advanceDate.getTime() - nowMs;
    const taskMs = scheduledDate.getTime() - nowMs;

    const timerIds: number[] = [];

    if (advanceMs > 0) {
      const advTimer = window.setTimeout(() => {
        new Notification(`⏰ 10-MIN ALERT: ${habitName}`, {
          body: `Your protocol "${habitName}" starts in 10 minutes (${timeStr}). Prepare for execution!`,
          icon: '/favicon.ico',
        });
      }, advanceMs);
      timerIds.push(advTimer);
    }

    if (taskMs > 0) {
      const taskTimer = window.setTimeout(() => {
        new Notification(`🎯 PROTOCOL START: ${habitName}`, {
          body: `It's ${timeStr}! Time to execute "${habitName}". Tap to mark complete!`,
          icon: '/favicon.ico',
        });
      }, taskMs);
      timerIds.push(taskTimer);
    }

    activeWebNotificationTimers.set(habitId, timerIds);
    console.log(`[Web Notification] Scheduled 10-min advance alert (${advanceTimeStr}) & task alert (${timeStr}) for "${habitName}"`);
  }
};

/**
 * Cancel Habit Reminders
 */
export const cancelHabitReminder = async (habitId: string) => {
  const timers = activeWebNotificationTimers.get(habitId);
  if (timers) {
    timers.forEach((tId) => clearTimeout(tId));
    activeWebNotificationTimers.delete(habitId);
  }
};
