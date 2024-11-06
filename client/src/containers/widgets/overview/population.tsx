"use client";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import {
  Card,
  CardWidgetNumber,
  CardTitle,
  CardLoader,
  CardHeader,
  CardInfo,
} from "@/containers/card";

export default function WidgetPopulation() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const query = useGetRasterAnalysis(
    {
      id: "population",
      polygon: GEOMETRY,
      statistics: ["sum"],
    },
    {
      enabled: !!GEOMETRY,

      select(data) {
        return data.features?.reduce((acc, curr) => {
          return acc + (curr.properties.sum || 0);
        }, 0);
      },
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Population</CardTitle>
        <CardInfo ids={["population"]} />
      </CardHeader>

      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber
          value={formatNumber(query.data, {
            maximumFractionDigits: 0,
          })}
          unit="inhabitants"
        />
      </CardLoader>
    </Card>
  );
}
