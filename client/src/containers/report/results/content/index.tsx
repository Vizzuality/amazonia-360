"use client";

import { TopicView } from "@/app/parsers";
import { useSyncTopics } from "@/app/store";

import ReportResultsContentItem from "@/containers/report/results/content/item";
import WidgetsOtherResources from "@/containers/widgets/other-resources";

export interface ReportResultsContentItemProps {
  topic: TopicView;
}

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      {/* <WidgetsOverview /> */}

      {/* topicsData DASHBOARD */}
      <div className="space-y-20">
        {topics?.map((topic) => {
          return <ReportResultsContentItem key={topic.id} topic={topic} />;
        })}
      </div>

      {/* OTHER RESOURCES */}
      <WidgetsOtherResources />
    </div>
  );
}
