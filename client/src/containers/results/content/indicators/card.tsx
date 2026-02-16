"use client";

import { useCallback } from "react";

import { useSearchParams } from "next/navigation";

import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { toast, useSonner } from "sonner";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";
import { downloadBlobResponse, usePostWebshotWidgetsMutation } from "@/lib/webshot";

import { Indicator, VisualizationTypes } from "@/types/indicator";
import { ResourceFeature, ResourceImageryTile, ResourceWebTile } from "@/types/indicator";

import { reportEditionModeAtom } from "@/app/(frontend)/store";

import { BasemapIds } from "@/constants/basemaps";

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
import { CustomIndicators } from "@/containers/indicators/custom";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { TableIndicators } from "@/containers/indicators/table";

import { useSidebar } from "@/components/ui/sidebar";

import { Report } from "@/payload-types";

// custom indicators

export default function ReportResultsIndicator({
  id,
  indicatorId,
  type,
  basemapId,
  editable,
  isWebshot = false,
  isPdf = false,
}: {
  id: Report["id"];
  indicatorId: Indicator["id"];
  type: VisualizationTypes;
  basemapId?: BasemapIds;
  editable: boolean;
  isWebshot?: boolean;
  isPdf?: boolean;
}) {
  const { toasts } = useSonner();
  const locale = useLocale();
  const t = useTranslations();
  const indicator = useGetIndicatorsId(indicatorId, locale);
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
      if (toasts.find((t) => t.id === `indicator-${indicatorId}-${type}`)) return;

      toast.promise(
        postWebshotWidgetsMutation.mutateAsync(
          {
            pagePath: `/${locale}/webshot/widgets/${id}/${indicatorId}/${type}?${searchParams.toString()}`,
            outputFileName: `indicator-${id}-${indicatorId}-${type}.${format.toLowerCase()}`,
            params: undefined,
          },
          {
            onSuccess: async (res) => {
              await downloadBlobResponse(
                res.data,
                `indicator-${id}-${indicatorId}-${type}.${format.toLowerCase()}`,
              );
            },
            onError: (error) => {
              console.error("Error downloading widget:", error);
            },
          },
        ),
        {
          id: `indicator-${id}-${indicatorId}-${type}`,
          loading: t("indicator-webshot-loading", { name: indicator?.name ?? "" }),
          success: t("indicator-webshot-success", { name: indicator?.name ?? "" }),
          error: t("indicator-webshot-error", { name: indicator?.name ?? "" }),
        },
      );
    },
    [id, indicatorId, t, indicator, type, toasts, locale, searchParams, postWebshotWidgetsMutation],
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
          {type === "chart" && indicator.resource.type !== "component" && (
            <ChartIndicators id={indicatorId} />
          )}

          {/*
            Custom
          */}
          {indicator.resource.type === "component" && <CustomIndicators id={indicatorId} />}

          {/*
            Numeric
          */}
          {type === "numeric" && indicator.resource.type !== "component" && (
            <NumericIndicators id={indicatorId} isPdf={isPdf} />
          )}

          {/*
            Table
          */}
          {type === "table" &&
            indicator.resource.type !== "component" &&
            indicator.resource.type === "feature" && <TableIndicators id={indicatorId} />}
        </CardContent>
      </Card>
    </div>
  );
}
