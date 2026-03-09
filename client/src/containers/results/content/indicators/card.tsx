"use client";

import { useCallback, useRef, useState } from "react";

import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { toast, useSonner } from "sonner";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";

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
import { exportToPng } from "@/lib/webshot";

import { useSidebar } from "@/components/ui/sidebar";

import { Report } from "@/payload-types";

export default function ReportResultsIndicator(props: {
  id: Report["id"];
  indicatorId: Indicator["id"];
  type: VisualizationTypes;
  basemapId?: BasemapIds;
  editable: boolean;
  isWebshot?: boolean;
  isPdf?: boolean;
}) {
  return <ReportResultsIndicatorContent {...props} />;
}

function ReportResultsIndicatorContent({
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);
  const handleEdit = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(!reportEditionMode);
  }, [toggleSidebar, setReportEditionMode, reportEditionMode]);

  const handleDownload = useCallback(
    async (format: string) => {
      if (toasts.find((t) => t.id === `indicator-${indicatorId}-${type}`)) return;
      if (!cardRef.current) return;

      const filename = `indicator-${id}-${indicatorId}-${type}.${format.toLowerCase()}`;
      const element = cardRef.current;

      setIsExporting(true);

      toast.promise(
        exportToPng(element, filename).finally(() => {
          setIsExporting(false);
        }),
        {
          id: `indicator-${id}-${indicatorId}-${type}`,
          loading: t("indicator-webshot-loading", { name: indicator?.name ?? "" }),
          success: t("indicator-webshot-success", { name: indicator?.name ?? "" }),
          error: t("indicator-webshot-error", { name: indicator?.name ?? "" }),
        },
      );
    },
    [id, indicatorId, t, indicator, type, toasts],
  );

  if (!indicator) return null;

  return (
    <div className="flex h-full flex-col" ref={cardRef}>
      <Card withoutBorder={isWebshot}>
        <CardHeader className="h-auto px-4 pt-2 pb-1.5">
          <CardTitle>{indicator?.name}</CardTitle>
          <CardControls data-export-exclude>
            {!isWebshot && !isPdf && <CardInfo ids={[indicator.id]} />}

            {editable && (
              <CardPopover
                id={indicator?.id}
                onClick={handleEdit}
                onDownload={handleDownload}
                isDownloading={isExporting}
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
