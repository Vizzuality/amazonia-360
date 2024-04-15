"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { LAND_COVER, LandCoverIds } from "@/constants/raster";

import { Card, CardLoader, CardTitle } from "@/containers/card";

export default function WidgetEnvironmentSummary() {
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
                id: LAND_COVER[`${u as LandCoverIds}`].label,
                parent: "root",
                size: frac[index],
                label: LAND_COVER[`${u as LandCoverIds}`].label,
                color: LAND_COVER[`${u as LandCoverIds}`].color,
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

  return (
    <Card>
      <CardTitle>Land cover by type</CardTitle>
      <CardLoader query={[query]} className="h-28">
        {!!query.data && (
          <p className="text-sm font-medium">
            The region is situated within an altitude range of 200-500 meters.
            It typically experiences a tropical climate type. Positioned within
            the hydrographic basin of the Madre de Dios River. Dominated by
            dense rainforests, which cover approximately 85% of its land area,
            the region showcases the rich biodiversity typical of tropical
            rainforest biomes.
          </p>
        )}
      </CardLoader>
    </Card>
  );
}
