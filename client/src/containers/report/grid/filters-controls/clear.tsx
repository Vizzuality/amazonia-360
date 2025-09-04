import { useCallback, useEffect } from "react";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import {
  useSyncGridDatasets,
  selectedFiltersViewAtom,
  useSyncGridSelectedDataset,
} from "@/app/store";

import { Button } from "@/components/ui/button";

export default function GridClearFilters() {
  const t = useTranslations();
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const setSelectedFiltersView = useSetAtom(selectedFiltersViewAtom);
  const [, setGridSelectedDataset] = useSyncGridSelectedDataset();

  const handleClick = useCallback(() => {
    setSelectedFiltersView(false);
    setGridDatasets([]);
    setGridSelectedDataset(null);
  }, [setGridDatasets, setSelectedFiltersView, setGridSelectedDataset]);

  useEffect(() => {
    if (gridDatasets.length === 0) {
      setSelectedFiltersView(false);
      setGridSelectedDataset(null);
    }
  }, [gridDatasets, setSelectedFiltersView, setGridSelectedDataset]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={!gridDatasets.length}
      className="space-x-1"
      onClick={handleClick}
    >
      <span>{t("grid-sidebar-grid-filters-button-clear-selection")}</span>
      <span>({gridDatasets.length})</span>
    </Button>
  );
}
