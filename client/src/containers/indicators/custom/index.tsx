import React, { createElement, useCallback } from "react";

import { useParams } from "next/navigation";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { useReport } from "@/lib/report";

import { Indicator } from "@/types/indicator";

import { Municipalities } from "@/containers/indicators/custom/municipalities";
import { TotalArea } from "@/containers/indicators/custom/total-area";
import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";

const COMPONENT_INDICATORS = {
  "total-area": TotalArea,
  AMZ_LOCADM2: Municipalities,
} as const;

type COMPONENT_INDICATORS_KEYS = keyof typeof COMPONENT_INDICATORS;

export const CustomIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${indicator!.id}-custom`);
  }, [indicator, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "component" &&
        reportData?.location &&
        !!COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS] &&
        createElement(
          COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS],
          { indicator, location: reportData?.location },
        )}
    </IndicatorProvider>
  );
};

export default CustomIndicators;
