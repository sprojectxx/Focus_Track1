import React from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';
import { isToday } from '../utils/date';

export const DailyPanel: React.FC = () => {
  const {
    isDailyPanelOpen,
    setIsDailyPanelOpen,
    selectedDateStr,
    activeHabits,
    toggleHabitDay,
  } = useHabits();

  if (!isDailyPanelOpen) return null;

  // Parse selected date
  const [yearStr, monthStr, dayStr] = selectedDateStr.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));

  const monthShortNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayFullNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  const formattedMonthShort = monthShortNames[dateObj.getMonth()];
  const formattedDayName = dayFullNames[dateObj.getDay()];
  const formattedDayNumber = dayStr;
  const isSelectedToday = isToday(selectedDateStr);

  // Calculate day metrics
  let completedHabits = 0;
  let totalFocusMinutes = 0;

  activeHabits.forEach((h) => {
    if (h.history[selectedDateStr]) {
      completedHabits++;
      totalFocusMinutes += h.focusMinutesPerSession;
    }
  });

  const totalPossible = activeHabits.length;
  const dayScore = totalPossible > 0 ? Math.round((completedHabits / totalPossible) * 100) : 0;

  const focusHours = Math.floor(totalFocusMinutes / 60);
  const focusRemainderMins = totalFocusMinutes % 60;
  const focusDisplay = focusHours > 0 || focusRemainderMins > 0 ? `${focusHours}h ${focusRemainderMins}m` : '0h 0m';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsDailyPanelOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
      ></div>

      {/* Slide-over Drawer Panel */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-[380px] bg-[#121212] border-l border-[#262626] p-6 z-50 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b border-[#262626] pb-4">
            <div>
              <span className="text-3xl font-extrabold text-white tracking-tighter block font-geist">
                {formattedMonthShort} {formattedDayNumber}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-technical text-xs text-[#a3a3a3] uppercase tracking-widest">
                  {formattedDayName}
                </span>
                {!isSelectedToday && (
                  <span className="font-technical text-[9px] bg-[#222] text-[#aaa] border border-[#333] px-1.5 py-0.5 rounded uppercase">
                    Read-Only
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsDailyPanelOpen(false)}
              className="text-[#a3a3a3] hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-[#262626]"
              aria-label="Close panel"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Habit Execution Section */}
          <div className="mb-8">
            <h3 className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-4">
              Habit Execution
            </h3>
            <div className="space-y-2.5">
              {activeHabits.map((habit) => {
                const isChecked = !!habit.history[selectedDateStr];

                return (
                  <div
                    key={habit.id}
                    onClick={() => isSelectedToday && toggleHabitDay(habit.id, selectedDateStr)}
                    className={`flex items-center justify-between p-3.5 border border-[#262626] rounded transition-colors bg-[#0a0a0a] group ${
                      isSelectedToday ? 'hover:border-neutral-500 cursor-pointer' : 'cursor-default opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <HabitVisual habit={habit} size="sm" />
                      </div>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isChecked ? 'text-white line-through opacity-80' : 'text-[#e5e5e5]'
                        }`}
                      >
                        {habit.name}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-xs flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-white text-black font-bold'
                          : isSelectedToday
                          ? 'border border-[#444] bg-[#141414] group-hover:border-white'
                          : 'border border-[#222] bg-[#0d0d0d]'
                      }`}
                    >
                      {isChecked && (
                        <span className="material-symbols-outlined text-black text-[14px] font-bold">
                          check
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Metrics */}
          <div>
            <h3 className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-4">
              Daily Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-[#262626] rounded bg-[#0a0a0a]">
                <span className="font-technical text-[10px] text-[#737373] uppercase tracking-widest block mb-1">
                  Focus Time
                </span>
                <span className="text-xl font-bold text-white font-geist">{focusDisplay}</span>
              </div>
              <div className="p-4 border border-[#262626] rounded bg-[#0a0a0a]">
                <span className="font-technical text-[10px] text-[#737373] uppercase tracking-widest block mb-1">
                  Score
                </span>
                <span className="text-xl font-bold text-white font-geist">{dayScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#262626] text-center">
          <p className="font-technical text-[10px] text-[#737373] uppercase tracking-wider">
            FocusTrack • {completedHabits}/{totalPossible} COMPLETED
          </p>
        </div>
      </aside>
    </>
  );
};
