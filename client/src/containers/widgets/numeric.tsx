"use client";

import { useMemo } from "react";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Pluralize from "pluralize";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS, Dataset } from "@/constants/datasets";

import {
  Card,
  CardWidgetNumber,
  CardTitle,
  CardLoader,
  CardHeader,
  CardInfo,
} from "@/containers/card";

export default function NumericWidget({ id }: { id: keyof typeof DATASETS }) {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const dataset = useMemo(() => {
    const d = DATASETS[id];
    if (d.layer instanceof FeatureLayer) {
      return d;
    }
    return null;
  }, [id]);

  const query = useGetFeatures(
    {
      query:
        dataset?.getFeatures &&
        dataset.getFeatures({
          ...(!!GEOMETRY && {
            geometry: GEOMETRY,
          }),
        }),
      feature: dataset?.layer instanceof FeatureLayer ? dataset.layer : undefined,
    },
    {
      enabled: !!dataset?.getFeatures && !!GEOMETRY,
      select: (data) => {
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
      <CardHeader>
        <CardTitle>IDB funding operations</CardTitle>
        <CardInfo ids={[id]} />
      </CardHeader>

      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber value={TOTAL} unit={Pluralize("operation", query.data?.length ?? 0)} />
      </CardLoader>
    </Card>
  );
}
