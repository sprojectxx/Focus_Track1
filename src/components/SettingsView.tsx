import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';

export const SettingsView: React.FC = () => {
  const { userProfile, updateUserProfile, resetToDefaults, habits } = useHabits();
  const [name, setName] = useState(userProfile.name);
  const [title, setTitle] = useState(userProfile.title);
  const [creed, setCreed] = useState(userProfile.creed);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, title, creed, avatarUrl });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const data = {
      habits,
      userProfile,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focustrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.habits && Array.isArray(parsed.habits)) {
          localStorage.setItem('focustrack_habits_v1', JSON.stringify(parsed.habits));
          if (parsed.userProfile) {
            localStorage.setItem('focustrack_profile_v1', JSON.stringify(parsed.userProfile));
          }
          window.location.reload();
        } else {
          alert('Invalid FocusTrack backup JSON file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-4xl mx-auto w-full flex flex-col pb-24">
      {/* Header */}
      <div className="mb-8 border-b border-[#262626] pb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase font-geist">
          SYSTEM CONFIGURATION
        </h2>
        <p className="text-xs text-[#a3a3a3] font-technical uppercase tracking-widest mt-1">
          Identity credentials, execution philosophy, and local storage data protocols.
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Configuration */}
        <section className="bg-[#121212] border border-[#262626] p-6 rounded">
          <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
            <span>Identity Credentials</span>
            <span className="material-symbols-outlined text-[18px] text-[#737373]">badge</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-[#1b1b1b] border border-[#444748] overflow-hidden shrink-0">
                <img
                  src={avatarUrl || userProfile.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </div>
              <div className="w-full">
                <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-technical"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-2">
                  Designation / Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-2">
                  Title / Rank
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-2">
                Operational Creed / Philosophy
              </label>
              <input
                type="text"
                value={creed}
                onChange={(e) => setCreed(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              {savedSuccess ? (
                <span className="font-technical text-xs text-white uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Changes Synced
                </span>
              ) : (
                <span></span>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-white text-black hover:bg-neutral-200 font-technical text-xs font-bold uppercase tracking-widest rounded transition-colors cursor-pointer flex items-center justify-center"
              >
                Save Credentials
              </button>
            </div>
          </form>
        </section>

        {/* Data Management */}
        <section className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded">
          <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
            <span>Data Synchronization & Backup</span>
            <span className="material-symbols-outlined text-[18px] text-[#737373]">cloud_sync</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-[#262626] rounded bg-[#0a0a0a] flex flex-col justify-between">
              <div>
                <h4 className="font-technical text-xs font-bold text-white uppercase mb-1">
                  Export Protocol Archive
                </h4>
                <p className="text-xs text-[#737373] mb-4">
                  Download all your habits, streaks, and full execution history as a JSON file.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="w-full py-2.5 min-h-[44px] border border-[#444] hover:border-white text-white font-technical text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Export JSON
              </button>
            </div>

            <div className="p-4 border border-[#262626] rounded bg-[#0a0a0a] flex flex-col justify-between">
              <div>
                <h4 className="font-technical text-xs font-bold text-white uppercase mb-1">
                  Import Protocol Archive
                </h4>
                <p className="text-xs text-[#737373] mb-4">
                  Restore habits and consistency logs from a previously exported backup file.
                </p>
              </div>
              <label className="w-full py-2.5 min-h-[44px] border border-[#444] hover:border-white text-white font-technical text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 cursor-pointer text-center flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">upload</span>
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Action */}
          <div className="mt-6 pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-technical text-xs font-bold text-[#ffb4ab] uppercase">
                Reset System State
              </h4>
              <p className="text-xs text-[#737373]">
                Restores default sample dataset (August 2026 / October 2023 initial matrix).
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all habit protocols and reload default demonstration data?')) {
                  resetToDefaults();
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 font-technical text-xs uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center"
            >
              Reset to Defaults
            </button>
          </div>
        </section>

        {/* Mobile Application (.APK) Download Section for Vercel Deployment */}
        <section className="bg-[#121212] border border-[#262626] p-4 sm:p-6 rounded">
          <h3 className="font-technical text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Android Mobile Application (.APK)</span>
            <span className="material-symbols-outlined text-[20px] text-white">android</span>
          </h3>
          <p className="text-xs text-[#a3a3a3] mb-5">
            Download the native Android container built with Capacitor to receive system alarms and Firebase push notifications directly on your Android phone.
          </p>
          <a
            href="/downloads/FocusTrack-Android.apk"
            download="FocusTrack-Android.apk"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-white hover:bg-neutral-200 text-black font-technical text-xs font-bold uppercase tracking-widest rounded transition-colors shadow-lg cursor-pointer w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">install_mobile</span>
            Download Android App (.apk)
          </a>
        </section>
      </div>
    </div>
  );
};
