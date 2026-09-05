import React from 'react';
import { Habit } from '../types';

interface HabitVisualProps {
  habit: Pick<Habit, 'icon' | 'customImage' | 'name'>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  muted?: boolean;
}

export const HabitVisual: React.FC<HabitVisualProps> = ({
  habit,
  size = 'sm',
  className = '',
  muted = false,
}) => {
  const sizeMap = {
    xs: {
      container: 'w-4 h-4 text-[14px]',
      img: 'w-4 h-4',
    },
    sm: {
      container: 'w-5 h-5 text-[18px]',
      img: 'w-5 h-5',
    },
    md: {
      container: 'w-7 h-7 text-[20px]',
      img: 'w-7 h-7',
    },
    lg: {
      container: 'w-9 h-9 text-[24px]',
      img: 'w-9 h-9',
    },
    xl: {
      container: 'w-12 h-12 text-[30px]',
      img: 'w-12 h-12',
    },
  };

  const { container, img } = sizeMap[size];

  if (habit.customImage) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-xs border border-[#333] bg-[#1a1a1a] ${container} ${className}`}
        title={habit.name}
      >
        <img
          src={habit.customImage}
          alt={habit.name}
          className={`${img} object-cover grayscale contrast-150 brightness-110 filter`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  let displayIcon = habit.icon?.trim() || 'task_alt';
  if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}]/u.test(displayIcon)) {
    displayIcon = 'target';
  }

  return (
    <span
      className={`material-symbols-outlined shrink-0 inline-flex items-center justify-center select-none ${
        muted ? 'text-[#737373]' : 'text-white'
      } ${container} ${className}`}
      title={habit.name}
    >
      {displayIcon}
    </span>
  );
};
