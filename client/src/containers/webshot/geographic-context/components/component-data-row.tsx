"use client";

import { useMemo } from "react";

import { geodesicArea } from "@arcgis/core/geometry/geometryEngine";

import { formatNumber } from "@/lib/formats";
import { useGetIndicatorsId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { DataRowProps } from "./types";

export default function ComponentDataRow({ indicatorId, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(indicatorId, locale);
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const VALUE = useMemo(() => {
    if (!GEOMETRY || !indicator) return null;

    const area = formatNumber(geodesicArea(GEOMETRY, "square-kilometers"), {
      maximumFractionDigits: 0,
    });

    if (indicator[`unit_${locale}`]) return `${area} ${indicator[`unit_${locale}`]}`;

    return area;
  }, [GEOMETRY, indicator, locale]);

  if (!indicator) return null;

  return (
    <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
      <p className="font-medium text-blue-600">{indicator[`name_${locale}`]}</p>
      <p className="font-bold text-blue-600">{VALUE}</p>
    </div>
  );
}
