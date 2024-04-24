"use client";

import { useMemo } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import Pluralize from "pluralize";

import { joinWithAnd } from "@/lib/utils";

export default function WidgetEnvironmentSummaryClimate({
  query,
}: {
  query: UseQueryResult<__esri.FeatureSet, unknown>;
}) {
  const STATISTICS = useMemo(() => {
    return {
      climates: new Set(query.data?.features.map((f) => f.attributes.Field3)),
    };
  }, [query.data]);

  return (
    <>
      The region typically experiences a{" "}
      <strong>{joinWithAnd(Array.from(STATISTICS.climates.values()))}</strong>{" "}
      {Pluralize("climate type", STATISTICS.climates.size)}
    </>
  );
}
