
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FigureListItemProps {
  figure: Figure;
}

export function FigureListItem({ figure }: FigureListItemProps) {
  return (
    <Link href={`/figures/${figure.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
        <CardHeader className="p-0 relative">
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              width={300}
              height={400}
              className="w-full h-64 object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x400.png?text=Error'; e.currentTarget.srcset = '' }}
            />
          ) : (
             <div className="w-full h-64 bg-muted flex items-center justify-center">
               <ImageOff className="h-16 w-16 text-muted-foreground" />
             </div>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl font-headline mb-1 group-hover:text-primary">{figure.name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{figure.description || "No description available."}</p>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t">
          <div className="flex items-center gap-1 text-sm text-amber-500">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>{figure.averageRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground ml-1">({figure.totalRatings})</span>
          </div>
          <Badge variant="secondary">View Profile</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
