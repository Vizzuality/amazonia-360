"use client";

import { useGetOverviewTopics } from "@/lib/topics";

import ReportResultsContentItem from "@/containers/report/results/content/item";

export const WidgetsOverview = () => {
  const { data } = useGetOverviewTopics();

  return data?.map((topic) => {
    const T = {
      ...topic,
      indicators: topic.default_visualization,
    };

    return <ReportResultsContentItem editable={false} key={topic.id} topic={T} />;
  });
};
