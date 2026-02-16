"use client";

import { useMemo, useState } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuPlus, LuX } from "react-icons/lu";
import { LuInfo } from "react-icons/lu";

import { useMeta } from "@/lib/grid";
import { useScrollOnExpand } from "@/lib/hooks";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { H3Indicator } from "@/types/indicator";

import {
  useSyncGridDatasets,
  useSyncGridDatasetContinousSettings,
  useSyncGridSelectedDataset,
  useSyncLocation,
  useSyncGridDatasetCategoricalSettings,
} from "@/app/(frontend)/store";

import Info from "@/containers/info";
import GridIndicatorsItemCategorical from "@/containers/report/grid/list/categorical";
import GridIndicatorsItemContinous from "@/containers/report/grid/list/continous";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipArrow } from "@/components/ui/tooltip";

export default function GridIndicatorsItem(indicator: H3Indicator) {
  const [max4Open, setMax4Open] = useState(false);
  const t = useTranslations();

  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { META, queryMeta, queryMetaFromGeometry } = useMeta(GEOMETRY);

  const { isFetching: gridMetaIsFetching } = queryMeta;

  const { isFetching: gridMetaFromGeometryIsFetching } = queryMetaFromGeometry;

  const [, setGridDatasetContinousSettings] = useSyncGridDatasetContinousSettings();
  const [, setGridDatasetCategoricalSettings] = useSyncGridDatasetCategoricalSettings();
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset, setGridSelectedDataset] = useSyncGridSelectedDataset();

  const H3_INDICATOR = useMemo(() => {
    const m = META?.datasets.find((d) => d.var_name === indicator.resource.column);

    if (!m) return null;

    return {
      ...indicator,
      legend: m?.legend,
    };
  }, [META, indicator]);

  const open = gridDatasets?.includes(H3_INDICATOR?.resource.column ?? "");
  const scrollRef = useScrollOnExpand(!!open);

  const onOpenChange = (open: boolean) => {
    if (open && gridDatasets.length >= 4) {
      return;
    }

    setGridDatasets((prev) => {
      if (open && H3_INDICATOR?.resource.column) {
        if (!prev.length) {
          setGridSelectedDataset(H3_INDICATOR.resource.column);
        }
        return [...prev, H3_INDICATOR.resource.column];
      }

      const d = prev.filter((d) => d !== H3_INDICATOR?.resource.column);
      if (gridSelectedDataset === H3_INDICATOR?.resource.column) {
        setGridSelectedDataset(d?.[0] || null);
      }

      // Sync filters
      setGridDatasetContinousSettings((prev) => {
        if (!H3_INDICATOR?.resource.column) return prev;

        const f = { ...prev };
        delete f[H3_INDICATOR.resource.column];
        return f;
      });

      setGridDatasetCategoricalSettings((prev) => {
        if (!H3_INDICATOR?.resource.column) return prev;

        const f = { ...prev };
        delete f[H3_INDICATOR.resource.column];
        return f;
      });

      return d;
    });
  };

  if (!H3_INDICATOR) {
    return null;
  }

  return (
    <div ref={scrollRef as React.RefObject<HTMLDivElement | null>} className="space-y-1">
      <Collapsible
        open={open}
        onOpenChange={onOpenChange}
        className={cn({
          "relative rounded-lg": true,
          "bg-blue-50": open,
        })}
      >
        <div className="flex w-full items-start justify-between space-x-5">
          <Tooltip
            delayDuration={100}
            open={max4Open}
            onOpenChange={(o) => setMax4Open(o && gridDatasets.length >= 4)}
          >
            <TooltipTrigger asChild>
              <CollapsibleTrigger
                className="flex grow space-x-2.5 rounded-sm p-1.5 px-2 text-left text-sm font-medium text-gray-400 transition-colors duration-300 ease-in-out hover:bg-blue-50"
                onClick={() => setMax4Open(false)}
              >
                <h3 className="text-left text-sm font-medium text-gray-400">
                  {indicator.name} {!!indicator.unit && ` (${indicator.unit})`}
                </h3>
              </CollapsibleTrigger>
            </TooltipTrigger>

            {!open && gridDatasets.length >= 4 && (
              <TooltipPortal>
                <TooltipContent sideOffset={0} align="start" side="right">
                  {t("grid-sidebar-report-location-filters-alert-maximum-selected")}
                  <TooltipArrow />
                </TooltipContent>
              </TooltipPortal>
            )}
          </Tooltip>

          <div className="flex items-center justify-between space-x-1 p-1">
            <Tooltip delayDuration={100}>
              <Dialog>
                <TooltipTrigger asChild>
                  <DialogTrigger
                    className={cn("flex cursor-pointer items-center justify-center p-0.5")}
                  >
                    <LuInfo className="h-4 w-4 text-foreground" />
                  </DialogTrigger>
                </TooltipTrigger>
                <DialogContent className="max-w-2xl p-0">
                  <DialogTitle className="sr-only">{indicator.description_short}</DialogTitle>
                  <Info ids={[indicator.id]} />
                  <DialogClose />
                </DialogContent>
                <TooltipPortal>
                  <TooltipContent sideOffset={0} className="max-w-72">
                    {indicator.description_short}
                    <TooltipArrow />
                  </TooltipContent>
                </TooltipPortal>
              </Dialog>
            </Tooltip>

            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn({
                    "flex items-center justify-center rounded bg-blue-50 p-0.5 transition-colors hover:bg-blue-100": true,
                  })}
                  onClick={() => setMax4Open(false)}
                >
                  {!open && <LuPlus className="h-4 w-4 cursor-pointer text-primary" />}
                  {open && <LuX className="h-4 w-4 cursor-pointer text-primary" />}
                </CollapsibleTrigger>
              </TooltipTrigger>

              {!open && gridDatasets.length >= 4 && (
                <TooltipPortal>
                  <TooltipContent sideOffset={0}>
                    {t("grid-sidebar-report-location-filters-alert-maximum-selected")}
                    <TooltipArrow />
                  </TooltipContent>
                </TooltipPortal>
              )}
            </Tooltip>
          </div>
        </div>

        <CollapsibleContent className="p-2">
          {(gridMetaIsFetching || gridMetaFromGeometryIsFetching) && (
            <Skeleton className="h-[34px]" />
          )}

          <GridIndicatorsItemContinous {...indicator} />

          <GridIndicatorsItemCategorical {...indicator} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
