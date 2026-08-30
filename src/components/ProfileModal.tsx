import React from 'react';
import { useHabits } from '../context/HabitContext';

export const ProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, userProfile, stats, setCurrentTab } = useHabits();

  if (!isProfileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsProfileModalOpen(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-[#0e0e0e] border border-[#444748] rounded shadow-2xl z-10 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start mb-6">
          <span className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest">
            OPERATOR DOSSIER
          </span>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="text-[#8e9192] hover:text-white p-1 rounded hover:bg-[#1f1f1f] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#1b1b1b] border-2 border-white overflow-hidden mb-4 shadow-xl">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-full h-full object-cover grayscale contrast-125"
            />
          </div>
          <h3 className="font-geist text-xl font-bold text-white uppercase tracking-tight">
            {userProfile.name}
          </h3>
          <p className="text-xs text-[#8e9192] font-technical uppercase tracking-widest mt-0.5">
            {userProfile.title}
          </p>

          <div className="mt-4 p-3 bg-[#131313] border border-[#2a2a2a] rounded w-full">
            <p className="text-xs text-[#c4c7c8] italic">"{userProfile.creed}"</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-3 bg-[#131313] border border-[#2a2a2a] rounded text-center">
            <div className="font-geist text-lg font-bold text-white">{stats.overallCompletion}%</div>
            <div className="font-technical text-[9px] text-[#8e9192] uppercase">Consistency</div>
          </div>
          <div className="p-3 bg-[#131313] border border-[#2a2a2a] rounded text-center">
            <div className="font-geist text-lg font-bold text-white">{stats.currentStreak}</div>
            <div className="font-technical text-[9px] text-[#8e9192] uppercase">Streak</div>
          </div>
          <div className="p-3 bg-[#131313] border border-[#2a2a2a] rounded text-center">
            <div className="font-geist text-lg font-bold text-white">
              {stats.totalCompletedSessions}
            </div>
            <div className="font-technical text-[9px] text-[#8e9192] uppercase">Sessions</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              setCurrentTab('settings');
            }}
            className="w-full py-2.5 bg-white text-black font-technical text-xs font-bold uppercase tracking-widest rounded hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
};
