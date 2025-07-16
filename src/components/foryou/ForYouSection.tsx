
"use client";

import type { Figure } from "@/lib/types";
import { FigureListItem } from "../figures/FigureListItem";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ForYouSectionProps {
  title: string;
  figures: Figure[];
}

export function ForYouSection({
  title,
  figures,
}: ForYouSectionProps) {
  if (!figures || figures.length === 0) {
    return null;
  }

  return (
    <section className="w-full space-y-4">
      <div>
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {figures.map((figure, index) => (
            <CarouselItem key={index} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
              <div className="h-full">
                <FigureListItem figure={figure} cardStyle="playstore" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </section>
  );
}
