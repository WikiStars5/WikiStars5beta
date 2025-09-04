
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ImageOff, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Figure } from '@/lib/types';
import { searchFiguresByName } from '@/app/actions/searchFiguresAction';
import { cn, correctMalformedUrl } from '@/lib/utils';

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
  onResultClick?: (figure: Figure) => void;
}

export function SearchBar({ 
  initialQuery = '', 
  className,
  onResultClick
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (initialQuery.trim().length >= 2) {
      debouncedSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

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

  const handleResultItemClick = (figure: Figure) => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
    if (onResultClick) {
      onResultClick(figure);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus(); 
  };

  return (
    <div className={cn("relative w-full", className)} ref={searchContainerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar en WikiStars5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { 
            if (query.trim().length > 0) setIsDropdownOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!searchContainerRef.current?.contains(document.activeElement)) {
                setIsDropdownOpen(false);
              }
            }, 100);
          }}
          className="text-sm h-9 flex-grow pl-10 pr-10 rounded-full shadow-sm border-none bg-muted focus:ring-1 focus:ring-primary/50"
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
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {isDropdownOpen && query.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {isLoading && query.trim().length >=2 && (
            <div className="p-3 text-xs text-center text-muted-foreground">Buscando...</div>
          )}
          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-3 text-xs text-center text-muted-foreground">No se encontraron figuras para "{query}".</div>
          )}
          {!isLoading && query.trim().length < 2 && (
             <div className="p-3 text-xs text-center text-muted-foreground">Escribe al menos 2 caracteres.</div>
          )}
          {!isLoading && results.length > 0 && (
            <ul className="divide-y divide-border">
              {results.map((figure) => (
                <li key={figure.id}>
                  {onResultClick ? (
                     <button
                      onClick={() => handleResultItemClick(figure)}
                      className="w-full flex items-center p-2 hover:bg-muted transition-colors duration-150 ease-in-out text-left"
                    >
                      <div className="flex-shrink-0 mr-2">
                      {figure.photoUrl ? (
                        <Image
                          src={correctMalformedUrl(figure.photoUrl)}
                          alt={figure.name}
                          width={32}
                          height={40}
                          className="rounded-sm object-cover aspect-[4/5]"
                          data-ai-hint="thumbnail person"
                        />
                      ) : (
                        <div className="w-8 h-10 bg-muted rounded-sm flex items-center justify-center" data-ai-hint="placeholder icon">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{figure.name}</p>
                      {figure.description && (
                        <p className="text-xs text-muted-foreground truncate">{figure.description}</p>
                      )}
                    </div>
                     </button>
                  ) : (
                  <Link
                    href={`/figures/${figure.id}`}
                    onClick={() => handleResultItemClick(figure)}
                    className="flex items-center p-2 hover:bg-muted transition-colors duration-150 ease-in-out"
                  >
                    <div className="flex-shrink-0 mr-2">
                      {figure.photoUrl ? (
                        <Image
                          src={correctMalformedUrl(figure.photoUrl)}
                          alt={figure.name}
                          width={32}
                          height={40}
                          className="rounded-sm object-cover aspect-[4/5]"
                          data-ai-hint="thumbnail person"
                        />
                      ) : (
                        <div className="w-8 h-10 bg-muted rounded-sm flex items-center justify-center" data-ai-hint="placeholder icon">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{figure.name}</p>
                      {figure.description && (
                        <p className="text-xs text-muted-foreground truncate">{figure.description}</p>
                      )}
                    </div>
                  </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
