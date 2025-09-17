"use client";

import { useLocale } from "next-intl";

import { useGetDefaultTopics } from "@/lib/topics";

import TopicsItem from "@/containers/report/generate/topics/item";

import { Skeleton } from "@/components/ui/skeleton";

export default function Topics() {
  const locale = useLocale();

  const { data: topicsData, isLoading: isLoadingTopicsData } = useGetDefaultTopics({
    locale,
  });

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {isLoadingTopicsData && <Skeleton className="h-20" />}
      {topicsData?.map((topic) => {
        return <TopicsItem key={topic.id} {...topic} />;
      })}
    </div>
  );
}
