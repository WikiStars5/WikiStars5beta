

"use client";

import Link from 'next/link';

interface FigureHashtagsProps {
  hashtags: string[];
}

export function FigureHashtags({ hashtags }: FigureHashtagsProps) {
  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {hashtags.map(tag => (
        <Link 
          key={tag} 
          href={`/figures/hashtagged/${encodeURIComponent(tag.toLowerCase())}`} 
          className="text-primary hover:underline font-medium"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
