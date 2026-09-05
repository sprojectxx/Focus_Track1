import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserProfile, Habit, PriorityLevel } from '../types';
import { getRandomMottoString } from '../data/motivationalQuotes';
import { Camera, Check, Sparkles, ArrowRight, ArrowLeft, Shield, Dumbbell, BookOpen, Brain, Zap, Target, Plus, Trash2 } from 'lucide-react';

interface OnboardingHabitDraft {
  id: string;
  name: string;
  category: string;
  icon: string;
  scheduleType: 'daily' | 'weekdays' | 'weekends' | 'custom';
  scheduleDays: number[];
  focusMinutesPerSession: number;
  reminderTime: string;
  selected: boolean;
}

const PRESET_HABIT_OPTIONS: OnboardingHabitDraft[] = [
  {
    id: 'h1',
    name: 'Morning Workout & Physical Focus',
    category: 'Physical Discipline',
    icon: 'fitness_center',
    scheduleType: 'daily',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    focusMinutesPerSession: 45,
    reminderTime: '06:30',
    selected: true,
  },
  {
    id: 'h2',
    name: 'Deep Work & Deep Focus Session',
    category: 'Cognitive Mastery',
    icon: 'psychology',
    scheduleType: 'weekdays',
    scheduleDays: [0, 1, 2, 3, 4],
    focusMinutesPerSession: 90,
    reminderTime: '09:00',
    selected: true,
  },
  {
    id: 'h3',
    name: 'Strategic Reading & Skill Acquisition',
    category: 'Knowledge',
    icon: 'book',
    scheduleType: 'daily',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    focusMinutesPerSession: 30,
    reminderTime: '20:00',
    selected: true,
  },
  {
    id: 'h4',
    name: 'Mindfulness & Cold Exposure',
    category: 'Mental Fortitude',
    icon: 'self_improvement',
    scheduleType: 'daily',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    focusMinutesPerSession: 15,
    reminderTime: '07:00',
    selected: false,
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { updateUserProfile, habits } = useHabits();

  const [step, setStep] = useState<number>(1);

  // Profile Form State
  const [name, setName] = useState<string>(user?.user_metadata?.full_name || 'Operator');
  const [title, setTitle] = useState<string>('TACTICAL OPERATOR');
  const [creed, setCreed] = useState<string>(getRandomMottoString());
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
  );

  // Fetch a random motto quote from Supabase if connected
  React.useEffect(() => {
    const fetchRandomMotto = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('motivational_quotes').select('*');
          if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            const formattedQuote = random.translation 
              ? `${random.quote} — ${random.translation}` 
              : `${random.quote} — ${random.author}`;
            setCreed(formattedQuote);
          }
        } catch {
          // fallback to local random motto string already set
        }
      }
    };
    fetchRandomMotto();
  }, []);

  // Habit Protocol State
  const [draftHabits, setDraftHabits] = useState<OnboardingHabitDraft[]>(PRESET_HABIT_OPTIONS);
  const [customHabitName, setCustomHabitName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle Photo Upload from device / camera
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleHabitSelection = (id: string) => {
    setDraftHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, selected: !h.selected } : h))
    );
  };

  const updateDraftHabit = (id: string, updates: Partial<OnboardingHabitDraft>) => {
    setDraftHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  const toggleDraftHabitDay = (habitId: string, dayIndex: number) => {
    setDraftHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;
        let newDays = [...h.scheduleDays];
        if (newDays.includes(dayIndex)) {
          if (newDays.length === 1) return h; // Must keep at least 1 day
          newDays = newDays.filter(d => d !== dayIndex);
        } else {
          newDays = [...newDays, dayIndex].sort((a, b) => a - b);
        }

        let newType: 'daily' | 'weekdays' | 'weekends' | 'custom' = 'custom';
        if (newDays.length === 7) newType = 'daily';
        else if (newDays.length === 5 && !newDays.includes(5) && !newDays.includes(6)) newType = 'weekdays';
        else if (newDays.length === 2 && newDays.includes(5) && newDays.includes(6)) newType = 'weekends';

        return {
          ...h,
          scheduleDays: newDays,
          scheduleType: newType,
        };
      })
    );
  };

  const setDraftHabitPresetSchedule = (habitId: string, type: 'daily' | 'weekdays' | 'weekends') => {
    setDraftHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;
        if (type === 'daily') return { ...h, scheduleType: 'daily', scheduleDays: [0, 1, 2, 3, 4, 5, 6] };
        if (type === 'weekdays') return { ...h, scheduleType: 'weekdays', scheduleDays: [0, 1, 2, 3, 4] };
        if (type === 'weekends') return { ...h, scheduleType: 'weekends', scheduleDays: [5, 6] };
        return h;
      })
    );
  };

  const handleAddCustomHabit = () => {
    if (!customHabitName.trim()) return;
    const newHabit: OnboardingHabitDraft = {
      id: `custom_${Date.now()}`,
      name: customHabitName.trim(),
      category: 'Custom Discipline',
      icon: 'star',
      scheduleType: 'daily',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
      focusMinutesPerSession: 30,
      reminderTime: '08:00',
      selected: true,
    };
    setDraftHabits(prev => [...prev, newHabit]);
    setCustomHabitName('');
  };

  const handleCompleteSetup = async () => {
    try {
      setIsSubmitting(true);

      const updatedProfile: UserProfile = {
        name,
        title,
        avatarUrl,
        disciplineScore: 0,
        creed,
      };

      // 1. Update React Local Context Profile
      updateUserProfile(updatedProfile);

      // 2. Persist Profile to Supabase DB if connected
      if (isSupabaseConfigured && user?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            name,
            title,
            avatar_url: avatarUrl,
            creed,
            discipline_score: 0,
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[Onboarding] Profile Supabase sync error:', err);
        }
      }

      // 3. Save Selected Habits to Supabase DB
      const selectedDrafts = draftHabits.filter(h => h.selected);
      if (isSupabaseConfigured && user?.id && selectedDrafts.length > 0) {
        try {
          const habitPayloads = selectedDrafts.map(h => ({
            user_id: user.id,
            name: h.name,
            category: h.category,
            priority: 'high' as PriorityLevel,
            icon: h.icon,
            schedule_days: h.scheduleDays,
            schedule_type: h.scheduleType,
            reminder_enabled: true,
            reminder_time: h.reminderTime,
            focus_minutes_per_session: h.focusMinutesPerSession,
            is_archived: false,
            created_at: new Date().toISOString(),
          }));

          await supabase.from('habits').insert(habitPayloads);
        } catch (err) {
          console.error('[Onboarding] Habits Supabase sync error:', err);
        }
      }

      // 4. Set onboarding completed flag in storage
      localStorage.setItem(`focustrack_onboarded_${user?.id || 'demo'}`, 'true');

      onComplete();
    } catch (err) {
      console.error('[Onboarding Error]:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans overflow-y-auto">
      {/* Mobile-Friendly Fixed Top Bar */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pt-2 pb-6 border-b border-[#222]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center p-1.5 shrink-0">
            <img src="/logo.png" alt="FocusTrack Emblem" className="w-full h-full object-contain invert" />
          </div>
          <span className="font-geist text-base sm:text-lg font-bold tracking-tight uppercase text-white truncate">
            OPERATOR INITIALIZATION
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-technical text-slate-400 uppercase tracking-widest">
          <span className={step === 1 ? 'text-white font-bold' : ''}>01 DOSSIER</span>
          <span>•</span>
          <span className={step === 2 ? 'text-white font-bold' : ''}>02 PROTOCOLS</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto w-full my-auto py-6">
        {step === 1 ? (
          /* STEP 1: PERSONAL DOSSIER & PROFILE AVATAR */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center sm:text-left">
              <h1 className="font-geist text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                CREATE YOUR OPERATOR PROFILE
              </h1>
              <p className="text-xs text-slate-400 font-technical uppercase tracking-widest mt-1">
                Enter your identity credentials & philosophical creed.
              </p>
            </div>

            {/* Profile Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#121212] border border-[#262626] rounded-2xl p-5">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 bg-[#1e1e1e] shadow-xl">
                  <img
                    src={avatarUrl}
                    alt="Operator Avatar"
                    className="w-full h-full object-cover grayscale contrast-125"
                  />
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center cursor-pointer shadow-lg hover:bg-neutral-200 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <span className="font-technical text-xs font-bold text-white uppercase tracking-widest">
                  PROFILE PHOTO & AVATAR
                </span>
                <p className="text-xs text-slate-400">
                  Tap camera icon to upload photo from your device, or use your synced Google avatar.
                </p>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-technical text-slate-400 uppercase tracking-widest mb-1.5">
                  OPERATOR NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full h-12 bg-[#121212] border border-[#262626] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-technical text-slate-400 uppercase tracking-widest mb-1.5">
                  OPERATOR TITLE / SPECIALIZATION
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. SOFTWARE ENGINEER, ATHLETE, RESEARCHER"
                  className="w-full h-12 bg-[#121212] border border-[#262626] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-technical text-slate-400 uppercase tracking-widest mb-1.5">
                  PHILOSOPHICAL CREED / MOTTO
                </label>
                <textarea
                  value={creed}
                  onChange={e => setCreed(e.target.value)}
                  rows={2}
                  placeholder="Enter your personal motto or creed"
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/60 resize-none"
                />
              </div>
            </div>

            {/* Next Step Button */}
            <button
              onClick={() => setStep(2)}
              className="w-full h-14 bg-white text-black font-geist font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors cursor-pointer mt-4"
            >
              <span>CONTINUE TO HABIT PROTOCOLS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* STEP 2: HABIT PROTOCOL SETUP */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="font-geist text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                CONFIGURE DAILY HABIT PROTOCOLS
              </h1>
              <p className="text-xs text-slate-400 font-technical uppercase tracking-widest mt-1">
                Select protocols to track and set frequency schedules.
              </p>
            </div>

            {/* Presets & Custom Protocols Grid */}
            <div className="space-y-3">
              {draftHabits.map(habit => (
                <div
                  key={habit.id}
                  className={`p-4 rounded-xl border transition-all ${
                    habit.selected
                      ? 'bg-neutral-900 border-neutral-600 text-white'
                      : 'bg-[#121212] border-[#262626] text-slate-400'
                  }`}
                >
                  <div
                    onClick={() => toggleHabitSelection(habit.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                          habit.selected
                            ? 'bg-white border-white text-black'
                            : 'border-slate-700 bg-transparent'
                        }`}
                      >
                        {habit.selected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase">{habit.name}</h4>
                        <p className="text-[11px] font-technical text-slate-400 uppercase">
                          {habit.category} • {habit.focusMinutesPerSession} mins/session • {habit.scheduleType}
                        </p>
                      </div>
                    </div>

                    {habit.selected && (
                      <span className="text-[10px] font-technical text-white uppercase tracking-widest bg-neutral-800 border border-neutral-600 px-2 py-0.5 rounded shrink-0">
                        {habit.reminderTime || '08:00'}
                      </span>
                    )}
                  </div>

                  {/* Interactive Timing & Schedule Controls (Select Own Timing & Execution Days) */}
                  {habit.selected && (
                    <div
                      className="mt-4 pt-3 border-t border-[#262626] space-y-3 animate-in fade-in duration-150"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Row 1: Focus Duration & Reminder Time */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Duration Pill Selector & Custom Mins Input */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-technical text-[10px] text-slate-400 uppercase mr-1">Session Timing:</span>
                          {[15, 30, 45, 60, 90, 120].map(mins => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => updateDraftHabit(habit.id, { focusMinutesPerSession: mins })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-technical uppercase font-bold transition-all cursor-pointer ${
                                habit.focusMinutesPerSession === mins
                                  ? 'bg-white text-black font-extrabold shadow'
                                  : 'bg-[#1a1a1a] text-slate-300 border border-[#333] hover:border-white/40'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                          {/* Custom Duration number input */}
                          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-0.5">
                            <input
                              type="number"
                              min="5"
                              max="480"
                              value={habit.focusMinutesPerSession}
                              onChange={e => updateDraftHabit(habit.id, { focusMinutesPerSession: Math.max(1, parseInt(e.target.value, 10) || 15) })}
                              className="w-10 bg-transparent text-center text-white font-technical font-bold text-[11px] focus:outline-none"
                            />
                            <span className="font-technical text-[9px] text-slate-500 uppercase">m</span>
                          </div>
                        </div>

                        {/* Reminder Time Input */}
                        <div className="flex items-center gap-2">
                          <span className="font-technical text-[10px] text-slate-400 uppercase">Reminder:</span>
                          <input
                            type="time"
                            value={habit.reminderTime || '08:00'}
                            onChange={e => updateDraftHabit(habit.id, { reminderTime: e.target.value })}
                            className="bg-[#1a1a1a] border border-[#333] text-white px-2 py-1 rounded-lg font-technical text-xs focus:outline-none focus:border-white cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Row 2: Execution Days (Every Day, Weekdays, Weekends & Individual Day Toggles) */}
                      <div className="pt-2.5 border-t border-[#1f1f1f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-technical text-[10px] text-slate-400 uppercase mr-1">Work Days:</span>
                          <button
                            type="button"
                            onClick={() => setDraftHabitPresetSchedule(habit.id, 'daily')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-technical uppercase font-bold transition-all cursor-pointer ${
                              habit.scheduleType === 'daily' || habit.scheduleDays.length === 7
                                ? 'bg-white text-black font-extrabold shadow'
                                : 'bg-[#1a1a1a] text-slate-300 border border-[#333] hover:border-white/40'
                            }`}
                          >
                            Every Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftHabitPresetSchedule(habit.id, 'weekdays')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-technical uppercase font-bold transition-all cursor-pointer ${
                              habit.scheduleType === 'weekdays' || (habit.scheduleDays.length === 5 && !habit.scheduleDays.includes(5) && !habit.scheduleDays.includes(6))
                                ? 'bg-white text-black font-extrabold shadow'
                                : 'bg-[#1a1a1a] text-slate-300 border border-[#333] hover:border-white/40'
                            }`}
                          >
                            Weekdays
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftHabitPresetSchedule(habit.id, 'weekends')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-technical uppercase font-bold transition-all cursor-pointer ${
                              habit.scheduleType === 'weekends' || (habit.scheduleDays.length === 2 && habit.scheduleDays.includes(5) && habit.scheduleDays.includes(6))
                                ? 'bg-white text-black font-extrabold shadow'
                                : 'bg-[#1a1a1a] text-slate-300 border border-[#333] hover:border-white/40'
                            }`}
                          >
                            Weekends
                          </button>
                        </div>

                        {/* 7 Days Individual Toggles */}
                        <div className="flex items-center gap-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLetter, dayIdx) => {
                            const isSelectedDay = habit.scheduleDays.includes(dayIdx);
                            return (
                              <button
                                key={dayIdx}
                                type="button"
                                onClick={() => toggleDraftHabitDay(habit.id, dayIdx)}
                                className={`w-6 h-6 rounded flex items-center justify-center font-technical text-[10px] font-bold transition-all cursor-pointer ${
                                  isSelectedDay
                                    ? 'bg-white text-black border border-white font-extrabold'
                                    : 'bg-[#141414] text-slate-500 border border-[#2a2a2a] hover:border-slate-400 hover:text-white'
                                }`}
                                title={`Toggle ${dayLetter}`}
                              >
                                {dayLetter}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Habit Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customHabitName}
                onChange={e => setCustomHabitName(e.target.value)}
                placeholder="Add custom habit (e.g. Journaling, Water Intake)"
                className="flex-1 h-12 bg-[#121212] border border-[#262626] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/60"
              />
              <button
                onClick={handleAddCustomHabit}
                className="h-12 px-5 bg-white/10 border border-white/30 text-white font-technical text-xs font-bold uppercase rounded-xl flex items-center gap-2 hover:bg-white/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ADD</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="h-14 px-6 bg-[#121212] border border-[#262626] text-slate-300 font-geist font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-[#1c1c1c] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={handleCompleteSetup}
                disabled={isSubmitting}
                className="flex-1 h-14 bg-white text-black font-geist font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ACTIVATE OPERATOR SYSTEM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Footer Note */}
      <div className="max-w-2xl mx-auto w-full text-center pb-2 pt-4 text-[10px] font-technical text-slate-500 uppercase tracking-widest">
        <span>MOBILE & CAPACITOR OPTIMIZED • TOUCH RESPONSE ENABLED</span>
      </div>
    </div>
  );
};
