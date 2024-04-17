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
    <div className="flex flex-col space-y-20">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {TOPICS?.map((topic) => {
        const id = topic.id as TopicIds;

        if (!topics?.includes(id)) return null;

        switch (id) {
          case "natural-physical-environment":
            return <WidgetsEnvironment key={id} />;
          case "population":
            return <WidgetsDemographicAndSocieconomic key={id} />;
          case "protection":
            return <WidgetsProtection key={id} />;
          case "bioeconomy":
            return <WidgetsBioeconomy key={id} />;
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
