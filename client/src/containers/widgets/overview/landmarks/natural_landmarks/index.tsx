"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

export default function WidgetLandmarksNatural() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const { data: areas_protegidasData } = useGetFeatures(
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
    <div>
      <h3 className="text-xs font-medium text-gray-500">Natural landmarks</h3>
      <ul className="space-y-1">
        {areas_protegidasData?.features.map((feature) => (
          <li key={feature.attributes.FID}>{feature.attributes.NAME}</li>
        ))}
      </ul>
    </div>
  );
}
