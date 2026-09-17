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
      id: `${topic.id}`,
      topic_id: topic.id,
      // TopicView is the shape a saved report and a shared URL serialize, where an absent
      // description is absent rather than null.
      description: topic.description ?? undefined,
      indicators: topic.default_visualization,
    };

    return <ReportResultsContentItem editable={false} key={T.id} topic={T} />;
  });
};

export default ReportResultsContentOverview;
