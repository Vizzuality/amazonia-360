"use client";

import { createElement, MouseEvent } from "react";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Indicator, VisualizationType } from "@/app/local-api/indicators/route";
import {
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/app/local-api/indicators/route";

import {
  Card,
  CardContent,
  CardHeader,
  CardControls,
  CardSettings,
  CardInfo,
  CardTitle,
} from "@/containers/card";
import { ChartIndicators } from "@/containers/indicators/chart";
import { ChartImageryIndicators } from "@/containers/indicators/chart/imagery";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { NumericImageryIndicators } from "@/containers/indicators/numeric/imagery";
import { TotalArea } from "@/containers/indicators/numeric/total-area";
import { TableIndicators } from "@/containers/indicators/table";

const COMPONENT_INDICATORS = {
  "total-area": TotalArea,
} as const;

type COMPONENT_INDICATORS_KEYS = keyof typeof COMPONENT_INDICATORS;

export default function ReportResultsIndicator({
  id,
  type,
  editable,
  onEdit,
}: {
  id: Indicator["id"];
  type: VisualizationType;
  editable: boolean;
  onEdit?: (e: MouseEvent<HTMLElement>) => void;
}) {
  const indicator = useGetIndicatorsId(id);

  if (!indicator) return null;
  return (
    <div className="flex h-full flex-col">
      <Card className={cn(type === "map" && "p-0")}>
        <CardHeader className={cn(type === "map" && "px-6 pt-6")}>
          <CardTitle>{indicator?.name_en}</CardTitle>
          <CardControls>
            <CardInfo ids={[indicator.id]} />

            {editable && <CardSettings id={indicator?.id} onClick={onEdit} />}
          </CardControls>
        </CardHeader>
        <CardContent>
          {type === "map" && indicator.resource.type !== "h3" && (
            <MapIndicators
              {...(indicator as Omit<Indicator, "resource"> & {
                resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
              })}
            />
          )}
          {/* resource type Feature Indicators */}
          {type === "chart" && indicator.resource.type === "feature" && (
            <ChartIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "chart" && indicator.resource.type === "imagery-tile" && (
            <ChartImageryIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "numeric" &&
            indicator.resource.type === "component" &&
            !!COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS] &&
            createElement(
              COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS],
              { indicator },
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
