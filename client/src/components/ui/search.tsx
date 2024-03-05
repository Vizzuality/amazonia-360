"use client";

import * as React from "react";

import { UseQueryResult } from "react-query";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

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
  onChange,
  onSelect,
}: SearchProps<T>) {
  return (
    <Command shouldFilter={false}>
      <CommandInput
        value={value}
        placeholder={placeholder ?? "Search..."}
        className="h-9"
        onValueChange={(e) => {
          onChange(e);
        }}
      />

      {!options.length && !!value && (
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
              {o.label}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </Command>
  );
}
