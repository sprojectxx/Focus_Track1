import React, { useState, useEffect, useRef } from 'react';
import { useHabits } from '../context/HabitContext';
import { PriorityLevel } from '../types';
import { MONOCHROME_ICONS, MONOCHROME_ICON_CATEGORIES } from '../data/monochromeIcons';
import { HabitVisual } from './HabitVisual';
import { PREDEFINED_DOMAINS } from '../data/habitDomains';

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
  const [selectedDomain, setSelectedDomain] = useState<string>('Workout');
  const [customDomain, setCustomDomain] = useState<string>('');
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
      const existingCat = editingHabit.category || 'Workout';
      if ((PREDEFINED_DOMAINS as readonly string[]).includes(existingCat)) {
        setSelectedDomain(existingCat);
        setCustomDomain('');
      } else {
        setSelectedDomain('Custom');
        setCustomDomain(existingCat);
      }
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
      setSelectedDomain('Workout');
      setCustomDomain('');
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

  // Image Upload Handler with Canvas Compression (< 50KB base64)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please choose an image under 5MB.');
      return;
    }

    try {
      const compressedDataUrl = await compressImageToMonochromeBase64(file, 256);
      setCustomImage(compressedDataUrl);
      setVisualMode('upload');
    } catch {
      alert('Failed to process image file.');
    }
  };

  const compressImageToMonochromeBase64 = (file: File, maxDim = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject('Failed to load image');
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
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

    const finalCategory = selectedDomain === 'Custom' ? (customDomain.trim() || 'General') : selectedDomain;

    const habitPayload = {
      name: name.trim(),
      description: description.trim(),
      category: finalCategory,
      categoryLabel: finalCategory,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-[#333] shadow-2xl z-10 flex flex-col max-h-[88vh] sm:max-h-[92vh] overflow-y-auto custom-scrollbar rounded animate-in zoom-in-95 duration-150 mb-10 sm:mb-0">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#222] bg-[#121212] flex justify-between items-start sticky top-0 z-20">
          <div>
            <span className="font-technical text-[9px] sm:text-[10px] text-[#737373] uppercase tracking-[0.2em] block mb-1">
              HABIT SPECIFICATION
            </span>
            <h2 className="font-geist text-lg sm:text-2xl font-extrabold text-white tracking-tight uppercase">
              {editingHabit ? 'MODIFY HABIT PROTOCOL' : 'CREATE CUSTOM HABIT'}
            </h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">
              Configure any custom activity, responsibility, or personal goal.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#737373] hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-[#222] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
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
              className="w-full bg-[#141414] border border-[#333] rounded px-4 py-2.5 min-h-[44px] text-white text-sm focus:outline-none focus:border-white transition-colors"
            />
            {/* Quick Suggestions */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-technical text-[#737373] uppercase mr-1">Quick Suggestions:</span>
              {['Build App', 'Gym & Lifting', 'Ranked Gaming', 'Study Algorithms', 'Freelance Work', 'Writing Journal'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setName(sug)}
                  className="text-[10px] font-technical bg-[#1c1c1c] text-[#a3a3a3] hover:text-white hover:bg-[#2a2a2a] px-2.5 py-1 min-h-[36px] flex items-center rounded cursor-pointer transition-colors"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Visual Identifier (Icon / Upload) */}
          <div className="p-3.5 sm:p-4 bg-[#141414] border border-[#262626] rounded space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
            <div className="flex border border-[#333] rounded p-0.5 bg-[#0a0a0a] w-full sm:w-fit">
              <button
                type="button"
                onClick={() => setVisualMode('icon')}
                className={`flex-1 sm:flex-initial px-3 py-2 min-h-[40px] text-xs font-technical uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  visualMode === 'icon' ? 'bg-white text-black font-bold' : 'text-[#a3a3a3] hover:text-white'
                }`}
              >
                Monochrome Icon Library
              </button>
              <button
                type="button"
                onClick={() => setVisualMode('upload')}
                className={`flex-1 sm:flex-initial px-3 py-2 min-h-[40px] text-xs font-technical uppercase tracking-wider rounded transition-colors cursor-pointer ${
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
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded pl-8 pr-3 py-2 min-h-[40px] text-xs text-white placeholder-[#555] focus:outline-none focus:border-white"
                    />
                  </div>

                  <select
                    value={iconCategory}
                    onChange={(e) => setIconCategory(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 min-h-[40px] text-xs text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    {MONOCHROME_ICON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-11 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-[#0a0a0a] border border-[#262626] rounded">
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
                          className={`p-2.5 min-h-[44px] min-w-[44px] rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black ring-2 ring-white scale-105'
                              : 'bg-[#141414] text-[#8e9192] hover:bg-[#222] hover:text-white border border-[#222]'
                          }`}
                          title={`${item.name} (${item.category})`}
                          aria-label={`Select icon ${item.name}`}
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
                        className="px-3.5 py-2 min-h-[44px] text-xs font-technical text-white border border-[#444] rounded hover:bg-[#222] cursor-pointer flex items-center"
                      >
                        Replace Image
                      </label>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="px-3.5 py-2 min-h-[44px] text-xs font-technical text-red-400 border border-red-900/50 rounded hover:bg-red-950/30 cursor-pointer flex items-center"
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
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2.5 min-h-[44px] text-white text-xs focus:outline-none focus:border-white cursor-pointer"
              >
                {PREDEFINED_DOMAINS.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
                <option value="Custom">Custom Domain...</option>
              </select>

              {selectedDomain === 'Custom' && (
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Enter custom domain..."
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 min-h-[40px] text-white text-xs mt-2 focus:outline-none focus:border-white"
                />
              )}
            </div>

            <div>
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2.5 min-h-[44px] text-white text-xs focus:outline-none focus:border-white cursor-pointer"
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
                className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2.5 min-h-[44px] text-white text-xs focus:outline-none focus:border-white cursor-pointer"
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
            <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
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

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {daysLabels.map((label, idx) => {
                const isSelected = scheduleDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-3 min-h-[44px] border rounded text-xs font-technical uppercase font-bold transition-all cursor-pointer flex items-center justify-center ${
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

          {/* Field 6: Session Focus Duration Timing */}
          <div className="p-3.5 sm:p-4 bg-[#141414] border border-[#262626] rounded space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <label className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest block">
                Session Focus Duration (Minutes per Session)
              </label>
              <span className="text-xs font-technical font-bold text-white uppercase bg-[#222] px-2 py-0.5 rounded border border-[#333]">
                {focusMinutes} Mins / Session
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setFocusMinutes(mins)}
                  className={`px-3.5 py-2 min-h-[40px] rounded text-xs font-technical uppercase font-bold transition-all cursor-pointer flex items-center ${
                    focusMinutes === mins
                      ? 'bg-white text-black font-extrabold shadow'
                      : 'bg-[#0a0a0a] border border-[#333] text-[#a3a3a3] hover:border-[#666] hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}

              {/* Custom Number Input */}
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 min-h-[40px] text-xs">
                <span className="font-technical text-[10px] text-[#737373] uppercase">Custom:</span>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={focusMinutes}
                  onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value, 10) || 15))}
                  className="w-14 bg-transparent text-center text-white font-technical font-bold text-xs focus:outline-none"
                />
                <span className="font-technical text-[10px] text-[#737373] uppercase">mins</span>
              </div>
            </div>
          </div>

          {/* Field 7: Reminders & Target Time */}
          <div className="p-3.5 bg-[#141414] border border-[#262626] rounded flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none min-h-[44px]">
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
                className="bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 min-h-[44px] text-xs rounded font-technical focus:outline-none focus:border-white"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#222] flex flex-col sm:flex-row justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-3 min-h-[44px] border border-[#333] hover:border-white text-[#a3a3a3] hover:text-white transition-colors rounded font-technical text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-white text-black hover:bg-neutral-200 transition-colors rounded font-technical text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
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
