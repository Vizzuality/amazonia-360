"use client";

import { useLocale } from "next-intl";

import { useGetOverviewTopics } from "@/lib/topics";

import ReportResultsContentItem from "@/containers/results/content/item";

export const ReportResultsContentOverview = () => {
  const locale = useLocale();
  const { data } = useGetOverviewTopics({ locale });

  return data?.map((topic) => {
    const T = {
      ...topic,
      indicators: topic.default_visualization,
    };

    return <ReportResultsContentItem editable={false} key={topic.id} topic={T} />;
  });
};

export default ReportResultsContentOverview;
