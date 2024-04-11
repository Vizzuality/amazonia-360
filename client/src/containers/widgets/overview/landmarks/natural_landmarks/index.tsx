"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { CardLoader } from "@/containers/card";

export default function WidgetLandmarksNatural() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.areas_protegidas.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["Shape__Area"],
          geometry: GEOMETRY,
          returnGeometry: false,
        }),
      }),
      feature: DATASETS.areas_protegidas.layer,
    },
    {
      enabled: !!DATASETS.areas_protegidas.getFeatures && !!GEOMETRY,
    },
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500">Natural landmarks</h3>
      <CardLoader query={[query]} className="h-12">
        <ul className="space-y-1">
          {query.data?.features.map((feature) => (
            <li key={feature.attributes.FID}>{feature.attributes.NAME}</li>
          ))}
        </ul>
      </CardLoader>
    </div>
  );
}
