
"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from '@/lib/utils';

interface PaginationProps {
  hasPrevPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export function Pagination({ hasPrevPage, hasNextPage, startCursor, endCursor }: PaginationProps) {
  const pathname = usePathname();

  const prevPageUrl = `${pathname}?endBefore=${startCursor}`;
  const nextPageUrl = `${pathname}?startAfter=${endCursor}`;

  return (
    <UiPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={prevPageUrl}
            aria-disabled={!hasPrevPage}
            className={cn(!hasPrevPage && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href={nextPageUrl}
            aria-disabled={!hasNextPage}
            className={cn(!hasNextPage && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </UiPagination>
  );
}
