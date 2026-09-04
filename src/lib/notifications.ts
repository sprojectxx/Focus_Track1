import { PushNotifications, PermissionStatus } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface NotificationService {
  isNative: boolean;
  initPushNotifications: (userId: string) => Promise<string | null>;
  requestWebNotificationPermission: () => Promise<boolean>;
  scheduleHabitReminder: (habitId: string, habitName: string, timeStr: string, advanceMinutes?: number) => Promise<void>;
  cancelHabitReminder: (habitId: string) => Promise<void>;
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
 * Initialize Web Browser Notifications (for Web Application)
 */
export const requestWebNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) return false;

  if (!('Notification' in window)) {
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
 * Initialize Firebase Cloud Messaging (FCM) & Push Notifications (for Mobile Application)
 */
export const initPushNotifications = async (userId: string): Promise<string | null> => {
  // Also request web notifications for web browsers
  if (!Capacitor.isNativePlatform()) {
    await requestWebNotificationPermission();
    return null;
  }

  try {
    let permStatus: PermissionStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Permission not granted for push notifications.');
      return null;
    }

    // Register with Firebase Cloud Messaging (FCM) / Apple Push Service
    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token) => {
        console.log('[FCM Push Token Generated]:', token.value);

        // Save FCM token to Supabase for backend push server targeting
        if (isSupabaseConfigured && userId) {
          try {
            await supabase.from('user_fcm_tokens').upsert(
              {
                user_id: userId,
                token: token.value,
                platform: Capacitor.getPlatform(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,token' }
            );
          } catch (err) {
            console.error('[FCM Token Storage Error]:', err);
          }
        }

        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[FCM Registration Error]:', err);
        resolve(null);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[FCM Push Notification Received]:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('[FCM Notification Action Tapped]:', notification.actionId, notification.notification);
      });
    });
  } catch (error) {
    console.error('[Push Notifications Init Error]:', error);
    return null;
  }
};

/**
 * Helper to calculate 10-minute advance time string & Date
 * Example: '08:00' -> '07:50'
 */
export const getAdvanceTimeString = (timeStr: string, advanceMinutes = 10): { advanceTimeStr: string; scheduledDate: Date; advanceDate: Date } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();

  // Task execution date
  const scheduledDate = new Date();
  scheduledDate.setHours(hours, minutes, 0, 0);

  // 10-minute advance date
  const advanceDate = new Date(scheduledDate.getTime() - advanceMinutes * 60 * 1000);

  if (advanceDate <= now) {
    // If 10-min advance time passed today, schedule for tomorrow
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
 * Works for Mobile Application (Capacitor/FCM/LocalNotifications) & Web Application (Browser Notifications)
 */
export const scheduleHabitReminder = async (
  habitId: string,
  habitName: string,
  timeStr: string,
  advanceMinutes = 10
) => {
  // Cancel previous timers for this habit first
  await cancelHabitReminder(habitId);

  const { advanceTimeStr, scheduledDate, advanceDate } = getAdvanceTimeString(timeStr, advanceMinutes);

  // Numeric ID hash for Capacitor LocalNotifications
  const baseHash = Math.abs(
    habitId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  );
  const advanceNotificationId = baseHash * 10 + 1;
  const taskNotificationId = baseHash * 10 + 2;

  // 1. MOBILE APPLICATION (Capacitor LocalNotifications & FCM)
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          // A) 10-Minute Advance Alert Notification
          {
            id: advanceNotificationId,
            title: `⏰ 10-MIN ALERT: ${habitName}`,
            body: `Your protocol "${habitName}" starts in 10 minutes (${timeStr}). Prepare for execution!`,
            schedule: {
              at: advanceDate,
              repeats: true,
              every: 'day',
            },
            sound: 'beep.wav',
            actionTypeId: 'HABIT_ADVANCE_ALERT',
          },
          // B) Scheduled Task Execution Notification
          {
            id: taskNotificationId,
            title: `🎯 PROTOCOL START: ${habitName}`,
            body: `It's ${timeStr}! Time to execute "${habitName}". Tap to mark complete.`,
            schedule: {
              at: scheduledDate,
              repeats: true,
              every: 'day',
            },
            sound: 'beep.wav',
            actionTypeId: 'HABIT_EXECUTION_ALERT',
          },
        ],
      });
      console.log(`[Mobile Notification] Scheduled 10-min advance alert (${advanceTimeStr}) & task alert (${timeStr}) for ${habitName}`);
    } catch (err) {
      console.error('[Mobile Notification Schedule Error]:', err);
    }
    return;
  }

  // 2. WEB APPLICATION (Browser Notification API & Web Timers)
  if ('Notification' in window && Notification.permission === 'granted') {
    const nowMs = Date.now();
    const advanceMs = advanceDate.getTime() - nowMs;
    const taskMs = scheduledDate.getTime() - nowMs;

    const timerIds: number[] = [];

    // Schedule 10-Minute Advance Web Notification
    if (advanceMs > 0) {
      const advTimer = window.setTimeout(() => {
        new Notification(`⏰ 10-MIN ALERT: ${habitName}`, {
          body: `Your protocol "${habitName}" starts in 10 minutes (${timeStr}). Prepare for execution!`,
          icon: '/favicon.ico',
        });
      }, advanceMs);
      timerIds.push(advTimer);
    }

    // Schedule Task Start Web Notification
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
  const baseHash = Math.abs(
    habitId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  );
  const advanceNotificationId = baseHash * 10 + 1;
  const taskNotificationId = baseHash * 10 + 2;

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: advanceNotificationId },
          { id: taskNotificationId },
        ],
      });
    } catch {
      // ignore
    }
  }

  // Cancel Web timers
  const timers = activeWebNotificationTimers.get(habitId);
  if (timers) {
    timers.forEach((tId) => clearTimeout(tId));
    activeWebNotificationTimers.delete(habitId);
  }
};
