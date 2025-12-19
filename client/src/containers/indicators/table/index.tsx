import React, { useCallback } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { useFormLocation } from "@/app/(frontend)/store";

import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";
import { TableIndicatorsFeature } from "@/containers/indicators/table/feature";

export const TableIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const { location } = useFormLocation();

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${indicator!.id}-table`);
  }, [indicator, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "feature" && location && (
        <TableIndicatorsFeature {...indicator} location={location} resource={indicator.resource} />
      )}
    </IndicatorProvider>
  );
};

export default TableIndicators;
