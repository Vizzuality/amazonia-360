"use client";

import { LuCheck, LuChevronDown } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

interface MyReportsSortProps {
  sort: string;
  onSortChange: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Created date (newest)" },
  { value: "createdAt", label: "Created date (oldest)" },
  { value: "-updatedAt", label: "Last updated (newest)" },
  { value: "updatedAt", label: "Last updated (oldest)" },
  { value: "title", label: "Title (A-Z)" },
  { value: "-title", label: "Title (Z-A)" },
];

export const MyReportsSort = ({ sort, onSortChange }: MyReportsSortProps) => {
  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label || "Sort";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <span>{currentSortLabel}</span>
          <LuChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <span>{option.label}</span>
              {sort === option.value && <LuCheck className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
