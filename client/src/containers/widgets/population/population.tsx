"use client";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetRasterAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";
import Legend from "@/containers/legend";
import LegendItem from "@/containers/legend/item";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsPopulationPopulation() {
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
    <Card className="h-full p-0 relative">
      <div className="p-6">
        <CardTitle>Population</CardTitle>
        <CardContent>
          <CardLoader query={[query]} className="h-10">
            <p className="text-sm font-medium">
              The current selection could have{" "}
              <strong>
                {formatNumber(query.data, {
                  maximumFractionDigits: 0,
                })}
              </strong>{" "}
              inhabitants, estimated for 2025 according to the GHS mode.
            </p>
          </CardLoader>
        </CardContent>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <Legend>
          <LegendItem {...DATASETS.population?.legend} />
        </Legend>
      </div>

      <WidgetMap ids={["population"]} />
    </Card>
  );
}
