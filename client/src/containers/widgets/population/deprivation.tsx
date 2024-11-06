"use client";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardContent, CardHeader, CardInfo, CardLoader, CardTitle } from "@/containers/card";
import Legend from "@/containers/legend";
import LegendItem from "@/containers/legend/item";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsPopulationDeprivation() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const query = useGetRasterAnalysis(
    {
      id: "deprivation_index",
      polygon: GEOMETRY,
      statistics: ["mean"],
    },
    {
      enabled: !!GEOMETRY,

      select(data) {
        return data.features?.reduce((acc, curr) => {
          return acc + (curr.properties.mean || 0);
        }, 0);
      },
    },
  );
  return (
    <Card className="relative h-full p-0">
      <div className="p-6">
        <CardHeader>
          <CardTitle>Deprivation Index</CardTitle>
          <CardInfo ids={["deprivation_index"]} />
        </CardHeader>

        <CardContent>
          <CardLoader query={[query]} className="h-10">
            <p className="text-sm font-medium">
              The SEDAC Deprivation Index reaches an{" "}
              <strong>average of {formatNumber(query.data)}</strong> out of a maximum of 100,
              representing the worst situation.
            </p>
          </CardLoader>
        </CardContent>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <Legend>
          <LegendItem {...DATASETS.deprivation_index?.legend} />
        </Legend>
      </div>
      <WidgetMap ids={["deprivation_index"]} />
    </Card>
  );
}
