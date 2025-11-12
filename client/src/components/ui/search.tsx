"use client";

import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { UseQueryResult } from "@tanstack/react-query";
import { group } from "@visx/vendor/d3-array";
import { Command as CommandPrimitive } from "cmdk";
import { useTranslations } from "next-intl";
import { LuLoader, LuSearch, LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverTrigger } from "@/components/ui/popover";

export type Option = {
  active?: boolean;
  label?: string;
  value: string;
  key: string;
  sourceIndex: number;
  group?: {
    id: number;
    label: string;
  };
};

export type SearchProps<T> = {
  value: string;
  open: boolean;
  options: T[];
  placeholder?: string;
  onChange: (e: string) => void;
  onSelect: (o: T | null) => void;
  children?: (option: Option) => React.ReactNode;
  extra?: React.ReactNode;
  size?: "sm" | "md";
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
  children,
  extra,
  size,
}: SearchProps<T>) {
  const t = useTranslations();
  const [opened, setOpened] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const OPTIONS = React.useMemo(() => {
    return Array.from(group(options, (d) => d.group?.label));
  }, [options]);

  return (
    <Popover onOpenChange={setOpened} open={opened}>
      <PopoverTrigger ref={triggerRef} className="relative w-full">
        <LuSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 stroke-1 text-black" />
        <div
          className={cn(
            "flex h-14 w-full items-center rounded-sm border border-input bg-white py-5 pl-10 text-sm",
            !value && "text-gray-500",
            size === "sm" && "h-10 py-3",
          )}
        >
          {value || placeholder || "Search..."}
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          {isFetching && (
            <span className="h-4 w-4 animate-spin text-blue-500">
              <LuLoader className="text-current" />
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
          sideOffset={(triggerRef.current?.getBoundingClientRect()?.height || 0) * -1}
          className={cn(
            "z-50 w-popover-width overflow-hidden rounded-sm border-0 bg-white p-0 text-popover-foreground shadow-md outline-none",
          )}
        >
          <Command shouldFilter={false}>
            <div className="relative w-full" cmdk-input-wrapper="">
              <LuSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 stroke-1 text-black" />

              <CommandPrimitive.Input
                value={value}
                placeholder={placeholder ?? "Search..."}
                className={cn(
                  "flex h-14 w-full items-center rounded-sm border border-input bg-white py-0 pl-10 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                  size === "sm" && "h-10",
                )}
                onValueChange={(e) => {
                  onChange(e);
                }}
              />

              <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center space-x-2">
                {isFetching && (
                  <span className="h-4 w-4 animate-spin text-blue-500">
                    <LuLoader className="text-current" />
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

            {open && !OPTIONS.length && !!value && !isFetching && isFetched && (
              <p className="py-6 text-center text-sm">{t("no-results-found")}.</p>
            )}

            {extra}

            <CommandList>
              {open &&
                !!OPTIONS.length &&
                OPTIONS.map((g) => (
                  <CommandGroup key={g[0]} heading={g[0]} className="px-2">
                    {g[1].map((o) => (
                      <CommandItem
                        key={o.sourceIndex + o.key + o.value}
                        value={o.value}
                        className="px-2"
                        onSelect={() => onSelect(o)}
                      >
                        {!children ? (
                          <>
                            {o.label}
                            <span className="hidden">({o.value})</span>
                          </>
                        ) : (
                          React.cloneElement(
                            children(o) as React.ReactElement<{
                              key: string;
                              value: string;
                              onSelect: () => void;
                            }>,
                            {
                              key: o.sourceIndex + o.key + o.value,
                              value: o.value,
                              onSelect: () => onSelect(o),
                            },
                          )
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
