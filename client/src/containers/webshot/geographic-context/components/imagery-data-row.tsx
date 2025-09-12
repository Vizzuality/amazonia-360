"use client";

import { useMemo } from "react";

import { useGetIndicatorsId, useQueryImageryId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { ResourceImagery } from "@/types/indicator";

import { useSyncLocation } from "@/app/store";

import { DataRowProps } from "./types";

export default function ImageryDataRow({ indicatorId, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(indicatorId, locale);
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryImageryId({
    id: indicatorId,
    resource: indicator?.resource as ResourceImagery,
    type: "numeric",
    geometry: GEOMETRY,
  });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;
    return query.data?.histograms?.reduce((acc, curr) => {
      return (
        acc +
        [...curr.counts].reduce((a, c, i) => {
          return a + c * (curr.min + (i * curr.max) / (curr.size - 1));
        }, 0)
      );
    }, 0);
  }, [query.data]);

  if (!indicator) return null;

  return (
    <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
      <p className="font-medium text-blue-600">{indicator[`name_${locale}`]}</p>
      <p className="font-bold text-blue-600">{VALUE || "n.d."}</p>
    </div>
  );
}
