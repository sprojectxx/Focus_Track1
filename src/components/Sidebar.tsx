import React from 'react';
import { useHabits } from '../context/HabitContext';
import { NavigationTab } from '../types';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, userProfile, setIsProfileModalOpen, setSelectedHabitId } = useHabits();

  const navItems: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'habits', label: 'Habits', icon: 'checklist' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_today' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (tab !== 'habits') {
      setSelectedHabitId(null);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[64px] lg:w-[240px] bg-[#0e0e0e] border-r border-[#444748]/50 z-50 transition-all duration-300 ease-in-out flex flex-col hidden md:flex">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-4 gap-3 border-b border-[#1f1f1f]">
        <img src="/logo.png" alt="FocusTrack Emblem" className="w-7 h-7 object-contain invert shrink-0" />
        <span className="font-geist text-2xl font-bold tracking-tighter text-white hidden lg:block">
          FocusTrack
        </span>
      </div>

      <div className="px-4 py-3 hidden lg:block border-b border-[#1f1f1f]">
        <span className="font-technical text-[11px] text-[#c4c7c8]/80 uppercase tracking-widest block">
          Radical Discipline
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 cursor-pointer group ${
                isActive
                  ? 'text-white border-l-2 border-white bg-[#1b1b1b]'
                  : 'text-[#c4c7c8] hover:text-white hover:bg-[#2a2a2a]'
              } ${item.id === 'settings' ? 'mt-8' : ''}`}
            >
              <span
                className={`material-symbols-outlined text-[20px] lg:mr-4 shrink-0 transition-colors ${
                  isActive ? 'text-white fill-1' : 'text-[#c4c7c8] group-hover:text-white'
                }`}
              >
                {item.icon}
              </span>
              <span className="font-technical text-[11px] uppercase tracking-widest hidden lg:block truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#1f1f1f] flex items-center justify-center lg:justify-start">
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-3 w-full text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#2a2a2a] overflow-hidden border border-[#444748] flex-shrink-0 group-hover:border-white transition-colors">
            <img
              className="w-full h-full object-cover grayscale contrast-125"
              src={userProfile.avatarUrl}
              alt={userProfile.name}
            />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <p className="font-technical text-[11px] text-[#e2e2e2] group-hover:text-white truncate uppercase tracking-widest">
              {userProfile.name}
            </p>
            <p className="text-[9px] text-[#8e9192] uppercase tracking-widest truncate">
              {userProfile.title}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
};
