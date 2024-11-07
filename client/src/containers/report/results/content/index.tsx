"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, TopicId } from "@/constants/topics";

import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
import TopicDashboard from "@/containers/widgets/topic";

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {/* TOPICS DASHBOARD */}
      {TOPICS.filter((topic) => {
        const id = topic.id as TopicId;
        return topics?.find((t) => t.id === id); // Check if `id` exists in the `topics` object
      })
        .sort((a, b) => {
          if (!topics) return 0;

          // Get the index of each topic's `id` in the keys of the `topics` object
          const indexA = Object.keys(topics).indexOf(a.id as TopicId);
          const indexB = Object.keys(topics).indexOf(b.id as TopicId);
          return indexA - indexB;
        })
        .map((topic) => {
          const id = topic.id as TopicId;
          if (!topics?.find((t) => t.id === id)) return null; // Check if `id` exists in `topics`

          return <TopicDashboard key={id} topicId={id} />;
        })}
      <WidgetsOtherResources />
    </div>
  );
}
