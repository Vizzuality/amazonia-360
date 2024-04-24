"use client";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsPopulationDeprivation() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

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
    <Card className="h-full p-0 relative print:break-before-page">
      <div className="p-6">
        <CardTitle>Deprivation Index</CardTitle>
        <CardContent>
          <CardLoader query={[query]} className="h-10">
            <p className="text-sm font-medium">
              The SEDAC Deprivation Index reaches an{" "}
              <strong>average of {formatNumber(query.data)}</strong> out of a
              maximum of 100, representing the worst situation.
            </p>
          </CardLoader>
        </CardContent>
      </div>
      <WidgetMap ids={["deprivation_index"]} />
    </Card>
  );
}
