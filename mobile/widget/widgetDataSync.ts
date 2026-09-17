import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import React from 'react';
import { Habit } from '../types';
import { getMonthlyConsistencyMatrix } from '../utils/habitStats';
import { getTodayYMD, getDeviceTimeZone } from '../utils/date';
import { MonthlyWidget } from './MonthlyWidget';

export function getWidgetStorageKey(userId?: string): string {
  return userId ? `@focustrack/widget_habits_${userId}` : '@focustrack/widget_habits_anon';
}

export interface WidgetCacheData {
  habits: Habit[];
  timeZone: string;
  updatedAt: number;
}

export async function syncWidgetData(
  habits: Habit[],
  timeZone: string = getDeviceTimeZone(),
  userId?: string
) {
  try {
    const storageKey = getWidgetStorageKey(userId);
    const payload: WidgetCacheData = {
      habits,
      timeZone,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(payload));

    const todayYMD = getTodayYMD(timeZone);
    const parts = todayYMD.split('-').map(Number);
    const year = parts[0] || new Date().getFullYear();
    const month = parts[1] || (new Date().getMonth() + 1);
    const matrix = getMonthlyConsistencyMatrix(habits, year, month, timeZone);

    await requestWidgetUpdate({
      widgetName: 'MonthlyWidget',
      renderWidget: (widgetInfo) =>
        React.createElement(MonthlyWidget, {
          year,
          month,
          matrix,
          width: widgetInfo?.width,
          height: widgetInfo?.height,
        }),
    });
  } catch (err) {
    console.warn('Widget sync error:', err);
  }
}

export async function clearWidgetData(userId?: string): Promise<void> {
  try {
    const storageKey = getWidgetStorageKey(userId);
    await AsyncStorage.removeItem(storageKey);
    await syncWidgetData([], getDeviceTimeZone(), userId);
  } catch (err) {
    console.warn('Failed to clear widget data:', err);
  }
}

export async function loadWidgetData(userId?: string): Promise<{ habits: Habit[]; timeZone: string }> {
  try {
    const storageKey = getWidgetStorageKey(userId);
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const parsed: WidgetCacheData = JSON.parse(raw);
      return {
        habits: parsed.habits || [],
        timeZone: parsed.timeZone || getDeviceTimeZone(),
      };
    }
  } catch (err) {
    console.warn('Failed to load cached widget data:', err);
  }
  return { habits: [], timeZone: getDeviceTimeZone() };
}
