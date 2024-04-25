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
} from "@/containers/card";

export default function WidgetPopulation() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

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
      <CardTitle>Population</CardTitle>
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
