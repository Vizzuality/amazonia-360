"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardTitle } from "@/containers/card";

export default function WidgetResearchCenters() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const { data: institutional_trackingData } = useGetFeatures(
    {
      query: DATASETS.institutional_tracking.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["Org_Name"],
          geometry: GEOMETRY,
          returnGeometry: false,
        }),
      }),
      feature: DATASETS.institutional_tracking.layer,
    },
    {
      enabled: !!DATASETS.institutional_tracking.getFeatures && !!GEOMETRY,
    },
  );

  return (
    <Card>
      <CardTitle>Research centers ()</CardTitle>
      <ul className="space-y-1">
        {institutional_trackingData?.features.map((feature) => (
          <li key={feature.attributes.FID}>{feature.attributes.Org_Name}</li>
        ))}
      </ul>
    </Card>
  );
}
