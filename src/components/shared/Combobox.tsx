
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

interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  creatable?: boolean; // New prop
}

export function Combobox({ options, value, onChange, placeholder = "Select an option...", disabled, creatable = false }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = value ? options.find(
    (option) => option.value.toLowerCase() === value.toLowerCase()
  ) : null;

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setOpen(false);
    setSearch("");
  };

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

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
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
                {creatable && search.trim().length > 0 ? (
                    <CommandItem
                        onSelect={() => handleSelect(search)}
                        value={search}
                        className="cursor-pointer"
                    >
                    Crear "{search}"
                    </CommandItem>
                ) : "No se encontraron opciones."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
