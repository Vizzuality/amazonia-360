"use client";

import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";

import { Indicator } from "@/types/indicator";

import { useSyncLocation } from "@/app/store";

import { CardWidgetNumber } from "@/containers/card";

export const TotalArea = ({ indicator }: { indicator: Indicator }) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return null;

    return formatNumber(geometryEngine.geodesicArea(GEOMETRY, "square-kilometers"), {
      maximumFractionDigits: 0,
    });
  }, [GEOMETRY]);

  return <CardWidgetNumber value={AREA} unit={indicator?.unit} />;
};
