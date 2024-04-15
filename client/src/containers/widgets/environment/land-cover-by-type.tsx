"use client";

import { LegendOrdinal } from "@visx/legend";
import { scaleOrdinal } from "@visx/scale";

import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { LAND_COVER, LandCoverIds } from "@/constants/raster";

import { Card, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart from "@/components/charts/marimekko";

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

      select(data) {
        const values = data.features.map((f) => {
          if (f.properties.unique && f.properties.frac) {
            const { frac, unique } = f.properties;

            const us = unique.map((u, index) => {
              return {
                id: LAND_COVER[`${u as LandCoverIds}`],
                parent: "landcover",
                size: frac[index],
                label: LAND_COVER[`${u as LandCoverIds}`],
              };
            }, {});

            return us;
          }

          return [];
        });

        return [
          {
            id: "landcover",
            parent: null,
            size: 0,
            label: "Land Cover",
          },
          ...values.flat(),
        ];
      },
    },
  );

  const ordinalColorScale = scaleOrdinal({
    domain:
      query?.data
        ?.map((d) => d)
        .toSorted((a, b) => {
          if (!a.size || !b.size) return 0;

          return b.size - a.size;
        }) || [], // sort by size
    range: [
      "#93CAEB",
      "#6FB8E5",
      "#4BA6DE",
      "#009ADE",
      "#35749B",
      "#2D6485",
    ].toReversed(),
  });

  return (
    <Card>
      <CardTitle>Land cover by type</CardTitle>
      <CardLoader query={[query]} className="h-40">
        {!!query.data && (
          <div className="space-y-2">
            <MarimekkoChart
              colorScale={ordinalColorScale}
              data={query.data || []}
            />

            <LegendOrdinal scale={ordinalColorScale} className="w-full">
              {(labels) => (
                <div className="flex flex-wrap justify-start gap-2">
                  {labels
                    .filter(
                      (label) => label.datum.size && label.datum.size > 0.001,
                    )
                    .map((label) => (
                      <div
                        key={`legend-quantile-${label.datum.id}`}
                        className="flex items-center"
                      >
                        <div
                          className="w-2 h-2 mr-1"
                          style={{
                            backgroundColor: label.value,
                          }}
                        />
                        <span className="text-xs font-medium text-gray-500">
                          {label.datum.label}
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
