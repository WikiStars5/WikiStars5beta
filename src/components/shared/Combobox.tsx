
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
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function Combobox({ 
  options, 
  value, 
  onValueChange,
  onSelect,
  placeholder = "Select an option...", 
  disabled,
  isLoading
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (currentValue: string) => {
    onSelect(currentValue);
    onValueChange(''); // Clear input after selection
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <PopoverTrigger asChild>
          <div className="w-full" role="combobox" aria-expanded={open}>
            <CommandInput 
              ref={inputRef}
              placeholder={placeholder}
              value={value}
              onValueChange={onValueChange}
              onFocus={() => setOpen(true)}
              disabled={isLoading || disabled}
              className="w-full"
            />
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
        >
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : (
              <>
                <CommandEmpty>No se encontraron opciones.</CommandEmpty>
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
                          "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  )
}
