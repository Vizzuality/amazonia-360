import { TopicView } from "@/app/parsers";

import ReportResultsContentList from "@/containers/results/content/list";
import ReportResultsContentOtherResources from "@/containers/results/content/other-resources";
import ReportResultsContentOverview from "@/containers/results/content/overview";

export interface ReportResultsContentItemProps {
  topic: TopicView;
}

export default function ReportResultsContent() {
  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <ReportResultsContentOverview />

      {/* LIST */}
      <ReportResultsContentList />

      {/* OTHER RESOURCES */}
      <ReportResultsContentOtherResources />
    </div>
  );
}
