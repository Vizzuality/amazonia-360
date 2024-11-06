"use client";

import { useGetGridMeta } from "@/lib/grid";

import GridFiltersItem from "@/containers/report/location/filters/item";

export default function GridFilters() {
  const { data: gridMetaData } = useGetGridMeta();

  return (
    <div className="space-y-2">
      {gridMetaData?.datasets?.map((dataset) => (
        <GridFiltersItem key={dataset.var_name} {...dataset} />
      ))}
    </div>
  );
}
