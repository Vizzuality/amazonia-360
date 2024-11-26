"use client";

import { HierarchyNode, HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { LAND_COVER, LandCoverIds } from "@/constants/colors";

import { Card, CardHeader, CardInfo, CardLoader, CardTitle } from "@/containers/card";
import LegendOrdinal from "@/containers/legend/ordinal";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetLandCoverByType() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

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
      <CardHeader>
        <CardTitle>Land cover by type</CardTitle>
        <CardInfo ids={["land_cover"]} />
      </CardHeader>

      <CardLoader query={[query]} className="h-52">
        {!!query.data && (
          <div className="space-y-2 pt-2">
            <MarimekkoChart format={FORMAT} data={query.data || []} />

            <LegendOrdinal ordinalColorScale={ordinalColorScale} />
          </div>
        )}
      </CardLoader>
    </Card>
  );
}
