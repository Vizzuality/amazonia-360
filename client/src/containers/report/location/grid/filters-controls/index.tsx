import { useCallback } from "react";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function GridFiltersControls() {
  const t = useTranslations();
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
        {t("grid-sidebar-grid-filters-checkbox-selected-indicators")}
      </Label>
    </div>
  );
}
