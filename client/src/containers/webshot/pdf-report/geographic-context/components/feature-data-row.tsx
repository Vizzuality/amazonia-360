"use client";

import { useMemo } from "react";

import { formatNumber } from "@/lib/formats";
import { useGetIndicatorsId, useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { ResourceFeature } from "@/types/indicator";

import { useSyncLocation } from "@/app/store";

import { DataRowProps } from "./types";

export default function FeatureDataRow({ indicatorId, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(indicatorId, locale);
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryFeatureId({
    id: indicatorId,
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

  if (!indicator) return null;

  return (
    <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
      <p className="font-medium text-blue-600">{indicator.name}</p>
      <p className="font-bold text-blue-600">{formatNumber(VALUE)}</p>
    </div>
  );
}
