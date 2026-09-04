import { Habit, UserProfile } from '../types';
import { getRandomMottoString } from './motivationalQuotes';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'New Operator',
  title: 'Tactical Operator',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  disciplineScore: 0,
  creed: getRandomMottoString(),
};

// INITIAL HABITS ARE EMPTY FOR NEW USERS
export const INITIAL_HABITS: Habit[] = [];
