"use client";

import { useSyncTopics } from "@/app/store";

import { TOPICS, TopicIds } from "@/constants/topics";

import WidgetsBioeconomy from "@/containers/widgets/bioeconomy";
import WidgetsEnvironment from "@/containers/widgets/environment";
import WidgetsFinancial from "@/containers/widgets/financial";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
import WidgetsDemographicAndSocieconomic from "@/containers/widgets/population";
import WidgetsProtection from "@/containers/widgets/protection";

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {TOPICS?.filter((topic) => {
        const id = topic.id as TopicIds;
        return topics?.includes(id);
      })
        .sort((a, b) => {
          if (!topics) return 0;
          const indexA = topics.indexOf(a.id as TopicIds);
          const indexB = topics.indexOf(b.id as TopicIds);
          return indexA - indexB;
        })
        .map((topic, index) => {
          const id = topic.id as TopicIds;

          if (!topics?.includes(id)) return null;

          switch (id) {
            case "natural-physical-environment":
              return <WidgetsEnvironment key={id} index={index} />;
            case "sociodemographics":
              return <WidgetsDemographicAndSocieconomic key={id} />;
            case "land-use-and-conservation":
              return <WidgetsProtection key={id} index={index} />;
            case "bioeconomy":
              return <WidgetsBioeconomy key={id} index={index} />;
            case "financial":
              return <WidgetsFinancial key={id} />;
            default:
              return null;
          }
        })}
      <WidgetsOtherResources />
    </div>
  );
}
