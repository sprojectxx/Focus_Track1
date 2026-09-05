import React, { useMemo, useState, useEffect } from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';
import { getTimeBasedGreeting, getRandomQuote, MotivationalQuote } from '../data/motivationalQuotes';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getDaysInMonth, getElapsedDaysInMonth, isToday, isPast, isFuture } from '../utils/date';

export const DashboardView: React.FC = () => {
  const {
    activeHabits,
    viewingYear,
    viewingMonth,
    nextMonth,
    prevMonth,
    goToToday,
    toggleHabitDay,
    stats,
    setSelectedHabitId,
    setCurrentTab,
    setIsCreateModalOpen,
  } = useHabits();

  const [greetingInfo, setGreetingInfo] = useState(getTimeBasedGreeting());
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(getRandomQuote());

  useEffect(() => {
    // Update time-based greeting
    setGreetingInfo(getTimeBasedGreeting());

    // Fetch quote from Supabase or random fallback
    const fetchQuote = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('motivational_quotes').select('*');
          if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            setCurrentQuote({
              id: random.id,
              quote: random.quote,
              author: random.author,
              translation: random.translation
            });
          }
        } catch {
          // fallback
        }
      }
    };
    fetchQuote();
  }, []);

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Today reference (Real-time current date)
  const realNow = new Date();
  const realYear = realNow.getFullYear();
  const realMonth = realNow.getMonth() + 1;
  const realDay = realNow.getDate();

  const isCurrentViewingMonth = viewingYear === realYear && viewingMonth === realMonth;
  const todayDayNum = isCurrentViewingMonth ? realDay : -1;

  // Calculate Today's completion count
  const todayKey = `${realYear}-${realMonth.toString().padStart(2, '0')}-${realDay.toString().padStart(2, '0')}`;

  const todayCompletedCount = useMemo(() => {
    return activeHabits.filter(h => !!h.history[todayKey]).length;
  }, [activeHabits, todayKey]);

  // Day of week labels for current month
  const getDayOfWeekLetter = (day: number) => {
    const date = new Date(viewingYear, viewingMonth - 1, day);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[date.getDay()];
  };

  const handleManageHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
    setCurrentTab('habits');
  };

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 lg:p-12 max-w-[1500px] mx-auto w-full flex flex-col pb-28 md:pb-24 overflow-x-hidden">
      {/* Time-Based Greeting & Hero Motto Header */}
      <section className="flex flex-col items-center justify-center py-4 sm:py-6 md:py-12 border-b border-[#222] text-center mb-5 md:mb-6">
        {/* Dynamic Time-Based Greeting Badge */}
        <div className="mb-2 sm:mb-3 px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[10px] sm:text-[11px] font-technical text-neutral-300 uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold inline-block">
          {greetingInfo.greeting}
        </div>

        {/* Dynamic Quote Headline */}
        <h1 className="font-geist text-xl sm:text-3xl md:text-5xl lg:text-[54px] font-extrabold text-white tracking-tighter uppercase leading-[1.15] md:leading-[1.08] max-w-5xl px-2 sm:px-4 break-words">
          "{currentQuote.quote}"
        </h1>

        <p className="mt-2 sm:mt-3 md:mt-4 font-technical text-[10px] sm:text-[11px] text-[#8e9192] uppercase tracking-[0.18em] sm:tracking-[0.25em] px-2">
          — {currentQuote.author} {currentQuote.translation ? `• ${currentQuote.translation}` : ''}
        </p>
        <p className="mt-1 font-technical text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-widest">
          {greetingInfo.subtext}
        </p>
      </section>

      {/* Month Header & Quick Action Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4 sm:gap-5">
        {/* Navigation Controls */}
        <div className="flex flex-col space-y-2 w-full lg:w-auto">
          <div className="flex items-center gap-2.5">
            <h2 className="font-geist text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
              {monthNames[viewingMonth - 1]} {viewingYear}
            </h2>
            {isCurrentViewingMonth && (
              <span className="font-technical text-[9px] sm:text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded-xs uppercase tracking-widest shrink-0">
                Active Month
              </span>
            )}
          </div>

          <div className="flex items-center border border-[#333] rounded p-1 w-full sm:w-fit justify-between sm:justify-start bg-[#141414]">
            <button
              onClick={prevMonth}
              className="px-3 py-2 min-h-[44px] hover:bg-[#222] transition-colors rounded text-[#a3a3a3] hover:text-white text-xs font-technical uppercase tracking-wider flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center"
              aria-label="Previous month"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span> Prev
            </button>
            <div className="w-px h-5 bg-[#333] mx-1"></div>
            <button
              onClick={goToToday}
              className={`px-4 py-2 min-h-[44px] transition-colors rounded font-bold text-xs font-technical uppercase tracking-widest cursor-pointer flex-1 sm:flex-initial text-center ${
                isCurrentViewingMonth ? 'bg-white text-black' : 'bg-[#222] text-white hover:bg-[#333]'
              }`}
              aria-label="Go to current day"
            >
              Today
            </button>
            <div className="w-px h-5 bg-[#333] mx-1"></div>
            <button
              onClick={nextMonth}
              className="px-3 py-2 min-h-[44px] hover:bg-[#222] transition-colors rounded text-[#a3a3a3] hover:text-white text-xs font-technical uppercase tracking-wider flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center"
              aria-label="Next month"
            >
              Next <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Stats Bento (Compact 2x2 grid on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto">
          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-0">
            <span className="font-geist text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 truncate">
              {stats.overallCompletion}%
            </span>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider truncate">
              OVERALL COMPLETION
            </span>
          </div>

          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-0">
            <div className="flex items-baseline gap-1 truncate">
              <span className="font-geist text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5">
                {todayCompletedCount}
              </span>
              <span className="text-[#737373] font-technical text-xs">/{activeHabits.length}</span>
            </div>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider truncate">
              TODAY'S EXECUTION
            </span>
          </div>

          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-0">
            <span className="font-geist text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 truncate">
              {stats.currentStreak} <span className="text-xs text-[#737373] font-normal">days</span>
            </span>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider truncate">
              CURRENT STREAK
            </span>
          </div>

          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-0">
            <span className="font-geist text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 truncate">
              {stats.totalCompletedSessions}
            </span>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider truncate">
              TOTAL LOGS
            </span>
          </div>
        </div>
      </div>

      {/* Primary Execution Habit Matrix */}
      <section className="bg-[#0e0e0e] border border-[#262626] rounded shadow-2xl overflow-hidden w-full">
        {/* Table Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-[#262626] bg-[#141414] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="font-geist text-sm sm:text-base md:text-lg font-bold text-white tracking-tight uppercase">
              DAILY HABIT MATRIX
            </h3>
            <span className="text-[10px] sm:text-[11px] font-technical text-[#737373] uppercase">
              ({activeHabits.length} ACTIVE)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-2 text-[10px] font-technical text-[#737373] mr-2">
              <span className="inline-block w-2.5 h-2.5 bg-white rounded-xs"></span> Done
              <span className="inline-block w-2.5 h-2.5 border border-white rounded-xs ml-2"></span> Today
              <span className="inline-block w-2.5 h-2.5 bg-[#222] rounded-xs ml-2"></span> Past
            </span>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-technical uppercase tracking-widest text-black bg-white hover:bg-neutral-200 font-bold px-3.5 py-2.5 min-h-[44px] rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95"
              aria-label="Add new habit"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Habit</span>
            </button>

            <button
              onClick={() => setCurrentTab('habits')}
              className="text-xs font-technical uppercase tracking-widest text-[#a3a3a3] hover:text-white border border-[#333] hover:border-[#666] px-3.5 py-2.5 min-h-[44px] rounded transition-all cursor-pointer flex items-center justify-center active:scale-95"
              aria-label="Manage habits"
            >
              Manage
            </button>
          </div>
        </div>

        {/* The Matrix Table Container (Scrolls horizontally inside matrix container only) */}
        <div className="overflow-x-auto custom-scrollbar select-none w-full">
          <table className="w-full text-left border-collapse min-w-[720px] sm:min-w-[960px]">
            <thead>
              <tr className="border-b border-[#262626] bg-[#0a0a0a]">
                {/* Habit Label Column Header — Pinned/Sticky */}
                <th className="p-2.5 sm:p-4 border-r border-[#262626] w-36 sm:w-64 md:w-72 sticky left-0 bg-[#0a0a0a] z-20 font-technical text-[10px] sm:text-[11px] text-[#888] uppercase tracking-wider shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                  Habit / Activity
                </th>

                {/* Completion % Column Header */}
                <th className="p-1.5 sm:p-2 border-r border-[#262626] w-12 sm:w-14 text-center font-technical text-[9px] sm:text-[10px] text-[#888] uppercase tracking-wider">
                  Rate
                </th>

                {/* Day Columns (1..daysInMonth) */}
                {daysArray.map((day) => {
                  const isTodayHeader = day === todayDayNum;
                  const dayLetter = getDayOfWeekLetter(day);

                  return (
                    <th
                      key={day}
                      className={`p-1.5 sm:p-2 border-r border-[#222] text-center font-technical min-w-[36px] sm:min-w-[40px] transition-colors ${
                        isTodayHeader
                          ? 'bg-[#222222] text-white border-b-2 border-b-white z-10'
                          : 'text-[#737373]'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-[9px] ${isTodayHeader ? 'text-white font-bold' : 'text-[#555]'}`}>
                          {dayLetter}
                        </span>
                        <span className={`text-[11px] sm:text-[12px] ${isTodayHeader ? 'font-black text-white' : 'font-medium'}`}>
                          {day}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {activeHabits.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysArray.length + 2}
                    className="p-12 text-center text-[#737373] font-technical text-sm"
                  >
                    NO ACTIVE HABITS DEFINED. CLICK "+ ADD HABIT" TO INITIALIZE A PROTOCOL.
                  </td>
                </tr>
              ) : (
                activeHabits.map((habit) => {
                  // Calculate completion percentage for this habit in viewing month up to elapsed days
                  let completedCount = 0;
                  let trackedDaysCount = 0;
                  const maxDayToCheck = getElapsedDaysInMonth(viewingYear, viewingMonth);

                  for (let d = 1; d <= maxDayToCheck; d++) {
                    const dayStr = d.toString().padStart(2, '0');
                    const monthStr = viewingMonth.toString().padStart(2, '0');
                    const key = `${viewingYear}-${monthStr}-${dayStr}`;
                    trackedDaysCount++;
                    if (habit.history[key]) {
                      completedCount++;
                    }
                  }

                  const habitCompletionPct = trackedDaysCount > 0
                    ? Math.round((completedCount / trackedDaysCount) * 100)
                    : 0;

                  return (
                    <tr
                      key={habit.id}
                      className="hover:bg-[#151515] transition-colors group border-b border-[#1f1f1f]"
                    >
                      {/* Sticky Habit Label Cell — Pinned on left during horizontal scroll */}
                      <td className="p-2.5 sm:p-4 border-r border-[#262626] sticky left-0 bg-[#0e0e0e] group-hover:bg-[#151515] z-20 whitespace-nowrap transition-colors shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleManageHabit(habit.id)}
                            className="flex items-center gap-2 text-left text-white hover:text-[#d4d4d4] transition-colors cursor-pointer group-hover:underline max-w-[110px] sm:max-w-[190px] md:max-w-[210px] truncate"
                            title={`Click to view/manage: ${habit.name}`}
                          >
                            <HabitVisual habit={habit} size="sm" />
                            <span className="font-geist font-bold text-xs sm:text-sm text-white truncate">
                              {habit.name}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Habit Completion Percentage */}
                      <td className="p-1.5 sm:p-2 border-r border-[#262626] text-center font-technical text-[9px] sm:text-xs text-[#a3a3a3]">
                        {habitCompletionPct}%
                      </td>

                      {/* Full 1..daysInMonth Individual Daily Cells */}
                      {daysArray.map((day) => {
                        const dayStr = day.toString().padStart(2, '0');
                        const monthStr = viewingMonth.toString().padStart(2, '0');
                        const dateKey = `${viewingYear}-${monthStr}-${dayStr}`;
                        const isDone = !!habit.history[dateKey];
                        const isTodayCell = isToday(dateKey);
                        const isPastCell = isPast(dateKey);
                        const isFutureCell = isFuture(dateKey);

                        return (
                          <td
                            key={day}
                            className={`p-1 sm:p-2 border-r border-[#1c1c1c] text-center transition-colors min-w-[36px] sm:min-w-[40px] ${
                              isTodayCell ? 'bg-[#202020]' : ''
                            } ${isFutureCell ? 'opacity-30' : ''}`}
                          >
                            {isTodayCell ? (
                              // Interactive Today Checkbox with comfortable touch area
                              <button
                                type="button"
                                onClick={() => toggleHabitDay(habit.id, dateKey)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px] mx-auto rounded-xs flex items-center justify-center transition-all cursor-pointer select-none ${
                                  isDone
                                    ? 'bg-white text-black font-extrabold shadow-sm hover:bg-neutral-200 active:scale-95'
                                    : 'border-2 border-white bg-[#141414] hover:bg-white/20 pulse-border active:scale-95'
                                }`}
                                title={`${habit.name} on Today (${dateKey}): ${isDone ? 'Completed (Click to uncheck)' : 'Pending (Click to mark complete)'}`}
                                aria-label={`Mark ${habit.name} ${isDone ? 'incomplete' : 'complete'} for today, ${dateKey}`}
                              >
                                {isDone ? (
                                  <span className="material-symbols-outlined text-black text-[17px] font-bold leading-none">
                                    check
                                  </span>
                                ) : (
                                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                                )}
                              </button>
                            ) : isPastCell ? (
                              // Read-only Past cell
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xs flex items-center justify-center cursor-default select-none ${
                                  isDone
                                    ? 'bg-[#333333] text-white'
                                    : 'border border-[#222222] bg-[#0d0d0d]'
                                }`}
                                title={`Past date (${dateKey}): ${isDone ? 'Completed (Read-only)' : 'Not logged (Read-only)'}`}
                              >
                                {isDone ? (
                                  <span className="material-symbols-outlined text-[#d4d4d4] text-[15px] leading-none">
                                    check
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-[#444] font-technical">·</span>
                                )}
                              </div>
                            ) : (
                              // Locked / Future cell
                              <div
                                className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xs border border-[#1a1a1a] bg-[#080808] flex items-center justify-center cursor-not-allowed select-none"
                                title={`Future date (${dateKey}): Locked`}
                              >
                                <span className="text-[9px] text-[#333] font-technical">·</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Note */}
        <div className="p-3 sm:p-4 bg-[#0a0a0a] border-t border-[#262626] flex flex-wrap items-center justify-between text-xs font-technical text-[#737373] gap-2">
          <span>
            1-CLICK EXECUTION: Click today's checkbox (<span className="text-white">□</span>) to log completion.
          </span>
          <span className="text-[10px] uppercase">
            FocusTrack • Monochrome Routine Engine
          </span>
        </div>
      </section>
    </div>
  );
};
