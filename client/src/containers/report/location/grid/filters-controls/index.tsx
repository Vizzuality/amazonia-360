import { useCallback } from "react";

import { useAtom } from "jotai";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function GridFiltersControls() {
  const [gridDatasets] = useSyncGridDatasets();
  const [selectedFiltersView, setSelectedFiltersView] = useAtom(selectedFiltersViewAtom);

  const handleCheckedChange = useCallback(() => {
    setSelectedFiltersView((prev) => !prev);
  }, [setSelectedFiltersView]);

  return (
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
  );
}
