"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { COUNTRIES } from "@/config/countries"

interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function CountryCombobox({ value, onChange, disabled }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCountry = COUNTRIES.find(
    (country) => country.code.toLowerCase() === value.toLowerCase()
  );

  // Custom filter for cmdk to handle accents and case-insensitivity
  const customFilter = (value: string, search: string): number => {
    // `value` is the `country.name` from `CommandItem`
    // `search` is what the user types in `CommandInput`
    if (normalizeString(value).includes(normalizeString(search))) {
      return 1; // Show item
    }
    return 0; // Hide item
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCountry ? (
            <div className="flex items-center">
               <span role="img" aria-label={selectedCountry.name} className="mr-2">{selectedCountry.emoji}</span>
               {selectedCountry.name}
            </div>
          ) : "Selecciona tu país"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={customFilter}>
          <CommandInput placeholder="Buscar país..." />
          <CommandEmpty>No se encontró el país.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name} // This is the value the filter will use
                  onSelect={() => {
                    onChange(country.code.toUpperCase());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toUpperCase() === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span role="img" aria-label={country.name} className="mr-2">{country.emoji}</span>
                  {country.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
