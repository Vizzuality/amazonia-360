"use client";

import { useIndicatorsId } from "@/lib/indicators";

import { Indicator, VisualizationType } from "@/app/api/indicators/route";

import { ChartIndicators } from "@/containers/indicators/chart";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { TableIndicators } from "@/containers/indicators/table";

export default function ReportResultsIndicator({
  id,
  type,
}: {
  id: Indicator["id"];
  type: VisualizationType;
}) {
  const indicator = useIndicatorsId(id);

  if (!indicator) return null;

  return (
    <div className="flex h-full flex-col">
      {type === "map" && <MapIndicators {...indicator} />}
      {/* resource type Feature Indicators */}
      {type === "chart" && indicator.resource.type === "feature" && (
        <ChartIndicators {...indicator} resource={indicator.resource} />
      )}
      {type === "numeric" && indicator.resource.type === "feature" && (
        <NumericIndicators {...indicator} resource={indicator.resource} />
      )}
      {type === "table" && indicator.resource.type === "feature" && (
        <TableIndicators {...indicator} resource={indicator.resource} />
      )}{" "}
    </div>
  );
}
