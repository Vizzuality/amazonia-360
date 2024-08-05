"use client";

import { useGetGridMeta } from "@/lib/grid";

import GridFiltersItem from "@/containers/grid/filters/item";

export default function GridFilters() {
  const { data: gridMetaData } = useGetGridMeta();

  return (
    <div>
      <h2 className="text-lg font-medium">Filters</h2>

      {gridMetaData &&
        gridMetaData.datasets.map((dataset) => (
          <GridFiltersItem key={dataset.var_name} {...dataset} />
        ))}
    </div>
  );
}
