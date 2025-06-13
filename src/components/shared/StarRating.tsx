"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number; // size of star icons
  className?: string;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

export function StarRating({
  rating,
  totalStars = 5,
  size = 20,
  className,
  onRatingChange,
  readOnly = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (index: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={cn("flex items-center", readOnly ? '' : 'cursor-pointer', className)} onMouseLeave={handleMouseLeave}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "transition-colors",
              starValue <= displayRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600',
              !readOnly && 'hover:text-amber-300'
            )}
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
          />
        );
      })}
    </div>
  );
}
