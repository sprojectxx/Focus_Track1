import React from 'react';
import { useHabits } from '../context/HabitContext';
import { DailyPanel } from './DailyPanel';

export const CalendarView: React.FC = () => {
  const {
    viewingYear,
    viewingMonth,
    nextMonth,
    prevMonth,
    activeHabits,
    selectedDateStr,
    setSelectedDateStr,
    setIsDailyPanelOpen,
  } = useHabits();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const yearInWords = (year: number) => {
    if (year === 2023) return 'TWO THOUSAND TWENTY THREE';
    if (year === 2024) return 'TWO THOUSAND TWENTY FOUR';
    if (year === 2025) return 'TWO THOUSAND TWENTY FIVE';
    if (year === 2026) return 'TWO THOUSAND TWENTY SIX';
    return year.toString();
  };

  // Calendar calculations
  const daysInMonth = new Date(viewingYear, viewingMonth, 0).getDate();
  const firstDayIndex = (new Date(viewingYear, viewingMonth - 1, 1).getDay() + 6) % 7; // 0=Mon, 6=Sun
  const prevMonthDaysCount = new Date(viewingYear, viewingMonth - 1, 0).getDate();

  // Prev month padding cells
  const prevMonthCells = Array.from({ length: firstDayIndex }, (_, i) => {
    const day = prevMonthDaysCount - firstDayIndex + i + 1;
    return { day, isCurrentMonth: false, isPrev: true };
  });

  // Current month cells
  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return { day, isCurrentMonth: true, isPrev: false };
  });

  // Next month padding cells to fill grid up to 35 or 42
  const totalCellsSoFar = prevMonthCells.length + currentMonthCells.length;
  const remainingCells = totalCellsSoFar <= 35 ? 35 - totalCellsSoFar : 42 - totalCellsSoFar;
  const nextMonthCells = Array.from({ length: remainingCells }, (_, i) => {
    const day = i + 1;
    return { day, isCurrentMonth: false, isPrev: false };
  });

  const allCalendarDays = [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];

  const handleDayClick = (day: number, isCurrent: boolean) => {
    if (!isCurrent) return;
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = viewingMonth.toString().padStart(2, '0');
    const dateKey = `${viewingYear}-${monthStr}-${dayStr}`;
    setSelectedDateStr(dateKey);
    setIsDailyPanelOpen(true);
  };

  return (
    <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col pb-24 relative">
      {/* Calendar Header */}
      <div className="flex justify-between items-end mb-8 border-b border-[#262626] pb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-white uppercase font-geist">
            {monthNames[viewingMonth - 1]}
          </h2>
          <p className="text-xs font-technical text-[#a3a3a3] uppercase tracking-[0.2em] mt-1">
            {yearInWords(viewingYear)}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center border border-[#262626] rounded hover:bg-[#1a1a1a] transition-colors text-white cursor-pointer"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center border border-[#262626] rounded hover:bg-[#1a1a1a] transition-colors text-white cursor-pointer"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Weekday Headers MON..SUN */}
      <div className="grid grid-cols-7 gap-2 md:gap-4 mb-3 text-center">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
          <div key={day} className="font-technical text-[11px] font-bold text-[#737373] uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-4 flex-1">
        {allCalendarDays.map((item, index) => {
          if (!item.isCurrentMonth) {
            return (
              <div
                key={index}
                className="aspect-square min-h-[70px] md:min-h-[100px] border border-[#1f1f1f]/50 rounded p-2 md:p-3 flex flex-col justify-between opacity-25 bg-[#0a0a0a]"
              >
                <span className="font-technical text-xs font-bold text-[#737373]">
                  {item.day.toString().padStart(2, '0')}
                </span>
              </div>
            );
          }

          const dayNumStr = item.day.toString().padStart(2, '0');
          const monthStr = viewingMonth.toString().padStart(2, '0');
          const dateKey = `${viewingYear}-${monthStr}-${dayNumStr}`;

          // Check completions for habits on this day
          const dayCompletions = activeHabits.map((h) => !!h.history[dateKey]);
          const completedCount = dayCompletions.filter(Boolean).length;
          const isSelected = selectedDateStr === dateKey;
          // Today representation (e.g. 4 for October or 30 for August)
          const isToday = (viewingMonth === 10 && item.day === 4) || (viewingMonth === 8 && item.day === 30);

          return (
            <div
              key={index}
              onClick={() => handleDayClick(item.day, true)}
              className={`aspect-square min-h-[70px] md:min-h-[100px] border rounded p-2 md:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 group ${
                isToday
                  ? 'border-white bg-[#141414] ring-1 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : isSelected
                  ? 'border-neutral-400 bg-[#171717]'
                  : 'border-[#262626] bg-[#0a0a0a] hover:border-neutral-500 hover:bg-[#121212]'
              }`}
            >
              {/* Day Number and status badge */}
              <div className="flex justify-between items-start">
                <span
                  className={`font-technical text-xs md:text-sm font-bold ${
                    isToday ? 'text-white' : 'text-[#e5e5e5]'
                  }`}
                >
                  {dayNumStr}
                </span>
                {isToday && (
                  <span className="hidden sm:inline-block font-technical text-[8px] tracking-widest uppercase bg-white text-black font-bold px-1.5 py-0.5 rounded-xs">
                    IN PROGRESS
                  </span>
                )}
              </div>

              {/* Habit Completion Dots */}
              <div className="flex items-center gap-1 flex-wrap mt-auto">
                {activeHabits.slice(0, 5).map((habit, hIdx) => {
                  const isDone = !!habit.history[dateKey];
                  return (
                    <div
                      key={hIdx}
                      className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${
                        isDone
                          ? 'bg-white'
                          : 'border border-[#404040] bg-transparent'
                      }`}
                      title={`${habit.name}: ${isDone ? 'Completed' : 'Not logged'}`}
                    />
                  );
                })}
                {completedCount > 5 && (
                  <span className="text-[8px] font-technical text-[#737373]">
                    +{completedCount - 5}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Daily Panel Drawer */}
      <DailyPanel />
    </div>
  );
};
