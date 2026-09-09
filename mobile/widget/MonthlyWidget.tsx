import React from 'react';
import { ColorProp, FlexWidget, TextWidget } from 'react-native-android-widget';
import { MonthlyConsistencyCell } from '../utils/habitStats';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface MonthlyWidgetProps {
  year: number;
  month: number;
  matrix: MonthlyConsistencyCell[];
}

export function MonthlyWidget({ year, month, matrix }: MonthlyWidgetProps) {
  const monthName = MONTH_NAMES[month - 1] || 'MONTH';

  // Chunk matrix into rows of 7 cells
  const rows: MonthlyConsistencyCell[][] = [];
  for (let i = 0; i < matrix.length; i += 7) {
    rows.push(matrix.slice(i, i + 7));
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 10,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Widget Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text="FOCUSTRACK"
          style={{
            fontSize: 10,
            fontWeight: 'bold',
            color: '#FFFFFF',
            letterSpacing: 1.5,
          }}
        />
        <TextWidget
          text={`${monthName} ${year}`}
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: '#A1A1AA',
          }}
        />
      </FlexWidget>

      {/* Weekday Row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginTop: 4,
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((w, idx) => (
          <FlexWidget
            key={idx}
            style={{
              width: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text={w}
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                color: '#71717A',
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Grid Rows */}
      {rows.map((row, rIdx) => (
        <FlexWidget
          key={rIdx}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: 'match_parent',
            marginTop: 2,
            marginBottom: 2,
          }}
        >
          {row.map((cell, cIdx) => {
            let bgColor: ColorProp = '#18181B'; // Empty/Not Current
            let textColor: ColorProp = '#52525B';

            if (cell.isCurrentMonth) {
              if (cell.isFuture) {
                bgColor = '#141417';
                textColor = '#3F3F46';
              } else if (cell.level === 4) {
                bgColor = '#FFFFFF';
                textColor = '#000000';
              } else if (cell.level === 3) {
                bgColor = '#D4D4D8';
                textColor = '#000000';
              } else if (cell.level === 2) {
                bgColor = '#A1A1AA';
                textColor = '#000000';
              } else if (cell.level === 1) {
                bgColor = '#52525B';
                textColor = '#FFFFFF';
              } else {
                bgColor = '#27272A';
                textColor = '#A1A1AA';
              }
            }

            return (
              <FlexWidget
                key={cIdx}
                style={{
                  width: 28,
                  height: 22,
                  borderRadius: 4,
                  backgroundColor: bgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: cell.isToday ? 1 : 0,
                  borderColor: cell.isToday ? '#FFFFFF' : '#00000000',
                }}
              >
                <TextWidget
                  text={cell.day.toString()}
                  style={{
                    fontSize: 8,
                    fontWeight: cell.isToday ? 'bold' : 'normal',
                    color: textColor,
                  }}
                />
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
