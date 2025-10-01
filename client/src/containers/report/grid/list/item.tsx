"use client";

import { useMemo, useState } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import numeral from "numeral";
import { LuPlus, LuX } from "react-icons/lu";
import { LuInfo } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import { useMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { H3Indicator } from "@/types/indicator";

import {
  useSyncGridDatasets,
  useSyncGridDatasetSettings,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import Info from "@/containers/info";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
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

  const [gridDatasetSettings, setGridDatasetSettings] = useSyncGridDatasetSettings();
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

  const continuosOptions = useMemo(() => {
    if (H3_INDICATOR?.legend?.legend_type === "continuous" && "stats" in H3_INDICATOR.legend) {
      const s = H3_INDICATOR.legend.stats.find((stat) => stat.level === 1);
      return s;
    }
  }, [H3_INDICATOR?.legend]);

  const categoricalOptions = useMemo(() => {
    if (H3_INDICATOR?.legend?.legend_type === "categorical" && "entries" in H3_INDICATOR.legend) {
      return H3_INDICATOR.legend.entries;
    }
  }, [H3_INDICATOR?.legend]);

  const continuosValue = useMemo(() => {
    if (continuosOptions) {
      if (gridDatasetSettings && H3_INDICATOR?.resource.column) {
        return (
          gridDatasetSettings[H3_INDICATOR.resource.column] || [
            continuosOptions.min || 0,
            continuosOptions.max || 100,
          ]
        );
      }

      return [continuosOptions.min || 0, continuosOptions.max || 100];
    }

    return [-Infinity, Infinity];
  }, [H3_INDICATOR?.resource.column, continuosOptions, gridDatasetSettings]);

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
      setGridDatasetSettings((prev) => {
        if (!H3_INDICATOR?.resource.column) return prev;

        const f = { ...prev };
        delete f[H3_INDICATOR.resource.column];
        return f;
      });

      return d;
    });
  };

  const onValueChange = (v: number[]) => {
    setGridDatasetSettings((prev) => {
      if (!H3_INDICATOR?.resource.column) return prev;
      return {
        ...prev,
        [H3_INDICATOR.resource.column]: v,
      };
    });
  };

  if (!H3_INDICATOR) {
    return null;
  }

  return (
    <div className="space-y-1">
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
                    "flex items-center justify-center rounded bg-blue-50 p-0.5 transition-colors hover:bg-blue-100":
                      true,
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

          {!(gridMetaIsFetching || gridMetaFromGeometryIsFetching) &&
            H3_INDICATOR?.legend?.legend_type === "continuous" &&
            continuosOptions && (
              <div className="space-y-2">
                <Slider
                  min={continuosOptions.min || 0}
                  max={continuosOptions.max || 100}
                  step={1}
                  value={continuosValue}
                  minStepsBetweenThumbs={1}
                  onValueChange={onValueChange}
                />

                <div className="flex justify-between gap-20">
                  <div className="relative">
                    <div className="pointer-events-none h-6 min-w-20 p-1 text-center text-sm text-foreground opacity-0">
                      {formatNumber(continuosValue[0] || continuosOptions.min || 0)}
                    </div>
                    <Input
                      value={formatNumber(continuosValue[0] ?? (continuosOptions.min || 0))}
                      type="text"
                      min={continuosOptions.min || 0}
                      max={continuosValue[1] ?? (continuosOptions.max || 100)}
                      onChange={(e) => {
                        const v = numeral(e.target.value).value();

                        if (typeof v === "number") {
                          onValueChange([v, continuosValue[1]]);
                        }
                      }}
                      onBlur={() => {
                        const v = continuosValue[0];
                        const max = continuosValue[1] || continuosOptions.max || 100;

                        if (typeof v === "number") {
                          if (v > max) {
                            onValueChange([max, max]);
                          } else {
                            onValueChange([v, max]);
                          }
                        }
                      }}
                      className="absolute left-0 top-0 h-full w-full min-w-20 bg-white p-1 text-center text-sm"
                    />
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none h-6 min-w-20 p-1 text-center text-sm text-foreground opacity-0">
                      {formatNumber(continuosValue[1] || continuosOptions.min || 0)}
                    </div>
                    <Input
                      value={formatNumber(continuosValue[1] ?? (continuosOptions.max || 0))}
                      type="text"
                      min={continuosValue[0] ?? (continuosOptions.min || 0)}
                      max={continuosOptions.max || 100}
                      onChange={(e) => {
                        const v = numeral(e.target.value).value();

                        if (typeof v === "number") {
                          onValueChange([continuosValue[0], v]);
                        }
                      }}
                      onBlur={() => {
                        const v = continuosValue[1];
                        const min = continuosValue[0] || continuosOptions.min || 0;
                        const max = continuosOptions.max || 100;

                        if (typeof v === "number") {
                          if (v < min) {
                            onValueChange([v, min]);
                          } else if (v > max) {
                            onValueChange([continuosValue[0], max]);
                          } else {
                            onValueChange([min, v]);
                          }
                        }
                      }}
                      className="absolute left-0 top-0 h-full w-full bg-white p-1 text-center text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

          {!(gridMetaIsFetching || gridMetaFromGeometryIsFetching) &&
            H3_INDICATOR?.legend?.legend_type === "categorical" &&
            categoricalOptions && (
              <div className="flex flex-col justify-between gap-1">
                {categoricalOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-1">
                    <Checkbox
                      // checked={fires.includes(+key)}
                      onCheckedChange={(checked) => {
                        console.info(H3_INDICATOR.resource.column, option, checked);

                        // setGridDatasetSettings({
                        //   ...gridDatasetSettings,
                        //   [indicator.var_name]: checked
                        //     ? [...gridDatasetSettings[indicator.var_name], key]
                        //     : gridDatasetSettings[indicator.var_name].filter((k) => k !== key),
                        // });
                      }}
                    />
                    <span className="text-xs text-gray-500">{option.label}</span>
                  </div>
                ))}
              </div>
            )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
