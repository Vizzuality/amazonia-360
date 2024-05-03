"use client";

import { useMemo } from "react";

import { formatCurrency } from "@/lib/formats";
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
import { IDBOperation } from "@/containers/widgets/financial/types";

export default function WidgetTotalFunding() {
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

  const t = query.data?.reduce((acc, curr) => {
    return acc + (curr.idbamount || 0);
  }, 0);

  const TOTAL = useMemo(() => {
    return formatCurrency(t ?? 0, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2,
    });
  }, [t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>IDB total funding</CardTitle>
        <CardInfo ids={["idb_operations"]} />
      </CardHeader>

      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber value={TOTAL} />
      </CardLoader>
    </Card>
  );
}
