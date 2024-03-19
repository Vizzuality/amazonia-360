"use client";

import * as React from "react";

import { UseQueryResult } from "react-query";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { LuSearch, LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger } from "@/components/ui/popover";

export type Option = {
  label: string;
  value: string;
  key: string;
  sourceIndex: number;
};

export type SearchProps<T> = {
  value: string;
  open: boolean;
  options: T[];
  placeholder?: string;
  onChange: (e: string) => void;
  onSelect: (o: T | null) => void;
} & UseQueryResult;

export function Search<T extends Option>({
  value,
  open,
  options,
  placeholder,
  isFetching,
  isFetched,
  onChange,
  onSelect,
}: SearchProps<T>) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Popover>
      <PopoverTrigger ref={triggerRef} className="w-full relative">
        <LuSearch className="absolute top-1/2 left-6 -translate-y-1/2 h-8 w-8 text-blue-500" />
        <div
          className={cn(
            "flex w-full rounded-[40px] bg-transparent py-5 h-16 pl-16 text-sm bg-white items-center",
            !value && "text-gray-500",
          )}
        >
          {value || placeholder || "Search..."}
        </div>
      </PopoverTrigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={
            (triggerRef.current?.getBoundingClientRect()?.height || 0) * -1 ?? 0
          }
          className={cn(
            "z-50 w-popover-width border-0 rounded-[40px] bg-white overflow-hidden p-0 text-popover-foreground shadow-md outline-none",
          )}
        >
          <Command shouldFilter={false}>
            <div className="w-full relative" cmdk-input-wrapper="">
              <LuSearch className="absolute top-1/2 left-6 -translate-y-1/2 h-8 w-8 text-blue-500" />

              <CommandPrimitive.Input
                value={value}
                placeholder={placeholder ?? "Search..."}
                className={cn(
                  "flex w-full bg-transparent h-16 py-5 pl-16 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                )}
                onValueChange={(e) => {
                  onChange(e);
                }}
              />

              {value && (
                <button
                  type="button"
                  className="absolute top-1/2 right-4 -translate-y-1/2 h-4 w-4 hover:text-cyan-500 focus:outline-none"
                  onClick={() => {
                    onSelect(null);
                  }}
                >
                  <LuX className="text-current" />
                </button>
              )}
            </div>

            {open && !options.length && !!value && !isFetching && isFetched && (
              <p className="py-6 text-center text-sm">No results found.</p>
            )}

            {open && !!options.length && (
              <CommandGroup className="px-2 pb-5">
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    className="px-4"
                    onSelect={() => onSelect(o)}
                  >
                    {o.label} <span className="hidden">({o.value})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
