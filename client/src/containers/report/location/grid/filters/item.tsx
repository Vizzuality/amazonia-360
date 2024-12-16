"use client";

import { useMemo } from "react";

import numeral from "numeral";
import { LuPlus, LuX } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import { cn } from "@/lib/utils";

import { DatasetMeta } from "@/types/generated/api.schemas";

import { useSyncGridDatasets, useSyncGridFilters } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export default function GridFiltersItem(dataset: DatasetMeta) {
  const [gridFilters, setGridFilters] = useSyncGridFilters();
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();

  const open = gridDatasets?.includes(dataset.var_name);

  const continousOptions = useMemo(() => {
    if (dataset.legend.legend_type === "continuous") {
      const s = dataset.legend.stats.find((stat) => stat.level === 1);
      return s;
    }
  }, [dataset.legend]);

  const categoricalOptions = useMemo(() => {
    if (dataset.legend.legend_type === "categorical") {
      return dataset.legend.entries;
    }
  }, [dataset.legend]);

  const continousValue = useMemo(() => {
    if (continousOptions) {
      if (gridFilters) {
        return (
          gridFilters[dataset.var_name] || [continousOptions.min || 0, continousOptions.max || 100]
        );
      }

      return [continousOptions.min || 0, continousOptions.max || 100];
    }

    return [-Infinity, Infinity];
  }, [dataset.var_name, continousOptions, gridFilters]);

  const onOpenChange = (open: boolean) => {
    setGridDatasets(
      open
        ? [...gridDatasets, dataset.var_name]
        : gridDatasets?.filter((d) => d !== dataset.var_name),
    );
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
          "relative rounded-lg px-3 py-2": true,
          "bg-blue-50": open,
        })}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">{dataset.label}</h3>

          <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-blue-50">
            {!open && <LuPlus className="h-5 w-5 text-primary" />}
            {open && <LuX className="h-5 w-5 text-primary" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="py-2">
          {dataset.legend.legend_type === "continuous" && continousOptions && (
            <div className="space-y-2">
              <Slider
                min={continousOptions.min || 0}
                max={continousOptions.max || 100}
                step={1}
                value={continousValue}
                minStepsBetweenThumbs={1}
                onValueChange={onValueChange}
              />

              <div className="flex justify-between gap-20">
                <div className="relative">
                  <div className="pointer-events-none h-6 min-w-20 p-1 text-center text-sm text-foreground opacity-0">
                    {formatNumber(continousValue[0] || continousOptions.min || 0)}
                  </div>
                  <Input
                    value={formatNumber(continousValue[0] ?? (continousOptions.min || 0))}
                    type="text"
                    min={continousOptions.min || 0}
                    max={continousValue[1] ?? (continousOptions.max || 100)}
                    onChange={(e) => {
                      const v = numeral(e.target.value).value();

                      if (typeof v === "number") {
                        onValueChange([v, continousValue[1]]);
                      }
                    }}
                    onBlur={() => {
                      const v = continousValue[0];
                      const max = continousValue[1] || continousOptions.max || 100;

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
                    {formatNumber(continousValue[1] || continousOptions.min || 0)}
                  </div>
                  <Input
                    value={formatNumber(continousValue[1] ?? (continousOptions.max || 0))}
                    type="text"
                    min={continousValue[0] ?? (continousOptions.min || 0)}
                    max={continousOptions.max || 100}
                    onChange={(e) => {
                      const v = numeral(e.target.value).value();

                      if (typeof v === "number") {
                        onValueChange([continousValue[0], v]);
                      }
                    }}
                    onBlur={() => {
                      const v = continousValue[1];
                      const min = continousValue[0] || continousOptions.min || 0;
                      const max = continousOptions.max || 100;

                      if (typeof v === "number") {
                        if (v < min) {
                          onValueChange([v, min]);
                        } else if (v > max) {
                          onValueChange([continousValue[0], max]);
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
