"use client";

import { useTranslations } from "next-intl";
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

export const MyReportsSort = ({ sort, onSortChange }: MyReportsSortProps) => {
  const t = useTranslations();

  const SORT_OPTIONS = [
    { value: "-createdAt", label: t("my-reports-sort-created-newest") },
    { value: "createdAt", label: t("my-reports-sort-created-oldest") },
    { value: "-updatedAt", label: t("my-reports-sort-updated-newest") },
    { value: "updatedAt", label: t("my-reports-sort-updated-oldest") },
    { value: "title", label: t("my-reports-sort-title-az") },
    { value: "-title", label: t("my-reports-sort-title-za") },
  ];

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label || t("my-reports-sort");

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
