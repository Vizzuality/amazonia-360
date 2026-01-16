"use client";

import { useMemo } from "react";

import { useAtomValue } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { useGetH3Indicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { selectedFiltersViewAtom, useSyncGridDatasets } from "@/app/(frontend)/store";

import { Skeleton } from "@/components/ui/skeleton";

import GridIndicatorsItem from "./item";

export default function GridIndicatorsList({ subtopicId }: { subtopicId?: Subtopic["id"] }) {
  const locale = useLocale();
  const t = useTranslations();

  const selectedFiltersView = useAtomValue(selectedFiltersViewAtom);
  const [gridDatasets] = useSyncGridDatasets();

  const {
    data: indicatorsData,
    isFetching,
    isFetched,
  } = useGetH3Indicators({
    subtopicId,
    locale,
  });

  const DATA = useMemo(() => {
    if (!indicatorsData) return [];
    if (selectedFiltersView) {
      return indicatorsData.filter((indicator) => gridDatasets.includes(indicator.resource.column));
    }
    return indicatorsData || [];
  }, [indicatorsData, gridDatasets, selectedFiltersView]);

  return (
    <div
      className={cn(
        "relative",
        "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-[calc(100%_-_theme(space.5))] before:w-5 before:rounded-b-3xl before:border-b-2 before:border-l-2 before:border-blue-100/40",
        "after:pointer-events-none after:absolute after:left-2.5 after:top-0 after:z-0 after:h-[calc(100%_-_theme(space.5))] after:w-2.5 after:bg-white",
      )}
    >
      <div className="relative z-10 flex flex-col gap-0.5 p-2 pl-3 pr-1">
        {isFetching && !isFetched && (
          <>
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
          </>
        )}

        {!isFetching && isFetched && !DATA?.length && (
          <p className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            {t("grid-sidebar-grid-filters-no-indicators-available")}
          </p>
        )}

        {!isFetching &&
          isFetched &&
          !!DATA?.length &&
          DATA?.map((indicator) => {
            return <GridIndicatorsItem key={indicator.id} {...indicator} />;
          })}
      </div>
    </div>
  );
}
