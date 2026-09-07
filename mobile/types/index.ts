export type PriorityLevel = 'high' | 'medium' | 'low';
export type NavigationTab = 'dashboard' | 'habits' | 'calendar' | 'analytics' | 'archive' | 'settings';

export interface Habit {
  id: string;
  name: string;
  category: string;
  categoryLabel?: string;
  description?: string;
  priority: PriorityLevel;
  icon: string;
  customImage?: string;
  visualType?: 'icon' | 'image' | 'symbol';
  scheduleDays: number[]; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  scheduleType?: 'daily' | 'weekdays' | 'weekends' | 'custom';
  reminderEnabled: boolean;
  reminderTime: string; // e.g. "08:00"
  targetTime?: string; // e.g. "Morning"
  history: Record<string, boolean>; // 'YYYY-MM-DD': boolean
  focusMinutesPerSession: number;
  isArchived: boolean;
  archivedAt?: string;
  archivedIntervals?: Array<{ archivedAt: string; restoredAt: string }>;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface UserProfile {
  name: string;
  title: string;
  avatarUrl: string;
  disciplineScore: number;
  creed: string;
}

export interface HabitStats {
  dueCount: number;
  completedCount: number;
  missedCount: number;
  completionRate: number; // 0 - 100
  currentStreak: number;
  bestStreak: number;
  trajectoryBars: Array<{
    week: string;
    value: number;
    height: string;
    isEmpty: boolean;
  }>;
}
