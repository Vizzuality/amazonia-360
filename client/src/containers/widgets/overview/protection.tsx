"use client";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import {
  Card,
  CardWidgetNumber,
  CardTitle,
  CardLoader,
} from "@/containers/card";
import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";

export default function WidgetProtection() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.areas_protegidas.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.areas_protegidas.layer,
    },
    {
      enabled: !!DATASETS.areas_protegidas.getFeatures && !!GEOMETRY,
      select(data): ProtectedAreas[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  return (
    <Card>
      <CardTitle>Protection</CardTitle>
      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber
          value={formatNumber(query?.data?.length, {
            maximumFractionDigits: 0,
          })}
          unit="protected areas"
        />
      </CardLoader>
    </Card>
  );
}
