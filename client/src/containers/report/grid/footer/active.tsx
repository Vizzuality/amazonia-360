"use client";

import { useCallback } from "react";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/(frontend)/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function GridActive() {
  const t = useTranslations();
  const [gridDatasets] = useSyncGridDatasets();
  const [selectedFiltersView, setSelectedFiltersView] = useAtom(selectedFiltersViewAtom);

  const handleCheckedChange = useCallback(() => {
    setSelectedFiltersView((prev) => !prev);
  }, [setSelectedFiltersView]);

  return (
    <div className="group flex items-center space-x-2">
      <Checkbox
        id="selected-filters"
        disabled={!gridDatasets.length}
        checked={selectedFiltersView}
        onCheckedChange={handleCheckedChange}
      />
      <Label
        htmlFor="selected-filters"
        className="cursor-pointer text-start text-xs text-muted-foreground group-hover:underline"
      >
        {t("grid-sidebar-grid-filters-checkbox-selected-indicators")}
      </Label>
    </div>
  );
}
