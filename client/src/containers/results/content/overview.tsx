"use client";

import { useLocale } from "next-intl";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetOverviewTopics } from "@/lib/topics";

import ReportResultsContentItem from "@/containers/results/content/item";

export const ReportResultsContentOverview = () => {
  const locale = useLocale();
  const { data } = useGetOverviewTopics({ locale });
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale, topicId: 0 });

  return data?.map((topic) => {
    const T = {
      ...topic,
      id: `${topic.id}`,
      topic_id: topic.id,
      indicators: subtopicsData?.map((s) => s.default_visualization).flat() || [],
    };

    return <ReportResultsContentItem editable={false} key={T.id} topic={T} />;
  });
};

export default ReportResultsContentOverview;
