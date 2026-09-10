export interface MonochromeIconItem {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export const MONOCHROME_ICON_CATEGORIES = [
  'All',
  'Technology',
  'Fitness & Gym',
  'Entertainment & Gaming',
  'Education & Learning',
  'Work & Productivity',
  'Finance & Money',
  'Creative & Design',
  'Health & Wellness',
  'Lifestyle & Personal',
  'Tools & System',
  'Symbols & Shapes',
] as const;

export const MONOCHROME_ICONS: MonochromeIconItem[] = [
  // Technology & Coding
  { id: 'terminal', name: 'Terminal / CLI', category: 'Technology', keywords: ['terminal', 'command', 'cli', 'code', 'shell', 'bash'] },
  { id: 'code', name: 'Code / Programming', category: 'Technology', keywords: ['code', 'html', 'developer', 'programming', 'software'] },
  { id: 'laptop_mac', name: 'Laptop / Computer', category: 'Technology', keywords: ['laptop', 'mac', 'computer', 'device', 'hardware'] },
  { id: 'developer_mode', name: 'Dev Mode / Smartphone', category: 'Technology', keywords: ['developer', 'phone', 'mobile', 'app'] },
  { id: 'memory', name: 'Chip / Architecture', category: 'Technology', keywords: ['chip', 'processor', 'memory', 'cpu', 'tech'] },
  { id: 'database', name: 'Database / Storage', category: 'Technology', keywords: ['database', 'sql', 'storage', 'data', 'backend'] },
  { id: 'cloud', name: 'Cloud Infrastructure', category: 'Technology', keywords: ['cloud', 'server', 'hosting', 'aws', 'gcp'] },
  { id: 'bug_report', name: 'Bug Debugging', category: 'Technology', keywords: ['bug', 'debug', 'testing', 'qa', 'fix'] },
  { id: 'smart_toy', name: 'AI / Robotics', category: 'Technology', keywords: ['ai', 'robot', 'automation', 'ml', 'machine learning'] },

  // Fitness & Gym
  { id: 'fitness_center', name: 'Dumbbell / Gym', category: 'Fitness & Gym', keywords: ['gym', 'workout', 'dumbbell', 'weightlifting', 'exercise'] },
  { id: 'directions_run', name: 'Running / Cardio', category: 'Fitness & Gym', keywords: ['run', 'running', 'cardio', 'jog', 'sprint', 'athletics'] },
  { id: 'sports_gymnastics', name: 'Calisthenics / Movement', category: 'Fitness & Gym', keywords: ['gymnastics', 'stretching', 'mobility', 'calisthenics'] },
  { id: 'pedal_bike', name: 'Cycling / Bike', category: 'Fitness & Gym', keywords: ['bike', 'cycling', 'bicycle', 'ride', 'spin'] },
  { id: 'pool', name: 'Swimming', category: 'Fitness & Gym', keywords: ['swim', 'swimming', 'pool', 'water', 'laps'] },
  { id: 'hiking', name: 'Hiking / Trekking', category: 'Fitness & Gym', keywords: ['hike', 'hiking', 'mountain', 'walk', 'trail'] },
  { id: 'sports_mma', name: 'Martial Arts / Boxing', category: 'Fitness & Gym', keywords: ['boxing', 'mma', 'combat', 'fight', 'sparring'] },
  { id: 'rowing', name: 'Rowing / Ergometer', category: 'Fitness & Gym', keywords: ['rowing', 'erg', 'endurance'] },

  // Entertainment & Gaming
  { id: 'sports_esports', name: 'Game Controller', category: 'Entertainment & Gaming', keywords: ['game', 'gaming', 'esports', 'controller', 'playstation', 'xbox'] },
  { id: 'videogame_asset', name: 'Arcade / D-Pad', category: 'Entertainment & Gaming', keywords: ['videogame', 'game', 'arcade', 'retro', 'dpad'] },
  { id: 'headphones', name: 'Headphones / Audio', category: 'Entertainment & Gaming', keywords: ['headphones', 'music', 'podcast', 'audio', 'sound'] },
  { id: 'music_note', name: 'Music / Instrument', category: 'Entertainment & Gaming', keywords: ['music', 'song', 'guitar', 'piano', 'sound'] },
  { id: 'movie', name: 'Cinema / Film', category: 'Entertainment & Gaming', keywords: ['movie', 'film', 'cinema', 'video', 'watch'] },
  { id: 'casino', name: 'Dice / Board Games', category: 'Entertainment & Gaming', keywords: ['dice', 'boardgame', 'tabletop', 'strategy'] },

  // Education & Learning
  { id: 'menu_book', name: 'Book / Reading', category: 'Education & Learning', keywords: ['book', 'read', 'reading', 'novel', 'literature'] },
  { id: 'auto_stories', name: 'Open Book / Study', category: 'Education & Learning', keywords: ['study', 'research', 'learning', 'story'] },
  { id: 'school', name: 'Graduation / College', category: 'Education & Learning', keywords: ['school', 'college', 'university', 'degree', 'exam'] },
  { id: 'science', name: 'Science / Lab', category: 'Education & Learning', keywords: ['science', 'chemistry', 'research', 'experiment', 'lab'] },
  { id: 'psychology', name: 'Brain / Cognition', category: 'Education & Learning', keywords: ['brain', 'mind', 'cognition', 'psychology', 'iq', 'intellect'] },
  { id: 'language', name: 'Language Learning', category: 'Education & Learning', keywords: ['language', 'vocab', 'duolingo', 'translation', 'world'] },
  { id: 'lightbulb', name: 'Idea / Insight', category: 'Education & Learning', keywords: ['idea', 'insight', 'creativity', 'discovery'] },

  // Work & Productivity
  { id: 'business_center', name: 'Briefcase / Business', category: 'Work & Productivity', keywords: ['work', 'business', 'job', 'office', 'career'] },
  { id: 'apartment', name: 'Office / Corporate', category: 'Work & Productivity', keywords: ['office', 'corporate', 'company', 'agency'] },
  { id: 'task_alt', name: 'Task / Execution', category: 'Work & Productivity', keywords: ['task', 'todo', 'check', 'complete', 'action'] },
  { id: 'timer', name: 'Timer / Pomodoro', category: 'Work & Productivity', keywords: ['timer', 'clock', 'time', 'pomodoro', 'focus'] },
  { id: 'schedule', name: 'Schedule / Routine', category: 'Work & Productivity', keywords: ['schedule', 'routine', 'plan', 'calendar'] },
  { id: 'flag', name: 'Milestone / Goal', category: 'Work & Productivity', keywords: ['goal', 'target', 'milestone', 'objective'] },
  { id: 'rocket_launch', name: 'Project Launch', category: 'Work & Productivity', keywords: ['project', 'launch', 'startup', 'build', 'ship'] },

  // Finance & Money
  { id: 'account_balance_wallet', name: 'Wallet / Budget', category: 'Finance & Money', keywords: ['wallet', 'money', 'budget', 'spending', 'cash'] },
  { id: 'payments', name: 'Cash / Income', category: 'Finance & Money', keywords: ['income', 'cash', 'money', 'salary', 'freelance'] },
  { id: 'savings', name: 'Piggy Bank / Savings', category: 'Finance & Money', keywords: ['save', 'savings', 'invest', 'emergency fund'] },
  { id: 'trending_up', name: 'Stock Chart / Growth', category: 'Finance & Money', keywords: ['stocks', 'investing', 'growth', 'market', 'crypto'] },
  { id: 'receipt_long', name: 'Receipt / Expenses', category: 'Finance & Money', keywords: ['receipt', 'tax', 'accounting', 'invoice', 'bills'] },

  // Creative & Design
  { id: 'palette', name: 'Palette / Painting', category: 'Creative & Design', keywords: ['paint', 'art', 'design', 'palette', 'illustration'] },
  { id: 'draw', name: 'Pencil / Sketching', category: 'Creative & Design', keywords: ['draw', 'sketch', 'pencil', 'graphic', 'art'] },
  { id: 'edit_note', name: 'Writing / Journaling', category: 'Creative & Design', keywords: ['write', 'writing', 'journal', 'essay', 'blog', 'author'] },
  { id: 'photo_camera', name: 'Photography', category: 'Creative & Design', keywords: ['photo', 'camera', 'shoot', 'lens', 'video'] },
  { id: 'mic', name: 'Microphone / Vocal', category: 'Creative & Design', keywords: ['mic', 'voice', 'sing', 'podcast', 'recording'] },
  { id: 'brush', name: 'Brush / Craft', category: 'Creative & Design', keywords: ['craft', 'diy', 'brush', 'sculpture'] },

  // Health & Wellness
  { id: 'self_improvement', name: 'Meditation / Zen', category: 'Health & Wellness', keywords: ['meditate', 'zen', 'mindfulness', 'breathe', 'peace'] },
  { id: 'spa', name: 'Rest / Recovery', category: 'Health & Wellness', keywords: ['spa', 'wellness', 'relaxation', 'recharge'] },
  { id: 'bedtime', name: 'Sleep / Circadian', category: 'Health & Wellness', keywords: ['sleep', 'bed', 'night', 'rest', 'circadian'] },
  { id: 'water_drop', name: 'Water / Hydration', category: 'Health & Wellness', keywords: ['water', 'hydrate', 'drink', 'fluid'] },
  { id: 'favorite', name: 'Heart / Vitality', category: 'Health & Wellness', keywords: ['heart', 'cardio', 'health', 'pulse', 'vitality'] },
  { id: 'restaurant', name: 'Nutrition / Diet', category: 'Health & Wellness', keywords: ['diet', 'meal', 'nutrition', 'food', 'cooking', 'fasting'] },

  // Lifestyle & Personal
  { id: 'home', name: 'Home / Chores', category: 'Lifestyle & Personal', keywords: ['home', 'house', 'chores', 'cleaning', 'family'] },
  { id: 'directions_car', name: 'Commute / Driving', category: 'Lifestyle & Personal', keywords: ['car', 'drive', 'commute', 'travel'] },
  { id: 'flight', name: 'Travel / Exploration', category: 'Lifestyle & Personal', keywords: ['travel', 'flight', 'trip', 'explore'] },
  { id: 'pets', name: 'Pet Care / Dog / Cat', category: 'Lifestyle & Personal', keywords: ['pet', 'dog', 'cat', 'walk', 'animal'] },
  { id: 'local_cafe', name: 'Coffee / Social', category: 'Lifestyle & Personal', keywords: ['coffee', 'tea', 'cafe', 'social', 'meet'] },
  { id: 'shopping_bag', name: 'Errands / Shopping', category: 'Lifestyle & Personal', keywords: ['errands', 'groceries', 'shopping'] },

  // Tools & System
  { id: 'handyman', name: 'Handyman / Repairs', category: 'Tools & System', keywords: ['tools', 'repair', 'hardware', 'build', 'craft'] },
  { id: 'build', name: 'Wrench / Maintenance', category: 'Tools & System', keywords: ['wrench', 'maintenance', 'fix', 'system'] },
  { id: 'tune', name: 'Controls / Tuning', category: 'Tools & System', keywords: ['settings', 'tune', 'adjust', 'calibrate'] },
  { id: 'bolt', name: 'Energy / Power', category: 'Tools & System', keywords: ['energy', 'electric', 'power', 'charge', 'intensity'] },
  { id: 'lock', name: 'Security / Boundary', category: 'Tools & System', keywords: ['security', 'lock', 'privacy', 'boundary'] },

  // Symbols & Shapes
  { id: 'target', name: 'Target / Focus', category: 'Symbols & Shapes', keywords: ['target', 'aim', 'focus', 'accuracy'] },
  { id: 'grade', name: 'Star / Excellence', category: 'Symbols & Shapes', keywords: ['star', 'favorite', 'quality', 'excellence'] },
  { id: 'verified', name: 'Badge / Verified', category: 'Symbols & Shapes', keywords: ['badge', 'shield', 'check', 'certified'] },
  { id: 'all_inclusive', name: 'Infinity / Loop', category: 'Symbols & Shapes', keywords: ['infinity', 'loop', 'constant', 'forever'] },
  { id: 'change_history', name: 'Delta / Triangle', category: 'Symbols & Shapes', keywords: ['triangle', 'delta', 'change', 'pyramid'] },
  { id: 'circle', name: 'Circle / Monolith', category: 'Symbols & Shapes', keywords: ['circle', 'ring', 'sun', 'dot'] },
];

/** Map web icon IDs to Ionicons vector icon names */
export const ICON_NAME_MAP: Record<string, string> = {
  terminal: 'terminal-outline',
  code: 'code-slash-outline',
  laptop_mac: 'laptop-outline',
  developer_mode: 'phone-portrait-outline',
  memory: 'hardware-chip-outline',
  database: 'server-outline',
  cloud: 'cloud-outline',
  bug_report: 'bug-outline',
  smart_toy: 'hardware-chip-outline',
  fitness_center: 'fitness-outline',
  directions_run: 'walk-outline',
  sports_gymnastics: 'body-outline',
  pedal_bike: 'bicycle-outline',
  pool: 'water-outline',
  hiking: 'navigate-outline',
  sports_mma: 'hand-left-outline',
  rowing: 'boat-outline',
  sports_esports: 'game-controller-outline',
  videogame_asset: 'game-controller-outline',
  headphones: 'headset-outline',
  music_note: 'musical-notes-outline',
  movie: 'film-outline',
  casino: 'cube-outline',
  menu_book: 'book-outline',
  auto_stories: 'book-outline',
  school: 'school-outline',
  science: 'flask-outline',
  psychology: 'bulb-outline',
  language: 'language-outline',
  lightbulb: 'bulb-outline',
  business_center: 'briefcase-outline',
  apartment: 'business-outline',
  task_alt: 'checkbox-outline',
  timer: 'time-outline',
  schedule: 'calendar-outline',
  flag: 'flag-outline',
  rocket_launch: 'rocket-outline',
  account_balance_wallet: 'wallet-outline',
  payments: 'cash-outline',
  savings: 'cash-outline',
  trending_up: 'trending-up-outline',
  receipt_long: 'document-text-outline',
  palette: 'color-palette-outline',
  draw: 'create-outline',
  edit_note: 'create-outline',
  photo_camera: 'camera-outline',
  mic: 'mic-outline',
  brush: 'brush-outline',
  self_improvement: 'leaf-outline',
  spa: 'flower-outline',
  bedtime: 'moon-outline',
  water_drop: 'water-outline',
  favorite: 'heart-outline',
  restaurant: 'restaurant-outline',
  home: 'home-outline',
  directions_car: 'car-outline',
  flight: 'airplane-outline',
  pets: 'paw-outline',
  local_cafe: 'cafe-outline',
  shopping_bag: 'bag-handle-outline',
  handyman: 'construct-outline',
  build: 'build-outline',
  tune: 'options-outline',
  bolt: 'flash-outline',
  lock: 'lock-closed-outline',
  target: 'locate-outline',
  grade: 'star-outline',
  verified: 'shield-checkmark-outline',
  all_inclusive: 'infinite-outline',
  change_history: 'triangle-outline',
  circle: 'ellipse-outline',
};

export function getIoniconsName(iconId?: string): string {
  if (!iconId) return 'locate-outline';
  if (ICON_NAME_MAP[iconId]) return ICON_NAME_MAP[iconId];
  if (iconId.endsWith('-outline')) return iconId;
  return 'locate-outline';
}
