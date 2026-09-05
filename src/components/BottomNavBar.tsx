import React from 'react';
import { useHabits } from '../context/HabitContext';
import { NavigationTab } from '../types';

export const BottomNavBar: React.FC = () => {
  const { currentTab, setCurrentTab, setSelectedHabitId } = useHabits();

  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (tab !== 'habits') {
      setSelectedHabitId(null);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0d0d0d]/95 backdrop-blur-md border-t border-[#262626] z-50 px-1 sm:px-2 py-1.5 pb-safe flex justify-around items-center shadow-2xl">
      <button
        onClick={() => handleTabChange('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 cursor-pointer ${
          currentTab === 'dashboard'
            ? 'text-white bg-white/10 border border-white/20 shadow-sm'
            : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'dashboard' ? 'fill-1 text-white' : ''}`}>
          dashboard
        </span>
        <span className="font-technical text-[9px] font-bold uppercase tracking-wider">Dash</span>
      </button>

      <button
        onClick={() => handleTabChange('habits')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 cursor-pointer ${
          currentTab === 'habits'
            ? 'text-white bg-white/10 border border-white/20 shadow-sm'
            : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'habits' ? 'fill-1 text-white' : ''}`}>
          checklist
        </span>
        <span className="font-technical text-[9px] font-bold uppercase tracking-wider">Habits</span>
      </button>

      <button
        onClick={() => handleTabChange('calendar')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 cursor-pointer ${
          currentTab === 'calendar'
            ? 'text-white bg-white/10 border border-white/20 shadow-sm'
            : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'calendar' ? 'fill-1 text-white' : ''}`}>
          calendar_today
        </span>
        <span className="font-technical text-[9px] font-bold uppercase tracking-wider">Calendar</span>
      </button>

      <button
        onClick={() => handleTabChange('analytics')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 cursor-pointer ${
          currentTab === 'analytics'
            ? 'text-white bg-white/10 border border-white/20 shadow-sm'
            : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'analytics' ? 'fill-1 text-white' : ''}`}>
          analytics
        </span>
        <span className="font-technical text-[9px] font-bold uppercase tracking-wider">Stats</span>
      </button>

      <button
        onClick={() => handleTabChange('settings')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 cursor-pointer ${
          currentTab === 'settings'
            ? 'text-white bg-white/10 border border-white/20 shadow-sm'
            : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'settings' ? 'fill-1 text-white' : ''}`}>
          settings
        </span>
        <span className="font-technical text-[9px] font-bold uppercase tracking-wider">Settings</span>
      </button>
    </nav>
  );
};
