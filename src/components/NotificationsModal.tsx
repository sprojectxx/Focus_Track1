import React from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';

export const NotificationsModal: React.FC = () => {
  const { isNotificationOpen, setIsNotificationOpen, activeHabits } = useHabits();

  if (!isNotificationOpen) return null;

  const reminders = activeHabits
    .filter((h) => h.reminderEnabled)
    .map((h) => ({
      habit: h,
      title: `Scheduled: ${h.name}`,
      time: `${h.reminderTime}`,
      desc: `Category: ${h.categoryLabel || h.category} • Priority: ${h.priority.toUpperCase()}`,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6 md:pt-16">
      {/* Backdrop */}
      <div
        onClick={() => setIsNotificationOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Popover */}
      <div className="relative w-full max-w-sm bg-[#121212] border border-[#262626] rounded shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-[18px]">notifications</span>
            <span className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              Active Alerts & Reminders
            </span>
          </div>
          <button
            onClick={() => setIsNotificationOpen(false)}
            className="text-[#737373] hover:text-white p-1 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {reminders.length === 0 ? (
            <p className="text-xs text-[#737373] p-4 text-center">No active reminders configured.</p>
          ) : (
            reminders.map((rem, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#0a0a0a] border border-[#262626] rounded flex items-start gap-3 hover:border-[#444] transition-colors"
              >
                <div className="w-8 h-8 rounded bg-[#171717] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
                  <HabitVisual habit={rem.habit} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-geist text-xs font-bold text-white truncate">{rem.title}</h4>
                    <span className="font-technical text-[9px] text-white bg-[#262626] px-1.5 py-0.5 rounded">
                      {rem.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#737373] mt-1 truncate">{rem.desc}</p>
                </div>
              </div>
            ))
          )}

          <div className="p-3 bg-[#171717] rounded text-center border border-[#262626]">
            <p className="font-technical text-[10px] text-white uppercase tracking-wider">
              FocusTrack • Custom Habit Execution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
