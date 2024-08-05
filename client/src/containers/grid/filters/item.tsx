"use client";

import { useMemo } from "react";

import { DatasetMeta } from "@/types/generated/api.schemas";

import { useSyncGridFilters } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export default function GridFiltersItem(dataset: DatasetMeta) {
  const [gridFilters, setGridFilters] = useSyncGridFilters();

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

  return (
    <div key={dataset.var_name} className="space-y-2">
      <h3 className="text-sm font-medium mt-4">{dataset.label}</h3>

      {dataset.legend.legend_type === "continuous" && continousOptions && (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">
              {continousOptions.min}
            </span>
            <span className="text-xs text-gray-500 float-right">
              {continousOptions.max}
            </span>
          </div>

          <Slider
            min={continousOptions.min || 0}
            max={continousOptions.max || 100}
            step={1}
            defaultValue={[
              continousOptions.min || 0,
              continousOptions.max || 100,
            ]}
            // value={dataset.legend.range}
            minStepsBetweenThumbs={1}
            onValueChange={(v) => {
              setGridFilters({
                ...gridFilters,
                [dataset.var_name]: v,
              });
            }}
          />
        </div>
      )}

      {dataset.legend.legend_type === "categorical" && categoricalOptions && (
        <div className="flex flex-col justify-between gap-1">
          {categoricalOptions.map((option) => (
            <div key={option.value} className="flex space-x-1 items-center">
              <Checkbox
                // checked={fires.includes(+key)}
                onCheckedChange={(checked) => {
                  console.log(dataset.var_name, option, checked);

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
    </div>
  );
}
