"use client";

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
                id: `${u}`,
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

  return (
    <Card>
      <CardTitle>Land cover by type</CardTitle>
      <CardLoader query={query} className="h-40">
        {!!query.data && <MarimekkoChart data={query.data || []} />}
      </CardLoader>
    </Card>
  );
}
