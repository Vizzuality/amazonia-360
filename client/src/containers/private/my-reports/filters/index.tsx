"use client";
import { MyReportsSearch } from "@/containers/private/my-reports/filters/search";
import { MyReportsSort } from "@/containers/private/my-reports/filters/sort";

interface MyReportsSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

export const MyReportsFilters = ({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: MyReportsSearchProps) => {
  return (
    <section className="flex items-center justify-between gap-4">
      <MyReportsSearch search={search} onSearchChange={onSearchChange} />
      <MyReportsSort sort={sort} onSortChange={onSortChange} />
    </section>
  );
};
