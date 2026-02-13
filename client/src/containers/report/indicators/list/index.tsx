"use client";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { Skeleton } from "@/components/ui/skeleton";

import IndicatorsItem from "./item";

export default function IndicatorsList({ subtopicId }: { subtopicId?: Subtopic["id"] }) {
  const t = useTranslations();
  const locale = useLocale();

  const {
    data: indicatorsData,
    isFetching,
    isFetched,
  } = useGetDefaultIndicators({
    subtopicId,
    locale,
  });

  return (
    <div
      className={cn(
        "relative",
        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-[calc(100%_-_calc(var(--spacing)*5))] before:w-5 before:rounded-b-3xl before:border-b-2 before:border-l-2 before:border-blue-100/40",
        "after:pointer-events-none after:absolute after:top-0 after:left-2.5 after:z-0 after:h-[calc(100%_-_calc(var(--spacing)*5))] after:w-2.5 after:bg-white",
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

        {!isFetching && isFetched && !indicatorsData?.length && (
          <p className="text-muted-foreground p-2 text-sm font-medium">
            {t("grid-sidebar-grid-filters-no-indicators-available")}
          </p>
        )}

        {!isFetching &&
          isFetched &&
          !!indicatorsData?.length &&
          indicatorsData?.map((indicator) => {
            return <IndicatorsItem key={indicator.id} {...indicator} />;
          })}
      </div>
    </div>
  );
}
