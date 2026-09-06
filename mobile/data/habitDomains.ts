export const PREDEFINED_DOMAINS = [
  'Study',
  'Work',
  'Workout',
  'Health',
  'Fitness',
  'Coding',
  'Personal Development',
  'Finance',
  'Reading',
  'Learning',
  'Sleep',
  'Family',
  'Projects',
  'Hobbies',
  'Gaming',
  'Creative',
  'Other',
] as const;

export type HabitDomain = (typeof PREDEFINED_DOMAINS)[number] | string;
