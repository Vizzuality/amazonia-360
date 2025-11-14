import React, { useCallback } from "react";

import { useParams } from "next/navigation";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { useReport } from "@/lib/report";

import { Indicator } from "@/types/indicator";

import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";
import { TableIndicatorsFeature } from "@/containers/indicators/table/feature";

export const TableIndicators = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: Number(reportId) });

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${indicator!.id}-table`);
  }, [indicator, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "feature" && reportData?.location && (
        <TableIndicatorsFeature
          {...indicator}
          location={reportData.location}
          resource={indicator.resource}
        />
      )}
    </IndicatorProvider>
  );
};

export default TableIndicators;
