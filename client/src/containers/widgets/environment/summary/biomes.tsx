"use client";

import { useMemo } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import Pluralize from "pluralize";

import { joinWithAnd } from "@/lib/utils";

export default function WidgetEnvironmentSummaryBiomes({
  query,
}: {
  query: UseQueryResult<__esri.FeatureSet, unknown>;
}) {
  const STATISTICS = useMemo(() => {
    return {
      biomes: new Set(query.data?.features.map((f) => f.attributes.BIOMADES)),
    };
  }, [query.data]);

  return (
    <>
      The region showcases the rich biodiversity typical of{" "}
      <strong>{joinWithAnd(Array.from(STATISTICS.biomes.values()))}</strong>{" "}
      {Pluralize("biome", STATISTICS.biomes.size)}
    </>
  );
}
