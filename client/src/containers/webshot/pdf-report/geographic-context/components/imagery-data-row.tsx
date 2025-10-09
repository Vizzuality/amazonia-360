"use client";

import { useMemo } from "react";

import { formatNumber } from "@/lib/formats";
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
    if (!query.data || !("statistics" in query.data)) return null;

    const [s] = query.data.statistics;

    if (!s) return 0;

    if ("sum" in s) return s.sum;

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
      <p className="font-medium text-blue-600">{indicator.name}</p>
      <p className="font-bold text-blue-600">
        {typeof VALUE === "number" ? formatNumber(VALUE) : "n.d."}
      </p>
    </div>
  );
}
