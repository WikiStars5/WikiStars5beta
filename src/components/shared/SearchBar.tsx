"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';


export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      // For now, let's assume a search page exists or handle client-side
      // router.push(`/search?q=${encodeURIComponent(query)}`);
      alert(`Searching for: ${query}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl items-center space-x-2">
      <Input
        type="text"
        placeholder="Search for a public figure..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base h-12"
      />
      <Button type="submit" size="lg" className="h-12">
        <Search className="mr-2 h-5 w-5" /> Search
      </Button>
    </form>
  );
}
