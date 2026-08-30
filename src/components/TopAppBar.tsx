import React from 'react';
import { useHabits } from '../context/HabitContext';

export const TopAppBar: React.FC = () => {
  const { currentTab, setIsNotificationOpen, setIsProfileModalOpen, userProfile } = useHabits();

  const getPageHeader = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'RADICAL DISCIPLINE';
      case 'habits':
        return 'HABIT PROTOCOL';
      case 'calendar':
        return 'EXECUTION CALENDAR';
      case 'analytics':
        return 'PERFORMANCE METRICS';
      case 'archive':
        return 'ARCHIVED PROTOCOLS';
      case 'settings':
        return 'SYSTEM CONFIGURATION';
      default:
        return 'FOCUS TRACK';
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center w-full h-16 px-4 border-b border-[#444748]/40 bg-[#131313] fixed top-0 left-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-geist text-xl font-bold tracking-tighter text-white">FocusTrack</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="text-[#c4c7c8] hover:text-white transition-colors cursor-pointer p-1.5"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-[#c4c7c8] hover:text-white transition-colors cursor-pointer p-1.5"
            aria-label="Profile"
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex justify-between items-center w-full h-16 px-8 border-b border-[#444748]/40 bg-[#131313] sticky top-0 z-40">
        <div className="flex items-center">
          <span className="font-technical text-[11px] text-[#8e9192] uppercase tracking-[0.2em]">
            {getPageHeader()}
          </span>
        </div>
        <div className="flex items-center space-x-5">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="text-[#c4c7c8] hover:text-white transition-colors cursor-pointer p-1.5 relative group"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></span>
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-[#c4c7c8] hover:text-white transition-colors cursor-pointer p-1.5 group flex items-center gap-2"
            aria-label="Profile"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[#444748] group-hover:border-white transition-colors">
              <img
                src={userProfile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </button>
        </div>
      </header>
    </>
  );
};
