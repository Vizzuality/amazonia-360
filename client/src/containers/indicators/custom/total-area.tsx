"use client";

import { useMemo } from "react";

import * as geodeticAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";

import { Indicator } from "@/types/indicator";

import { CardWidgetNumber } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";

import { Report } from "@/payload-types";

if (!geodeticAreaOperator.isLoaded()) {
  await geodeticAreaOperator.load();
}

export const TotalArea = ({
  indicator,
  location,
}: {
  indicator: Indicator;
  location: Report["location"];
}) => {
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded } = useIndicator();

  useMemo(() => {
    onIndicatorViewLoading(indicator.id);
  }, [indicator.id, onIndicatorViewLoading]);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return null;

    return formatNumber(geodeticAreaOperator.execute(GEOMETRY, { unit: "square-kilometers" }), {
      maximumFractionDigits: 0,
    });
  }, [GEOMETRY]);

  useMemo(() => {
    onIndicatorViewLoaded(indicator.id);
  }, [indicator.id, onIndicatorViewLoaded]);

  return <CardWidgetNumber value={AREA} unit={indicator?.unit} />;
};
