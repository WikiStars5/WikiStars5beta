
"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  count?: number;
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  className?: string;
  hoverColor?: string;
  activeColor?: string;
  inactiveColor?: string;
}

export function StarRatingInput({
  count = 5,
  value,
  onChange,
  size = 28, // Increased default size for better touch interaction
  className,
  hoverColor = "text-amber-400",
  activeColor = "text-amber-500 fill-amber-500",
  inactiveColor = "text-gray-300 dark:text-gray-600",
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array(count).fill(0);

  const handleClick = (newValue: number) => {
    onChange(newValue);
  };

  const handleMouseOver = (newHoverValue: number) => {
    setHoverValue(newHoverValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(undefined);
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "cursor-pointer transition-colors duration-150 ease-in-out",
              (hoverValue || value) >= starValue ? activeColor : inactiveColor,
              hoverValue && hoverValue >= starValue && hoverColor
            )}
            onClick={() => handleClick(starValue)}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
            fill={(hoverValue || value) >= starValue ? 'currentColor' : 'none'}
          />
        );
      })}
    </div>
  );
}
