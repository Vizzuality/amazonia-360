"use client";

import { useMemo } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import Pluralize from "pluralize";

import { joinWithAnd } from "@/lib/utils";

export default function WidgetEnvironmentSummaryHydro({
  query,
}: {
  query: UseQueryResult<__esri.FeatureSet, unknown>;
}) {
  const STATISTICS = useMemo(() => {
    return {
      basin: new Set(query.data?.features.map((f) => f.attributes.MAJ_NAME)),
    };
  }, [query.data]);

  return (
    <>
      Positioned within the hydrographic {Pluralize("basin", STATISTICS.basin.size)} of the{" "}
      <strong>{joinWithAnd(Array.from(STATISTICS.basin.values()))}</strong>
    </>
  );
}
