"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardLoader, CardTitle } from "@/containers/card";

export default function WidgetResearchCenters() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
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
      <CardTitle>
        Research centers ({query.data?.features?.length ?? "-"})
      </CardTitle>
      <CardLoader query={query} className="h-12">
        <ul className="space-y-1">
          {query.data?.features.map((feature) => (
            <li key={feature.attributes.FID}>{feature.attributes.Org_Name}</li>
          ))}
        </ul>
      </CardLoader>
    </Card>
  );
}
