import React from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitVisual } from './HabitVisual';
import { getAdvanceTimeString } from '../lib/notifications';

export const NotificationsModal: React.FC = () => {
  const { isNotificationOpen, setIsNotificationOpen, activeHabits } = useHabits();

  if (!isNotificationOpen) return null;

  const reminderItems: Array<{
    habit: any;
    title: string;
    time: string;
    badge: string;
    isAdvance: boolean;
  }> = [];

  activeHabits
    .filter((h) => h.reminderEnabled && h.reminderTime)
    .forEach((h) => {
      const { advanceTimeStr } = getAdvanceTimeString(h.reminderTime || '08:00', 10);
      
      // 10-Minute Advance Alert
      reminderItems.push({
        habit: h,
        title: `10-MIN ALERT: ${h.name}`,
        time: advanceTimeStr,
        badge: '10-MIN WARNING',
        isAdvance: true,
      });

      // Task Execution Time
      reminderItems.push({
        habit: h,
        title: `PROTOCOL START: ${h.name}`,
        time: h.reminderTime,
        badge: 'TASK TIME',
        isAdvance: false,
      });
    });

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
            <span className="material-symbols-outlined text-amber-400 text-[18px]">notifications_active</span>
            <span className="font-technical text-xs font-bold text-white uppercase tracking-widest">
              Active Alerts & 10-Min Warnings
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
          {reminderItems.length === 0 ? (
            <p className="text-xs text-[#737373] p-4 text-center">No active reminders or 10-min alerts configured.</p>
          ) : (
            reminderItems.map((rem, idx) => (
              <div
                key={idx}
                className={`p-3 rounded flex items-start gap-3 border transition-colors ${
                  rem.isAdvance
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                    : 'bg-[#0a0a0a] border-[#262626] text-white hover:border-[#444]'
                }`}
              >
                <div className="w-8 h-8 rounded bg-[#171717] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
                  <HabitVisual habit={rem.habit} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-geist text-xs font-bold truncate">{rem.title}</h4>
                    <span
                      className={`font-technical text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        rem.isAdvance ? 'bg-amber-400 text-black' : 'bg-white text-black'
                      }`}
                    >
                      {rem.time}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-70 mt-1 truncate">
                    {rem.isAdvance
                      ? `Fires 10 mins before execution (${rem.habit.reminderTime})`
                      : `Task start time`}
                  </p>
                </div>
              </div>
            ))
          )}

          <div className="p-3 bg-[#171717] rounded text-center border border-[#262626]">
            <p className="font-technical text-[10px] text-emerald-400 uppercase tracking-wider">
              Firebase & Web Push • 10-Min Pre-Alert System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
