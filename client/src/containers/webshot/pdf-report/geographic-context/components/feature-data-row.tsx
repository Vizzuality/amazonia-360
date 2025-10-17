"use client";

import { useMemo } from "react";

import { formatNumber } from "@/lib/formats";
import { useGetIndicatorsId, useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { ResourceFeature } from "@/types/indicator";

import { useSyncLocation } from "@/app/store";

import { useIndicator } from "@/containers/indicators/provider";

import { DataRowProps } from "./types";

export default function FeatureDataRow({ id, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(id, locale);
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const query = useQueryFeatureId({
    id: id,
    resource: indicator?.resource as ResourceFeature,
    type: "numeric",
    geometry: GEOMETRY,
  });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;
    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

  useMemo(() => {
    if (query.isLoading) {
      onIndicatorViewLoading(id);
    }

    if (query.isError) {
      onIndicatorViewError(id);
    }

    if (query.isSuccess) {
      onIndicatorViewLoaded(id);
    }
  }, [query, id, onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError]);

  if (!indicator) return null;

  return (
    <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
      <p className="font-medium text-blue-600">{indicator.name}</p>
      <p className="font-bold text-blue-600">{formatNumber(VALUE)}</p>
    </div>
  );
}
