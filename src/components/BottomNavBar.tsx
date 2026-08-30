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
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0e0e0e] border-t border-[#444748]/50 z-50 px-2 py-2 flex justify-around items-center">
      <button
        onClick={() => handleTabChange('dashboard')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
          currentTab === 'dashboard' ? 'text-white' : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'dashboard' ? 'fill-1' : ''}`}>
          dashboard
        </span>
        <span className="font-technical text-[9px] uppercase tracking-wider">Dash</span>
      </button>

      <button
        onClick={() => handleTabChange('habits')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
          currentTab === 'habits' ? 'text-white' : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'habits' ? 'fill-1' : ''}`}>
          checklist
        </span>
        <span className="font-technical text-[9px] uppercase tracking-wider">Habits</span>
      </button>

      <button
        onClick={() => handleTabChange('calendar')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
          currentTab === 'calendar' ? 'text-white' : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'calendar' ? 'fill-1' : ''}`}>
          calendar_today
        </span>
        <span className="font-technical text-[9px] uppercase tracking-wider">Cal</span>
      </button>

      <button
        onClick={() => handleTabChange('analytics')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
          currentTab === 'analytics' ? 'text-white' : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'analytics' ? 'fill-1' : ''}`}>
          analytics
        </span>
        <span className="font-technical text-[9px] uppercase tracking-wider">Stats</span>
      </button>

      <button
        onClick={() => handleTabChange('settings')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
          currentTab === 'settings' ? 'text-white' : 'text-[#8e9192] hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] mb-0.5 ${currentTab === 'settings' ? 'fill-1' : ''}`}>
          settings
        </span>
        <span className="font-technical text-[9px] uppercase tracking-wider">Config</span>
      </button>
    </nav>
  );
};
