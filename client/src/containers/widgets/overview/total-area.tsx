"use client";

import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { Card, CardWidgetNumber, CardTitle, CardHeader, CardInfo } from "@/containers/card";

export default function WidgetTotalArea() {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return null;

    return formatNumber(geometryEngine.geodesicArea(GEOMETRY, "square-kilometers"), {
      maximumFractionDigits: 0,
    });
  }, [GEOMETRY]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Area</CardTitle>
        <CardInfo ids={[+"population"]} />
      </CardHeader>
      <CardWidgetNumber value={AREA} unit="km²" />
    </Card>
  );
}
