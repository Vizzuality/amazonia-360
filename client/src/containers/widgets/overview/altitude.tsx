"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { ELEVATION_RANGES, ElevationRangeIds } from "@/constants/raster";

import { Card, CardTitle, CardLoader } from "@/containers/card";

import BarChart from "@/components/charts/bar";

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

      select(data) {
        const values = data.features.map((f) => {
          if (f.properties.unique && f.properties.frac) {
            const { frac, unique } = f.properties;

            const us = unique.map((u, index) => {
              const e = ELEVATION_RANGES[`${u}` as ElevationRangeIds];
              return {
                id: u,
                x: frac[index],
                y: e.range[1],
                label: e.label,
                color: e.color,
              };
            }, {});

            return us.toSorted((a, b) => {
              if (!a.id || !b.id) return 0;

              return a.id - b.id;
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
      <CardTitle>Altitude</CardTitle>
      <CardLoader query={[query]} className="h-12">
        <BarChart data={query?.data || []} />
      </CardLoader>
    </Card>
  );
}
