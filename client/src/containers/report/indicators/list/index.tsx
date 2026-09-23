"use client";

import { useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { useSyncIndicatorsScopeFilter } from "@/app/(frontend)/store";

import { getFilteredIndicators } from "@/containers/indicators/filter-tabs";

import { Skeleton } from "@/components/ui/skeleton";

import { useCountry } from "@/i18n/use-country";

import IndicatorsItem from "./item";

export default function IndicatorsList({ subtopicId }: { subtopicId?: Subtopic["id"] }) {
  const t = useTranslations();
  const locale = useLocale();
  const country = useCountry();
  const [scopeFilter] = useSyncIndicatorsScopeFilter();

  const {
    data: indicatorsData,
    isFetching,
    isFetched,
  } = useGetDefaultIndicators({
    subtopicId,
    locale,
  });

  const filteredIndicators = useMemo(
    () => getFilteredIndicators(indicatorsData ?? [], country ? scopeFilter : "all"),
    [indicatorsData, scopeFilter, country],
  );

  return (
    <div
      className={cn(
        "relative",
        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-[calc(100%-calc(var(--spacing)*5))] before:w-5 before:rounded-b-3xl before:border-b-2 before:border-l-2 before:border-blue-100/40",
        "after:pointer-events-none after:absolute after:top-0 after:left-2.5 after:z-0 after:h-[calc(100%-calc(var(--spacing)*5))] after:w-2.5 after:bg-white",
      )}
    >
      <div className="relative z-10 flex flex-col gap-0.5 p-2 pl-3">
        {isFetching && !isFetched && (
          <>
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
          </>
        )}

        {!isFetching && isFetched && !filteredIndicators.length && (
          <p className="text-muted-foreground p-2 text-sm font-medium">
            {t("grid-sidebar-grid-filters-no-indicators-available")}
          </p>
        )}

        {!isFetching &&
          isFetched &&
          !!filteredIndicators.length &&
          filteredIndicators.map((indicator) => {
            return <IndicatorsItem key={indicator.id} {...indicator} />;
          })}
      </div>
    </div>
  );
}
