"use client";

import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { UseQueryResult } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { LuLoader2, LuSearch, LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
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
      <PopoverTrigger ref={triggerRef} className="relative w-full">
        <LuSearch className="absolute left-6 top-1/2 h-8 w-8 -translate-y-1/2 stroke-1 text-blue-500" />
        <div
          className={cn(
            "flex h-12 w-full items-center rounded-[32px] bg-white py-5 pl-[70px] text-sm tall:2xl:h-16",
            !value && "text-gray-500",
          )}
        >
          {value || placeholder || "Search..."}
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          {isFetching && (
            <span className="h-4 w-4 animate-spin text-blue-500">
              <LuLoader2 className="text-current" />
            </span>
          )}
          {value && (
            <span
              role="button"
              className="block h-6 w-6 rounded-full bg-secondary p-1 hover:text-cyan-500 focus:outline-none"
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
          sideOffset={(triggerRef.current?.getBoundingClientRect()?.height || 0) * -1 ?? 0}
          className={cn(
            "z-50 w-popover-width overflow-hidden rounded-[32px] border-0 bg-white p-0 text-popover-foreground shadow-md outline-none",
          )}
        >
          <Command shouldFilter={false}>
            <div className="relative w-full" cmdk-input-wrapper="">
              <LuSearch className="absolute left-6 top-1/2 h-8 w-8 -translate-y-1/2 stroke-1 text-blue-500" />

              <CommandPrimitive.Input
                value={value}
                placeholder={placeholder ?? "Search..."}
                className={cn(
                  "flex h-12 w-full bg-transparent py-5 pl-[70px] text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 tall:2xl:h-16",
                )}
                onValueChange={(e) => {
                  onChange(e);
                }}
              />

              <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center space-x-2">
                {isFetching && (
                  <span className="h-4 w-4 animate-spin text-blue-500">
                    <LuLoader2 className="text-current" />
                  </span>
                )}
                {value && (
                  <span
                    role="button"
                    className="block h-6 w-6 rounded-full bg-secondary p-1 hover:text-cyan-500 focus:outline-none"
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

            <CommandList>
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
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
