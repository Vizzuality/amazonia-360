import React, { useCallback } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { IndicatorProvider } from "@/containers/indicators/provider";
import { TableIndicatorsFeature } from "@/containers/indicators/table/feature";

export const TableIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const handleLoad = useCallback(() => {
    console.info(`Indicator loaded: ${indicator?.name}`);
  }, [indicator]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "feature" && (
        <TableIndicatorsFeature {...indicator} resource={indicator.resource} />
      )}
    </IndicatorProvider>
  );
};

export default TableIndicators;
