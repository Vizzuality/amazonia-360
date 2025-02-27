"use client";

import { useSyncTopics } from "@/app/store";

import ReportResultsContentItem from "@/containers/results/content/item";

export default function ReportResultsContentList() {
  const [topics] = useSyncTopics();

  return (
    <div className="space-y-20">
      {topics?.map((topic) => {
        return <ReportResultsContentItem editable key={topic.id} topic={topic} />;
      })}
    </div>
  );
}
