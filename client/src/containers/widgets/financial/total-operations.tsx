"use client";

import { useMemo } from "react";

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
import { IDBOperation } from "@/containers/widgets/financial/types";

export default function WidgetTotalOperations() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.idb_operations.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.idb_operations.layer,
    },
    {
      enabled: !!DATASETS.idb_operations.getFeatures && !!GEOMETRY,
      select(data): IDBOperation[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  const TOTAL = useMemo(() => {
    return formatNumber(query.data?.length ?? 0, {
      maximumFractionDigits: 0,
    });
  }, [query.data?.length]);

  return (
    <Card>
      <CardTitle>IDB funding operations</CardTitle>
      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber value={TOTAL} unit="operations" />
      </CardLoader>
    </Card>
  );
}
