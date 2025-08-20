"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import Image from "next/image"

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

export function CountryCombobox({ value, onChange, disabled }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCountry = COUNTRIES.find(
    (country) => country.code.toLowerCase() === value.toLowerCase()
  );

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
            <div className="flex items-center gap-2">
              <Image
                src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                alt={selectedCountry.name}
                width={20}
                height={15}
                className="w-5 h-auto"
              />
              {selectedCountry.name}
            </div>
          ) : "Selecciona tu país"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandEmpty>No se encontró el país.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={(currentValue) => {
                    const selected = COUNTRIES.find(
                      (c) => c.name.toLowerCase() === currentValue.toLowerCase()
                    );
                    if (selected) {
                      // Check if user is re-selecting the same country to clear it
                      if (selected.code === value) {
                        onChange("");
                      } else {
                        onChange(selected.code);
                      }
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toUpperCase() === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Image
                      src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                      alt={country.name}
                      width={20}
                      height={15}
                      className="mr-2 h-auto w-5"
                  />
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
