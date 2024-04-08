"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

export default function WidgetLandmarksCities() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const { data: ciudades_capitalesData } = useGetFeatures(
    {
      query: DATASETS.ciudades_capitales.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["NOMBCAP"],
          geometry: GEOMETRY,
          returnGeometry: false,
        }),
      }),
      feature: DATASETS.ciudades_capitales.layer,
    },
    {
      enabled: !!DATASETS.ciudades_capitales.getFeatures && !!GEOMETRY,
    },
  );

  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500">Cities</h3>
      <ul className="space-y-1">
        {ciudades_capitalesData?.features.map((feature) => (
          <li key={feature.attributes.FID}>{feature.attributes.NOMBCAP}</li>
        ))}
      </ul>
    </div>
  );
}
