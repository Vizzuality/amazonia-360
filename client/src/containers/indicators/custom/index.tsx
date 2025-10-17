import React, { createElement, useCallback } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { Municipalities } from "@/containers/indicators/custom/municipalities";
import { TotalArea } from "@/containers/indicators/custom/total-area";
import { IndicatorProvider } from "@/containers/indicators/provider";

const COMPONENT_INDICATORS = {
  "total-area": TotalArea,
  AMZ_LOCADM2: Municipalities,
} as const;

type COMPONENT_INDICATORS_KEYS = keyof typeof COMPONENT_INDICATORS;

export const CustomIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const handleLoad = useCallback(() => {
    console.info(`Indicator loaded: ${indicator?.name}`);
  }, [indicator]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "component" &&
        !!COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS] &&
        createElement(
          COMPONENT_INDICATORS[`${indicator.resource.name}` as COMPONENT_INDICATORS_KEYS],
          { indicator },
        )}
    </IndicatorProvider>
  );
};

export default CustomIndicators;
