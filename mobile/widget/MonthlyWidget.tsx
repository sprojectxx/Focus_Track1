import React from 'react';
import { ColorProp, FlexWidget, TextWidget } from 'react-native-android-widget';
import { MonthlyConsistencyCell } from '../utils/habitStats';

const MONTH_NAMES_FULL = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const MONTH_NAMES_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const WEEKDAY_NAMES_3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_NAMES_1 = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type WidgetSizeClass = 'small' | 'medium' | 'large' | 'tall';

export function getWidgetSizeClass(width: number = 250, height: number = 180): WidgetSizeClass {
  if (width < 200) {
    return height >= 160 ? 'tall' : 'small';
  } else {
    return height >= 160 ? 'large' : 'medium';
  }
}

function getCellBgColor(cell: MonthlyConsistencyCell): ColorProp {
  if (!cell.isCurrentMonth) {
    return '#121214'; // Padding days outside current month
  }
  if (cell.isFuture) {
    return '#18181B'; // Future days
  }
  if (cell.totalDue === 0 || cell.level === 0) {
    return '#222226'; // No completions
  }
  if (cell.level === 1) return '#44444A';
  if (cell.level === 2) return '#777780';
  if (cell.level === 3) return '#AAAAB2';
  return '#FFFFFF'; // 100% completed
}

interface MonthlyWidgetProps {
  year: number;
  month: number;
  matrix: MonthlyConsistencyCell[];
  width?: number;
  height?: number;
}

export function MonthlyWidget({ year, month, matrix, width = 250, height = 180 }: MonthlyWidgetProps) {
  const sizeClass = getWidgetSizeClass(width, height);

  // Calculate real monthly consistency percentage for current month
  let totalDueMonth = 0;
  let completedDueMonth = 0;
  matrix.forEach((cell) => {
    if (cell.isCurrentMonth && !cell.isFuture) {
      totalDueMonth += cell.totalDue;
      completedDueMonth += cell.completedDue;
    }
  });
  const monthlyPercentage = totalDueMonth > 0 ? Math.round((completedDueMonth / totalDueMonth) * 100) : 0;

  const isSmall = sizeClass === 'small';
  const isTall = sizeClass === 'tall';
  const isMedium = sizeClass === 'medium';
  const isLarge = sizeClass === 'large';

  // Month label format
  const monthName = (isSmall || isTall)
    ? `${MONTH_NAMES_SHORT[month - 1]} ${year}`
    : `${MONTH_NAMES_FULL[month - 1]} ${year}`;

  const weekdayLabels = isSmall ? WEEKDAY_NAMES_1 : WEEKDAY_NAMES_3;

  // Geometry specs per size class
  const padding = isSmall ? 8 : isTall ? 10 : isMedium ? 10 : 12;
  const cellSize = isSmall ? 10 : isTall ? 12 : isMedium ? 14 : 16;
  const cellGap = isSmall ? 2 : isTall ? 3 : isMedium ? 3 : 4;
  const titleFontSize = isSmall ? 10 : isTall ? 11 : isMedium ? 12 : 13;
  const percentageFontSize = isSmall ? 11 : isTall ? 12 : isMedium ? 13 : 14;
  const monthFontSize = isSmall ? 8 : isTall ? 9 : isMedium ? 9 : 10;
  const weekdayFontSize = isSmall ? 7 : isTall ? 8 : isMedium ? 8 : 9;
  const labelWidth = isSmall ? 14 : 28;

  // Map flat matrix (chronological 7xW) into 7 GitHub-style weekday rows
  const numWeeks = Math.ceil(matrix.length / 7);
  const weekdayRows: MonthlyConsistencyCell[][] = [];
  for (let d = 0; d < 7; d++) {
    const rowCells: MonthlyConsistencyCell[] = [];
    for (let w = 0; w < numWeeks; w++) {
      const idx = w * 7 + d;
      if (idx < matrix.length) {
        rowCells.push(matrix[idx]);
      }
    }
    weekdayRows.push(rowCells);
  }

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'com.focustrack.app://analytics' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding,
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderColor: '#262626',
        borderWidth: 1,
      }}
    >
      {/* Widget Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: isSmall ? 4 : 6,
        }}
      >
        <TextWidget
          text="FocusTrack"
          style={{
            fontSize: titleFontSize,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <TextWidget
            text={`${monthlyPercentage}%`}
            style={{
              fontSize: percentageFontSize,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
          <TextWidget
            text={monthName}
            style={{
              fontSize: monthFontSize,
              fontWeight: '600',
              color: '#A1A1AA',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* GitHub-Style Matrix Rows (7 rows for Mon..Sun) */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          flex: 1,
          justifyContent: 'space-around',
        }}
      >
        {weekdayRows.map((rowCells, rIdx) => (
          <FlexWidget
            key={rIdx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              marginVertical: 1,
            }}
          >
            {/* Weekday Label */}
            <FlexWidget
              style={{
                width: labelWidth,
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <TextWidget
                text={weekdayLabels[rIdx]}
                style={{
                  fontSize: weekdayFontSize,
                  fontWeight: '600',
                  color: '#71717A',
                }}
              />
            </FlexWidget>

            {/* Heatmap Contribution Squares Row (NO DATES INSIDE CELLS) */}
            <FlexWidget
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexGap: cellGap,
              }}
            >
              {rowCells.map((cell, cIdx) => {
                const cellBgColor = getCellBgColor(cell);
                const isToday = cell.isCurrentMonth && cell.isToday;

                return (
                  <FlexWidget
                    key={cIdx}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      backgroundColor: cellBgColor,
                      borderWidth: isToday ? 1 : 0,
                      borderColor: isToday ? '#FFFFFF' : '#00000000',
                    }}
                  />
                );
              })}
            </FlexWidget>
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Large Widget Compact Legend */}
      {isLarge ? (
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            width: 'match_parent',
            marginTop: 4,
            flexGap: 3,
          }}
        >
          <TextWidget text="Less" style={{ fontSize: 7, color: '#71717A' }} />
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: '#222226' }} />
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: '#44444A' }} />
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: '#777780' }} />
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: '#AAAAB2' }} />
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: '#FFFFFF' }} />
          <TextWidget text="More" style={{ fontSize: 7, color: '#71717A' }} />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}
