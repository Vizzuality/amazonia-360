"use client";

import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { UseQueryResult } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { LuLoader2, LuSearch, LuX } from "react-icons/lu";

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
} & UseQueryResult<unknown, unknown>;

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
  const [opened, setOpened] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Popover onOpenChange={setOpened} open={opened}>
      <PopoverTrigger ref={triggerRef} className="w-full relative">
        <LuSearch className="absolute top-1/2 left-6 -translate-y-1/2 h-8 w-8 text-blue-500 stroke-1" />
        <div
          className={cn(
            "flex w-full rounded-[32px] py-5 h-12 tall:2xl:h-16 pl-[70px] text-sm bg-white items-center",
            !value && "text-gray-500",
          )}
        >
          {value || placeholder || "Search..."}
        </div>

        <div className="absolute top-1/2 right-6 -translate-y-1/2">
          {isFetching && (
            <span className="h-4 w-4 animate-spin text-blue-500">
              <LuLoader2 className="text-current" />
            </span>
          )}
          {value && (
            <span
              role="button"
              className="h-6 w-6 p-1 hover:text-cyan-500 focus:outline-none block bg-secondary rounded-full"
              onClick={() => {
                onSelect(null);
              }}
            >
              <LuX className="text-current" />
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          updatePositionStrategy="always"
          sideOffset={
            (triggerRef.current?.getBoundingClientRect()?.height || 0) * -1 ?? 0
          }
          className={cn(
            "z-50 w-popover-width border-0 rounded-[32px] bg-white overflow-hidden p-0 text-popover-foreground shadow-md outline-none",
          )}
        >
          <Command shouldFilter={false}>
            <div className="w-full relative" cmdk-input-wrapper="">
              <LuSearch className="absolute top-1/2 left-6 -translate-y-1/2 h-8 w-8 text-blue-500 stroke-1" />

              <CommandPrimitive.Input
                value={value}
                placeholder={placeholder ?? "Search..."}
                className={cn(
                  "flex w-full bg-transparent h-12 tall:2xl:h-16 py-5 pl-[70px] text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                )}
                onValueChange={(e) => {
                  onChange(e);
                }}
              />

              <div className="absolute top-1/2 right-6 -translate-y-1/2 flex items-center space-x-2">
                {isFetching && (
                  <span className="h-4 w-4 animate-spin text-blue-500">
                    <LuLoader2 className="text-current" />
                  </span>
                )}
                {value && (
                  <span
                    role="button"
                    className="h-6 w-6 p-1 hover:text-cyan-500 focus:outline-none block bg-secondary rounded-full"
                    onClick={() => {
                      onSelect(null);
                    }}
                  >
                    <LuX className="text-current" />
                  </span>
                )}
              </div>
            </div>

            {open && !options.length && !!value && !isFetching && isFetched && (
              <p className="py-6 text-center text-sm">No results found.</p>
            )}

            {open && !!options.length && (
              <CommandGroup className="px-2 pb-5">
                {options.map((o) => (
                  <CommandItem
                    key={o.sourceIndex + o.key + o.value}
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
