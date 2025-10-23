"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useMeta } from "@/lib/grid";
import { useGetDefaultIndicators, useGetH3Indicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import {
  useSyncGridDatasets,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/(frontend)/store";

import { Search } from "@/components/ui/search";
import { Switch } from "@/components/ui/switch";

type Option = Indicator & {
  label: string;
  value: string;
  key: string;
  active?: boolean;
  sourceIndex: number;
};

export default function SearchC({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gridDatasets, setSelectedDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset, setGridSelectedDataset] = useSyncGridSelectedDataset();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });
  const queryIndicators = useGetDefaultIndicators({ locale });

  const { data: H3IndicatorsData } = useGetH3Indicators({ locale });
  const { META } = useMeta(GEOMETRY);

  const INDICATORS = useMemo(() => {
    if (!H3IndicatorsData || !META) return [];

    return H3IndicatorsData.map((indicator, index) => {
      const matchingDataset = META.datasets.find(
        (dataset) => dataset.var_name === indicator.resource.column,
      );

      return {
        ...indicator,
        label: indicator.name ?? "",
        value: matchingDataset?.var_name ?? "",
        key: matchingDataset?.var_name ?? "",
        sourceIndex: index,
        active: matchingDataset?.var_name && gridDatasets?.includes(matchingDataset.var_name),
        group: {
          id: indicator.topic.id,
          label: indicator.topic.name,
        },
      } as Option;
    });
  }, [H3IndicatorsData, META, gridDatasets]);

  const OPTIONS = useMemo(() => {
    if (search) {
      return (
        INDICATORS?.filter(
          (o) =>
            o.key.toLowerCase().includes(search.toLowerCase()) ||
            o.label?.toLowerCase().includes(search.toLowerCase()) ||
            o.topic.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.subtopic.name?.toLowerCase().includes(search.toLowerCase()),
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
      const v = value?.value;

      if (!v) {
        setOpen(false);
        setSearch("");
        return;
      }

      if (!gridSelectedDataset) setGridSelectedDataset(v);

      setSelectedDatasets((prev) => {
        if (prev?.includes(v)) {
          return prev.filter((i) => i !== v);
        }

        if (gridDatasets.length < 4) {
          return [...(prev || []), v];
        }

        return prev;
      });
    },
    [setSelectedDatasets, setGridSelectedDataset, gridDatasets, gridSelectedDataset],
  );

  return (
    <div className={cn({ "w-full": true, [`${className}`]: !!className })}>
      <Search
        value={search}
        open={open}
        placeholder={`${t("grid-sidebar-report-location-filters-search")}...`}
        options={OPTIONS}
        {...queryIndicators}
        onChange={handleSearch}
        onSelect={handleSelect}
        size="sm"
        extra={
          gridDatasets.length >= 4 && (
            <div className="bg-amber-100 px-4 py-2 text-xs text-foreground">
              {t("grid-sidebar-report-location-filters-alert-maximum-selected")}
            </div>
          )
        }
      >
        {(o) => (
          <div
            className={cn({
              "flex w-full cursor-pointer items-start justify-between gap-2 py-1 text-start text-xs": true,
            })}
            role="button"
            aria-disabled={false}
          >
            <span>{o.label}</span>

            <Switch className="h-4 w-8" checked={o.active} />
          </div>
        )}
      </Search>
    </div>
  );
}
