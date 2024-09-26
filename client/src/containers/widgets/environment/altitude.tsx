"use client";

import { treemapDice } from "@visx/hierarchy";
import { HierarchyNode, HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { ELEVATION_RANGES, ElevationRangeIds } from "@/constants/colors";

import { Card, CardTitle, CardLoader, CardHeader, CardInfo } from "@/containers/card";
import LegendOrdinal from "@/containers/legend/ordinal";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetAltitude() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetRasterAnalysis(
    {
      id: "elevation_ranges",
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
              const e = ELEVATION_RANGES[`${u}` as ElevationRangeIds];
              return {
                id: e.label,
                key: u,
                parent: "root",
                size: frac[index],
                label: e.label,
                color: e.color,
              };
            }, {});

            return us.filter((u) => u.size > 0.001);
          }

          return [];
        });

        return values
          .flat()
          .toSorted((a, b) => a.key - b.key)
          .map((d, i, arr) => {
            return {
              ...d,
              percentage: (i + 1) / arr.length,
            };
          });
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
    <Card>
      <CardHeader>
        <CardTitle>Elevation</CardTitle>
        <CardInfo ids={["elevation_ranges"]} />
      </CardHeader>

      <CardLoader query={[query]} className="h-20">
        <div className="space-y-2 pt-2">
          <MarimekkoChart
            data={query?.data || []}
            colorScale={ordinalColorScale}
            format={FORMAT}
            className="h-12"
            tile={treemapDice}
          />

          <LegendOrdinal ordinalColorScale={ordinalColorScale} />
        </div>
      </CardLoader>
    </Card>
  );
}
