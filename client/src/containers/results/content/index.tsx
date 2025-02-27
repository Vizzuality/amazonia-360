"use client";

import { TopicView } from "@/app/parsers";
import { useSyncTopics } from "@/app/store";

import ReportResultsContentItem from "@/containers/results/content/item";
import ReportResultsContentOtherResources from "@/containers/results/content/other-resources";
import ReportResultsContentOverview from "@/containers/results/content/overview";

export interface ReportResultsContentItemProps {
  topic: TopicView;
}

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <ReportResultsContentOverview />

      {/* topicsData DASHBOARD */}
      <div className="space-y-20">
        {topics?.map((topic) => {
          return <ReportResultsContentItem editable key={topic.id} topic={topic} />;
        })}
      </div>

      {/* OTHER RESOURCES */}
      <ReportResultsContentOtherResources />
    </div>
  );
}
