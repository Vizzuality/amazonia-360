"use client";

import * as React from "react";

import { UseQueryResult } from "react-query";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type Option = {
  label: string;
  value: string;
  key: string;
  sourceIndex: number;
};

export type SearchProps<T> = {
  value: string;
  options: T[];
  placeholder?: string;
  onChange: (e: string) => void;
  onSelect: (o: T) => void;
} & UseQueryResult;

export function Search<T extends Option>({
  value,
  options,
  placeholder,
  isFetching,
  isFetched,
  onChange,
  onSelect,
}: SearchProps<T>) {
  return (
    <Popover>
      <PopoverTrigger className="w-full relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 opacity-50" />
        <div
          className={cn(
            "flex h-10 w-full rounded-md bg-transparent py-3 pl-8 text-sm border-b leading-[normal]",
            !value && "text-gray-500",
          )}
        >
          {value || placeholder || "Search..."}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-popover-width p-0 border-0",
          "data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[side=bottom]:slide-in-from-top-0 data-[side=left]:slide-in-from-right-0 data-[side=right]:slide-in-from-left-0 data-[side=top]:slide-in-from-bottom-0",
        )}
        sideOffset={-38}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={value}
            placeholder={placeholder ?? "Search..."}
            className="h-9"
            onValueChange={(e) => {
              onChange(e);
            }}
          />

          {!options.length && !!value && !isFetching && isFetched && (
            <p className="py-6 text-center text-sm">No results found.</p>
          )}

          {!!options.length && (
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  onSelect={() => onSelect(o)}
                >
                  {o.label} <span className="hidden">({o.value})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
