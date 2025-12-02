import React, { useCallback } from "react";

import { useParams } from "next/navigation";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { useReport } from "@/lib/report";

import { Indicator } from "@/types/indicator";

import { ChartIndicatorsFeature } from "@/containers/indicators/chart/feature";
import { ChartImageryIndicators } from "@/containers/indicators/chart/imagery";
import { ChartImageryTileIndicators } from "@/containers/indicators/chart/imagery-tile";
import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";

export const ChartIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${indicator!.id}-chart`);
  }, [indicator, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "feature" && reportData?.location && (
        <ChartIndicatorsFeature
          {...indicator}
          resource={indicator.resource}
          location={reportData?.location}
        />
      )}
      {indicator.resource.type === "imagery" && reportData?.location && (
        <ChartImageryIndicators
          {...indicator}
          resource={indicator.resource}
          location={reportData?.location}
        />
      )}
      {indicator.resource.type === "imagery-tile" && reportData?.location && (
        <ChartImageryTileIndicators
          {...indicator}
          resource={indicator.resource}
          location={reportData?.location}
        />
      )}
    </IndicatorProvider>
  );
};

export default ChartIndicators;
