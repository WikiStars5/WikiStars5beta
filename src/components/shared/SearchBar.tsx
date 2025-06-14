
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Loader2, ImageOff, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Figure } from '@/lib/types';
import { searchFiguresByName } from '@/app/actions/searchFiguresAction';

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        if (searchTerm.trim().length === 0) {
            setIsDropdownOpen(false);
        } else if (searchTerm.trim().length > 0) {
            setIsDropdownOpen(true); 
        }
        return;
      }
      setIsLoading(true);
      setIsDropdownOpen(true);
      try {
        const figures = await searchFiguresByName(searchTerm);
        setResults(figures);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300), 
    []
  );

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsLoading(false);
      setIsDropdownOpen(false);
      return;
    }
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const handleResultClick = () => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar una figura pública..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { 
            if (query.trim().length > 0) setIsDropdownOpen(true);
          }}
          className="text-base h-12 flex-grow pl-10 pr-10 rounded-md shadow-sm border-primary focus:ring-2 focus:ring-primary/50"
        />
        {isLoading && query.length >= 2 && (
           <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {!isLoading && query.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      {isDropdownOpen && query.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {isLoading && query.trim().length >=2 && (
            <div className="p-4 text-sm text-center text-muted-foreground">Buscando...</div>
          )}
          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-4 text-sm text-center text-muted-foreground">No se encontraron figuras para "{query}".</div>
          )}
          {!isLoading && query.trim().length < 2 && (
             <div className="p-4 text-sm text-center text-muted-foreground">Por favor, escribe al menos 2 caracteres.</div>
          )}
          {!isLoading && results.length > 0 && (
            <ul className="divide-y divide-border">
              {results.map((figure) => (
                <li key={figure.id}>
                  <Link
                    href={`/figures/${figure.id}`}
                    onClick={handleResultClick}
                    className="flex items-center p-3 hover:bg-muted transition-colors duration-150 ease-in-out"
                  >
                    <div className="flex-shrink-0 mr-3">
                      {figure.photoUrl ? (
                        <Image
                          src={figure.photoUrl}
                          alt={figure.name}
                          width={40}
                          height={50}
                          className="rounded-md object-cover aspect-[4/5]"
                        />
                      ) : (
                        <div className="w-10 h-[50px] bg-muted rounded-md flex items-center justify-center">
                          <ImageOff className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-sm text-foreground">{figure.name}</p>
                      {figure.description && (
                        <p className="text-xs text-muted-foreground truncate">{figure.description}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

