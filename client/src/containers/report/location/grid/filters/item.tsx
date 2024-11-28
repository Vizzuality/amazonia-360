"use client";

import { useMemo } from "react";

import { LuPlus, LuX } from "react-icons/lu";

import { formatNumberUnit } from "@/lib/formats";
import { cn } from "@/lib/utils";

import { DatasetMeta } from "@/types/generated/api.schemas";

import { useSyncGridDatasets, useSyncGridFilters } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  const continuousValue = useMemo(() => {
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
    <div key={dataset.var_name} className="space-y-2">
      <Collapsible
        open={open}
        onOpenChange={onOpenChange}
        className={cn({
          "rounded-2xl border border-blue-50 px-3 py-1.5": true,
        })}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{dataset.label}</h3>

          {!open && <LuPlus className="h-5 w-5 text-primary" />}
          {open && <LuX className="h-5 w-5 text-primary" />}
        </CollapsibleTrigger>

        <CollapsibleContent className="py-2">
          {dataset.legend.legend_type === "continuous" && continousOptions && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">
                  {formatNumberUnit(continousOptions.min)}
                </span>
                <span className="float-right text-xs text-gray-500">
                  {formatNumberUnit(continousOptions.max)}
                </span>
              </div>

              <Slider
                min={continousOptions.min || 0}
                max={continousOptions.max || 100}
                step={1}
                defaultValue={continuousValue}
                minStepsBetweenThumbs={1}
                onValueChange={onValueChange}
              />
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
