"use client";

import { useMemo } from "react";

import { geodesicArea } from "@arcgis/core/geometry/geometryEngine";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";

import { Indicator } from "@/types/indicator";

import { useSyncLocation } from "@/app/(frontend)/store";

import { CardWidgetNumber } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";

export const TotalArea = ({ indicator }: { indicator: Indicator }) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded } = useIndicator();

  useMemo(() => {
    onIndicatorViewLoading(indicator.id);
  }, [indicator.id, onIndicatorViewLoading]);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return null;

    return formatNumber(geodesicArea(GEOMETRY, "square-kilometers"), {
      maximumFractionDigits: 0,
    });
  }, [GEOMETRY]);

  useMemo(() => {
    onIndicatorViewLoaded(indicator.id);
  }, [indicator.id, onIndicatorViewLoaded]);

  return <CardWidgetNumber value={AREA} unit={indicator?.unit} />;
};
