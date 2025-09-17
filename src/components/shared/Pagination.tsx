
"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from '@/lib/utils';


interface PaginationProps {
  currentPage: number;
  totalPages: number;
  endCursor: string | null;
}

// Helper to generate the page numbers for the pagination component
function generatePagination(currentPage: number, totalPages: number): (number | '...')[] {
    // If there are 7 or less pages, show all of them
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // If the current page is among the first 3 pages
    // Show the first 4, an ellipsis, and the last page. e.g., 1 2 3 4 ... 10
    if (currentPage <= 3) {
        return [1, 2, 3, 4, '...', totalPages];
    }

    // If the current page is among the last 3 pages
    // Show the first page, an ellipsis, and the last 4 pages. e.g., 1 ... 7 8 9 10
    if (currentPage >= totalPages - 2) {
        return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    // If the current page is somewhere in the middle
    // Show the first page, an ellipsis, the current page and its neighbors, another ellipsis, and the last page. e.g., 1 ... 4 5 6 ... 10
    return [
        1,
        '...',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        '...',
        totalPages,
    ];
}


export function Pagination({ currentPage, totalPages, endCursor }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // This function now needs to handle the 'startAfter' cursor for pages > 1
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());

    // For the next page link, we use the endCursor from the current page's data
    if (pageNumber > currentPage && endCursor) {
        params.set('startAfter', endCursor);
    } else if (pageNumber < currentPage) {
        // Going back is complex without tracking all previous cursors.
        // A simple approach is to remove startAfter, which restarts from the beginning for that page number.
        // This is not perfectly efficient but works for "Go to page X".
        params.delete('startAfter'); 
    }
     if (pageNumber === 1) {
        params.delete('startAfter');
    }

    return `${pathname}?${params.toString()}`;
  };

  const allPages = generatePagination(currentPage, totalPages);
  
  // For now, we can only reliably link to the next page. 
  // "Previous" and direct number links are disabled as it would require a more complex state management.
  // We'll just build a simple Next/Previous for now.
  const prevPageParams = new URLSearchParams(searchParams);
  prevPageParams.set('page', (currentPage - 1).toString());
  prevPageParams.delete('startAfter'); // This will have to re-query from the start
  const prevPageUrl = `${pathname}?${prevPageParams.toString()}`;

  const nextPageParams = new URLSearchParams(searchParams);
  nextPageParams.set('page', (currentPage + 1).toString());
  if (endCursor) {
      nextPageParams.set('startAfter', endCursor);
  }
  const nextPageUrl = `${pathname}?${nextPageParams.toString()}`;


  return (
    <UiPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={prevPageUrl}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        
        {/* The numeric display part remains for visual feedback */}
        {allPages.map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={createPageURL(page)}
                isActive={currentPage === page}
                // Disabling direct number links for now as they are not efficient without storing all cursors
                className={typeof page === 'number' && page > 1 ? "pointer-events-none opacity-50" : ""}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={nextPageUrl}
            aria-disabled={currentPage >= totalPages || !endCursor}
            className={currentPage >= totalPages || !endCursor ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </UiPagination>
  );
}
