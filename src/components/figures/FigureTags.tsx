
"use client";

import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

interface FigureTagsProps {
  tags: string[];
}

export function FigureTags({ tags }: FigureTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link key={tag} href={`/figures/tagged/${encodeURIComponent(tag.toLowerCase())}`} passHref>
          <Badge
            variant="outline"
            className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground text-sm border-white/30"
          >
            {tag}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
