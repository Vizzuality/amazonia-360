"use client";

import { useLocale } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";

import { Topic } from "@/types/topic";

import { Skeleton } from "@/components/ui/skeleton";

import IndicatorsItem from "./item";

export default function IndicatorsList({ topicId }: { topicId?: Topic["id"] }) {
  const locale = useLocale();

  const { data: indicatorsData, isLoading: isLoadingTopicsData } = useGetDefaultIndicators(
    topicId,
    locale,
  );

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto border-l border-gray-200 p-2">
      {isLoadingTopicsData && <Skeleton className="h-10" />}
      {indicatorsData?.map((indicator) => {
        return <IndicatorsItem key={indicator.id} {...indicator} />;
      })}
    </div>
  );
}
