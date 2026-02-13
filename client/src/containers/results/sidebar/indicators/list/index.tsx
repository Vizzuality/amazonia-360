"use client";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Subtopic, Topic } from "@/types/topic";

import { Skeleton } from "@/components/ui/skeleton";

import { IndicatorsItem } from "./item";

export const IndicatorsList = ({
  topicId,
  subtopicId,
}: {
  topicId: Topic["id"];
  subtopicId: Subtopic["id"];
}) => {
  const locale = useLocale();
  const t = useTranslations();

  const {
    data: indicatorsData,
    isFetching,
    isFetched,
  } = useGetDefaultIndicators({
    subtopicId: subtopicId,
    locale,
  });

  return (
    <ul
      className={cn(
        "relative space-y-0.5 p-1 pr-0.5 pl-3 text-sm font-medium",
        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-[calc(100%_-_calc(var(--spacing)*4))] before:w-5 before:rounded-b-3xl before:border-b-2 before:border-l-2 before:border-blue-100/40",
        "after:pointer-events-none after:absolute after:top-0 after:left-2.5 after:z-0 after:h-[calc(100%_-_calc(var(--spacing)*4))] after:w-2.5 after:bg-white",
      )}
    >
      {isFetching && !isFetched && (
        <>
          <Skeleton className="h-7" />
          <Skeleton className="h-7" />
          <Skeleton className="h-7" />
        </>
      )}

      {!isFetching && isFetched && !indicatorsData?.length && (
        <p className="text-muted-foreground p-2 text-sm font-medium">
          {t("grid-sidebar-grid-filters-no-indicators-available")}
        </p>
      )}

      {!isFetching &&
        isFetched &&
        !!indicatorsData?.length &&
        indicatorsData?.map((indicator) => {
          return (
            <li key={`${indicator.id}-${subtopicId}`}>
              <IndicatorsItem topicId={topicId} indicator={indicator} />
            </li>
          );
        })}
    </ul>
  );
};

export default IndicatorsList;
