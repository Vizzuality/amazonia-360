"use client";

import { treemapDice } from "@visx/hierarchy";
import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { FIRES, FireIds } from "@/constants/raster";

import { Card, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetForestFires() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetRasterAnalysis(
    {
      id: "fires",
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
                id: FIRES[`${u}` as FireIds].label,
                key: u,
                parent: "root",
                size: frac[index],
                label: FIRES[`${u}` as FireIds].label,
                color: FIRES[`${u}` as FireIds].color,
              };
            }, {});

            return us.filter((u) => u.size > 0.001);
          }

          return [];
        });

        return values.flat().toSorted((a, b) => a.key - b.key);
      },
    },
  );

  const ordinalColorScale = scaleOrdinal({
    domain: query?.data?.map((d) => d),
    range: query?.data?.map((d) => d.color), // sort by size.toReversed(),
  });

  const FORMAT = (node: HierarchyRectangularNode<HierarchyNode<Data>>) => {
    return formatPercentage(node?.value || 0, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card>
      <CardTitle>Frequency of forest fires</CardTitle>
      <CardLoader query={[query]} className="h-16">
        {!!query?.data && (
          <MarimekkoChart
            data={query?.data}
            colorScale={ordinalColorScale}
            format={FORMAT}
            className="h-16"
            tile={treemapDice}
          />
        )}
      </CardLoader>
    </Card>
  );
}
