"use client";

import { useSetAtom } from "jotai";

import { gridPanelAtom, useSyncGridDatasets } from "@/app/store";

import GridFilters from "@/containers/report/location/grid/filters";
import SearchIndicators from "@/containers/report/location/grid/filters/search";
import GridFiltersControls from "@/containers/report/location/grid/filters-controls";
import GridClearFilters from "@/containers/report/location/grid/filters-controls/clear";

import { Button } from "@/components/ui/button";

export default function TabsFilters() {
  const setGridPanel = useSetAtom(gridPanelAtom);

  const [gridDatasets] = useSyncGridDatasets();

  return (
    <div className="relative h-full space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            Redefine your area of interest
          </h1>
          <GridClearFilters />
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          Add indicators to filter the grid cells and highlight areas that meet specific criteria.
          You can select a maximum 4 indicators.
        </p>
      </div>
      <SearchIndicators className="py-0" />

      <GridFiltersControls />

      <div className="space-y-5">
        <div className="relative h-full max-h-[calc(100vh_-_(64px_+_40px_+_310px))]">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2.5 bg-gradient-to-b from-white to-transparent" />
          <div className="h-full max-h-[calc(100vh_-_(64px_+_40px_+_310px_+_46px))] overflow-y-auto px-1 py-1">
            <GridFilters />
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
        </div>

        <Button
          onClick={() => setGridPanel("table")}
          variant="outline"
          className="w-full"
          disabled={!gridDatasets?.length}
        >
          View cells ranking
        </Button>
      </div>
    </div>
  );
}
