import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';

export const AnalyticsView: React.FC = () => {
  const { stats, habits } = useHabits();
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);

  // Generate 52 weeks x 7 days heatmap for selectedYear
  const generateHeatmapWeeks = () => {
    const weeks: { dateStr: string; dayOfWeek: number; count: number; level: number }[][] = [];
    const startDate = new Date(selectedYear, 0, 1);
    // Align start to the first Monday on or before Jan 1
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
        let completedCount不易 = 0;
        habits.forEach(h => {
          if (h.history[key]) completedCount不易++;
        });

        // Determine brightness level (0 to 4)
        let level = 0;
        if (completedCount不易 >= 4) level = 4;
        else if (completedCount不易 === 3) level = 3;
        else if (completedCount不易 === 2) level = 2;
        else if (completedCount不易 === 1) level = 1;

        week.push({
          dateStr: key,
          dayOfWeek: d,
          count: completedCount不易,
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

  // Monthly consistency rates for selectedYear
  const monthlyRates = [
    { month: 'Jan', rate: 78 },
    { month: 'Feb', rate: 82 },
    { month: 'Mar', rate: 85 },
    { month: 'Apr', rate: 80 },
    { month: 'May', rate: 91 },
    { month: 'Jun', rate: 95, isPeak: true },
    { month: 'Jul', rate: 88 },
    { month: 'Aug', rate: 87 },
    { month: 'Sep', rate: 84 },
    { month: 'Oct', rate: 89 },
    { month: 'Nov', rate: 83 },
    { month: 'Dec', rate: 90 },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col pb-24">
      {/* Header */}
      <div className="mb-8 border-b border-[#262626] pb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase font-geist">
          PERFORMANCE
        </h2>
        <p className="text-xs text-[#a3a3a3] font-technical uppercase tracking-widest mt-1">
          A clear overview of your consistency and progress.
        </p>
      </div>

      {/* Top 3 Stat Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Overall Consistency */}
        <div className="bg-[#121212] border border-[#262626] p-6 rounded flex flex-col justify-between hover:border-white transition-colors group">
          <div>
            <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-3">
              OVERALL CONSISTENCY
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter font-geist">
                87%
              </span>
              <span className="text-xs font-technical font-bold text-white flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                +2.4%
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">vs last month</p>
          </div>
          <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden mt-6">
            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: '87%' }}></div>
          </div>
        </div>

        {/* Card 2: Total Completed */}
        <div className="bg-[#121212] border border-[#262626] p-6 rounded flex flex-col justify-between hover:border-white transition-colors group">
          <div>
            <div className="flex justify-between items-start">
              <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-3">
                TOTAL COMPLETED
              </div>
              <span className="material-symbols-outlined text-[#737373] group-hover:text-white transition-colors">
                checklist_rtl
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter font-geist">
              {stats.totalCompletedSessions.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Total habit repetitions</p>
          </div>
          <div className="font-technical text-[10px] text-[#a3a3a3] uppercase tracking-wider mt-4">
            ACROSS ALL LOGGED PROTOCOLS
          </div>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="bg-[#121212] border border-[#262626] p-6 rounded flex flex-col justify-between hover:border-white transition-colors group">
          <div>
            <div className="flex justify-between items-start">
              <div className="font-technical text-xs font-bold text-[#a3a3a3] uppercase tracking-widest mb-3">
                LONGEST STREAK
              </div>
              <span className="material-symbols-outlined text-[#737373] group-hover:text-white transition-colors">
                local_fire_department
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter font-geist">
                42
              </span>
              <span className="text-xs font-technical text-[#a3a3a3] uppercase tracking-wider">
                Days
              </span>
            </div>
            <p className="text-[11px] text-[#737373] mt-1 font-technical">Achieved on Deep Work</p>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span className="font-technical text-[10px] text-white uppercase tracking-widest">
              CURRENT RUN: 12 DAYS
            </span>
          </div>
        </div>
      </div>

      {/* Yearly Consistency Heatmap */}
      <div className="bg-[#121212] border border-[#262626] p-6 rounded mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              Consistency Heatmap ({selectedYear})
            </h3>
            {hoveredCell && (
              <span className="text-xs font-technical text-[#a3a3a3] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333]">
                {hoveredCell.date}: {hoveredCell.count} completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-technical text-[#a3a3a3]">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-xs bg-[#1a1a1a] border border-[#262626]"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-[#404040]"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-[#737373]"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-[#a3a3a3]"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-white"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Month Labels */}
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[700px]">
            <div className="flex text-[10px] font-technical text-[#737373] uppercase mb-2 pl-7 justify-between pr-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>

            {/* Grid with Mon/Wed/Fri Labels */}
            <div className="flex gap-1.5">
              <div className="flex flex-col justify-between text-[9px] font-technical text-[#737373] pr-2 py-0.5">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              <div className="flex gap-1 flex-1">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 flex-1">
                    {week.map((day, dIdx) => {
                      const colorClass =
                        day.level === 4
                          ? 'bg-white'
                          : day.level === 3
                          ? 'bg-[#a3a3a3]'
                          : day.level === 2
                          ? 'bg-[#737373]'
                          : day.level === 1
                          ? 'bg-[#404040]'
                          : 'bg-[#171717] border border-[#262626]';

                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={() => setHoveredCell({ date: day.dateStr, count: day.count })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`aspect-square w-full rounded-xs transition-transform hover:scale-125 cursor-pointer ${colorClass}`}
                          title={`${day.dateStr}: ${day.count} habits`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Trend & Monthly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Daily Completion Trend */}
        <div className="bg-[#121212] border border-[#262626] p-6 rounded flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              Daily Completion Trend
            </h3>
            <span className="text-xs font-technical text-[#737373] uppercase">Last 30 Days</span>
          </div>

          {/* SVG Area Line Chart */}
          <div className="relative h-48 w-full mt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="400" y2="20" stroke="#262626" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="#262626" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="400" y2="130" stroke="#262626" />

              {/* Area Fill */}
              <path
                d="M 0 100 Q 50 120, 100 80 T 200 60 T 300 40 T 400 25 L 400 130 L 0 130 Z"
                fill="url(#trendGradient)"
              />

              {/* Trend Line */}
              <path
                d="M 0 100 Q 50 120, 100 80 T 200 60 T 300 40 T 400 25"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Current Status Glow Dot */}
              <circle cx="400" cy="25" r="4" fill="#ffffff" />
              <circle cx="400" cy="25" r="8" fill="#ffffff" opacity="0.3" />
            </svg>

            {/* Scale Labels */}
            <div className="absolute left-0 top-0 text-[9px] font-technical text-[#737373]">100%</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-technical text-[#737373]">50%</div>
            <div className="absolute left-0 bottom-0 text-[9px] font-technical text-[#737373]">0%</div>
          </div>
        </div>

        {/* Right: Monthly Consistency Bar Chart */}
        <div className="bg-[#121212] border border-[#262626] p-6 rounded flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              Monthly Consistency
            </h3>
            <div className="flex border border-[#262626] rounded p-0.5 bg-[#0a0a0a]">
              {[2023, 2024, 2026].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2 py-0.5 text-[10px] font-technical uppercase rounded transition-colors cursor-pointer ${
                    selectedYear === yr ? 'bg-white text-black font-bold' : 'text-[#737373] hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-1.5 h-48 pt-4">
            {monthlyRates.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  className={`w-full rounded-t-xs transition-all duration-300 ${
                    item.isPeak
                      ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                      : 'bg-[#262626] group-hover:bg-[#404040]'
                  }`}
                  style={{ height: `${item.rate}%` }}
                ></div>
                <span
                  className={`text-[9px] font-technical uppercase ${
                    item.isPeak ? 'text-white font-bold' : 'text-[#737373]'
                  }`}
                >
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
