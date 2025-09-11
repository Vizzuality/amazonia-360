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
      {isLoadingTopicsData && (
        <>
          <div className="flex items-center space-x-2.5 p-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex items-center space-x-2.5 p-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center space-x-2.5 p-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex items-center space-x-2.5 p-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center space-x-2.5 p-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex items-center space-x-2.5 p-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-40" />
          </div>
        </>
      )}
      {topicsData?.map((topic) => {
        return <TopicsItem key={topic.id} {...topic} />;
      })}
    </div>
  );
}
