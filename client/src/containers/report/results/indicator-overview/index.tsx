"use client";

import { useGetIndicatorsOverviewId } from "@/lib/indicators";

import { Indicator, VisualizationType } from "@/app/local-api/indicators/route";

import {
  Card,
  CardContent,
  CardHeader,
  CardControls,
  CardInfo,
  CardTitle,
} from "@/containers/card";
import { ChartIndicators } from "@/containers/indicators/chart";
import { ChartImageryIndicators } from "@/containers/indicators/chart/imagery";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { NumericImageryIndicators } from "@/containers/indicators/numeric/imagery";
import { TableIndicators } from "@/containers/indicators/table";

export default function ReportResultsIndicatorOverview({
  id,
  type,
}: {
  id: Indicator["id"];
  type: VisualizationType;
}) {
  const indicator = useGetIndicatorsOverviewId(id);

  if (!indicator) return null;

  return (
    <div className="flex h-full flex-col">
      <Card>
        <CardHeader>
          <CardTitle>{indicator?.name}</CardTitle>
          <CardControls>
            <CardInfo ids={[indicator?.id]} />
          </CardControls>
        </CardHeader>
        <CardContent>
          {type === "map" && <MapIndicators {...indicator} resource={indicator.resource} />}
          {/* resource type Feature Indicators */}
          {type === "chart" && indicator.resource.type === "feature" && (
            <ChartIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "chart" && indicator.resource.type === "imagery-tile" && (
            <ChartImageryIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "numeric" && indicator.resource.type === "feature" && (
            <NumericIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "numeric" && indicator.resource.type === "imagery-tile" && (
            <NumericImageryIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "table" && indicator.resource.type === "feature" && (
            <TableIndicators {...indicator} resource={indicator.resource} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
