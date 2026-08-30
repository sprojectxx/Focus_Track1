import React, { useState, useEffect, useRef } from 'react';
import { useHabits } from '../context/HabitContext';
import { PriorityLevel } from '../types';
import { MONOCHROME_ICONS, MONOCHROME_ICON_CATEGORIES } from '../data/monochromeIcons';
import { HabitVisual } from './HabitVisual';

export const CreateHabitModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    createHabit,
    updateHabit,
    editingHabit,
    setEditingHabit,
  } = useHabits();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [targetTime, setTargetTime] = useState('Morning');
  
  // Visual state
  const [visualMode, setVisualMode] = useState<'icon' | 'upload'>('icon');
  const [selectedIcon, setSelectedIcon] = useState('terminal');
  const [customImage, setCustomImage] = useState<string | undefined>(undefined);
  const [iconCategory, setIconCategory] = useState<string>('All');
  const [iconSearch, setIconSearch] = useState('');
  
  // Schedule state
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Daily default
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [focusMinutes, setFocusMinutes] = useState(45);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category || 'General');
      setPriority(editingHabit.priority);
      setSelectedIcon(editingHabit.icon || 'terminal');
      setCustomImage(editingHabit.customImage);
      setVisualMode(editingHabit.customImage ? 'upload' : 'icon');
      setScheduleDays(editingHabit.scheduleDays || [0, 1, 2, 3, 4, 5, 6]);
      setReminderEnabled(editingHabit.reminderEnabled);
      setReminderTime(editingHabit.reminderTime || '08:00');
      setTargetTime(editingHabit.targetTime || 'Morning');
      setFocusMinutes(editingHabit.focusMinutesPerSession || 45);
    } else {
      setName('');
      setDescription('');
      setCategory('Technology');
      setPriority('high');
      setSelectedIcon('terminal');
      setCustomImage(undefined);
      setVisualMode('icon');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      setReminderEnabled(true);
      setReminderTime('08:00');
      setTargetTime('Morning');
      setFocusMinutes(45);
    }
  }, [editingHabit, isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  // Filtered icons
  const filteredIcons = MONOCHROME_ICONS.filter((item) => {
    const matchesCategory = iconCategory === 'All' || item.category === iconCategory;
    const query = iconSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.keywords.some((k) => k.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const toggleDay = (dayIndex: number) => {
    if (scheduleDays.includes(dayIndex)) {
      if (scheduleDays.length === 1) return; // Must have at least 1 day
      setScheduleDays(scheduleDays.filter((d) => d !== dayIndex));
    } else {
      setScheduleDays([...scheduleDays, dayIndex].sort((a, b) => a - b));
    }
  };

  const setPresetSchedule = (type: 'daily' | 'weekdays' | 'weekends') => {
    if (type === 'daily') setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    else if (type === 'weekdays') setScheduleDays([0, 1, 2, 3, 4]);
    else if (type === 'weekends') setScheduleDays([5, 6]);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Image file is too large. Please choose an image under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImage(reader.result);
        setVisualMode('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setCustomImage(undefined);
    setVisualMode('icon');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitPayload = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      categoryLabel: category.trim() || 'General',
      priority,
      icon: selectedIcon,
      customImage: visualMode === 'upload' ? customImage : undefined,
      visualType: visualMode === 'upload' && customImage ? ('image' as const) : ('icon' as const),
      scheduleDays,
      scheduleType:
        scheduleDays.length === 7
          ? ('daily' as const)
          : scheduleDays.length === 5 && !scheduleDays.includes(5) && !scheduleDays.includes(6)
          ? ('weekdays' as const)
          : ('custom' as const),
      reminderEnabled,
      reminderTime,
      targetTime,
      focusMinutesPerSession: focusMinutes,
    };

    if (editingHabit) {
      updateHabit(editingHabit.id, habitPayload);
    } else {
      createHabit(habitPayload);
    }

    setEditingHabit(null);
    setIsCreateModalOpen(false);
  };

  const handleClose = () => {
    setEditingHabit(null);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-[#333] shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar rounded animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#222] bg-[#121212] flex justify-between items-start sticky top-0 z-20">
          <div>
            <span className="font-technical text-[10px] text-[#737373] uppercase tracking-[0.2em] block mb-1">
              HABIT SPECIFICATION
            </span>
            <h2 className="font-geist text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase">
              {editingHabit ? 'MODIFY HABIT PROTOCOL' : 'CREATE CUSTOM HABIT'}
            </h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">
              Configure any custom activity, responsibility, or personal goal.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#737373] hover:text-white p-1 rounded hover:bg-[#222] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* Field 1: Habit Name */}
          <div>
            <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1.5">
              Habit Name / Activity <span className="text-white">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Build Project, Coding, Gaming, Gym, Studying, Reading..."
              className="w-full bg-[#141414] border border-[#333] rounded px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white transition-colors"
            />
            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-technical text-[#737373] uppercase mr-1">Quick Suggestions:</span>
              {['Build App', 'Gym & Lifting', 'Ranked Gaming', 'Study Algorithms', 'Freelance Work', 'Writing Journal'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setName(sug)}
                  className="text-[10px] font-technical bg-[#1c1c1c] text-[#a3a3a3] hover:text-white hover:bg-[#2a2a2a] px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Visual Identifier (Icon / Upload) */}
          <div className="p-4 bg-[#141414] border border-[#262626] rounded space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest">
                Visual Identifier (Monochrome Black / White)
              </label>

              {/* Current Preview */}
              <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1 border border-[#333] rounded">
                <span className="text-[10px] font-technical text-[#737373] uppercase">Preview:</span>
                <HabitVisual
                  habit={{
                    name: name || 'Habit',
                    icon: selectedIcon,
                    customImage: visualMode === 'upload' ? customImage : undefined,
                  }}
                  size="sm"
                />
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex border border-[#333] rounded p-0.5 bg-[#0a0a0a] w-fit">
              <button
                type="button"
                onClick={() => setVisualMode('icon')}
                className={`px-3 py-1 text-xs font-technical uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  visualMode === 'icon' ? 'bg-white text-black font-bold' : 'text-[#a3a3a3] hover:text-white'
                }`}
              >
                Monochrome Icon Library
              </button>
              <button
                type="button"
                onClick={() => setVisualMode('upload')}
                className={`px-3 py-1 text-xs font-technical uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  visualMode === 'upload' ? 'bg-white text-black font-bold' : 'text-[#a3a3a3] hover:text-white'
                }`}
              >
                Upload Custom Image
              </button>
            </div>

            {/* Tab A: Monochrome Icon Library */}
            {visualMode === 'icon' && (
              <div className="space-y-3">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[#737373] text-[16px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Search icons (e.g. code, game, gym, read, wallet, task)..."
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-white"
                    />
                  </div>

                  <select
                    value={iconCategory}
                    onChange={(e) => setIconCategory(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    {MONOCHROME_ICON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-11 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1 bg-[#0a0a0a] border border-[#262626] rounded">
                  {filteredIcons.length === 0 ? (
                    <div className="col-span-full p-4 text-center text-xs font-technical text-[#737373]">
                      No matching monochrome icons found.
                    </div>
                  ) : (
                    filteredIcons.map((item) => {
                      const isSelected = selectedIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(item.id);
                            setCustomImage(undefined);
                          }}
                          className={`p-2 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black ring-2 ring-white scale-105'
                              : 'bg-[#141414] text-[#8e9192] hover:bg-[#222] hover:text-white border border-[#222]'
                          }`}
                          title={`${item.name} (${item.category})`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{item.id}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab B: Upload Custom Image */}
            {visualMode === 'upload' && (
              <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded space-y-3 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="habit-image-upload"
                />

                {customImage ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded border-2 border-white bg-[#141414] overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src={customImage}
                        alt="Custom Upload Preview"
                        className="w-full h-full object-cover grayscale contrast-150 brightness-110"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label
                        htmlFor="habit-image-upload"
                        className="px-3 py-1 text-xs font-technical text-white border border-[#444] rounded hover:bg-[#222] cursor-pointer"
                      >
                        Replace Image
                      </label>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="px-3 py-1 text-xs font-technical text-red-400 border border-red-900/50 rounded hover:bg-red-950/30 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-[10px] font-technical text-[#737373]">
                      Applied grayscale & high-contrast filter to preserve monochrome aesthetic.
                    </p>
                  </div>
                ) : (
                  <label
                    htmlFor="habit-image-upload"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#333] hover:border-white rounded cursor-pointer transition-colors bg-[#111]"
                  >
                    <span className="material-symbols-outlined text-3xl text-[#737373] mb-2">
                      add_photo_alternate
                    </span>
                    <span className="font-geist text-xs font-bold text-white uppercase">
                      Upload Custom Habit Icon / Image
                    </span>
                    <span className="text-[10px] font-technical text-[#737373] mt-1">
                      PNG, JPG, WEBP, or SVG • Converted to monochrome black/white
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Field 3: Category & Priority & Target Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1.5">
                Category / Domain
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Technology, Gym, Work..."
                className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="high">High (Core Priority)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="low">Low (Flexible)</option>
              </select>
            </div>

            <div>
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1.5">
                Target Time Window
              </label>
              <select
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="Anytime">Anytime</option>
              </select>
            </div>
          </div>

          {/* Field 4: Description (Optional) */}
          <div>
            <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1.5">
              Description / Action Criteria (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify the condition for completion (e.g. Complete 2 code commits, 45 min workout, read 25 pages)..."
              className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-white resize-none"
            />
          </div>

          {/* Field 5: Execution Schedule */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest">
                Execution Days
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPresetSchedule('daily')}
                  className="text-[10px] font-technical text-[#8e9192] hover:text-white uppercase tracking-wider underline cursor-pointer"
                >
                  Every Day
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSchedule('weekdays')}
                  className="text-[10px] font-technical text-[#8e9192] hover:text-white uppercase tracking-wider underline cursor-pointer"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => setPresetSchedule('weekends')}
                  className="text-[10px] font-technical text-[#8e9192] hover:text-white uppercase tracking-wider underline cursor-pointer"
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {daysLabels.map((label, idx) => {
                const isSelected = scheduleDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-2.5 border rounded text-xs font-technical uppercase font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-white bg-white text-black'
                        : 'border-[#2a2a2a] bg-[#141414] text-[#8e9192] hover:border-[#444] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 6: Reminders */}
          <div className="p-3.5 bg-[#141414] border border-[#262626] rounded flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0 accent-white cursor-pointer"
              />
              <span className="font-technical text-xs uppercase tracking-wider">
                Enable Daily Reminder
              </span>
            </label>

            {reminderEnabled && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-[#0a0a0a] border border-[#333] text-white px-2.5 py-1 text-xs rounded font-technical focus:outline-none focus:border-white"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#222] flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-[#333] hover:border-white text-[#a3a3a3] hover:text-white transition-colors rounded font-technical text-xs uppercase tracking-widest cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 transition-colors rounded font-technical text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <span className="material-symbols-outlined text-[17px]">
                {editingHabit ? 'save' : 'add'}
              </span>
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
