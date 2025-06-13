
"use client";

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MobileSearchButton() {
  const { toast } = useToast();

  const handleSearchClick = () => {
    toast({
      title: "Search Not Implemented",
      description: "Mobile search will be available soon. Please use the search bar on the homepage.",
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="md:hidden" 
      onClick={handleSearchClick}
      aria-label="Search (placeholder)"
    >
      <Search className="h-5 w-5" />
      <span className="sr-only">Search</span>
    </Button>
  );
}
