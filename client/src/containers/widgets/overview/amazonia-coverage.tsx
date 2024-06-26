"use client";

import { useMemo } from "react";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetIntersectionAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import {
  Card,
  CardWidgetNumber,
  CardTitle,
  CardLoader,
} from "@/containers/card";

export default function WidgetAmazoniaCoverage() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetIntersectionAnalysis(
    {
      id: "area_afp",
      polygon: GEOMETRY,
    },
    {
      enabled: !!GEOMETRY,
    },
  );

  const COVERAGE = useMemo(() => {
    return formatPercentage(query.data?.percentage ?? 0, {
      maximumFractionDigits: 0,
    });
  }, [query.data?.percentage]);

  return (
    <Card>
      <CardTitle>Amazonia coverage</CardTitle>
      <CardLoader query={[query]} className="h-12">
        <CardWidgetNumber value={COVERAGE} unit="is in Amazonia" />
      </CardLoader>
    </Card>
  );
}
