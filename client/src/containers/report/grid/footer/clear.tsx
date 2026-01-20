"use client";

import { useCallback, useEffect } from "react";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

import {
  useSyncGridDatasets,
  gridSelectedFiltersViewAtom,
  useSyncGridSelectedDataset,
} from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";

export default function GridClear() {
  const t = useTranslations();
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const setGridSelectedFiltersView = useSetAtom(gridSelectedFiltersViewAtom);
  const [, setGridSelectedDataset] = useSyncGridSelectedDataset();

  const handleClick = useCallback(() => {
    setGridSelectedFiltersView(false);
    setGridDatasets([]);
    setGridSelectedDataset(null);
  }, [setGridDatasets, setGridSelectedFiltersView, setGridSelectedDataset]);

  useEffect(() => {
    if (gridDatasets.length === 0) {
      setGridSelectedFiltersView(false);
      setGridSelectedDataset(null);
    }
  }, [gridDatasets, setGridSelectedFiltersView, setGridSelectedDataset]);

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
