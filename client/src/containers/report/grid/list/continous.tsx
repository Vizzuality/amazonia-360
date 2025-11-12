"use client";

import { useMemo } from "react";

import numeral from "numeral";

import { formatNumber } from "@/lib/formats";
import { useMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { H3Indicator } from "@/types/indicator";

import { useSyncGridDatasetContinousSettings, useSyncLocation } from "@/app/(frontend)/store";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export default function GridIndicatorsItemContinous(indicator: H3Indicator) {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { META, queryMeta, queryMetaFromGeometry } = useMeta(GEOMETRY);

  const { isFetching: gridMetaIsFetching } = queryMeta;

  const { isFetching: gridMetaFromGeometryIsFetching } = queryMetaFromGeometry;

  const [gridDatasetContinousSettings, setGridDatasetContinousSettings] =
    useSyncGridDatasetContinousSettings();

  const H3_INDICATOR = useMemo(() => {
    const m = META?.datasets.find((d) => d.var_name === indicator.resource.column);

    if (!m) return null;

    return {
      ...indicator,
      legend: m?.legend,
    };
  }, [META, indicator]);

  const continuosOptions = useMemo(() => {
    const legend = H3_INDICATOR?.legend;
    if (legend?.legend_type === "continuous" && "stats" in legend) {
      const s = legend.stats.find((stat) => stat.level === 1);
      return s;
    }
  }, [H3_INDICATOR?.legend]);

  const continuosValue = useMemo(() => {
    const column = H3_INDICATOR?.resource.column;
    if (continuosOptions) {
      if (gridDatasetContinousSettings && column) {
        return (
          gridDatasetContinousSettings[column] || [
            continuosOptions.min || 0,
            continuosOptions.max || 100,
          ]
        );
      }

      return [continuosOptions.min || 0, continuosOptions.max || 100];
    }

    return [-Infinity, Infinity];
  }, [H3_INDICATOR?.resource.column, continuosOptions, gridDatasetContinousSettings]);

  const step = useMemo(() => {
    if (continuosOptions) {
      const range = (continuosOptions.max || 100) - (continuosOptions.min || 0);
      if (range <= 0.1) return 0.001;
      if (range <= 1) return 0.01;
      if (range <= 10) return 0.1;
      if (range <= 100) return 1;
    }
    return 1;
  }, [continuosOptions]);

  const onValueChange = (v: number[]) => {
    setGridDatasetContinousSettings((prev) => {
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
    <>
      {!(gridMetaIsFetching || gridMetaFromGeometryIsFetching) &&
        H3_INDICATOR?.legend?.legend_type === "continuous" &&
        continuosOptions && (
          <div className="space-y-2">
            <Slider
              min={continuosOptions.min || 0}
              max={continuosOptions.max || 100}
              step={step}
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
    </>
  );
}
