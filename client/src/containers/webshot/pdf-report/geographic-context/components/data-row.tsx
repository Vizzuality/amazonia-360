"use client";

import { useCallback } from "react";

import { useGetIndicatorsId } from "@/lib/indicators";

import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";

import ComponentDataRow from "./component-data-row";
import FeatureDataRow from "./feature-data-row";
import ImageryDataRow from "./imagery-data-row";
import { DataRowProps } from "./types";

export default function DataRow({ id, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(id, locale);

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${id}-numeric`);
  }, [id, onReady]);

  if (!indicator) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      {indicator.resource.type === "component" && <ComponentDataRow id={id} locale={locale} />}
      {indicator.resource.type === "imagery" && <ImageryDataRow id={id} locale={locale} />}
      {indicator.resource.type === "feature" && <FeatureDataRow id={id} locale={locale} />}
    </IndicatorProvider>
  );
}
