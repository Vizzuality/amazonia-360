"use client";

import { useMemo } from "react";

import { useFormatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { LAND_COVER, LandCoverIds } from "@/constants/raster";

import { Card, CardWidgetNumber, CardTitle } from "@/containers/card";

export default function WidgetPopulation() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);
  const { format } = useFormatNumber({
    maximumFractionDigits: 0,
  });

  const { data } = useGetRasterAnalysis(
    {
      id: "landcover",
      polygon: GEOMETRY,
      statistics: ["frac", "unique"],
    },
    {
      enabled: !!GEOMETRY,

      select(data) {
        return data.features.reduce((acc, f) => {
          if (f.properties.unique && f.properties.frac) {
            const { frac, unique } = f.properties;

            const us = unique.map((u, index) => {
              return {
                id: u,
                value: frac[index],
                label: LAND_COVER[`${u as LandCoverIds}`],
              };
            }, {});

            return us;
          }

          return acc;
        }, {});
      },
    },
  );

  console.log(data);

  const POPULATION = useMemo(() => {
    return format(265000);
  }, [format]);

  return (
    <Card>
      <CardTitle>Population</CardTitle>
      <CardWidgetNumber value={POPULATION} unit="inhabitants" />
    </Card>
  );
}
