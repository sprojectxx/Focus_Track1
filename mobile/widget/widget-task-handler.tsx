import React from 'react';
import { registerWidgetTaskHandler, WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MonthlyWidget } from './MonthlyWidget';
import { loadWidgetData } from './widgetDataSync';
import { getMonthlyConsistencyMatrix } from '../utils/habitStats';
import { getTodayYMD } from '../utils/date';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;

  if (widgetInfo.widgetName === 'MonthlyWidget') {
    const { habits, timeZone } = await loadWidgetData();
    const todayYMD = getTodayYMD(timeZone);
    const parts = todayYMD.split('-').map(Number);
    const year = parts[0] || new Date().getFullYear();
    const month = parts[1] || (new Date().getMonth() + 1);

    const matrix = getMonthlyConsistencyMatrix(habits, year, month, timeZone);
    renderWidget(
      <MonthlyWidget
        year={year}
        month={month}
        matrix={matrix}
        width={widgetInfo.width}
        height={widgetInfo.height}
      />
    );
  }
}

export function registerMonthlyWidgetTask() {
  registerWidgetTaskHandler(widgetTaskHandler);
}
