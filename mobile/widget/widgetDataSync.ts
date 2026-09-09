import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import React from 'react';
import { Habit } from '../types';
import { getMonthlyConsistencyMatrix } from '../utils/habitStats';
import { getTodayYMD, getDeviceTimeZone } from '../utils/date';
import { MonthlyWidget } from './MonthlyWidget';

export const WIDGET_STORAGE_KEY = '@focustrack/widget_habits';

export interface WidgetCacheData {
  habits: Habit[];
  timeZone: string;
  updatedAt: number;
}

export async function syncWidgetData(habits: Habit[], timeZone: string = getDeviceTimeZone()) {
  try {
    const payload: WidgetCacheData = {
      habits,
      timeZone,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(payload));

    const todayYMD = getTodayYMD(timeZone);
    const parts = todayYMD.split('-').map(Number);
    const year = parts[0] || new Date().getFullYear();
    const month = parts[1] || (new Date().getMonth() + 1);
    const matrix = getMonthlyConsistencyMatrix(habits, year, month, timeZone);

    await requestWidgetUpdate({
      widgetName: 'MonthlyWidget',
      renderWidget: () => React.createElement(MonthlyWidget, { year, month, matrix }),
    });
  } catch (err) {
    console.warn('Widget sync error:', err);
  }
}

export async function loadWidgetData(): Promise<{ habits: Habit[]; timeZone: string }> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
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
