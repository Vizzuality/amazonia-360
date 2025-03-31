"use client";

import { useCallback, useMemo, useState } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { useMeta } from "@/lib/grid";
import { useGetDefaultIndicators, useGetH3Indicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import {
  selectedFiltersViewAtom,
  useSyncGridDatasets,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import { Search } from "@/components/ui/search";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipArrow } from "@/components/ui/tooltip";

type Option = {
  label: string;
  value: string;
  key: string;
  active?: boolean;
  sourceIndex: number;
};

export default function SearchC({ className }: { className?: string }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);
  const [gridDatasets, setSelectedDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset, setGridSelectedDataset] = useSyncGridSelectedDataset();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });
  const queryIndicators = useGetDefaultIndicators(undefined);

  const { data: H3IndicatorsData } = useGetH3Indicators();
  const { META } = useMeta(GEOMETRY);

  const INDICATORS = useMemo(() => {
    if (!H3IndicatorsData || !META) return [];

    return H3IndicatorsData.filter(
      (indicator) => !selectedFiltersView || gridDatasets.includes(indicator.resource.column), // Additional filtering
    ).map((indicator, index) => {
      const matchingDataset = META.datasets.find(
        (dataset) => dataset.var_name === indicator.resource.column,
      );

      return {
        label: matchingDataset?.label,
        value: matchingDataset?.var_name,
        key: matchingDataset?.var_name,
        sourceIndex: index,
        active: matchingDataset?.var_name && gridDatasets?.includes(matchingDataset.var_name),
      } as Option;
    });
  }, [H3IndicatorsData, META, gridDatasets, selectedFiltersView]);

  const OPTIONS = useMemo(() => {
    if (search) {
      return (
        INDICATORS?.filter(
          (o) =>
            o.label.toLowerCase().includes(search.toLowerCase()) ||
            o.key.toLowerCase().includes(search.toLowerCase()),
        ) || []
      );
    }
    return INDICATORS || [];
  }, [search, INDICATORS]);

  const handleSearch = useCallback(
    (value: string) => {
      setOpen(true);
      setSearch(value);
    },
    [setSearch],
  );

  const handleSelect = useCallback(
    (value: Option | null) => {
      if (!value) {
        setOpen(false);
        setSearch("");
        return;
      }

      if (!gridSelectedDataset) setGridSelectedDataset(value.value);

      if (gridDatasets.length < 4) {
        setSelectedDatasets((prev) => {
          if (!value.value) return prev;
          return [...prev, value.value];
        });
      }
    },
    [setSelectedDatasets, setGridSelectedDataset, gridDatasets, gridSelectedDataset],
  );

  return (
    <div className={cn({ "w-full py-2": true, [`${className}`]: !!className })}>
      <Search
        value={search}
        open={open}
        placeholder={`${t("grid-sidebar-report-location-filters-search")}...`}
        options={OPTIONS}
        {...queryIndicators}
        onChange={handleSearch}
        onSelect={handleSelect}
        size="sm"
      >
        {(o) => (
          <Tooltip delayDuration={0}>
            <TooltipTrigger className="w-full">
              <div
                className={cn({
                  "flex w-full cursor-pointer items-start justify-between gap-2 py-1 text-start text-xs":
                    true,
                  "pointer-events-none opacity-50": o.active,
                })}
                role="button"
                aria-disabled={false}
              >
                <span>{o.label}</span>
              </div>
            </TooltipTrigger>
            {gridDatasets.length >= 4 && (
              <TooltipPortal>
                <TooltipContent sideOffset={0}>
                  You can only select up to 4 layers
                  <TooltipArrow />
                </TooltipContent>
              </TooltipPortal>
            )}
          </Tooltip>
        )}
      </Search>
    </div>
  );
}
