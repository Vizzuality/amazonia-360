"use client";

import { useLocale } from "next-intl";

import { useGetDefaultTopics } from "@/lib/topics";

import { Skeleton } from "@/components/ui/skeleton";

import TopicsItem from "./item";

export default function TopicsList() {
  const locale = useLocale();

  const { data: topicsData, isLoading: isLoadingTopicsData } = useGetDefaultTopics({
    locale,
  });

  return (
    <div className="flex flex-col gap-0.5">
      {isLoadingTopicsData && <Skeleton className="h-20" />}
      {topicsData?.map((topic) => {
        return <TopicsItem key={topic.id} {...topic} />;
      })}
    </div>
  );
}
