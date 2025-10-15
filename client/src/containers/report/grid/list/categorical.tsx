"use client";

import { useMemo } from "react";

import { useMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { H3Indicator } from "@/types/indicator";

import { useSyncGridDatasetCategoricalSettings, useSyncLocation } from "@/app/store";

import { Checkbox } from "@/components/ui/checkbox";

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
    if (H3_INDICATOR?.legend?.legend_type === "categorical" && "entries" in H3_INDICATOR.legend) {
      return H3_INDICATOR.legend.entries;
    }
  }, [H3_INDICATOR?.legend]);

  const categoricalValue = useMemo(() => {
    if (categoricalOptions) {
      if (
        gridDatasetCategoricalSettings &&
        H3_INDICATOR?.resource.column &&
        gridDatasetCategoricalSettings[H3_INDICATOR?.resource.column]
      ) {
        return gridDatasetCategoricalSettings[H3_INDICATOR.resource.column] || [];
      }

      return categoricalOptions.map((o) => o.value);
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
          <div className="flex flex-col justify-between gap-1">
            {categoricalOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-1">
                <Checkbox
                  checked={categoricalValue.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (!H3_INDICATOR?.resource.column) return;

                    if (checked) {
                      // Add
                      setGridDatasetCategoricalSettings((prev) => ({
                        ...prev,
                        [H3_INDICATOR.resource.column]: [...categoricalValue, option.value],
                      }));
                    } else {
                      // Remove
                      setGridDatasetCategoricalSettings((prev) => {
                        const v = prev?.[H3_INDICATOR!.resource.column] ?? categoricalValue;
                        if (Array.isArray(v)) {
                          return {
                            ...prev,
                            [H3_INDICATOR!.resource.column]: v.filter(
                              (val) => val !== option.value,
                            ),
                          };
                        }
                        return prev;
                      });
                    }
                  }}
                />
                <span className="text-xs text-gray-500">{option.label}</span>
              </div>
            ))}
          </div>
        )}
    </>
  );
}
