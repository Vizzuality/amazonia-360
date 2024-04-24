"use client";

import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetIntersectionAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { BIOMES, BiomesIds } from "@/constants/raster";

import { Card, CardLoader, CardTitle } from "@/containers/card";
import LegendOrdinal from "@/containers/legend/ordinal";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetBiomesByType() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetIntersectionAnalysis(
    {
      id: "biomas",
      polygon: GEOMETRY,
    },
    {
      enabled: !!GEOMETRY,

      select(data) {
        const { areas } = data;

        return data?.features
          ?.map((f) => {
            return {
              id: f.attributes.BIOMADES,
              parent: "root",
              size: f.area / (areas || 1),
              label: f.attributes.BIOMADES,
              color: BIOMES[f.attributes.BIOME as BiomesIds]?.color,
            };
          })
          ?.reduce((acc, curr) => {
            const index = acc.findIndex((a) => a.id === curr.id);

            if (index === -1) {
              acc.push(curr);
            } else {
              acc[index].size = (acc[index]?.size ?? 0) + curr.size;
            }

            return acc;
          }, [] as Data[])
          ?.filter((u) => u.size > 0.001)
          ?.toSorted((a, b) => {
            if (!a.size || !b.size) return 0;

            return b.size - a.size;
          });
      },
    },
  );

  const ordinalColorScale = scaleOrdinal({
    domain: query?.data?.map((d) => d),
    range: query?.data?.map((d) => d.color),
  });

  const FORMAT = (node: HierarchyRectangularNode<HierarchyNode<Data>>) => {
    return formatPercentage(node?.value || 0, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card className="grow">
      <CardTitle>Biomes by type</CardTitle>
      <CardLoader query={[query]} className="h-52">
        <div className="space-y-2 pt-2">
          <MarimekkoChart
            format={FORMAT}
            colorScale={ordinalColorScale}
            data={query.data || []}
          />

          <LegendOrdinal ordinalColorScale={ordinalColorScale} />
        </div>
      </CardLoader>
    </Card>
  );
}
