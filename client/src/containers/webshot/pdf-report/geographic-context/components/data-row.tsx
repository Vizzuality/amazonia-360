"use client";

import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useGetIndicatorsId } from "@/lib/indicators";
import { useReport } from "@/lib/report";

import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";

import ComponentDataRow from "./component-data-row";
import FeatureDataRow from "./feature-data-row";
import ImageryDataRow from "./imagery-data-row";
import { DataRowProps } from "./types";

export default function DataRow({ id, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(id, locale);

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: Number(reportId) });

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${id}-numeric`);
  }, [id, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "component" && reportData?.location && (
        <ComponentDataRow id={id} locale={locale} location={reportData.location} />
      )}
      {indicator.resource.type === "imagery" && reportData?.location && (
        <ImageryDataRow id={id} locale={locale} location={reportData.location} />
      )}
      {indicator.resource.type === "feature" && reportData?.location && (
        <FeatureDataRow id={id} locale={locale} location={reportData.location} />
      )}
    </IndicatorProvider>
  );
}
