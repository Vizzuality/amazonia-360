"use client";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures, useGetIntersectionAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import {
  Card,
  CardTitle,
  CardLoader,
  CardWidgetNumber,
  CardHeader,
  CardInfo,
} from "@/containers/card";
import { IndigenousLand } from "@/containers/widgets/protection/indigenous-lands/types";

export default function WidgetIndigenousLands() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const queryIndigenousLands = useGetFeatures(
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
      select(data): IndigenousLand[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  const queryIndigenousLandsCoverage = useGetIntersectionAnalysis(
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
      <CardHeader>
        <CardTitle>Indigenous lands</CardTitle>
        <CardInfo ids={["tierras_indigenas"]} />
      </CardHeader>

      <CardLoader query={[queryIndigenousLands, queryIndigenousLandsCoverage]} className="h-16">
        <CardWidgetNumber
          value={`${queryIndigenousLands.data?.length ?? 0}`}
          subvalue={`representing ${formatPercentage(
            queryIndigenousLandsCoverage.data?.percentage ?? 0,
            {
              maximumFractionDigits: 0,
            },
          )} of the area`}
        />
      </CardLoader>
    </Card>
  );
}
