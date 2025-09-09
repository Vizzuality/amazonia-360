"use client";

import { useLocale } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import IndicatorsItem from "./item";

export default function IndicatorsList({ topicId }: { topicId?: Topic["id"] }) {
  const locale = useLocale();

  const { data: indicatorsData, isLoading: isLoadingTopicsData } = useGetDefaultIndicators(
    topicId,
    locale,
  );

  return (
    <div
      className={cn(
        "relative",
        "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-[calc(100%_-_theme(space.5))] before:w-5 before:rounded-b-3xl before:border-b-2 before:border-l-2 before:border-blue-100/75",
        "after:pointer-events-none after:absolute after:left-2.5 after:top-0 after:z-0 after:h-[calc(100%_-_theme(space.5))] after:w-2.5 after:bg-white",
      )}
    >
      <ScrollArea className="relative z-10 flex flex-col gap-0.5 overflow-y-auto p-2 px-4">
        {isLoadingTopicsData && <Skeleton className="h-10" />}
        {indicatorsData?.map((indicator) => {
          return <IndicatorsItem key={indicator.id} {...indicator} />;
        })}
      </ScrollArea>
    </div>
  );
}
