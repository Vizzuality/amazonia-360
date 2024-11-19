"use client";

import { useMemo } from "react";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Pluralize from "pluralize";

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
  CardControls,
} from "@/containers/card";

export default function NumericWidget({ id }: { id: keyof typeof DATASETS }) {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const dataset = useMemo(() => {
    const d = DATASETS[id];
    if (d?.layer instanceof FeatureLayer && "getFeatures" in d) {
      return d;
    }
    return null;
  }, [id]);

  const query = useGetFeatures(
    {
      query: dataset?.getFeatures({
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
        <CardTitle>{dataset?.layer?.title}</CardTitle>
        <CardControls>
          <CardInfo ids={[id]} />
        </CardControls>
      </CardHeader>

      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber value={TOTAL} unit={Pluralize("operation", query.data?.length ?? 0)} />
      </CardLoader>
    </Card>
  );
}
