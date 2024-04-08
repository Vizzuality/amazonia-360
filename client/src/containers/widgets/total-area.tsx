"use client";

import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import { useFormatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { Card, CardWidgetNumber, CardTitle } from "@/containers/card";

export default function WidgetTotalArea() {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { format } = useFormatNumber({
    maximumFractionDigits: 0,
  });

  const AREA = useMemo(() => {
    if (!GEOMETRY) return null;

    return format(geometryEngine.geodesicArea(GEOMETRY, "square-kilometers"));
  }, [GEOMETRY, format]);

  return (
    <Card>
      <CardTitle>Total Area</CardTitle>
      <CardWidgetNumber value={AREA} unit="km²" />
    </Card>
  );
}
