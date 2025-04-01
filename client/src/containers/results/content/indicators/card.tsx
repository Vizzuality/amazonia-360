"use client";

import { createElement, MouseEvent } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Indicator, VisualizationTypes } from "@/app/local-api/indicators/route";
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
import { ChartImageryTileIndicators } from "@/containers/indicators/chart/imagery-tile";
import { Municipalities } from "@/containers/indicators/custom/municipalities";
import { TotalArea } from "@/containers/indicators/custom/total-area";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { NumericImageryIndicators } from "@/containers/indicators/numeric/imagery";
import { NumericImageryTileIndicators } from "@/containers/indicators/numeric/imagery-tile";
import { TableIndicators } from "@/containers/indicators/table";

// custom indicators

const COMPONENT_INDICATORS = {
  "total-area": TotalArea,
  AMZ_LOCADM2: Municipalities,
} as const;

type COMPONENT_INDICATORS_KEYS = keyof typeof COMPONENT_INDICATORS;

export default function ReportResultsIndicator({
  id,
  type,
  editable,
  onEdit,
}: {
  id: Indicator["id"];
  type: VisualizationTypes;
  editable: boolean;
  onEdit?: (e: MouseEvent<HTMLElement>) => void;
}) {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  if (!indicator) return null;

  return (
    <div className="flex h-full flex-col">
      <Card className={cn(type === "map" && "p-0")}>
        <CardHeader className={cn(type === "map" && "px-6 pt-6")}>
          <CardTitle>{indicator?.name}</CardTitle>
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

          {/*
            Charts
          */}
          {type === "chart" && indicator.resource.type === "feature" && (
            <ChartIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "chart" && indicator.resource.type === "imagery" && (
            <ChartImageryIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "chart" && indicator.resource.type === "imagery-tile" && (
            <ChartImageryTileIndicators {...indicator} resource={indicator.resource} />
          )}

          {indicator.resource.type === "component" &&
            !!COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS] &&
            createElement(
              COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS],
              { indicator },
            )}

          {type === "numeric" && indicator.resource.type === "feature" && (
            <NumericIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "numeric" && indicator.resource.type === "imagery" && (
            <NumericImageryIndicators {...indicator} resource={indicator.resource} />
          )}
          {type === "numeric" && indicator.resource.type === "imagery-tile" && (
            <NumericImageryTileIndicators {...indicator} resource={indicator.resource} />
          )}

          {/*
            Table
          */}
          {type === "table" && indicator.resource.type === "feature" && (
            <TableIndicators {...indicator} resource={indicator.resource} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
