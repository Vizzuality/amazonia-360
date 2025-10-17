import React, { useCallback } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { ChartIndicatorsFeature } from "@/containers/indicators/chart/feature";
import { ChartImageryIndicators } from "@/containers/indicators/chart/imagery";
import { ChartImageryTileIndicators } from "@/containers/indicators/chart/imagery-tile";
import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";

export const ChartIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${indicator!.id}-chart`);
  }, [indicator, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "feature" && (
        <ChartIndicatorsFeature {...indicator} resource={indicator.resource} />
      )}
      {indicator.resource.type === "imagery" && (
        <ChartImageryIndicators {...indicator} resource={indicator.resource} />
      )}
      {indicator.resource.type === "imagery-tile" && (
        <ChartImageryTileIndicators {...indicator} resource={indicator.resource} />
      )}
    </IndicatorProvider>
  );
};

export default ChartIndicators;
