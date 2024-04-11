"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetIntersectionAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { Card, CardTitle, CardLoader } from "@/containers/card";

import ArcChart from "@/components/charts/arc";

export default function WidgetIndigenousLandCoverage() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetIntersectionAnalysis(
    {
      id: "tierras_indigenas",
      polygon: GEOMETRY,
    },
    {
      enabled: !!GEOMETRY,
    },
  );

  return (
    <Card>
      <CardTitle>Indigenous lands</CardTitle>
      <CardLoader query={[query]} className="h-12">
        <ArcChart value={query.data?.percentage ?? 0} />
      </CardLoader>
    </Card>
  );
}
