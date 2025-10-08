"use client";

import { createElement, MouseEvent, useCallback } from "react";

import { useSearchParams } from "next/navigation";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";
import { downloadBlobResponse, usePostWebshotWidgetsMutation } from "@/lib/webshot";

import { Indicator, VisualizationTypes } from "@/types/indicator";
import { ResourceFeature, ResourceImageryTile, ResourceWebTile } from "@/types/indicator";

import {
  Card,
  CardContent,
  CardHeader,
  CardControls,
  CardInfo,
  CardTitle,
  CardPopover,
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

import { BASEMAPS } from "@/components/map/controls/basemap";

// custom indicators

const COMPONENT_INDICATORS = {
  "total-area": TotalArea,
  AMZ_LOCADM2: Municipalities,
} as const;

type COMPONENT_INDICATORS_KEYS = keyof typeof COMPONENT_INDICATORS;

export default function ReportResultsIndicator({
  id,
  type,
  basemapId,
  editable,
  onEdit,
  isWebshot = false,
  isPdf = false,
}: {
  id: Indicator["id"];
  type: VisualizationTypes;
  basemapId?: (typeof BASEMAPS)[number]["id"];
  editable: boolean;
  onEdit?: (e: MouseEvent<HTMLElement>) => void;
  isWebshot?: boolean;
  isPdf?: boolean;
}) {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);
  const searchParams = useSearchParams();

  const postWebshotWidgetsMutation = usePostWebshotWidgetsMutation();

  const onWebshotDownload = useCallback(
    async (format: string) => {
      postWebshotWidgetsMutation.mutate(
        {
          pagePath: `/${locale}/webshot/widgets/${id}/${type}?${searchParams.toString()}`,
          outputFileName: `indicator-${id}.${format.toLowerCase()}`,
          params: undefined,
        },
        {
          onSuccess: async (res) => {
            await downloadBlobResponse(res.data, `indicator-${id}-${type}.${format.toLowerCase()}`);
          },
          onError: (error) => {
            console.error("Error downloading widget:", error);
          },
        },
      );
    },
    [id, type, locale, searchParams, postWebshotWidgetsMutation],
  );

  if (!indicator) return null;

  return (
    <div className="flex h-full flex-col">
      <Card withoutBorder={isWebshot}>
        <CardHeader className="h-auto px-4 pb-1.5 pt-2">
          <CardTitle>{indicator?.name}</CardTitle>
          <CardControls>
            {!isWebshot && !isPdf && <CardInfo ids={[indicator.id]} />}

            {editable && (
              <CardPopover
                id={indicator?.id}
                onClick={onEdit}
                onWebshotDownload={onWebshotDownload}
                isDownloading={postWebshotWidgetsMutation.isPending}
              />
            )}
          </CardControls>
        </CardHeader>
        <CardContent
          className={cn({
            "px-4 pb-4": type !== "map",
          })}
        >
          {type === "map" && indicator.resource.type !== "h3" && (
            <MapIndicators
              {...(indicator as Omit<Indicator, "resource"> & {
                resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
              })}
              basemapId={basemapId}
              isWebshot={isWebshot}
              isPdf={isPdf}
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
            <NumericIndicators {...indicator} resource={indicator.resource} isPdf={isPdf} />
          )}
          {type === "numeric" && indicator.resource.type === "imagery" && (
            <NumericImageryIndicators {...indicator} resource={indicator.resource} isPdf={isPdf} />
          )}
          {type === "numeric" && indicator.resource.type === "imagery-tile" && (
            <NumericImageryTileIndicators
              {...indicator}
              resource={indicator.resource}
              isPdf={isPdf}
            />
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
