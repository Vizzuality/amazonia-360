"use client";

import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { LegendOrdinal } from "@visx/legend";
import { scaleOrdinal } from "@visx/scale";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { LAND_COVER, LandCoverIds } from "@/constants/raster";

import { Card, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetLandCoverByType() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetRasterAnalysis(
    {
      id: "landcover",
      polygon: GEOMETRY,
      statistics: ["frac", "unique"],
    },
    {
      enabled: !!GEOMETRY,

      select(data): Data[] {
        const values = data.features.map((f) => {
          if (f.properties.unique && f.properties.frac) {
            const { frac, unique } = f.properties;

            const us = unique.map((u, index) => {
              return {
                id: LAND_COVER[`${u}` as LandCoverIds].label,
                parent: "root",
                size: frac[index],
                label: LAND_COVER[`${u}` as LandCoverIds].label,
                color: LAND_COVER[`${u}` as LandCoverIds].color,
              };
            }, {});

            return us
              .filter((u) => u.size > 0.001)
              .toSorted((a, b) => {
                if (!a.size || !b.size) return 0;

                return b.size - a.size;
              });
          }

          return [];
        });

        return values.flat();
      },
    },
  );

  const ordinalColorScale = scaleOrdinal({
    domain: query?.data?.map((d) => d),
    range: query?.data?.map((d) => d.color) || [], // sort by size.toReversed(),
  });

  const FORMAT = (node: HierarchyRectangularNode<HierarchyNode<Data>>) => {
    return formatPercentage(node?.value || 0, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card className="grow">
      <CardTitle>Land cover by type</CardTitle>
      <CardLoader query={[query]} className="h-52">
        {!!query.data && (
          <div className="space-y-2 pt-2">
            <MarimekkoChart
              format={FORMAT}
              colorScale={ordinalColorScale}
              data={query.data || []}
            />

            <LegendOrdinal scale={ordinalColorScale} className="w-full">
              {(labels) => (
                <div className="flex flex-wrap justify-start gap-y-1 gap-x-3">
                  {labels.map((label) => (
                    <div
                      key={`legend-quantile-${label.datum.id}`}
                      className="flex space-x-1"
                    >
                      <div
                        className="w-2 h-2 shrink-0 mt-px border border-foreground/50 rounded-[2px]"
                        style={{
                          backgroundColor: label.value,
                        }}
                      />
                      <span className="text-2xs font-semibold text-gray-500">
                        {label.datum.label}{" "}
                        <span>
                          (
                          {label.datum.size > 0.01 &&
                            formatPercentage(label.datum.size, {
                              maximumFractionDigits: 0,
                            })}
                          {label.datum.size <= 0.01 && `<1%`})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </LegendOrdinal>
          </div>
        )}
      </CardLoader>
    </Card>
  );
}
