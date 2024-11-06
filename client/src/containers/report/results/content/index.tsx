"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, TopicId } from "@/constants/topics";

// import WidgetsBioeconomy from "@/containers/widgets/bioeconomy";
// import WidgetsEnvironment from "@/containers/widgets/environment";
// import WidgetsFinancial from "@/containers/widgets/financial";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
// import WidgetsDemographicAndSocieconomic from "@/containers/widgets/population";
// import WidgetsProtection from "@/containers/widgets/protection";
import TopicDashboard from "@/containers/widgets/topic";

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />
      {TOPICS?.filter((topic) => {
        const id = topic.id as TopicId;
        return topics?.includes(id);
      })
        .sort((a, b) => {
          if (!topics) return 0;
          const indexA = topics.indexOf(a.id as TopicId);
          const indexB = topics.indexOf(b.id as TopicId);
          return indexA - indexB;
        })
        .map((topic) => {
          const id = topic.id as TopicId;

          if (!topics?.includes(id)) return null;
          return <TopicDashboard key={id} topicId={id} />;

          // switch (id) {
          //   case "natural-physical-environment":
          //     return <WidgetsEnvironment key={id} />;
          //   case "sociodemographics":
          //     return <WidgetsDemographicAndSocieconomic key={id} />;
          //   case "land-use-and-conservation":
          //     return <WidgetsProtection key={id} index={index} />;
          //   case "bioeconomy":
          //     return <WidgetsBioeconomy key={id} index={index} />;
          //   case "financial":
          //     return <WidgetsFinancial key={id} />;
          //   default:
          //     return null;
          // }
        })}
      <WidgetsOtherResources />
    </div>
  );
}
