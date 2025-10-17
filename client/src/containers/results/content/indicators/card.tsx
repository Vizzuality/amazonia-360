"use client";

import { createElement, useCallback } from "react";

import { useSearchParams } from "next/navigation";

import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { toast, useSonner } from "sonner";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";
import { downloadBlobResponse, usePostWebshotWidgetsMutation } from "@/lib/webshot";

import { Indicator, VisualizationTypes } from "@/types/indicator";
import { ResourceFeature, ResourceImageryTile, ResourceWebTile } from "@/types/indicator";

import { reportEditionModeAtom } from "@/app/store";

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
import { Municipalities } from "@/containers/indicators/custom/municipalities";
import { TotalArea } from "@/containers/indicators/custom/total-area";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { NumericImageryIndicators } from "@/containers/indicators/numeric/imagery";
import { NumericImageryTileIndicators } from "@/containers/indicators/numeric/imagery-tile";
import { TableIndicators } from "@/containers/indicators/table";

import { BASEMAPS } from "@/components/map/controls/basemap";
import { useSidebar } from "@/components/ui/sidebar";

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
  isWebshot = false,
  isPdf = false,
}: {
  id: Indicator["id"];
  type: VisualizationTypes;
  basemapId?: (typeof BASEMAPS)[number]["id"];
  editable: boolean;
  isWebshot?: boolean;
  isPdf?: boolean;
}) {
  const { toasts } = useSonner();
  const locale = useLocale();
  const t = useTranslations();
  const indicator = useGetIndicatorsId(id, locale);
  const searchParams = useSearchParams();

  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  const postWebshotWidgetsMutation = usePostWebshotWidgetsMutation();

  const handleEdit = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(!reportEditionMode);
  }, [toggleSidebar, setReportEditionMode, reportEditionMode]);

  const handleWebshotDownload = useCallback(
    async (format: string) => {
      if (toasts.find((t) => t.id === `indicator-${id}-${type}`)) return;

      toast.promise(
        postWebshotWidgetsMutation.mutateAsync(
          {
            pagePath: `/${locale}/webshot/widgets/${id}/${type}?${searchParams.toString()}`,
            outputFileName: `indicator-${id}.${format.toLowerCase()}`,
            params: undefined,
          },
          {
            onSuccess: async (res) => {
              await downloadBlobResponse(
                res.data,
                `indicator-${id}-${type}.${format.toLowerCase()}`,
              );
            },
            onError: (error) => {
              console.error("Error downloading widget:", error);
            },
          },
        ),
        {
          id: `indicator-${id}-${type}`,
          loading: t("indicator-webshot-loading", { name: indicator?.name ?? "" }),
          success: t("indicator-webshot-success", { name: indicator?.name ?? "" }),
          error: t("indicator-webshot-error", { name: indicator?.name ?? "" }),
        },
      );
    },
    [id, t, indicator, type, toasts, locale, searchParams, postWebshotWidgetsMutation],
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
                onClick={handleEdit}
                onWebshotDownload={handleWebshotDownload}
                isDownloading={postWebshotWidgetsMutation.isPending}
              />
            )}
          </CardControls>
        </CardHeader>
        <CardContent
          className={cn({
            "px-4 pb-4": type !== "map",
            "justify-between": type === "numeric" && isPdf,
          })}
        >
          {type === "map" && !!indicator.resource.type && indicator.resource.type !== "h3" && (
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
          {type === "chart" && <ChartIndicators id={id} />}

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
