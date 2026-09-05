import React, { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';

export const AnalyticsView: React.FC = () => {
  const { stats, habits } = useHabits();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);

  // Compute total completed habit repetitions across all active/archived habits
  const totalRepetitions = useMemo(() => {
    let total = 0;
    habits.forEach(h => {
      Object.values(h.history).forEach(val => {
        if (val) total++;
      });
    });
    return total;
  }, [habits]);

  // Compute overall consistency rate
  const overallConsistencyRate = useMemo(() => {
    if (habits.length === 0) return 0;
    return stats.overallCompletion || 0;
  }, [habits, stats.overallCompletion]);

  // Compute longest streak across all habits
  const longestStreak = useMemo(() => {
    return stats.bestStreak || 0;
  }, [stats.bestStreak]);

  // Compute current streak
  const currentRunStreak = useMemo(() => {
    return stats.currentStreak || 0;
  }, [stats.currentStreak]);

  // Generate 52 weeks x 7 days heatmap for selectedYear dynamically
  const generateHeatmapWeeks = () => {
    const weeks: { dateStr: string; dayOfWeek: number; count: number; level: number }[][] = [];
    const startDate = new Date(selectedYear, 0, 1);
    const dayOfWeek = (startDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const current = new Date(startDate);
    current.setDate(current.getDate() - dayOfWeek);

    for (let w = 0; w < 53; w++) {
      const week: { dateStr: string; dayOfWeek: number; count: number; level: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const year = current.getFullYear();
        const monthStr = (current.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = current.getDate().toString().padStart(2, '0');
        const key = `${year}-${monthStr}-${dayStr}`;

        // Count how many habits completed on this day
        let completedCount = 0;
        habits.forEach(h => {
          if (h.history[key]) completedCount++;
        });

        // Determine brightness level (0 to 4)
        let level = 0;
        if (completedCount >= 4) level = 4;
        else if (completedCount === 3) level = 3;
        else if (completedCount === 2) level = 2;
        else if (completedCount === 1) level = 1;

        week.push({
          dateStr: key,
          dayOfWeek: d,
          count: completedCount,
          level,
        });

        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current.getFullYear() > selectedYear && w >= 51) break;
    }
    return weeks;
  };

  const heatmapWeeks = generateHeatmapWeeks();

  // Dynamically calculate monthly consistency rates for selectedYear
  const monthlyRates = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((monthName, monthIndex) => {
      const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
      let monthCompleted = 0;
      let monthTotalPossible = habits.length * daysInMonth;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${selectedYear}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        habits.forEach(h => {
          if (h.history[dateKey]) monthCompleted++;
        });
      }

      const rate = monthTotalPossible > 0 ? Math.round((monthCompleted / monthTotalPossible) * 100) : 0;
      return { month: monthName, rate };
    });
  }, [habits, selectedYear]);

  // Identify peak month
  const maxMonthlyRate = Math.max(...monthlyRates.map(m => m.rate), 0);

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col pb-28 md:pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-8 border-b border-[#262626] pb-4 sm:pb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase font-geist">
          PERFORMANCE
        </h2>
        <p className="text-xs text-[#a3a3a3] font-technical uppercase tracking-widest mt-1">
          Real-time metrics calculated from your daily executions.
        </p>
      </div>

      {/* Top 3 Stat Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-6 md:mb-8 w-full">
        {/* Card 1: Overall Consistency */}
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between hover:border-white transition-colors group min-w-0">
          <div>
            <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-2.5">
              OVERALL CONSISTENCY
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tighter font-geist">
                {overallConsistencyRate}%
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Active habits average</p>
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
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tighter font-geist">
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
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tighter font-geist">
                {longestStreak}
              </span>
              <span className="text-xs font-technical text-[#a3a3a3] uppercase tracking-wider">
                Days
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Consecutive execution record</p>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="font-technical text-[10px] text-[#a3a3a3] uppercase tracking-wider">
              CURRENT RUN: {currentRunStreak} DAYS
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded mb-6 md:mb-8 w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
            CONSISTENCY HEATMAP ({selectedYear})
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-technical text-[#737373]">
            <span>Less</span>
            <span className="w-2.5 h-2.5 bg-[#181818] border border-[#262626] rounded-xs"></span>
            <span className="w-2.5 h-2.5 bg-[#3b3b3b] rounded-xs"></span>
            <span className="w-2.5 h-2.5 bg-[#6b6b6b] rounded-xs"></span>
            <span className="w-2.5 h-2.5 bg-[#a3a3a3] rounded-xs"></span>
            <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid (Scrolls horizontally inside container) */}
        <div className="overflow-x-auto custom-scrollbar pb-2 w-full select-none">
          <div className="flex flex-col gap-1 min-w-[640px] sm:min-w-[750px]">
            {/* Months Header Row */}
            <div className="flex text-[9px] font-technical text-[#737373] pl-6 mb-1">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                <div key={m} className="flex-1 text-center">
                  {m}
                </div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="flex gap-1">
              <div className="flex flex-col justify-between text-[9px] font-technical text-[#737373] pr-2 shrink-0 py-0.5">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>
              <div className="flex gap-1 flex-1">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 flex-1">
                    {week.map((cell, cIdx) => {
                      let bgColor = 'bg-[#181818] border border-[#262626]';
                      if (cell.level === 1) bgColor = 'bg-[#3b3b3b]';
                      if (cell.level === 2) bgColor = 'bg-[#6b6b6b]';
                      if (cell.level === 3) bgColor = 'bg-[#a3a3a3]';
                      if (cell.level === 4) bgColor = 'bg-white';

                      return (
                        <div
                          key={cIdx}
                          onMouseEnter={() => setHoveredCell({ date: cell.dateStr, count: cell.count })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-full aspect-square rounded-xs transition-all cursor-pointer hover:scale-125 hover:z-10 ${bgColor}`}
                          title={`${cell.dateStr}: ${cell.count} habits logged`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Tooltip display */}
        <div className="h-4 mt-2">
          {hoveredCell ? (
            <p className="text-[10px] font-technical text-white text-right">
              {hoveredCell.date} — <span className="text-white font-bold">{hoveredCell.count} executions</span>
            </p>
          ) : (
            <p className="text-[10px] font-technical text-[#525252] text-right">Hover or tap grid for daily logs</p>
          )}
        </div>
      </div>

      {/* Bottom Grid: Monthly Consistency Bar Chart */}
      <div className="grid grid-cols-1 gap-6 w-full">
        <div className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded flex flex-col justify-between w-full min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
            <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              Monthly Consistency ({selectedYear})
            </h3>
            <div className="flex border border-[#262626] rounded p-1 bg-[#0a0a0a] w-full sm:w-auto justify-between sm:justify-start">
              {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 min-h-[40px] text-xs font-technical uppercase rounded transition-colors cursor-pointer flex-1 sm:flex-initial text-center ${
                    selectedYear === yr ? 'bg-white text-black font-bold' : 'text-[#737373] hover:text-white'
                  }`}
                  aria-label={`Select year ${yr}`}
                >
                  {yr}
                </button>
              ))}
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
    </div>
  );
};
