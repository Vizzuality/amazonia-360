"use client";

import { useSyncTopics } from "@/app/store";

import ReportResultsContentItem from "@/containers/report/results/content/item";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {/* topicsData DASHBOARD */}

      {/* TO - DO - change topic dashboard (pass this to that component)*/}
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
