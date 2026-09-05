import React from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';

export const ArchiveView: React.FC = () => {
  const { archivedHabits, unarchiveHabit, deleteHabit, setSelectedHabitId, setCurrentTab } = useHabits();

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col pb-28 md:pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-8 border-b border-[#262626] pb-4 sm:pb-6">
        <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-[0.25em] block mb-1">
          ARCHIVED HABIT RECORDS
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase font-geist">
          ARCHIVED HABITS
        </h2>
        <p className="text-xs text-[#a3a3a3] font-technical uppercase tracking-widest mt-1">
          Historical routines and inactive habits. All historical data remains preserved.
        </p>
      </div>

      {archivedHabits.length === 0 ? (
        <div className="bg-[#121212] border border-[#262626] rounded p-6 sm:p-12 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-[#737373] mb-3">
            archive
          </span>
          <h3 className="font-geist text-base sm:text-lg font-bold text-white mb-1 uppercase">
            No Archived Habits
          </h3>
          <p className="text-xs text-[#737373] font-technical uppercase tracking-wider max-w-md">
            When you retire or pause a custom habit, it will appear here without deleting your past consistency history.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 sm:space-y-4 w-full">
          {archivedHabits.map((habit) => {
            const completedCount = Object.values(habit.history).filter(Boolean).length;

            return (
              <div
                key={habit.id}
                className="bg-[#121212] border border-[#262626] p-4 sm:p-5 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-[#444748] transition-colors w-full min-w-0"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded bg-[#181818] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
                    <HabitVisual habit={habit} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-geist text-base font-bold text-white truncate">{habit.name}</h3>
                    <div className="flex items-center gap-2.5 text-xs font-technical text-[#737373] uppercase mt-0.5 flex-wrap">
                      <span>{habit.categoryLabel || habit.category}</span>
                      <span>•</span>
                      <span className="text-white font-bold">{completedCount} Lifetime Logs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t sm:border-t-0 border-[#262626] pt-3 sm:pt-0 justify-between sm:justify-end w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedHabitId(habit.id);
                      setCurrentTab('habits');
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] border border-[#333] hover:border-white text-xs font-technical text-[#c4c7c8] hover:text-white rounded transition-colors uppercase tracking-wider cursor-pointer flex items-center justify-center active:scale-95"
                    aria-label={`View logs for ${habit.name}`}
                  >
                    View Logs
                  </button>
                  <button
                    onClick={() => unarchiveHabit(habit.id)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] border border-white bg-white text-black hover:bg-neutral-200 text-xs font-technical font-bold rounded transition-colors uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    aria-label={`Restore ${habit.name}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">unarchive</span>
                    Restore
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete "${habit.name}" and all historical data?`)) {
                        deleteHabit(habit.id);
                      }
                    }}
                    className="px-3.5 py-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-red-400 border border-[#333] bg-[#181818] rounded transition-colors cursor-pointer active:scale-95"
                    title="Permanently Delete"
                    aria-label={`Delete ${habit.name} permanently`}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
