export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  latinTag?: string;
  translation?: string;
}

export const INITIAL_MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 'q1',
    quote: 'EX DURIS GLORIA',
    author: 'LATIN PROVERB',
    latinTag: 'Ex Duris Gloria',
    translation: 'From suffering comes glory'
  },
  {
    id: 'q2',
    quote: 'DISCIPLINE IS BUILT ONE DAY AT A TIME.',
    author: 'FOCUSTRACK',
    translation: 'Unwavering daily consistency'
  },
  {
    id: 'q3',
    quote: 'WE ARE WHAT WE REPEATEDLY DO. EXCELLENCE IS NOT AN ACT, BUT A HABIT.',
    author: 'ARISTOTLE',
    translation: 'Habitual mastery'
  },
  {
    id: 'q4',
    quote: 'SUFFER THE PAIN OF DISCIPLINE OR SUFFER THE PAIN OF REGRET.',
    author: 'JIM ROHN',
    translation: 'The daily choice'
  },
  {
    id: 'q5',
    quote: 'HE WHO HAS A WHY TO LIVE CAN BEAR ALMOST ANY HOW.',
    author: 'FRIEDRICH NIETZSCHE',
    translation: 'Purpose over comfort'
  },
  {
    id: 'q6',
    quote: 'VICTORY BELONGS TO THE MOST PERSEVERING.',
    author: 'NAPOLEON BONAPARTE',
    translation: 'Relentless execution'
  },
  {
    id: 'q7',
    quote: 'NO MAN IS FREE WHO IS NOT MASTER OF HIMSELF.',
    author: 'EPICTETUS',
    translation: 'Self-sovereignty'
  }
];

export const getRandomQuote = (): MotivationalQuote => {
  const randomIndex = Math.floor(Math.random() * INITIAL_MOTIVATIONAL_QUOTES.length);
  return INITIAL_MOTIVATIONAL_QUOTES[randomIndex];
};

export const getRandomMottoString = (): string => {
  const q = getRandomQuote();
  if (q.translation) {
    return `${q.quote} — ${q.translation}`;
  }
  return `${q.quote} — ${q.author}`;
};

export const getTimeBasedGreeting = (): { greeting: string; subtext: string } => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'GOOD MORNING, OPERATOR.',
      subtext: 'DISCIPLINE STARTS NOW. SET THE STANDARD FOR THE DAY.'
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: 'GOOD AFTERNOON, OPERATOR.',
      subtext: 'MAINTAIN THE MOMENTUM. NO RETREAT, NO COMPROMISE.'
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: 'GOOD EVENING, OPERATOR.',
      subtext: 'FINISH STRONG. ACCOUNT FOR EVERY SESSION.'
    };
  } else {
    return {
      greeting: 'NIGHT SHIFT, OPERATOR.',
      subtext: 'CONQUER THE SILENCE. DISCIPLINE DOES NOT SLEEP.'
    };
  }
};
