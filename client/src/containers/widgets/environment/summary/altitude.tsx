"use client";

import { useMemo } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import Pluralize from "pluralize";

import { formatPercentage } from "@/lib/formats";
import { joinWithAnd } from "@/lib/utils";

export default function WidgetEnvironmentSummaryAltitude({
  query,
}: {
  query: UseQueryResult<
    {
      id: number;
      x: number;
      y: number;
      label: string;
      color: string;
    }[],
    unknown
  >;
}) {
  const STATISTICS = useMemo(() => {
    return {
      altitudes: new Set(query.data?.map((d) => d)),
    };
  }, [query.data]);

  return (
    <>
      The region is situated within an{" "}
      {Pluralize("altitude range", STATISTICS.altitudes.size)} of{" "}
      <strong>
        {joinWithAnd(
          Array.from(STATISTICS.altitudes.values()).map(
            (v) =>
              `${v.label} (${formatPercentage(v.x, {
                maximumFractionDigits: 0,
              })})`,
          ),
        )}
      </strong>
    </>
  );
}
