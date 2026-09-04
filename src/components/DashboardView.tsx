import React, { useMemo, useState, useEffect } from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';
import { getTimeBasedGreeting, getRandomQuote, MotivationalQuote } from '../data/motivationalQuotes';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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

  const daysInMonth = new Date(viewingYear, viewingMonth, 0).getDate();
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
    <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1500px] mx-auto w-full flex flex-col pb-24">
      {/* Time-Based Greeting & Hero Motto Header */}
      <section className="flex flex-col items-center justify-center py-8 md:py-12 border-b border-[#222] text-center mb-6">
        {/* Dynamic Time-Based Greeting Badge */}
        <div className="mb-3 px-3 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-technical text-emerald-400 uppercase tracking-[0.25em] font-bold">
          {greetingInfo.greeting}
        </div>

        {/* Dynamic Quote Headline */}
        <h1 className="font-geist text-2xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-white tracking-tighter uppercase leading-[1.08] max-w-5xl px-4">
          "{currentQuote.quote}"
        </h1>

        <p className="mt-3 md:mt-4 font-technical text-[11px] text-[#8e9192] uppercase tracking-[0.25em]">
          — {currentQuote.author} {currentQuote.translation ? `• ${currentQuote.translation}` : ''}
        </p>
        <p className="mt-1 font-technical text-[10px] text-emerald-400/80 uppercase tracking-widest">
          {greetingInfo.subtext}
        </p>
      </section>


      {/* Month Header & Quick Action Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-5">
        {/* Navigation Controls */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="font-geist text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
              {monthNames[viewingMonth - 1]} {viewingYear}
            </h2>
            {isCurrentViewingMonth && (
              <span className="font-technical text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded-xs uppercase tracking-widest">
                Active Month
              </span>
            )}
          </div>

          <div className="flex items-center border border-[#333] rounded p-1 w-fit bg-[#141414]">
            <button
              onClick={prevMonth}
              className="px-3 py-1 hover:bg-[#222] transition-colors rounded text-[#a3a3a3] hover:text-white text-xs font-technical uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span> Prev
            </button>
            <div className="w-px h-4 bg-[#333] mx-1"></div>
            <button
              onClick={goToToday}
              className={`px-4 py-1 transition-colors rounded font-bold text-xs font-technical uppercase tracking-widest cursor-pointer ${
                isCurrentViewingMonth ? 'bg-white text-black' : 'bg-[#222] text-white hover:bg-[#333]'
              }`}
            >
              Today
            </button>
            <div className="w-px h-4 bg-[#333] mx-1"></div>
            <button
              onClick={nextMonth}
              className="px-3 py-1 hover:bg-[#222] transition-colors rounded text-[#a3a3a3] hover:text-white text-xs font-technical uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              Next <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Stats Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full lg:w-auto">
          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-[125px]">
            <span className="font-geist text-xl md:text-2xl font-bold text-white mb-0.5">
              {stats.overallCompletion}%
            </span>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider">
              OVERALL COMPLETION
            </span>
          </div>

          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-[125px]">
            <div className="flex items-baseline gap-1">
              <span className="font-geist text-xl md:text-2xl font-bold text-white mb-0.5">
                {todayCompletedCount}
              </span>
              <span className="text-[#737373] font-technical text-xs">/{activeHabits.length}</span>
            </div>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider">
              TODAY'S EXECUTION
            </span>
          </div>

          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-[125px]">
            <span className="font-geist text-xl md:text-2xl font-bold text-white mb-0.5">
              {stats.currentStreak} <span className="text-xs text-[#737373] font-normal">days</span>
            </span>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider">
              CURRENT STREAK
            </span>
          </div>

          <div className="bg-[#121212] border border-[#262626] p-3 sm:p-4 rounded flex flex-col justify-end min-w-[125px]">
            <span className="font-geist text-xl md:text-2xl font-bold text-white mb-0.5">
              {stats.totalCompletedSessions}
            </span>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-wider">
              TOTAL LOGS
            </span>
          </div>
        </div>
      </div>

      {/* Primary Execution Habit Matrix */}
      <section className="bg-[#0e0e0e] border border-[#262626] rounded shadow-2xl overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#141414] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-geist text-base sm:text-lg font-bold text-white tracking-tight uppercase">
              DAILY HABIT MATRIX
            </h3>
            <span className="text-[11px] font-technical text-[#737373] uppercase">
              ({activeHabits.length} ACTIVE HABITS)
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
              className="text-xs font-technical uppercase tracking-widest text-black bg-white hover:bg-neutral-200 font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Habit</span>
            </button>

            <button
              onClick={() => setCurrentTab('habits')}
              className="text-xs font-technical uppercase tracking-widest text-[#a3a3a3] hover:text-white border border-[#333] hover:border-[#666] px-3 py-1.5 rounded transition-all cursor-pointer"
            >
              Manage
            </button>
          </div>
        </div>

        {/* The Matrix Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-[#262626] bg-[#0a0a0a]">
                {/* Habit Label Column Header */}
                <th className="p-3 sm:p-4 border-r border-[#262626] w-64 sm:w-72 sticky left-0 bg-[#0a0a0a] z-20 font-technical text-[11px] text-[#888] uppercase tracking-wider">
                  Habit / Activity
                </th>

                {/* Completion % Column Header */}
                <th className="p-2 border-r border-[#262626] w-14 text-center font-technical text-[10px] text-[#888] uppercase tracking-wider">
                  Rate
                </th>

                {/* Day Columns (1..31) */}
                {daysArray.map((day) => {
                  const isToday = day === todayDayNum;
                  const dayLetter = getDayOfWeekLetter(day);

                  return (
                    <th
                      key={day}
                      className={`p-1.5 sm:p-2 border-r border-[#222] text-center font-technical min-w-[32px] sm:min-w-[36px] transition-colors ${
                        isToday
                          ? 'bg-[#222222] text-white border-b-2 border-b-white z-10'
                          : 'text-[#737373]'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-[9px] ${isToday ? 'text-white font-bold' : 'text-[#555]'}`}>
                          {dayLetter}
                        </span>
                        <span className={`text-[12px] ${isToday ? 'font-black text-white' : 'font-medium'}`}>
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
                  // Calculate completion percentage for this habit in viewing month
                  let completedCount = 0;
                  let trackedDaysCount = 0;
                  const maxDayToCheck = isCurrentViewingMonth ? 30 : daysInMonth;

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
                      {/* Sticky Habit Label */}
                      <td className="p-3 sm:p-4 border-r border-[#262626] sticky left-0 bg-[#0e0e0e] group-hover:bg-[#151515] z-20 whitespace-nowrap transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleManageHabit(habit.id)}
                            className="flex items-center gap-2.5 text-left text-white hover:text-[#d4d4d4] transition-colors cursor-pointer group-hover:underline max-w-[190px] sm:max-w-[210px] truncate"
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
                      <td className="p-2 border-r border-[#262626] text-center font-technical text-[10px] sm:text-xs text-[#a3a3a3]">
                        {habitCompletionPct}%
                      </td>

                      {/* Full 1..31 Individual Daily Checkbox Cells */}
                      {daysArray.map((day) => {
                        const dayStr = day.toString().padStart(2, '0');
                        const monthStr = viewingMonth.toString().padStart(2, '0');
                        const dateKey = `${viewingYear}-${monthStr}-${dayStr}`;
                        const isDone = !!habit.history[dateKey];
                        const isToday = day === todayDayNum;
                        const isFuture = todayDayNum > 0 && day > todayDayNum;

                        return (
                          <td
                            key={day}
                            className={`p-1.5 sm:p-2 border-r border-[#1c1c1c] text-center transition-colors ${
                              isToday ? 'bg-[#202020]' : ''
                            } ${isFuture ? 'opacity-30' : ''}`}
                          >
                            {isFuture ? (
                              // Locked / Future cell
                              <div
                                className="w-6 h-6 mx-auto rounded-xs border border-[#222] bg-[#0c0c0c] flex items-center justify-center cursor-not-allowed"
                                title={`Future: ${dateKey}`}
                              >
                                <span className="text-[9px] text-[#444] font-technical">·</span>
                              </div>
                            ) : (
                              // Interactive Single-Click Checkbox
                              <button
                                type="button"
                                onClick={() => toggleHabitDay(habit.id, dateKey)}
                                className={`w-6 h-6 mx-auto rounded-xs flex items-center justify-center transition-all cursor-pointer select-none ${
                                  isDone
                                    ? 'bg-white text-black font-extrabold shadow-sm hover:bg-neutral-200'
                                    : isToday
                                    ? 'border-2 border-white bg-[#141414] hover:bg-white/20 pulse-border'
                                    : 'border border-[#2a2a2a] bg-[#101010] hover:border-[#555] hover:bg-[#1a1a1a]'
                                }`}
                                title={`${habit.name} on ${dateKey}: ${isDone ? 'Completed (Click to uncheck)' : 'Pending (Click to mark complete)'}`}
                                aria-label={`${habit.name} ${dateKey}`}
                              >
                                {isDone ? (
                                  <span className="material-symbols-outlined text-black text-[17px] font-bold leading-none">
                                    check
                                  </span>
                                ) : isToday ? (
                                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                                ) : null}
                              </button>
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
