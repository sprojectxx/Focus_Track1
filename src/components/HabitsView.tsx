import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Habit } from '../types';
import { HabitVisual } from './HabitVisual';

export const HabitsView: React.FC = () => {
  const {
    activeHabits,
    setSelectedHabitId,
    setIsCreateModalOpen,
    setEditingHabit,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Distinct categories
  const categories = ['All', ...Array.from(new Set(activeHabits.map((h) => h.categoryLabel || h.category)))];

  const filteredHabits = activeHabits.filter((h) => {
    const matchesCategory = categoryFilter === 'All' || (h.categoryLabel || h.category) === categoryFilter;
    const matchesSearch =
      !searchFilter ||
      h.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchFilter.toLowerCase())) ||
      h.category.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getScheduleLabel = (habit: Habit) => {
    if (habit.scheduleType === 'daily' || habit.scheduleDays.length === 7) {
      return 'DAILY (7 DAYS)';
    }
    if (
      habit.scheduleType === 'weekdays' ||
      (habit.scheduleDays.length === 5 && !habit.scheduleDays.includes(5) && !habit.scheduleDays.includes(6))
    ) {
      return 'WEEKDAYS (MON-FRI)';
    }
    if (
      habit.scheduleDays.length === 2 &&
      habit.scheduleDays.includes(5) &&
      habit.scheduleDays.includes(6)
    ) {
      return 'WEEKENDS (SAT-SUN)';
    }
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return habit.scheduleDays.map((d) => dayNames[d]).join(' · ');
  };

  const handleEdit = (e: React.MouseEvent, habit: Habit) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setIsCreateModalOpen(true);
  };

  const handleArchive = (e: React.MouseEvent, habitId: string) => {
    e.stopPropagation();
    archiveHabit(habitId);
  };

  const handleDelete = (e: React.MouseEvent, habitId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this habit permanently?')) {
      deleteHabit(habitId);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full flex flex-col pb-28 md:pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3 border-b border-[#262626] pb-4 sm:pb-6">
        <div>
          <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-[0.25em] block mb-1">
            HABIT CONFIGURATION & MANAGEMENT
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white uppercase font-geist">
            HABITS & ROUTINES
          </h2>
          <p className="text-xs text-[#a3a3a3] font-technical uppercase tracking-widest mt-1">
            Define, customize, and manage your personalized activities.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setIsCreateModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-white text-black hover:bg-neutral-200 transition-all rounded font-technical text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg active:scale-95"
          aria-label="Add custom habit"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          <span>Add Custom Habit</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-3 text-[#737373] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search habits by name, category, or description..."
            className="w-full bg-[#121212] border border-[#262626] rounded pl-9 pr-9 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-[#555] focus:outline-none focus:border-white"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2.5 text-[#737373] hover:text-white p-1 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Category Filters (Horizontally Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 min-h-[40px] text-xs font-technical uppercase tracking-wider rounded whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                categoryFilter === cat
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#141414] text-[#8e9192] border border-[#262626] hover:text-white hover:border-[#444]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Habit Cards List */}
      <div className="space-y-4 w-full">
        {filteredHabits.length === 0 ? (
          <div className="p-8 sm:p-12 border border-dashed border-[#262626] rounded text-center bg-[#0a0a0a]">
            <span className="material-symbols-outlined text-4xl text-[#555] mb-2">
              inventory_2
            </span>
            <h3 className="font-geist text-base font-bold text-white uppercase">
              No Habits Found
            </h3>
            <p className="text-xs font-technical text-[#737373] mt-1">
              No active habits match your search criteria.
            </p>
            <button
              onClick={() => {
                setSearchFilter('');
                setCategoryFilter('All');
                setIsCreateModalOpen(true);
              }}
              className="mt-4 px-4 py-2.5 min-h-[44px] border border-white text-white rounded text-xs font-technical uppercase tracking-wider hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              Create New Habit
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

            // Calculate overall completions
            let totalDone = 0;
            Object.values(habit.history).forEach((val) => {
              if (val) totalDone++;
            });

            return (
              <div
                key={habit.id}
                onClick={() => setSelectedHabitId(habit.id)}
                className="bg-[#121212] border border-[#262626] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group hover:border-white transition-all duration-200 rounded cursor-pointer shadow-lg w-full min-w-0"
              >
                {/* Left: Visual + Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#181818] border border-[#333] text-white shrink-0 rounded group-hover:border-white transition-colors overflow-hidden">
                    <HabitVisual habit={habit} size="md" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-geist text-base sm:text-lg font-bold text-white truncate max-w-full">
                        {habit.name}
                      </h3>
                      <span
                        className={`text-[9px] font-technical px-2 py-0.5 rounded uppercase ${
                          habit.priority === 'high'
                            ? 'bg-white text-black font-extrabold'
                            : habit.priority === 'medium'
                            ? 'bg-[#262626] text-white border border-[#444] font-bold'
                            : 'bg-[#181818] text-[#888] border border-[#262626]'
                        }`}
                      >
                        {habit.priority} Priority
                      </span>
                    </div>

                    {habit.description && (
                      <p className="text-xs text-[#a3a3a3] line-clamp-2 mb-1.5 max-w-xl">
                        {habit.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2.5 font-technical text-[10px] sm:text-[11px] text-[#737373] uppercase flex-wrap">
                      <span className="flex items-center gap-1 text-[#a3a3a3]">
                        <span className="material-symbols-outlined text-[13px]">label</span>
                        {habit.categoryLabel || habit.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#a3a3a3]">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {getScheduleLabel(habit)}
                      </span>
                      {habit.reminderEnabled && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#a3a3a3]">
                            <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                            {habit.reminderTime}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-white font-bold">{totalDone} Logs</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Weekday Schedule Badges */}
                <div className="flex items-center gap-1 flex-wrap self-start sm:self-center my-1">
                  {dayLetters.map((letter, idx) => {
                    const isScheduled = habit.scheduleDays.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-technical text-[10px] sm:text-[11px] rounded-xs transition-colors ${
                          isScheduled
                            ? 'border border-white bg-white text-black font-bold'
                            : 'border border-[#262626] bg-[#181818] text-[#555]'
                        }`}
                        title={`${letter} - ${isScheduled ? 'Scheduled' : 'Off'}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>

                {/* Right: Touch-friendly Action Buttons */}
                <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t border-[#222] lg:border-t-0 justify-between sm:justify-end w-full lg:w-auto">
                  <button
                    onClick={(e) => handleEdit(e, habit)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-technical uppercase tracking-wider text-[#a3a3a3] hover:text-white border border-[#333] hover:border-white bg-[#181818] rounded cursor-pointer active:scale-95"
                    title="Edit Habit Configuration"
                    aria-label={`Edit ${habit.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span className="sm:hidden lg:hidden">Edit</span>
                  </button>

                  <button
                    onClick={(e) => handleArchive(e, habit.id)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-technical uppercase tracking-wider text-[#a3a3a3] hover:text-white border border-[#333] hover:border-white bg-[#181818] rounded cursor-pointer active:scale-95"
                    title="Archive Habit"
                    aria-label={`Archive ${habit.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">archive</span>
                    <span className="sm:hidden lg:hidden">Archive</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, habit.id)}
                    className="px-3.5 py-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#a3a3a3] hover:text-red-400 border border-[#333] hover:border-red-900/60 bg-[#181818] rounded cursor-pointer active:scale-95"
                    title="Delete Habit Permanently"
                    aria-label={`Delete ${habit.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
