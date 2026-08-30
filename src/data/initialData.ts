import { Habit, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'User Profile',
  title: 'Radical Discipline',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6tc64l0mPGTwnfgRW_8jhU2nCpC6i4lYIbb3P3aVZVb73bXAYLNPk_gR6pSl2IwkPLINSGp4APq88BXRHpnsf4Dt2JCjjE8vyNA5dxCufeDuEEFcCZd7_pc3T3Lw-dVNvGzDvDzN_OFr_SJetRADHVS8ZyK1adGYRqdwHA0KioWAtjh4-A-mFQludZ6Y2E1WkljtrDjJtti-XuRhi5Q4QgnD7r_eAqj8QF525KRUogfCqgiypOTlq',
  disciplineScore: 87,
  creed: 'Discipline is built one day at a time.',
};

// Generate helper for realistic history
function generateMonthHistory(year: number, month: number, pattern: (day: number) => boolean): Record<string, boolean> {
  const history: Record<string, boolean> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    const key = `${year}-${monthStr}-${dayStr}`;
    history[key] = pattern(d);
  }
  return history;
}

// Generate year-wide history for rich heatmap
function generateFullYearHistory(year: number, completionRate: number, skipDays: number[] = []): Record<string, boolean> {
  const history: Record<string, boolean> = {};
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m - 1, d);
      const dayOfWeek = (date.getDay() + 6) % 7; // 0=Mon, 6=Sun
      const dayStr = d.toString().padStart(2, '0');
      const monthStr = m.toString().padStart(2, '0');
      const key = `${year}-${monthStr}-${dayStr}`;
      
      if (skipDays.includes(dayOfWeek)) {
        history[key] = false;
        continue;
      }
      // Deterministic completion based on hash
      const hash = Math.sin(year * 1000 + m * 31 + d) * 10000;
      const rand = hash - Math.floor(hash);
      history[key] = rand < completionRate;
    }
  }
  return history;
}

const yearHistory2024 = generateFullYearHistory(2024, 0.82);
const yearHistory2026 = generateFullYearHistory(2026, 0.85);
const yearHistory2023 = generateFullYearHistory(2023, 0.80);

const aug2026Coding = generateMonthHistory(2026, 8, (d) => {
  if ([3, 6, 12, 13, 19].includes(d)) return false;
  if (d === 31) return false;
  return d <= 30;
});

const aug2026Gym = generateMonthHistory(2026, 8, (d) => {
  if (d === 12 || d === 31) return false;
  return d <= 30;
});

const aug2026Gaming = generateMonthHistory(2026, 8, (d) => {
  if ([1, 4, 8, 15, 22, 29].includes(d)) return false;
  if (d === 31) return false;
  return d <= 30;
});

const aug2026Reading = generateMonthHistory(2026, 8, (d) => {
  if ([5, 10, 18, 25].includes(d)) return false;
  if (d === 31) return false;
  return d <= 30;
});

const aug2026Growth = generateMonthHistory(2026, 8, (d) => {
  if ([7, 14, 21, 28].includes(d)) return false;
  if (d === 31) return false;
  return d <= 30;
});

const aug2026Finance = generateMonthHistory(2026, 8, (d) => {
  if ([2, 9, 16, 23, 30].includes(d)) return true;
  return false;
});

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-coding',
    name: 'Coding & Build Project',
    category: 'Technology',
    categoryLabel: 'Technology',
    description: 'Ship 2 hours of feature code or open-source commits daily.',
    priority: 'high',
    icon: 'terminal',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    scheduleType: 'daily',
    reminderEnabled: true,
    reminderTime: '09:00',
    targetTime: 'Morning',
    focusMinutesPerSession: 120,
    isArchived: false,
    createdAt: '2023-01-01',
    history: {
      ...yearHistory2023,
      ...yearHistory2024,
      ...yearHistory2026,
      ...aug2026Coding,
    },
  },
  {
    id: 'habit-gym',
    name: 'Gym & Strength',
    category: 'Fitness',
    categoryLabel: 'Fitness',
    description: 'Progressive overload weightlifting and recovery.',
    priority: 'high',
    icon: 'fitness_center',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    scheduleType: 'daily',
    reminderEnabled: true,
    reminderTime: '06:30',
    targetTime: 'Morning',
    focusMinutesPerSession: 60,
    isArchived: false,
    createdAt: '2023-01-01',
    history: {
      ...yearHistory2023,
      ...yearHistory2024,
      ...yearHistory2026,
      ...aug2026Gym,
    },
  },
  {
    id: 'habit-gaming',
    name: 'Gaming & Strategy',
    category: 'Entertainment',
    categoryLabel: 'Entertainment',
    description: 'Ranked strategy match or leisure gaming cooldown.',
    priority: 'medium',
    icon: 'sports_esports',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    scheduleType: 'daily',
    reminderEnabled: false,
    reminderTime: '20:00',
    targetTime: 'Evening',
    focusMinutesPerSession: 60,
    isArchived: false,
    createdAt: '2023-01-01',
    history: {
      ...yearHistory2023,
      ...yearHistory2024,
      ...yearHistory2026,
      ...aug2026Gaming,
    },
  },
  {
    id: 'habit-reading',
    name: 'Reading & Research',
    category: 'Education',
    categoryLabel: 'Education',
    description: 'Read 30 pages of non-fiction, engineering, or philosophy.',
    priority: 'high',
    icon: 'menu_book',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    scheduleType: 'daily',
    reminderEnabled: true,
    reminderTime: '21:30',
    targetTime: 'Night',
    focusMinutesPerSession: 30,
    isArchived: false,
    createdAt: '2023-01-01',
    history: {
      ...yearHistory2023,
      ...yearHistory2024,
      ...yearHistory2026,
      ...aug2026Reading,
    },
  },
  {
    id: 'habit-growth',
    name: 'Personal Growth & Writing',
    category: 'Creative',
    categoryLabel: 'Creative',
    description: 'Reflect, journal, and document lessons learned.',
    priority: 'medium',
    icon: 'psychology',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    scheduleType: 'daily',
    reminderEnabled: true,
    reminderTime: '08:00',
    targetTime: 'Morning',
    focusMinutesPerSession: 25,
    isArchived: false,
    createdAt: '2023-01-01',
    history: {
      ...yearHistory2023,
      ...yearHistory2024,
      ...yearHistory2026,
      ...aug2026Growth,
    },
  },
  {
    id: 'habit-finance',
    name: 'Financial Tracking & Review',
    category: 'Finance',
    categoryLabel: 'Finance',
    description: 'Audit cash flow, investments, and project budget balance.',
    priority: 'medium',
    icon: 'account_balance_wallet',
    scheduleDays: [0, 2, 4, 6],
    scheduleType: 'custom',
    reminderEnabled: true,
    reminderTime: '18:00',
    targetTime: 'Evening',
    focusMinutesPerSession: 15,
    isArchived: false,
    createdAt: '2023-01-01',
    history: {
      ...yearHistory2023,
      ...yearHistory2024,
      ...yearHistory2026,
      ...aug2026Finance,
    },
  },
];
