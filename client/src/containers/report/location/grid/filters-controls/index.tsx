"use client";

import { useCallback } from "react";

import { useAtom } from "jotai";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function GridFiltersControls() {
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const [selectedFiltersView, setSelectedFiltersView] = useAtom(selectedFiltersViewAtom);

  const handleCheckedChange = useCallback(() => {
    setSelectedFiltersView((prev) => !prev);
  }, [setSelectedFiltersView]);

  const handleClick = useCallback(() => {
    setSelectedFiltersView(false);
    setGridDatasets([]);
  }, [setGridDatasets, setSelectedFiltersView]);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center space-x-1">
        <Checkbox
          id="selected-filters"
          disabled={!gridDatasets.length}
          checked={selectedFiltersView}
          onCheckedChange={handleCheckedChange}
        />
        <Label htmlFor="selected-filters" className="text-start text-xs text-muted-foreground">
          View selected indicators only
        </Label>
      </div>
      <button
        type="button"
        disabled={!gridDatasets.length}
        className="cursor-pointer space-x-1 whitespace-nowrap text-end text-xs font-semibold text-primary transition-colors duration-500 ease-linear hover:underline"
        onClick={handleClick}
      >
        <span>Clear selection</span>
        <span>({gridDatasets.length})</span>
      </button>
    </div>
  );
}
