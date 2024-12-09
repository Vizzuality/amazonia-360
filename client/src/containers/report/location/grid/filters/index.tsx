"use client";

import { useGetGridMeta } from "@/lib/grid";

import GridFiltersItem from "./item";

export default function GridFilters() {
  const { data: gridMetaData } = useGetGridMeta();

  return (
    <div className="space-y-1">
      {gridMetaData?.datasets?.map((dataset) => (
        <GridFiltersItem key={dataset.var_name} {...dataset} />
      ))}
    </div>
  );
}
