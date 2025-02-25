"use client";

import { useMemo } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import numeral from "numeral";
import { LuPlus, LuX } from "react-icons/lu";
import { LuInfo } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import { cn } from "@/lib/utils";

import { H3Indicator } from "@/app/local-api/indicators/route";
import { useSyncGridDatasets, useSyncGridFilters, useSyncGridSelectedDataset } from "@/app/store";

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
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipArrow } from "@/components/ui/tooltip";

export default function GridFiltersItem(dataset: H3Indicator) {
  const [gridFilters, setGridFilters] = useSyncGridFilters();
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset, setGridSelectedDataset] = useSyncGridSelectedDataset();

  const open = gridDatasets?.includes(dataset.var_name);

  const continuosOptions = useMemo(() => {
    if (dataset.legend?.legend_type === "continuous") {
      const s = dataset.legend.stats.find((stat) => stat.level === 1);
      return s;
    }
  }, [dataset.legend]);

  const categoricalOptions = useMemo(() => {
    if (dataset.legend.legend_type === "categorical") {
      return dataset.legend.entries;
    }
  }, [dataset.legend]);

  const continuosValue = useMemo(() => {
    if (continuosOptions) {
      if (gridFilters) {
        return (
          gridFilters[dataset.var_name] || [continuosOptions.min || 0, continuosOptions.max || 100]
        );
      }

      return [continuosOptions.min || 0, continuosOptions.max || 100];
    }

    return [-Infinity, Infinity];
  }, [dataset.var_name, continuosOptions, gridFilters]);

  const onOpenChange = (open: boolean) => {
    setGridDatasets((prev) => {
      if (open) {
        if (!prev.length) {
          setGridSelectedDataset(dataset.var_name);
        }
        return [...prev, dataset.var_name];
      }

      const d = prev.filter((d) => d !== dataset.var_name);
      if (gridSelectedDataset === dataset.var_name) {
        setGridSelectedDataset(d?.[0] || null);
      }

      // Sync filters
      setGridFilters((prev) => {
        const f = { ...prev };
        delete f[dataset.var_name];
        return f;
      });
      return d;
    });
  };

  const onValueChange = (v: number[]) => {
    setGridFilters({
      ...gridFilters,
      [dataset.var_name]: v,
    });
  };

  // const onValueChangeDebounced = useDebounce(onValueChange, 100);

  return (
    <div key={dataset.var_name} className="space-y-1">
      <Collapsible
        open={open}
        onOpenChange={onOpenChange}
        className={cn({
          "group relative rounded-lg px-3 py-2 text-left transition-colors hover:bg-blue-50": true,
          "bg-blue-50": open,
        })}
        disabled={gridDatasets.length >= 5}
      >
        <div className="flex w-full items-start justify-between space-x-5">
          <CollapsibleTrigger>
            <h3 className="text-left text-sm font-medium text-gray-400">
              {dataset.name_en} {!!dataset.unit_en && ` (${dataset.unit_en})`}
            </h3>
          </CollapsibleTrigger>

          <div className="flex items-center justify-between space-x-1">
            <Tooltip delayDuration={100}>
              <Dialog>
                <TooltipTrigger asChild>
                  <DialogTrigger
                    className={cn("flex cursor-pointer items-center justify-center p-0.5")}
                  >
                    <LuInfo className="h-4 w-4 text-foreground" />
                  </DialogTrigger>
                </TooltipTrigger>
                <DialogContent className="p-0">
                  <DialogTitle className="sr-only">{dataset.description_short_en}</DialogTitle>
                  <div className="p-4">
                    <p>{!!dataset.description_en ? dataset.description_en : "Data coming soon"}</p>
                  </div>
                  <DialogClose />
                </DialogContent>
                <TooltipPortal>
                  <TooltipContent sideOffset={0}>
                    {dataset.description_short_en}
                    <TooltipArrow />
                  </TooltipContent>
                </TooltipPortal>
              </Dialog>
            </Tooltip>

            <CollapsibleTrigger
              className={cn({
                "flex items-center justify-center rounded bg-blue-50 p-0.5 transition-colors hover:bg-blue-100":
                  true,
                "group-hover:bg-blue-100": !open,
              })}
            >
              {!open && <LuPlus className="h-4 w-4 cursor-pointer text-primary" />}
              {open && <LuX className="h-4 w-4 cursor-pointer text-primary" />}
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="py-2">
          {dataset.legend.legend_type === "continuous" && continuosOptions && (
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

          {dataset.legend.legend_type === "categorical" && categoricalOptions && (
            <div className="flex flex-col justify-between gap-1">
              {categoricalOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-1">
                  <Checkbox
                    // checked={fires.includes(+key)}
                    onCheckedChange={(checked) => {
                      console.info(dataset.var_name, option, checked);

                      // setGridFilters({
                      //   ...gridFilters,
                      //   [dataset.var_name]: checked
                      //     ? [...gridFilters[dataset.var_name], key]
                      //     : gridFilters[dataset.var_name].filter((k) => k !== key),
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
