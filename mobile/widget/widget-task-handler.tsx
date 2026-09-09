import React from 'react';
import { registerWidgetTaskHandler, WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MonthlyWidget } from './MonthlyWidget';
import { loadWidgetData } from './widgetDataSync';
import { getMonthlyConsistencyMatrix } from '../utils/habitStats';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;

  if (widgetInfo.widgetName === 'MonthlyWidget') {
    const { habits, timeZone } = await loadWidgetData();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const matrix = getMonthlyConsistencyMatrix(habits, year, month, timeZone);
    renderWidget(<MonthlyWidget year={year} month={month} matrix={matrix} />);
  }
}

export function registerMonthlyWidgetTask() {
  registerWidgetTaskHandler(widgetTaskHandler);
}
