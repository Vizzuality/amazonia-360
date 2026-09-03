"use client";

import { useMemo } from "react";

import { formatNumber } from "@/lib/formats";
import { getImageryScalar } from "@/lib/imagery";
import { useGetIndicatorsId, useQueryImageryId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { ResourceImagery } from "@/types/indicator";

import { useIndicator } from "@/containers/indicators/provider";

import { DataRowProps } from "./types";

export default function ImageryDataRow({ id, locale, location }: DataRowProps) {
  const indicator = useGetIndicatorsId(id, locale);
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const resource = indicator?.resource as ResourceImagery | undefined;

  const query = useQueryImageryId({
    id,
    resource: resource as ResourceImagery,
    type: "numeric",
    geometry: GEOMETRY,
  });

  const VALUE = useMemo(
    () => getImageryScalar(query.data, resource?.aggregation ?? "none"),
    [query.data, resource],
  );

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
      <p className="font-bold text-blue-600">
        {typeof VALUE === "number" ? formatNumber(VALUE) : "n.d."}
      </p>
    </div>
  );
}
