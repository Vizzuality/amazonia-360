"use client";

import { useMemo } from "react";

import { geodesicArea } from "@arcgis/core/geometry/geometryEngine";

import { formatNumber } from "@/lib/formats";
import { useGetIndicatorsId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { useIndicator } from "@/containers/indicators/provider";

import { DataRowProps } from "./types";

export default function ComponentDataRow({ id, locale, location }: DataRowProps) {
  const indicator = useGetIndicatorsId(id, locale);
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded } = useIndicator();

  useMemo(() => {
    onIndicatorViewLoading(id);
  }, [id, onIndicatorViewLoading]);

  const VALUE = useMemo(() => {
    if (!GEOMETRY || !indicator) return null;

    const area = formatNumber(geodesicArea(GEOMETRY, "square-kilometers"), {
      maximumFractionDigits: 0,
    });

    if (indicator[`unit_${locale}`]) return `${area} ${indicator.unit}`;

    return area;
  }, [GEOMETRY, indicator, locale]);

  useMemo(() => {
    onIndicatorViewLoaded(id);
  }, [id, onIndicatorViewLoaded]);

  if (!indicator) return null;

  return (
    <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
      <p className="font-medium text-blue-600">{indicator.name}</p>
      <p className="font-bold text-blue-600">{VALUE}</p>
    </div>
  );
}
