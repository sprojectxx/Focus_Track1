export type PriorityLevel = 'high' | 'medium' | 'low';
export type NavigationTab = 'dashboard' | 'habits' | 'calendar' | 'analytics' | 'archive' | 'settings';

export interface Habit {
  id: string;
  name: string;
  category: string; // Dynamic custom category or preset label
  categoryLabel?: string;
  description?: string;
  priority: PriorityLevel;
  icon: string; // Monochrome material icon identifier or symbol
  customImage?: string; // Grayscale base64 data URL if user uploaded an image
  visualType?: 'icon' | 'image' | 'symbol';
  scheduleDays: number[]; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  scheduleType?: 'daily' | 'weekdays' | 'weekends' | 'custom';
  reminderEnabled: boolean;
  reminderTime: string; // e.g. "06:00"
  targetTime?: string; // Optional time of day e.g. "09:00" or "Morning"
  history: Record<string, boolean>; // 'YYYY-MM-DD': boolean
  focusMinutesPerSession: number;
  isArchived: boolean;
  createdAt: string;
}

export interface DayMetric {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  score: number; // 0 - 100
  notes?: string;
}

export interface UserProfile {
  name: string;
  title: string;
  avatarUrl: string;
  disciplineScore: number;
  creed: string;
}

