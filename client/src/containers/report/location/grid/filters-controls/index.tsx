"use client";

import { useCallback } from "react";

import { useSetAtom } from "jotai";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function GridFiltersControls() {
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const setSelectedFiltersView = useSetAtom(selectedFiltersViewAtom);

  const handleFiltersView = useCallback(() => {
    setSelectedFiltersView((prev) => !prev);
  }, [setSelectedFiltersView]);

  const handleClick = useCallback(() => {
    setGridDatasets([]);
  }, [setGridDatasets]);

  return (
    <div className="flex items-center justify-between">
      <button className="flex items-center space-x-1" type="button" onClick={handleFiltersView}>
        <Checkbox id="selected-filters" />
        <Label htmlFor="selected-filters" className="text-xs text-muted-foreground">
          View selected indicators only
        </Label>
      </button>
      <button
        type="button"
        disabled={!gridDatasets.length}
        className="space-x-1 text-xs font-semibold text-primary"
        onClick={handleClick}
      >
        <span>Clear selection</span>
        <span>({gridDatasets.length})</span>
      </button>
    </div>
  );
}
