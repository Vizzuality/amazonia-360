"use client";

import { useGetIndicatorsId } from "@/lib/indicators";

import ComponentDataRow from "./component-data-row";
import FeatureDataRow from "./feature-data-row";
import ImageryDataRow from "./imagery-data-row";
import { DataRowProps } from "./types";

export default function DataRow({ indicatorId, locale }: DataRowProps) {
  const indicator = useGetIndicatorsId(indicatorId, locale);

  if (!indicator) return null;

  if (indicator.resource.type === "component") {
    return <ComponentDataRow indicatorId={indicatorId} locale={locale} />;
  }

  if (indicator.resource.type === "imagery") {
    return <ImageryDataRow indicatorId={indicatorId} locale={locale} />;
  }

  return <FeatureDataRow indicatorId={indicatorId} locale={locale} />;
}
