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
  CardHeader,
  CardInfo,
} from "@/containers/card";
import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";

export default function WidgetIndigenous() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.tierras_indigenas.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.tierras_indigenas.layer,
    },
    {
      enabled: !!DATASETS.tierras_indigenas.getFeatures && !!GEOMETRY,
      select(data): ProtectedAreas[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indigenous lands</CardTitle>
        <CardInfo ids={["tierras_indigenas"]} />
      </CardHeader>
      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber
          value={formatNumber(query?.data?.length, {
            maximumFractionDigits: 0,
          })}
          unit="indigenous lands"
        />
      </CardLoader>
    </Card>
  );
}
