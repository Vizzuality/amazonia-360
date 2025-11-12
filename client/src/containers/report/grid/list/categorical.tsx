"use client";

import { useMemo } from "react";

import { useMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { H3Indicator } from "@/types/indicator";

import { useSyncGridDatasetCategoricalSettings, useSyncLocation } from "@/app/(frontend)/store";

import { Toggle } from "@/components/ui/toggle";

export default function GridIndicatorsItemCategorical(indicator: H3Indicator) {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { META, queryMeta, queryMetaFromGeometry } = useMeta(GEOMETRY);

  const { isFetching: gridMetaIsFetching } = queryMeta;

  const { isFetching: gridMetaFromGeometryIsFetching } = queryMetaFromGeometry;

  const [gridDatasetCategoricalSettings, setGridDatasetCategoricalSettings] =
    useSyncGridDatasetCategoricalSettings();

  const H3_INDICATOR = useMemo(() => {
    const m = META?.datasets.find((d) => d.var_name === indicator.resource.column);

    if (!m) return null;

    return {
      ...indicator,
      legend: m?.legend,
    };
  }, [META, indicator]);

  const categoricalOptions = useMemo(() => {
    const legend = H3_INDICATOR?.legend;
    if (legend?.legend_type === "categorical" && "entries" in legend) {
      return legend.entries;
    }
  }, [H3_INDICATOR?.legend]);

  const categoricalValue = useMemo(() => {
    const column = H3_INDICATOR?.resource.column;
    if (categoricalOptions) {
      if (gridDatasetCategoricalSettings && column && gridDatasetCategoricalSettings[column]) {
        return gridDatasetCategoricalSettings[column] || [];
      }

      return undefined;
    }

    return [];
  }, [H3_INDICATOR?.resource.column, categoricalOptions, gridDatasetCategoricalSettings]);

  if (!H3_INDICATOR) {
    return null;
  }

  return (
    <>
      {!(gridMetaIsFetching || gridMetaFromGeometryIsFetching) &&
        H3_INDICATOR?.legend?.legend_type === "categorical" &&
        categoricalOptions && (
          <div className="flex flex-wrap gap-1">
            <Toggle
              variant="outline"
              size="xs"
              pressed={!categoricalValue}
              onPressedChange={() => {
                if (!H3_INDICATOR?.resource.column) return;

                setGridDatasetCategoricalSettings((prev) => ({
                  ...prev,
                  [H3_INDICATOR.resource.column]: undefined,
                }));
              }}
            >
              All
            </Toggle>
            {categoricalOptions.map((option) => (
              <Toggle
                key={option.value}
                variant="outline"
                size="xs"
                pressed={categoricalValue?.includes(option.value) ?? false}
                onPressedChange={(pressed) => {
                  if (!H3_INDICATOR?.resource.column) return;

                  if (pressed) {
                    // Add
                    setGridDatasetCategoricalSettings((prev) => ({
                      ...prev,
                      [H3_INDICATOR.resource.column]: [...(categoricalValue ?? []), option.value],
                    }));
                  } else {
                    // Remove
                    setGridDatasetCategoricalSettings((prev) => {
                      const v = prev?.[H3_INDICATOR!.resource.column] ?? categoricalValue;
                      if (Array.isArray(v)) {
                        return {
                          ...prev,
                          [H3_INDICATOR!.resource.column]: v.filter((val) => val !== option.value),
                        };
                      }
                      return prev;
                    });
                  }
                }}
              >
                {option.label}
              </Toggle>
            ))}
          </div>
        )}
    </>
  );
}
