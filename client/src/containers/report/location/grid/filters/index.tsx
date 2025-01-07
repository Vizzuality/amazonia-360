"use client";

import { useAtom } from "jotai";

import { useGetGridMeta } from "@/lib/grid";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/store";

import GridFiltersItem from "./item";

export default function GridFilters() {
  const [gridDatasets] = useSyncGridDatasets();
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);

  const { data: gridMetaData } = useGetGridMeta({
    select: (data) =>
      selectedFiltersView
        ? data.datasets.filter((dataset) => gridDatasets.includes(dataset.var_name))
        : data.datasets,
  });

  return (
    <div className="space-y-1">
      {gridMetaData?.map((dataset) => <GridFiltersItem key={dataset.var_name} {...dataset} />)}
    </div>
  );
}
