
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube } from 'lucide-react';
import type { Figure } from '@/lib/types';

interface FigureShortsProps {
  figure: Figure;
}

export function FigureShorts({ figure }: FigureShortsProps) {
  const shorts = figure.youtubeShorts || [];

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube />
          Shorts
        </CardTitle>
        <CardDescription>
          Videos cortos relacionados con {figure.name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shorts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shorts.map((short, index) => (
              <div key={index} className="group aspect-ratio-9/16">
                 <a href={`https://www.youtube.com/shorts/${short.videoId}`} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                        <iframe
                            src={`https://www.youtube.com/embed/${short.videoId}`}
                            title={short.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-semibold truncate">{short.title}</p>
                        </div>
                    </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <Youtube className="mx-auto h-12 w-12 mb-4" />
            <p>Aún no se han añadido videos cortos para este perfil.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
