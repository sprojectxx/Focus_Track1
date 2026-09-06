import React from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';
import { getDaysInMonth, isToday, isPast, isFuture } from '../utils/date';
import { calculateHabitStats } from '../utils/habitStats';

export const HabitDetailView: React.FC = () => {
  const {
    selectedHabit,
    setSelectedHabitId,
    setEditingHabit,
    setIsCreateModalOpen,
    archiveHabit,
    deleteHabit,
    toggleHabitDay,
    viewingYear,
    viewingMonth,
  } = useHabits();

  if (!selectedHabit) {
    return (
      <div className="flex-1 p-8 text-center text-[#8e9192]">
        <p>No habit selected.</p>
        <button
          onClick={() => setSelectedHabitId(null)}
          className="mt-4 px-4 py-2 border border-[#444748] text-white rounded font-technical text-xs cursor-pointer"
        >
          Back to Habits
        </button>
      </div>
    );
  }

  // Calculate detailed stats dynamically using central calculation engine
  const stats = calculateHabitStats(selectedHabit, viewingYear, viewingMonth);
  const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);

  // Generate recent days history grid up to daysInMonth
  const recentDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = viewingMonth.toString().padStart(2, '0');
    const dateKey = `${viewingYear}-${monthStr}-${dayStr}`;
    return {
      day,
      dateKey,
      isDone: !!selectedHabit.history[dateKey],
      isTodayCell: isToday(dateKey),
      isPastCell: isPast(dateKey),
      isFutureCell: isFuture(dateKey),
    };
  });

  return (
    <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1440px] mx-auto w-full flex flex-col pb-24">
      {/* Header & Breadcrumb */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#262626] pb-6">
        <div>
          <button
            onClick={() => setSelectedHabitId(null)}
            className="inline-flex items-center text-[#a3a3a3] hover:text-white transition-colors text-xs font-technical uppercase tracking-widest mb-3 cursor-pointer gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Habits Overview
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded bg-[#181818] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
              <HabitVisual habit={selectedHabit} size="md" />
            </div>
            <div>
              <h1 className="font-geist text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">
                {selectedHabit.name}
              </h1>
              <p className="text-xs text-[#8e9192] font-technical uppercase tracking-wider mt-0.5">
                {selectedHabit.categoryLabel || selectedHabit.category} • Priority: {selectedHabit.priority}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingHabit(selectedHabit);
              setIsCreateModalOpen(true);
            }}
            className="bg-transparent border border-[#444748] text-white hover:bg-[#1f1f1f] hover:border-white px-5 py-2 rounded font-technical text-xs transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Habit
          </button>
        </div>
      </div>

      {/* Description if available */}
      {selectedHabit.description && (
        <div className="p-4 bg-[#141414] border border-[#262626] rounded mb-8">
          <span className="font-technical text-[10px] text-[#737373] uppercase tracking-widest block mb-1">
            Habit Action Criteria / Description
          </span>
          <p className="text-sm text-[#d4d4d4]">{selectedHabit.description}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between rounded">
          <div className="text-[#8e9192] font-technical text-[10px] uppercase tracking-widest mb-1.5">
            Completion Rate
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-geist font-bold text-white text-3xl">
              {stats.completionRate}
            </span>
            <span className="text-[#8e9192] text-sm">%</span>
          </div>
          <div className="w-full bg-[#262626] h-[2px] mt-3 overflow-hidden rounded-full">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between rounded">
          <div className="text-[#8e9192] font-technical text-[10px] uppercase tracking-widest mb-1.5">
            Completed
          </div>
          <div className="font-geist font-bold text-white text-3xl">
            {stats.completedCount}
          </div>
          <div className="text-[#737373] text-xs mt-3">Total logs recorded</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between rounded">
          <div className="text-[#8e9192] font-technical text-[10px] uppercase tracking-widest mb-1.5">
            Missed Days
          </div>
          <div className="font-geist font-bold text-white text-3xl">
            {stats.missedCount}
          </div>
          <div className="text-[#737373] text-xs mt-3">Scheduled missed</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between rounded">
          <div className="text-[#8e9192] font-technical text-[10px] uppercase tracking-widest mb-1.5">
            Current Streak
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-geist font-bold text-white text-3xl">{stats.currentStreak}</span>
            <span className="text-[#8e9192] text-sm">Days</span>
          </div>
          <div className="text-[#737373] text-xs mt-3 font-technical uppercase">Active run</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between rounded col-span-2 lg:col-span-1">
          <div className="text-[#8e9192] font-technical text-[10px] uppercase tracking-widest mb-1.5">
            Best Streak
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-geist font-bold text-white text-3xl">{stats.bestStreak}</span>
            <span className="text-[#8e9192] text-sm">Days</span>
          </div>
          <div className="text-[#737373] text-xs mt-3">All-time record</div>
        </div>
      </div>

      {/* Bento Grid: Recent Grid + Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent 28-day matrix */}
        <div className="bg-[#121212] border border-[#262626] p-5 lg:col-span-1 flex flex-col rounded">
          <h3 className="font-technical text-[11px] text-white uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Recent History</span>
            <span className="material-symbols-outlined text-[18px] text-[#737373]">grid_on</span>
          </h3>

          <div className="grid grid-cols-7 gap-1.5 flex-1 content-start">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayL, idx) => (
              <div
                key={idx}
                className="text-center font-technical text-[10px] text-[#737373] mb-1"
              >
                {dayL}
              </div>
            ))}

            {recentDays.map((item, idx) => (
              item.isTodayCell ? (
                <button
                  key={idx}
                  onClick={() => toggleHabitDay(selectedHabit.id, item.dateKey)}
                  className={`aspect-square w-full rounded-xs flex items-center justify-center transition-all cursor-pointer ${
                    item.isDone
                      ? 'bg-white text-black shadow-sm hover:bg-neutral-200'
                      : 'border-2 border-white pulse-border'
                  }`}
                  title={`Today (${item.dateKey}): ${item.isDone ? 'Click to uncheck' : 'Click to complete'}`}
                >
                  {item.isDone && (
                    <span className="material-symbols-outlined text-black text-[12px] font-bold">
                      check
                    </span>
                  )}
                </button>
              ) : item.isPastCell ? (
                <div
                  key={idx}
                  className={`aspect-square w-full rounded-xs flex items-center justify-center cursor-default select-none ${
                    item.isDone
                      ? 'bg-[#333333] text-white'
                      : 'bg-[#141414] border border-[#222]'
                  }`}
                  title={`Past date (${item.dateKey}): ${item.isDone ? 'Completed' : 'Not logged'}`}
                >
                  {item.isDone && (
                    <span className="material-symbols-outlined text-[#d4d4d4] text-[12px]">
                      check
                    </span>
                  )}
                </div>
              ) : (
                <div
                  key={idx}
                  className="aspect-square w-full rounded-xs border border-[#1f1f1f] opacity-30 cursor-not-allowed flex items-center justify-center select-none"
                  title={`Future date (${item.dateKey}): Locked`}
                >
                </div>
              )
            ))}
          </div>
        </div>

        {/* Trajectory */}
        <div className="bg-[#121212] border border-[#262626] p-5 lg:col-span-2 flex flex-col rounded">
          <h3 className="font-technical text-[11px] text-white uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Weekly Performance Trajectory</span>
            <span className="material-symbols-outlined text-[18px] text-[#737373]">show_chart</span>
          </h3>

          <div className="flex-1 min-h-[200px] relative border-l border-b border-[#262626] pl-4 pb-4 flex items-end justify-between">
            <div className="absolute inset-x-4 top-0 border-t border-[#262626] border-dashed w-[calc(100%-16px)]"></div>
            <div className="absolute inset-x-4 top-1/2 border-t border-[#262626] border-dashed w-[calc(100%-16px)]"></div>

            {stats.trajectoryBars.map((bar, idx) => {
              const isHigh = bar.value >= 80;
              return (
                <div
                  key={idx}
                  className="w-[9%] relative group flex flex-col justify-end items-center h-full"
                >
                  <div
                    className={`w-full rounded-t-xs transition-all duration-300 ${
                      bar.isEmpty
                        ? 'bg-[#181818] border border-[#262626]'
                        : isHigh
                        ? 'bg-white'
                        : 'bg-[#333] hover:bg-[#444]'
                    }`}
                    style={{ height: bar.height }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 transform -translate-x-1/2 bg-[#1b1b1b] border border-[#444] px-1.5 py-0.5 rounded text-[9px] font-technical text-white whitespace-nowrap pointer-events-none transition-opacity">
                      {bar.isEmpty ? 'NO DATA' : `${bar.value}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Archive / Delete Danger Zone */}
      <div className="border border-[#333] p-5 flex flex-col md:flex-row items-start md:items-center justify-between bg-[#121212] rounded">
        <div>
          <h4 className="font-technical text-xs font-bold text-white uppercase tracking-wider mb-1">
            Habit Actions
          </h4>
          <p className="text-[#8e9192] text-xs">
            Archive or permanently remove this habit definition.
          </p>
        </div>
        <div className="flex gap-2.5 mt-4 md:mt-0">
          <button
            onClick={() => archiveHabit(selectedHabit.id)}
            className="px-4 py-2 border border-[#444] text-[#d4d4d4] hover:text-white hover:border-white transition-colors rounded font-technical text-xs uppercase tracking-widest cursor-pointer"
          >
            Archive Habit
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently delete this habit and all associated logs?')) {
                deleteHabit(selectedHabit.id);
              }
            }}
            className="px-4 py-2 border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors rounded font-technical text-xs uppercase tracking-widest cursor-pointer"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};
