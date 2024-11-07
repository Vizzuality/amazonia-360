"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, TopicId } from "@/constants/topics";

import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
import TopicDashboard from "@/containers/widgets/topic";

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  const topicsDashboard = TOPICS.filter((topic) => topics?.some((t) => t.id === topic.id)).sort(
    (a, b) => {
      if (!topics) return 0;
      const indexA = topics.findIndex((t) => t.id === a.id);
      const indexB = topics.findIndex((t) => t.id === b.id);
      return indexA - indexB;
    },
  );

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {/* TOPICS DASHBOARD */}
      {topicsDashboard.map((topic) => {
        const id = topic.id as TopicId;
        return <TopicDashboard key={id} topicId={id} />;
      })}

      {/* OTHER RESOURCES */}
      <WidgetsOtherResources />
    </div>
  );
}
