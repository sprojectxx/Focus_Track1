import React, { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import {
  calculateTotalRepetitions,
  calculateOverallConsistency,
  calculateOverallStreaks,
  getMonthlyConsistencyMatrix,
  calculateMonthlyRates,
  getDeviceTimeZone,
} from '../utils/habitStats';
import { getTodayYMD } from '../utils/date';

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const HEATMAP_BG: Record<number, string> = {
  0: 'bg-[#161616] border border-[#262626]',
  1: 'bg-[#3A3A3A]',
  2: 'bg-[#777777]',
  3: 'bg-[#B0B0B0]',
  4: 'bg-white',
};

export const AnalyticsView: React.FC = () => {
  const { habits } = useHabits();
  const timeZone = useMemo(() => getDeviceTimeZone(), []);
  const todayStr = useMemo(() => getTodayYMD(), []);
  const todayParts = useMemo(() => {
    const parts = todayStr.split('-');
    return {
      year: parseInt(parts[0], 10) || new Date().getFullYear(),
      month: parseInt(parts[1], 10) || (new Date().getMonth() + 1),
    };
  }, [todayStr]);

  const [selectedYear, setSelectedYear] = useState<number>(todayParts.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayParts.month);

  const totalRepetitions = useMemo(
    () => calculateTotalRepetitions(habits, todayStr, timeZone),
    [habits, todayStr, timeZone]
  );

  const overallConsistencyRate = useMemo(
    () => calculateOverallConsistency(habits, todayStr, timeZone),
    [habits, todayStr, timeZone]
  );

  const streaks = useMemo(
    () => calculateOverallStreaks(habits, todayStr, timeZone),
    [habits, todayStr, timeZone]
  );

  const monthlyMatrix = useMemo(
    () => getMonthlyConsistencyMatrix(habits, selectedYear, selectedMonth, timeZone),
    [habits, selectedYear, selectedMonth, timeZone]
  );

  const monthlyRates = useMemo(
    () => calculateMonthlyRates(habits, selectedYear, todayStr, timeZone),
    [habits, selectedYear, todayStr, timeZone]
  );

  const isCurrentOrFutureMonth =
    selectedYear > todayParts.year ||
    (selectedYear === todayParts.year && selectedMonth >= todayParts.month);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (isCurrentOrFutureMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const maxMonthlyRate = Math.max(...monthlyRates.map((m) => m.rate), 0);

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col pb-28 md:pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-8 border-b border-[#262626] pb-4 sm:pb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase font-geist">
          PERFORMANCE
        </h2>
        <p className="text-xs text-[#a3a3a3] font-technical uppercase tracking-widest mt-1">
          Discipline Engine & Performance Trends
        </p>
      </div>

      {/* Top 4 Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6 md:mb-8 w-full">
        {/* Card 1: Overall Consistency */}
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between hover:border-white transition-colors group min-w-0">
          <div>
            <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-2.5">
              OVERALL CONSISTENCY
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter font-geist">
                {overallConsistencyRate}%
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Due sessions completed</p>
          </div>
          <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden mt-5">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallConsistencyRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Completed */}
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between hover:border-white transition-colors group min-w-0">
          <div>
            <div className="flex justify-between items-start">
              <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-2.5">
                TOTAL COMPLETED
              </div>
              <span className="material-symbols-outlined text-[#737373] group-hover:text-white transition-colors">
                checklist_rtl
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter font-geist">
              {totalRepetitions.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Total habit repetitions</p>
          </div>
          <div className="font-technical text-[10px] text-[#a3a3a3] uppercase tracking-wider mt-3">
            ACROSS ALL LOGGED PROTOCOLS
          </div>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between hover:border-white transition-colors group min-w-0">
          <div>
            <div className="flex justify-between items-start">
              <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-2.5">
                LONGEST STREAK
              </div>
              <span className="material-symbols-outlined text-[#737373] group-hover:text-white transition-colors">
                local_fire_department
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter font-geist">
                {streaks.bestStreak}
              </span>
              <span className="text-xs font-technical text-[#a3a3a3] uppercase tracking-wider">
                Days
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Consecutive execution record</p>
          </div>
          <div className="font-technical text-[10px] text-[#a3a3a3] uppercase tracking-wider mt-3">
            BEST HISTORICAL RUN
          </div>
        </div>

        {/* Card 4: Current Streak */}
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between hover:border-white transition-colors group min-w-0">
          <div>
            <div className="flex justify-between items-start">
              <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-2.5">
                CURRENT STREAK
              </div>
              <span className="material-symbols-outlined text-[#737373] group-hover:text-white transition-colors">
                bolt
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter font-geist">
                {streaks.currentStreak}
              </span>
              <span className="text-xs font-technical text-[#a3a3a3] uppercase tracking-wider">
                Days
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Active execution streak</p>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="font-technical text-[10px] text-[#a3a3a3] uppercase tracking-wider">
              ACTIVE RUN
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Consistency Matrix Section */}
      <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded mb-6 md:mb-8 w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 border-b border-[#262626] pb-4">
          <div>
            <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              MONTHLY CONSISTENCY MATRIX
            </h3>
            <p className="text-[11px] text-[#737373] font-technical uppercase mt-0.5">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 border border-[#262626] rounded p-1 bg-[#0a0a0a]">
            <button
              onClick={prevMonth}
              className="px-2.5 py-1 text-white hover:bg-[#262626] rounded transition-colors cursor-pointer text-xs font-bold"
              aria-label="Previous Month"
            >
              ←
            </button>
            <span className="text-xs font-technical font-bold text-white uppercase px-2">
              {MONTH_NAMES[selectedMonth - 1].slice(0, 3)} {selectedYear}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentOrFutureMonth}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-bold ${
                isCurrentOrFutureMonth
                  ? 'text-[#444] cursor-not-allowed'
                  : 'text-white hover:bg-[#262626] cursor-pointer'
              }`}
              aria-label="Next Month"
            >
              →
            </button>
          </div>
        </div>

        {/* 7-Column Weekday Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center font-technical text-[10px] text-[#737373] uppercase mb-2 border-b border-[#262626] pb-2">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        {/* 7-Column Grid */}
        <div className="grid grid-cols-7 gap-1.5 w-full">
          {monthlyMatrix.map((cell, idx) => {
            const isCurrentMonth = cell.isCurrentMonth;
            const isTodayCell = cell.isToday;
            const isFutureCell = cell.isFuture;
            const level = cell.level;
            const totalDue = cell.totalDue;

            if (!isCurrentMonth) {
              return (
                <div
                  key={idx}
                  className="aspect-square rounded border border-transparent bg-[#0a0a0a] opacity-15 flex flex-col items-center justify-center p-1"
                >
                  <span className="text-[10px] font-bold text-[#555]">
                    {cell.day.toString().padStart(2, '0')}
                  </span>
                </div>
              );
            }

            const bgClass = !isFutureCell && totalDue > 0 ? HEATMAP_BG[level] : 'bg-[#181818] border border-[#262626]';
            const todayBorder = isTodayCell ? 'ring-2 ring-white ring-offset-1 ring-offset-[#121212]' : '';
            const textColor = !isFutureCell && level >= 3 ? 'text-black font-extrabold' : 'text-white';
            const subTextColor = !isFutureCell && level >= 3 ? 'text-black/80' : 'text-[#888]';

            return (
              <div
                key={idx}
                className={`aspect-square rounded flex flex-col items-center justify-center p-1 transition-all ${bgClass} ${todayBorder} ${
                  isFutureCell ? 'opacity-25' : ''
                }`}
                title={`${cell.dateKey}: ${cell.completedDue}/${cell.totalDue} due completed`}
              >
                <span className={`text-[10px] sm:text-xs font-technical font-bold ${textColor}`}>
                  {cell.day.toString().padStart(2, '0')}
                </span>
                {!isFutureCell && totalDue > 0 ? (
                  <span className={`text-[8px] sm:text-[9px] font-technical font-bold ${subTextColor}`}>
                    {cell.completedDue}/{cell.totalDue}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] font-technical text-[#737373]">
          <span>0%</span>
          <span className="w-3 h-3 bg-[#161616] border border-[#262626] rounded-xs"></span>
          <span className="w-3 h-3 bg-[#3A3A3A] rounded-xs"></span>
          <span className="w-3 h-3 bg-[#777777] rounded-xs"></span>
          <span className="w-3 h-3 bg-[#B0B0B0] rounded-xs"></span>
          <span className="w-3 h-3 bg-white rounded-xs"></span>
          <span>100%</span>
        </div>
      </div>

      {/* 12-Month Completion Trajectory Bar Chart */}
      <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <div>
            <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              MONTHLY RATE TRAJECTORY ({selectedYear})
            </h3>
            <p className="text-[11px] text-[#737373] font-technical uppercase mt-0.5">
              12-Month Completion Distribution
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end gap-1.5 sm:gap-4 h-40 sm:h-48 pt-6 border-b border-[#262626] pb-2 w-full">
          {monthlyRates.map((m) => {
            const isPeak = m.rate > 0 && m.rate === maxMonthlyRate;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] font-technical text-[#737373] group-hover:text-white transition-colors mb-1 opacity-0 group-hover:opacity-100">
                  {m.rate}%
                </span>
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isPeak
                      ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : m.rate > 0
                      ? 'bg-[#3b3b3b] hover:bg-[#525252]'
                      : 'bg-[#181818]'
                  }`}
                  style={{ height: `${Math.max(m.rate, 4)}%` }}
                />
                <span
                  className={`text-[9px] sm:text-[10px] font-technical uppercase tracking-wider mt-2 ${
                    isPeak ? 'text-white font-bold' : 'text-[#737373]'
                  }`}
                >
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
