"use client";

import { useTranslations } from "next-intl";
import { LuSearch } from "react-icons/lu";
import { useDebounceCallback } from "usehooks-ts";

import { Input } from "@/components/ui/input";

interface MyReportsSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const MyReportsSearch = ({ onSearchChange }: MyReportsSearchProps) => {
  const t = useTranslations();
  const debouncedOnSearchChange = useDebounceCallback(onSearchChange, 300);

  return (
    <div className="relative">
      <LuSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        placeholder={t("my-reports-search-placeholder")}
        onChange={(e) => debouncedOnSearchChange(e.target.value)}
        className="w-full bg-white pl-10"
      />
    </div>
  );
};
