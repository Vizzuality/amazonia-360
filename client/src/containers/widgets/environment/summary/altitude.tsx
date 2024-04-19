"use client";

import { useMemo } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import Pluralize from "pluralize";

import { useFormatPercentage } from "@/lib/formats";
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

  const { format } = useFormatPercentage({
    maximumFractionDigits: 1,
  });

  return (
    <>
      The region is situated within an{" "}
      {Pluralize("altitude range", STATISTICS.altitudes.size)} of{" "}
      <strong>
        {joinWithAnd(
          Array.from(STATISTICS.altitudes.values()).map(
            (v) => `${v.label} (${format(v.x)})`,
          ),
        )}
      </strong>
    </>
  );
}
