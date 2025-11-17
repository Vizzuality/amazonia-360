import React, { useCallback } from "react";

import { useParams } from "next/navigation";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { useReport } from "@/lib/report";

import { Indicator } from "@/types/indicator";

import { useLoad } from "@/containers/indicators/load-provider";
import { NumericIndicatorsFeature } from "@/containers/indicators/numeric/feature";
import { NumericImageryIndicators } from "@/containers/indicators/numeric/imagery";
import { NumericImageryTileIndicators } from "@/containers/indicators/numeric/imagery-tile";
import { IndicatorProvider } from "@/containers/indicators/provider";

export const NumericIndicators = ({ id, isPdf }: { id: Indicator["id"]; isPdf?: boolean }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: Number(reportId) });

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${indicator!.id}-numeric`);
  }, [indicator, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "feature" && reportData?.location && (
        <NumericIndicatorsFeature
          {...indicator}
          location={reportData?.location}
          resource={indicator.resource}
          isPdf={isPdf}
        />
      )}
      {indicator.resource.type === "imagery" && reportData?.location && (
        <NumericImageryIndicators
          {...indicator}
          location={reportData?.location}
          resource={indicator.resource}
          isPdf={isPdf}
        />
      )}
      {indicator.resource.type === "imagery-tile" && reportData?.location && (
        <NumericImageryTileIndicators
          {...indicator}
          location={reportData?.location}
          resource={indicator.resource}
          isPdf={isPdf}
        />
      )}
    </IndicatorProvider>
  );
};

export default NumericIndicators;
